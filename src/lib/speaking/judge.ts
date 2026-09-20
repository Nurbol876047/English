import type { SpeakingWord } from './words';
import { evaluate } from './evaluate';
import { float32ToWavBase64 } from './wav';

export interface Verdict {
  ok: boolean;
  /** Что услышано (Gemini или распознаватель) */
  heard: string;
  /** Совет, как произнести (если не засчитано) */
  tip: string;
  engine: 'gemini' | 'local';
}

interface JudgeBody {
  word: string;
  hint?: string;
  audio?: { mimeType: string; data: string };
  transcript?: string;
}

async function askServer(body: JudgeBody, timeoutMs = 15000): Promise<Verdict | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/speaking/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { heard: string; accept: boolean; tip: string };
    return { ok: j.accept, heard: j.heard, tip: j.tip, engine: 'gemini' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Проверить аудио: Gemini слушает сам; если сервер недоступен — локальная транскрипция + мягкая проверка */
export async function judgeAudio(
  audio: Float32Array,
  sampleRate: number,
  entry: SpeakingWord,
  transcribeLocal: (audio: Float32Array) => Promise<string>,
): Promise<Verdict> {
  const data = float32ToWavBase64(audio, sampleRate);
  const viaGemini = await askServer({ word: entry.word, hint: entry.hint, audio: { mimeType: 'audio/wav', data } });
  if (viaGemini) return viaGemini;
  const text = await transcribeLocal(audio);
  return judgeTextLocal(text, entry);
}

/** Проверить текст от распознавателя браузера: сначала Gemini, при недоступности — локально */
export async function judgeText(transcript: string, entry: SpeakingWord): Promise<Verdict> {
  const local = judgeTextLocal(transcript, entry);
  if (local.ok) return local; // локально уже похоже — не тратим запрос
  const viaGemini = await askServer({ word: entry.word, hint: entry.hint, transcript });
  return viaGemini ?? local;
}

export function judgeTextLocal(transcript: string, entry: SpeakingWord): Verdict {
  const { ok } = evaluate(transcript, entry);
  return { ok, heard: transcript, tip: ok ? '' : `Try it in parts: ${syllables(entry.word)}`, engine: 'local' };
}

/** Очень грубое деление на слоги для подсказки */
function syllables(word: string): string {
  const parts = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))?/gi);
  return parts && parts.length > 1 ? parts.join(' · ') : word;
}
