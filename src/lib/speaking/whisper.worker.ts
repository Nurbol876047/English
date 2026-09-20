/// <reference lib="webworker" />
/**
 * Web Worker с офлайн-распознаванием речи (Whisper tiny.en через transformers.js).
 * Запасной движок, когда Web Speech API недоступен или отвечает ошибкой
 * `network` (встроенные браузеры, Chromium без ключей Google, офлайн).
 * Модель (~40 МБ, int8) один раз скачивается с Hugging Face и кэшируется браузером.
 */
import { pipeline, type AutomaticSpeechRecognitionPipeline, type ProgressInfo } from '@huggingface/transformers';

const MODEL = 'onnx-community/whisper-tiny.en';

export type WorkerIn = { type: 'load' } | { type: 'transcribe'; audio: Float32Array; id: number };
export type WorkerOut =
  | { type: 'progress'; progress: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; text: string }
  | { type: 'error'; message: string; id?: number };

let asr: Promise<AutomaticSpeechRecognitionPipeline> | null = null;
const loaded = new Map<string, number>();
const totals = new Map<string, number>();

function post(msg: WorkerOut) {
  self.postMessage(msg);
}

function load() {
  if (asr) return asr;
  asr = pipeline('automatic-speech-recognition', MODEL, {
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
    return p as AutomaticSpeechRecognitionPipeline;
  });
  asr.catch((e) => {
    asr = null;
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  });
  return asr;
}

self.onmessage = async (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  if (msg.type === 'load') {
    load();
    return;
  }
  try {
    const model = await load();
    const out = await model(msg.audio);
    const text = Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text;
    post({ type: 'result', id: msg.id, text: text.trim() });
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) });
  }
};
