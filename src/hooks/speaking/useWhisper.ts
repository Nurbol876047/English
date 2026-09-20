'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkerIn, WorkerOut } from '@/lib/speaking/whisper.worker';

export type WhisperStatus = 'idle' | 'loading-model' | 'recording' | 'transcribing' | 'denied' | 'error';

const SAMPLE_RATE = 16000;
/** Порог громкости (RMS), выше которого считаем, что человек говорит */
const SPEECH_RMS = 0.015;
/** Пауза после речи, после которой запись останавливается сама */
const SILENCE_MS = 1400;
/** Максимальная длительность одной записи */
const MAX_MS = 10000;

interface Options {
  /** Запись закончена — отдаём сэмплы (16 кГц, моно). Что с ними делать, решает вызывающий */
  onAudio: (audio: Float32Array, sampleRate: number) => void;
}

/**
 * Запись микрофона через AudioContext (16 кГц, моно) с автостопом по тишине
 * плюс офлайн-транскрипция через worker с Whisper (`transcribe`).
 */
export function useWhisper({ onAudio }: Options) {
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Текущая громкость микрофона 0..1 — для индикатора «вас слышно» */
  const [level, setLevel] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const onAudioRef = useRef(onAudio);
  useEffect(() => {
    onAudioRef.current = onAudio;
  }, [onAudio]);

  const stopRef = useRef<(() => void) | null>(null);
  const reqId = useRef(0);
  const pending = useRef(new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>());

  const getWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('../../lib/speaking/whisper.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data;
      if (m.type === 'progress') setProgress(m.progress);
      else if (m.type === 'ready') {
        setReady(true);
        setProgress(1);
        setStatus((s) => (s === 'loading-model' ? 'idle' : s));
      } else if (m.type === 'result') {
        setStatus('idle');
        pending.current.get(m.id)?.resolve(m.text);
        pending.current.delete(m.id);
      } else if (m.type === 'error') {
        if (m.id !== undefined) {
          pending.current.get(m.id)?.reject(new Error(m.message));
          pending.current.delete(m.id);
        }
        setErrorMessage(m.message);
        setStatus('error');
      }
    };
    w.onerror = (e) => {
      setErrorMessage(e.message || 'Speech model failed to load');
      setStatus('error');
    };
    workerRef.current = w;
    return w;
  }, []);

  const send = useCallback((msg: WorkerIn) => getWorker().postMessage(msg, msg.type === 'transcribe' ? [msg.audio.buffer] : []), [getWorker]);

  /** Начать скачивание модели заранее (без записи) */
  const preload = useCallback(() => {
    if (ready) return;
    setStatus((s) => (s === 'idle' ? 'loading-model' : s));
    send({ type: 'load' });
  }, [ready, send]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const stop = useCallback(() => stopRef.current?.(), []);

  const start = useCallback(async () => {
    if (stopRef.current) return;
    setErrorMessage(null);
    if (!ready) send({ type: 'load' });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch {
      setStatus('denied');
      return;
    }

    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    const source = ctx.createMediaStreamSource(stream);
    // ScriptProcessor устарел, но работает во всех браузерах без отдельного файла worklet'а
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    let heardSpeech = false;
    let lastSpeechAt = performance.now();
    const startedAt = performance.now();

    const finish = () => {
      if (!stopRef.current) return;
      stopRef.current = null;
      setLevel(0);
      proc.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});

      const length = chunks.reduce((n, c) => n + c.length, 0);
      if (!heardSpeech || length < SAMPLE_RATE * 0.4) {
        setStatus('idle');
        setErrorMessage('I didn’t hear anything — press the mic and speak.');
        return;
      }
      const audio = new Float32Array(length);
      let off = 0;
      for (const c of chunks) {
        audio.set(c, off);
        off += c.length;
      }
      setStatus('idle');
      onAudioRef.current(audio, SAMPLE_RATE);
    };
    stopRef.current = finish;

    proc.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(input));
      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
      const rms = Math.sqrt(sum / input.length);
      setLevel(Math.min(1, rms / 0.12));
      const now = performance.now();
      if (rms > SPEECH_RMS) {
        heardSpeech = true;
        lastSpeechAt = now;
      }
      if ((heardSpeech && now - lastSpeechAt > SILENCE_MS) || now - startedAt > MAX_MS) finish();
    };
    source.connect(proc);
    proc.connect(ctx.destination);
    setStatus('recording');
  }, [ready, send]);

  /** Локальная транскрипция записанных сэмплов (Whisper в worker) */
  const transcribe = useCallback(
    (audio: Float32Array) =>
      new Promise<string>((resolve, reject) => {
        const id = ++reqId.current;
        pending.current.set(id, { resolve, reject });
        setStatus(ready ? 'transcribing' : 'loading-model');
        // Копия — буфер уходит в worker без копирования (transfer)
        send({ type: 'transcribe', audio: new Float32Array(audio), id });
      }),
    [ready, send],
  );

  // Модель догрузилась, пока ждали транскрипцию
  useEffect(() => {
    if (ready && status === 'loading-model' && pending.current.size > 0) setStatus('transcribing');
  }, [ready, status]);

  return { status, progress, ready, errorMessage, level, start, stop, preload, transcribe };
}
