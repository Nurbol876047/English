/// <reference lib="webworker" />
/**
 * Web Worker с офлайн-озвучкой (MMS-TTS English / VITS через transformers.js).
 * Запасной вариант, когда у браузера нет голосов speechSynthesis
 * (встроенные браузеры, Linux без speech-dispatcher). Модель ~38 МБ (int8)
 * скачивается один раз и кэшируется браузером.
 */
import { pipeline, type TextToAudioPipeline, type ProgressInfo } from '@huggingface/transformers';

const MODEL = 'Xenova/mms-tts-eng';

export type TtsIn = { type: 'load' } | { type: 'synthesize'; text: string; id: number };
export type TtsOut =
  | { type: 'progress'; progress: number }
  | { type: 'ready' }
  | { type: 'audio'; id: number; audio: Float32Array; sampleRate: number }
  | { type: 'error'; message: string; id?: number };

let tts: Promise<TextToAudioPipeline> | null = null;
const loaded = new Map<string, number>();
const totals = new Map<string, number>();

function post(msg: TtsOut, transfer: Transferable[] = []) {
  self.postMessage(msg, transfer);
}

function load() {
  if (tts) return tts;
  tts = pipeline('text-to-speech', MODEL, {
    dtype: 'q8',
    progress_callback: (p: ProgressInfo) => {
      if (p.status === 'progress') {
        loaded.set(p.file, p.loaded);
        totals.set(p.file, p.total);
        let l = 0;
        let t = 0;
        loaded.forEach((v) => (l += v));
        totals.forEach((v) => (t += v));
        post({ type: 'progress', progress: t ? l / t : 0 });
      }
    },
  }).then((p) => {
    post({ type: 'ready' });
    return p as TextToAudioPipeline;
  });
  tts.catch((e) => {
    tts = null;
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  });
  return tts;
}

self.onmessage = async (e: MessageEvent<TtsIn>) => {
  const msg = e.data;
  if (msg.type === 'load') {
    load();
    return;
  }
  try {
    const model = await load();
    const out = await model(msg.text);
    const first = Array.isArray(out) ? out[0] : out;
    // Копируем в обычный ArrayBuffer, чтобы передать без копирования (transfer)
    const audio = new Float32Array(first.audio);
    post({ type: 'audio', id: msg.id, audio, sampleRate: first.sampling_rate }, [audio.buffer]);
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) });
  }
};
