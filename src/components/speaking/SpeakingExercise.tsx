'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Flame, Keyboard, Loader2, Mic, MicOff, SkipForward, Sparkles, Trophy, Volume2, XCircle } from 'lucide-react';
import { WORDS, NATION_LABEL, pickRandomWord, type SpeakingWord, type Nation } from '@/lib/speaking/words';
import { judgeAudio, judgeText, judgeTextLocal, type Verdict } from '@/lib/speaking/judge';
import { useSpeechRecognition, type MicStatus } from '@/hooks/speaking/useSpeechRecognition';
import { useSpeaker } from '@/hooks/speaking/useSpeaker';

export interface SpeakingResult {
  wordId: string;
  transcript: string;
  ok: boolean;
  score: number;
}

interface Props {
  /** Точка интеграции с общим прогрессом платформы Lingova */
  onExerciseComplete?: (result: SpeakingResult) => void;
}

const card = 'bg-white/[0.07] backdrop-blur-md rounded-2xl border border-white/15 shadow-xl';

const NATION_STYLE: Record<Nation, { badge: string; ring: string; glyph: string }> = {
  water: { badge: 'bg-sky-400/20 text-sky-200 border-sky-300/40', ring: 'from-sky-400/60 to-blue-600/40', glyph: '💧' },
  earth: { badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40', ring: 'from-emerald-400/60 to-green-700/40', glyph: '⛰️' },
  fire: { badge: 'bg-orange-400/20 text-orange-200 border-orange-300/40', ring: 'from-orange-400/60 to-red-600/40', glyph: '🔥' },
  air: { badge: 'bg-amber-300/20 text-amber-100 border-amber-200/40', ring: 'from-amber-300/60 to-yellow-600/40', glyph: '🌪️' },
  all: { badge: 'bg-violet-400/20 text-violet-200 border-violet-300/40', ring: 'from-violet-400/60 to-fuchsia-600/40', glyph: '☯️' },
};

const MIC_LABEL: Record<MicStatus, { text: string; cls: string }> = {
  idle: { text: 'Press the mic and say the word', cls: 'text-white/60' },
  listening: { text: 'Listening… say the word', cls: 'text-emerald-300' },
  'loading-model': { text: 'Loading the offline speech model (one time, ~40 MB)…', cls: 'text-sky-300' },
  transcribing: { text: 'Recognizing…', cls: 'text-sky-300' },
  denied: { text: 'Microphone access denied — allow it in the browser, or type the word below', cls: 'text-red-300' },
  unsupported: { text: 'Speech recognition is not supported here — open in Google Chrome, or type the word below', cls: 'text-red-300' },
  error: { text: 'Recognition error — try again or type the word below', cls: 'text-amber-300' },
};

/* Причины ошибок Web Speech API, которые стоит объяснить пользователю */
const ERROR_DETAIL: Record<string, string> = {
  network: 'The speech service could not be reached. Chrome sends audio to Google’s servers — check your internet, or open the page in Google Chrome (embedded browsers often block it).',
  'audio-capture': 'No microphone was found. Plug one in or check the system sound settings.',
  'language-not-supported': 'English (en-US) recognition is not available in this browser.',
  'bad-grammar': 'The recognizer rejected the request — try again.',
};

type Attempt = Verdict;

export function SpeakingExercise({ onExerciseComplete }: Props) {
  const [entry, setEntry] = useState<SpeakingWord>(() => pickRandomWord());
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mastered, setMastered] = useState<string[]>([]);
  /** Идёт проверка (Gemini / локально) */
  const [judging, setJudging] = useState(false);

  const applyVerdict = useCallback(
    (verdict: Verdict) => {
      const gained = verdict.ok ? 10 : 0;
      setAttempt(verdict);
      setScore((s) => s + gained);
      if (verdict.ok) {
        setStreak((s) => s + 1);
        setMastered((m) => (m.includes(entry.id) ? m : [...m, entry.id]));
      } else {
        setStreak(0);
      }
      onExerciseComplete?.({ wordId: entry.id, transcript: verdict.heard, ok: verdict.ok, score: gained });
    },
    [entry.id, onExerciseComplete],
  );

  // Текст от Web Speech → проверка (локально, при сомнении — Gemini)
  const handleFinal = useCallback(
    (transcript: string) => {
      setJudging(true);
      judgeText(transcript, entry)
        .then(applyVerdict)
        .finally(() => setJudging(false));
    },
    [entry, applyVerdict],
  );

  const transcribeRef = useRef<((audio: Float32Array) => Promise<string>) | null>(null);
  // Аудио от офлайн-записи → Gemini слушает сам; если сервер недоступен — Whisper + мягкая проверка
  const handleAudio = useCallback(
    (audio: Float32Array, sampleRate: number) => {
      setJudging(true);
      const transcribeLocal = transcribeRef.current ?? (() => Promise.resolve(''));
      judgeAudio(audio, sampleRate, entry, transcribeLocal)
        .then(applyVerdict)
        .catch(() => applyVerdict(judgeTextLocal('', entry)))
        .finally(() => setJudging(false));
    },
    [entry, applyVerdict],
  );

  const mic = useSpeechRecognition({ onFinal: handleFinal, onAudio: handleAudio });
  const transcribeLocal = mic.transcribeLocal;
  useEffect(() => {
    transcribeRef.current = transcribeLocal;
  }, [transcribeLocal]);
  const speaker = useSpeaker();
  const listening = mic.status === 'listening';
  const busy = judging || mic.status === 'loading-model' || mic.status === 'transcribing';
  const micBlocked = mic.status === 'denied' || mic.status === 'unsupported';
  const micFailed = micBlocked || mic.status === 'error';
  // Ввод с клавиатуры — запасной путь, если микрофон/распознавание недоступны
  const [typedOpen, setTypedOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const showTyped = typedOpen || micFailed;
  const submitTyped = () => {
    const text = typed.trim();
    if (!text) return;
    applyVerdict(judgeTextLocal(text, entry));
    setTyped('');
  };

  const style = NATION_STYLE[entry.nation];
  const speakerBusy = speaker.status === 'loading-model' || speaker.status === 'synthesizing';

  const next = () => {
    mic.stop();
    speaker.stop();
    setAttempt(null);
    setTyped('');
    setEntry((e) => pickRandomWord(e.id));
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex justify-between items-start gap-3">
        <div className={`${card} px-3 py-2 md:p-4 flex items-center gap-3`}>
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="Back to the arena">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-400 via-amber-300 to-sky-400 bg-clip-text text-transparent">
              Lingova
            </h1>
            <p className="text-white/60 text-xs md:text-sm mt-0.5 whitespace-nowrap">Speaking — Voice Control</p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3">
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Score</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5">
              <Sparkles size={18} className="text-yellow-300/80" />
              {score}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Streak</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5">
              <Flame size={20} className={streak > 2 ? 'text-orange-400 animate-pulse' : 'text-white/25'} />
              {streak}
            </span>
          </div>
          <div className={`${card} px-3 py-2 md:px-4 md:py-3 flex flex-col items-end`}>
            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Mastered</span>
            <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
              <Trophy size={18} className="text-yellow-300/80" />
              {mastered.length} / {WORDS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Центр: карточка слова */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`${card} w-full max-w-xl px-6 py-6 md:px-10 md:py-8 text-center my-auto`}
          >
            <p className="text-white/50 text-xs uppercase tracking-widest">Say this word</p>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${style.ring} border border-white/20 flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(255,255,255,0.12)]`}>
                {style.glyph}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-5xl md:text-6xl font-bold text-white tracking-wide">{entry.word}</h2>
                <button
                  onClick={() => (speaker.status === 'speaking' ? speaker.stop() : speaker.speak(entry.word))}
                  disabled={speakerBusy}
                  className={`p-2.5 rounded-full text-white transition-colors ${speaker.status === 'speaking' ? 'bg-emerald-500/40' : 'bg-white/10 hover:bg-white/20'} disabled:opacity-60`}
                  title={speaker.status === 'speaking' ? 'Stop' : 'Listen'}
                >
                  {speakerBusy ? <Loader2 size={22} className="animate-spin" /> : <Volume2 size={22} />}
                </button>
              </div>
              <p className="text-white/60 text-lg font-mono">{entry.ipa}</p>
              {speaker.status === 'loading-model' && (
                <span className="text-xs text-sky-300">Loading voice… {Math.round(speaker.progress * 100)}%</span>
              )}
              {speaker.status === 'synthesizing' && <span className="text-xs text-sky-300">Preparing audio…</span>}
              <span className={`text-xs px-3 py-1 rounded-full border ${style.badge}`}>{NATION_LABEL[entry.nation]}</span>
              <p className="text-white/70 text-base leading-relaxed max-w-md">{entry.hint}</p>
            </div>

            {/* Микрофон */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                onClick={listening ? mic.stop : mic.start}
                disabled={micBlocked || busy}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center border transition-all
                  ${listening ? 'bg-emerald-500/30 border-emerald-300/70 scale-110' : 'bg-white/10 border-white/25 hover:bg-white/20'}
                  ${micBlocked || busy ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                title={listening ? 'Stop' : 'Speak'}
              >
                {listening && <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />}
                {micBlocked ? <MicOff size={30} className="text-white/60" /> : busy ? <Loader2 size={30} className="text-white animate-spin" /> : <Mic size={30} className="text-white" />}
              </button>
              <p className={`text-sm ${judging ? 'text-sky-300' : MIC_LABEL[mic.status].cls}`}>
                {judging ? 'Checking your pronunciation…' : MIC_LABEL[mic.status].text}
              </p>
              {mic.status === 'loading-model' && (
                <div className="w-full max-w-xs h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-sky-400/80 transition-all" style={{ width: `${Math.round(mic.modelProgress * 100)}%` }} />
                </div>
              )}
              {mic.engine === 'whisper' && mic.modelReady && !busy && !listening && (
                <p className="text-[11px] text-white/35">Offline recognition — say the word, then pause; recording stops by itself</p>
              )}
              {listening && mic.engine === 'whisper' && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>I hear you</span>
                  <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400/80 transition-[width] duration-75" style={{ width: `${Math.round(mic.level * 100)}%` }} />
                  </div>
                </div>
              )}
              <p className="min-h-[1.5rem] text-white/90 text-base italic">{listening && mic.interim ? `“${mic.interim}”` : ''}</p>
              {mic.status === 'error' && mic.errorCode && (
                <p className="text-xs text-white/50 max-w-md">{ERROR_DETAIL[mic.errorCode] ?? `Error code: ${mic.errorCode}`}</p>
              )}
              {mic.errorMessage && <p className="text-xs text-amber-200/80 max-w-md">{mic.errorMessage}</p>}

              {showTyped ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitTyped();
                  }}
                  className="w-full max-w-md flex gap-2"
                >
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Type the word…"
                    autoComplete="off"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-emerald-300/60"
                  />
                  <button type="submit" disabled={!typed.trim()} className="px-4 py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-300/50 text-white hover:bg-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Check
                  </button>
                </form>
              ) : (
                <button onClick={() => setTypedOpen(true)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors">
                  <Keyboard size={14} /> Or type the word
                </button>
              )}
            </div>

            {/* Результат попытки */}
            <AnimatePresence>
              {attempt && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 rounded-2xl border p-4 text-left ${attempt.ok ? 'bg-emerald-500/15 border-emerald-400/40' : 'bg-red-500/10 border-red-400/30'}`}
                >
                  <div className="flex items-center gap-2">
                    {attempt.ok ? <CheckCircle2 size={20} className="text-emerald-300" /> : <XCircle size={20} className="text-red-300" />}
                    <p className={`font-semibold ${attempt.ok ? 'text-emerald-200' : 'text-red-200'}`}>
                      {attempt.ok ? 'Great! +10' : 'Not quite — listen and try again.'}
                    </p>
                  </div>
                  {attempt.heard && <p className="text-white/60 text-sm mt-1">We heard: “{attempt.heard}”</p>}
                  {!attempt.ok && attempt.tip && <p className="text-amber-200/90 text-sm mt-1">💡 {attempt.tip}</p>}
                  <p className="text-white/30 text-[11px] mt-2">{attempt.engine === 'gemini' ? 'Checked by Gemini' : 'Checked offline'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Низ */}
      <div className="flex items-end justify-between gap-3">
        <div className={`${card} px-4 py-3 max-w-xs text-xs text-white/50`}>
          One word is enough. Press 🔊 to hear it, then press the mic and repeat.
        </div>
        <button
          onClick={next}
          className={`${card} px-4 py-3 flex items-center gap-2 text-sm text-white/70 hover:text-white hover:bg-white/15 transition-colors whitespace-nowrap`}
        >
          <SkipForward size={16} /> {attempt?.ok ? 'Next word' : 'Skip'}
        </button>
      </div>
    </div>
  );
}
