'use client';

import React from 'react';
import Link from 'next/link';
import { useElementStore, type ElementType } from '@/store/elementStore';
import { useSpeechElementDetector } from '@/hooks/useSpeechElementDetector';
import { Mic, Droplet, Flame, Mountain, Wind, Volume2, AlertCircle, Hand, ArrowRight, Shuffle } from 'lucide-react';

export const HUD = ({ onElementMastered }: { onElementMastered?: (element: string) => void }) => {
  const { streak, masteredElements, activeElement } = useElementStore();
  const { error, suggestion, toggleListening, isListening, playExample } = useSpeechElementDetector(onElementMastered);

  const elements: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'water', icon: <Droplet size={24} />, label: 'Water' },
    { id: 'fire', icon: <Flame size={24} />, label: 'Fire' },
    { id: 'earth', icon: <Mountain size={24} />, label: 'Earth' },
    { id: 'wind', icon: <Wind size={24} />, label: 'Wind' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Top HUD */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-orange-400 to-green-400 bg-clip-text text-transparent">
              Lingova
            </h1>
            <p className="text-white/60 text-sm mt-1">Elemental Pronunciation</p>
          </div>

          {/* Переход к упражнению Word Order — управление жестами руки */}
          <Link
            href="/exercises/word-order"
            className="group bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-sky-300/50 shadow-xl transition-colors flex items-center gap-3"
          >
            <div className="bg-sky-400/20 p-2.5 rounded-xl text-sky-300 group-hover:bg-sky-400/30 transition-colors">
              <Hand size={22} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Word Order — Hand Control</p>
              <p className="text-white/50 text-xs mt-0.5">Собери предложение жестами руки</p>
            </div>
            <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/exercises/sort-words"
            className="group bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-violet-300/50 shadow-xl transition-colors flex items-center gap-3"
          >
            <div className="bg-violet-400/20 p-2.5 rounded-xl text-violet-300 group-hover:bg-violet-400/30 transition-colors">
              <Shuffle size={22} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Sort the Words — Hand Control</p>
              <p className="text-white/50 text-xs mt-0.5">Раскидай слова по категориям жестами</p>
            </div>
            <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right flex flex-col items-end shadow-xl">
            <span className="text-white/60 text-sm uppercase tracking-wider">Streak</span>
            <span className="text-3xl font-bold text-white flex items-center gap-2">
              <Flame size={24} className={streak > 2 ? 'text-orange-500 animate-pulse' : 'text-white/30'} />
              {streak}
            </span>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right flex flex-col items-end shadow-xl">
            <span className="text-white/60 text-sm uppercase tracking-wider">Mastered</span>
            <span className="text-3xl font-bold text-white">
              {masteredElements.length} / 4
            </span>
          </div>
        </div>
      </div>

      {/* Suggestion Toast */}
      {suggestion && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500/30 p-2 rounded-full">
              <AlertCircle className="text-red-300" />
            </div>
            <div>
              <p className="text-white font-medium">Did you mean <span className="font-bold text-red-200 capitalize">{suggestion.word}</span>?</p>
              <p className="text-red-200/80 text-sm">{suggestion.ipa}</p>
            </div>
            {suggestion.word !== 'Try an element' && (
              <button 
                onClick={() => playExample(suggestion.word)}
                className="ml-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                title="Listen to pronunciation"
              >
                <Volume2 className="text-white" size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-lg">
          <div className="bg-orange-500/20 backdrop-blur-xl border border-orange-500/50 rounded-2xl p-4 flex flex-col items-center gap-4 shadow-2xl text-center">
            <p className="text-white text-sm">{error}</p>
            {/* Fallback buttons for manual testing */}
            <div className="flex flex-wrap justify-center gap-2">
              <p className="text-white/60 text-xs w-full mb-1">Manual trigger (Fallback):</p>
              {elements.map(el => (
                <button key={el.id} onClick={() => useElementStore.getState().setActiveElement(el.id as ElementType)} className="bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 text-white text-xs">
                  {el.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="flex flex-col items-center gap-8 pointer-events-auto mb-10">
        <div className="flex gap-4">
          {elements.map((el) => {
            const isMastered = masteredElements.includes(el.id) || (el.id === 'wind' && masteredElements.includes('air'));
            const isActive = activeElement === el.id || (el.id === 'wind' && activeElement === 'air');
            
            return (
              <button 
                key={el.id}
                onClick={() => {
                  useElementStore.getState().setActiveElement(el.id as ElementType);
                  useElementStore.getState().addMasteredElement(el.id);
                  useElementStore.getState().incrementStreak();
                  if (onElementMastered) onElementMastered(el.id);
                  setTimeout(() => useElementStore.getState().setActiveElement(null), 8000);
                }}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 hover:scale-105 cursor-pointer
                  ${isMastered ? 'bg-white/20 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                  ${isActive ? 'scale-110 bg-white/30' : 'scale-100'}
                  backdrop-blur-md border
                `}
                title={`Manually trigger ${el.label}`}
              >
                <div className={`
                  ${isMastered ? 'text-white' : 'text-white/30'}
                  ${isActive ? 'animate-pulse text-blue-300' : ''}
                `}>
                  {el.icon}
                </div>
              </button>
            );
          })}
        </div>

        <button 
          onClick={toggleListening}
          className={`
            relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.6)]' 
              : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'}
          `}
        >
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
          )}
          <Mic size={32} className={isListening ? 'text-white animate-pulse' : 'text-white/70 group-hover:text-white'} />
        </button>
        
        <p className="text-white/60 font-medium tracking-wide">
          {isListening ? 'Listening...' : 'Tap mic and say an element word'}
        </p>
      </div>
    </div>
  );
};
