import { NextResponse } from 'next/server';

/**
 * Проверка произношения через Gemini. Ключ живёт только на сервере (.env.local).
 * Принимает либо аудио (WAV/WebM в base64), либо текст от распознавателя браузера.
 * Отвечает мягко: засчитывает попытку с акцентом/парой неверных звуков,
 * отклоняет только совсем другое слово или тишину.
 */

export const runtime = 'nodejs';

interface JudgeRequest {
  word: string;
  hint?: string;
  audio?: { mimeType: string; data: string };
  transcript?: string;
}

export interface JudgeResponse {
  heard: string;
  accept: boolean;
  tip: string;
  model: string;
}

const MAX_AUDIO_BASE64 = 2_000_000; // ~1.5 МБ аудио — 10 с WAV 16 кГц с запасом
const TIMEOUT_MS = 12_000;

function modelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = [preferred, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'].filter((m): m is string => !!m);
  return Array.from(new Set(list));
}

function buildPrompt(word: string, hint: string | undefined, transcript: string | undefined): string {
  const context = hint ? ` (context: ${hint})` : '';
  const source = transcript
    ? `You cannot hear the audio. The browser's speech recognizer wrote down: "${transcript}". Recognizers often mangle names, so ACCEPT if this text sounds similar to the target word when read aloud (same or similar consonants and syllable count, e.g. "Cattara" for Katara, "Toff" for Toph, "Arrow" for Iroh). REJECT if the text sounds clearly different from the target (e.g. "I have been here" for airbender, "the car" for Katara).`
    : 'Listen to the attached audio.';
  return `You are a friendly, encouraging English pronunciation coach inside a language-learning game about "Avatar: The Last Airbender".
The learner was asked to say ONE word out loud: "${word}"${context}.
${source}
Be lenient and improvisational: ACCEPT if the learner clearly attempted the target word — a foreign accent, a few wrong or missing sounds/letters, wrong stress, a slightly different spelling, or extra filler words around it are all fine. Names and made-up words (Aang, Toph, Appa, Omashu, waterbender…) are hard to recognize, so be generous with them.
REJECT only if a completely different word was said, or nothing understandable was said.
Return JSON: heard (a short phrase — what you heard, in English), accept (boolean), tip (if rejected: one short friendly tip on how to say the word, e.g. how to split it into syllables; if accepted: empty string).`;
}

async function callGemini(model: string, key: string, body: JudgeRequest, signal: AbortSignal): Promise<JudgeResponse> {
  const parts: Array<Record<string, unknown>> = [{ text: buildPrompt(body.word, body.hint, body.transcript) }];
  if (body.audio && !body.transcript) parts.push({ inline_data: { mime_type: body.audio.mimeType, data: body.audio.data } });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal,
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: { heard: { type: 'string' }, accept: { type: 'boolean' }, tip: { type: 'string' } },
          required: ['heard', 'accept', 'tip'],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status}`);
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const parsed = JSON.parse(text) as { heard?: string; accept?: boolean; tip?: string };
  if (typeof parsed.accept !== 'boolean') throw new Error(`${model}: bad JSON`);
  return { heard: String(parsed.heard ?? ''), accept: parsed.accept, tip: String(parsed.tip ?? ''), model };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: 'no-key' }, { status: 501 });

  let body: JudgeRequest;
  try {
    body = (await req.json()) as JudgeRequest;
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }
  if (!body.word || (!body.audio && !body.transcript)) return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  if (body.audio && body.audio.data.length > MAX_AUDIO_BASE64) return NextResponse.json({ error: 'audio-too-large' }, { status: 413 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const errors: string[] = [];
  try {
    // Модели по очереди: у флагманских бывают всплески 503 — тихо уходим на следующую
    for (const model of modelsToTry()) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return NextResponse.json(await callGemini(model, key, body, controller.signal));
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
          if (controller.signal.aborted) break;
        }
      }
      if (controller.signal.aborted) break;
    }
  } finally {
    clearTimeout(timer);
  }
  console.warn('[speaking/judge] all models failed:', errors.join(' | '));
  return NextResponse.json({ error: 'upstream', details: errors }, { status: 503 });
}
