'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWhisper } from './useWhisper';

/* Web Speech API нет в стандартных типах DOM — описываем нужный минимум */
interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: RecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechEngine = 'web' | 'whisper';
export type MicStatus =
  | 'idle'
  | 'listening'
  | 'loading-model'
  | 'transcribing'
  | 'denied'
  | 'unsupported'
  | 'error';

const ENGINE_KEY = 'lingova.speech.engine';
/** Ошибки Web Speech, после которых переключаемся на офлайн-движок */
const FALLBACK_ERRORS = new Set(['network', 'language-not-supported', 'service-not-allowed', 'bad-grammar']);

function readEngine(): SpeechEngine {
  try {
    return localStorage.getItem(ENGINE_KEY) === 'whisper' ? 'whisper' : 'web';
  } catch {
    return 'web';
  }
}

interface Options {
  /** Web Speech: финальный текст одной фразы */
  onFinal: (transcript: string) => void;
  /** Офлайн-движок: записанное аудио (проверять можно и без транскрипции) */
  onAudio: (audio: Float32Array, sampleRate: number) => void;
}

/**
 * Одна фраза за нажатие. Основной движок — Web Speech API браузера
 * (быстрый, с промежуточным текстом). Если его нет или он падает с
 * `network` (встроенные браузеры, Chromium без ключей Google), автоматически
 * переходим на офлайн Whisper в Web Worker и запоминаем выбор.
 */
export function useSpeechRecognition({ onFinal, onAudio }: Options) {
  const [engine, setEngine] = useState<SpeechEngine>('web');
  const [webStatus, setWebStatus] = useState<MicStatus>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [interim, setInterim] = useState('');
  const recRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const whisper = useWhisper({ onAudio });
  const whisperStart = whisper.start;
  const whisperPreload = whisper.preload;

  const switchToWhisper = useCallback(
    (thenStart: boolean) => {
      setEngine('whisper');
      try {
        localStorage.setItem(ENGINE_KEY, 'whisper');
      } catch {
        /* приватный режим — не страшно */
      }
      if (thenStart) void whisperStart();
      else whisperPreload();
    },
    [whisperStart, whisperPreload],
  );

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    // Сохранённый выбор или отсутствие Web Speech → сразу офлайн-движок (и греем модель)
    if (!Ctor || readEngine() === 'whisper') {
      const t = setTimeout(() => switchToWhisper(false), 0);
      return () => clearTimeout(t);
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = '';
    let fellBack = false;
    rec.onstart = () => {
      finalText = '';
      fellBack = false;
      setInterim('');
      setErrorCode(null);
      setWebStatus('listening');
    };
    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(finalText || interimText);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') setWebStatus('denied');
      else if (e.error === 'no-speech' || e.error === 'aborted') setWebStatus('idle');
      else if (FALLBACK_ERRORS.has(e.error)) {
        // Пользователь уже нажал микрофон — продолжаем той же попыткой, но офлайн
        fellBack = true;
        setWebStatus('idle');
        switchToWhisper(true);
      } else {
        setErrorCode(e.error);
        setWebStatus('error');
      }
    };
    rec.onend = () => {
      setWebStatus((s) => (s === 'listening' ? 'idle' : s));
      const text = finalText.trim();
      if (text && !fellBack) onFinalRef.current(text);
    };
    recRef.current = rec;
    return () => {
      rec.onend = null;
      rec.abort();
      recRef.current = null;
    };
  }, [switchToWhisper]);

  const start = useCallback(() => {
    if (engine === 'whisper') {
      void whisperStart();
      return;
    }
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.start();
    } catch {
      /* уже запущено */
    }
  }, [engine, whisperStart]);

  const stop = useCallback(() => {
    if (engine === 'whisper') whisper.stop();
    else recRef.current?.stop();
  }, [engine, whisper]);

  // Единый статус для UI
  let status: MicStatus = webStatus;
  if (engine === 'whisper') {
    const w = whisper.status;
    status = w === 'recording' ? 'listening' : w;
  }

  return {
    engine,
    status,
    errorCode,
    errorMessage: engine === 'whisper' ? whisper.errorMessage : null,
    modelProgress: whisper.progress,
    modelReady: whisper.ready,
    interim: engine === 'web' ? interim : '',
    level: engine === 'whisper' ? whisper.level : 0,
    start,
    stop,
    /** Локальная транскрипция аудио (Whisper) — запасной путь, если сервер проверки недоступен */
    transcribeLocal: whisper.transcribe,
  };
}
