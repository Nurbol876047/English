'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TtsIn, TtsOut } from '@/lib/speaking/tts.worker';

export type SpeakerStatus = 'idle' | 'loading-model' | 'synthesizing' | 'speaking';

const OFFLINE_KEY = 'lingova.tts.offline';
/** Если speechSynthesis не начал говорить за это время — считаем, что голосов нет */
const SYNTH_START_TIMEOUT = 1500;

/**
 * Озвучка текста. Сначала — встроенный speechSynthesis; если голосов нет
 * или он падает (`synthesis-failed`), переключаемся на офлайн-модель в
 * Web Worker и запоминаем выбор. Готовые фразы кэшируются.
 */
export function useSpeaker() {
  const [status, setStatus] = useState<SpeakerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [offline, setOffline] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const cache = useRef(new Map<string, { audio: Float32Array; sampleRate: number }>());
  const pending = useRef(new Map<number, string>());
  const reqId = useRef(0);

  const playBuffer = useCallback((audio: Float32Array, sampleRate: number) => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    sourceRef.current?.stop();
    const buffer = ctx.createBuffer(1, audio.length, sampleRate);
    buffer.getChannelData(0).set(audio);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      if (sourceRef.current === src) {
        sourceRef.current = null;
        setStatus('idle');
      }
    };
    sourceRef.current = src;
    setStatus('speaking');
    void ctx.resume().then(() => src.start());
  }, []);

  const getWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('../../lib/speaking/tts.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<TtsOut>) => {
      const m = e.data;
      if (m.type === 'progress') setProgress(m.progress);
      else if (m.type === 'ready') {
        setProgress(1);
        setStatus((s) => (s === 'loading-model' && pending.current.size === 0 ? 'idle' : s));
      } else if (m.type === 'audio') {
        const text = pending.current.get(m.id);
        pending.current.delete(m.id);
        if (text) cache.current.set(text, { audio: m.audio, sampleRate: m.sampleRate });
        // Играем только последний запрошенный текст
        if (m.id === reqId.current) playBuffer(m.audio, m.sampleRate);
        else if (pending.current.size === 0) setStatus('idle');
      } else if (m.type === 'error') {
        if (m.id !== undefined) pending.current.delete(m.id);
        setStatus('idle');
      }
    };
    w.onerror = () => setStatus('idle');
    workerRef.current = w;
    return w;
  }, [playBuffer]);

  const send = useCallback((msg: TtsIn) => getWorker().postMessage(msg), [getWorker]);

  const switchToOffline = useCallback(() => {
    setOffline(true);
    try {
      localStorage.setItem(OFFLINE_KEY, '1');
    } catch {
      /* приватный режим */
    }
    send({ type: 'load' });
  }, [send]);

  const speakOffline = useCallback(
    (text: string) => {
      const cached = cache.current.get(text);
      if (cached) {
        playBuffer(cached.audio, cached.sampleRate);
        return;
      }
      const id = ++reqId.current;
      pending.current.set(id, text);
      setStatus(progress < 1 ? 'loading-model' : 'synthesizing');
      send({ type: 'synthesize', text, id });
    },
    [playBuffer, progress, send],
  );

  // Сохранённый выбор или отсутствие голосов → сразу греем офлайн-модель
  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(OFFLINE_KEY) === '1';
    } catch {
      /* приватный режим */
    }
    const noSynth = typeof window === 'undefined' || !('speechSynthesis' in window);
    if (saved || noSynth) {
      const t = setTimeout(switchToOffline, 0);
      return () => clearTimeout(t);
    }
    // Голоса могут подгружаться асинхронно — даём им секунду
    const t = setTimeout(() => {
      if (window.speechSynthesis.getVoices().length === 0) switchToOffline();
    }, 1000);
    return () => clearTimeout(t);
  }, [switchToOffline]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      sourceRef.current?.stop();
      ctxRef.current?.close().catch(() => {});
    },
    [],
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    sourceRef.current?.stop();
    sourceRef.current = null;
    setStatus('idle');
  }, []);

  const speak = useCallback(
    (text: string) => {
      stop();
      if (offline || !('speechSynthesis' in window)) {
        speakOffline(text);
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      let started = false;
      const fallback = () => {
        if (started) return;
        started = true; // чтобы не сработать дважды
        window.speechSynthesis.cancel();
        switchToOffline();
        speakOffline(text);
      };
      const timer = setTimeout(fallback, SYNTH_START_TIMEOUT);
      u.onstart = () => {
        started = true;
        clearTimeout(timer);
        setStatus('speaking');
      };
      u.onend = () => setStatus('idle');
      u.onerror = (e) => {
        clearTimeout(timer);
        if (e.error === 'interrupted' || e.error === 'canceled') {
          setStatus('idle');
          return;
        }
        fallback();
      };
      setStatus('speaking');
      window.speechSynthesis.speak(u);
    },
    [offline, speakOffline, stop, switchToOffline],
  );

  return { speak, stop, status, offline, progress };
}
