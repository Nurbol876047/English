'use client';

import React from 'react';
import { useElementStore, type ElementType } from '@/store/elementStore';
import { useSpeechElementDetector } from '@/hooks/useSpeechElementDetector';
import { Droplet, Flame, Mountain, Wind, Volume2, AlertCircle } from 'lucide-react';

export const HUD = ({ onElementMastered }: { onElementMastered?: (element: string) => void }) => {
  const { streak, masteredElements, activeElement } = useElementStore();
  const { error, suggestion, toggleListening, isListening, playExample } = useSpeechElementDetector(onElementMastered);

  const elements: { id: string; icon: React.ReactNode; label: string; accent: string }[] = [
    { id: 'water', icon: <Droplet className="w-8 h-8 md:w-10 md:h-10" />, label: 'Water', accent: 'hover:border-sky-300/70 hover:shadow-[0_0_28px_rgba(56,189,248,0.35)]' },
    { id: 'fire', icon: <Flame className="w-8 h-8 md:w-10 md:h-10" />, label: 'Fire', accent: 'hover:border-orange-300/70 hover:shadow-[0_0_28px_rgba(251,146,60,0.35)]' },
    { id: 'earth', icon: <Mountain className="w-8 h-8 md:w-10 md:h-10" />, label: 'Earth', accent: 'hover:border-emerald-300/70 hover:shadow-[0_0_28px_rgba(52,211,153,0.35)]' },
    { id: 'wind', icon: <Wind className="w-8 h-8 md:w-10 md:h-10" />, label: 'Wind', accent: 'hover:border-amber-200/70 hover:shadow-[0_0_28px_rgba(252,211,77,0.35)]' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] z-10">
      {/* Top HUD */}
      <div className="flex justify-end items-start pointer-events-auto">
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

      {/* Bottom HUD: кнопки стихий — крупные, на весь ряд, на мобильных прижаты к низу */}
      <div className="flex flex-col items-center pointer-events-auto mb-2 md:mb-8">
        <div className="grid grid-cols-4 gap-3 md:gap-5 w-full max-w-sm md:max-w-lg">
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
                  aspect-square w-full rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1 md:gap-2
                  transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md border
                  ${isMastered ? 'bg-white/20 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/10 border-white/20 hover:bg-white/15'}
                  ${isActive ? 'scale-110 bg-white/30' : ''}
                  ${el.accent}
                `}
                title={`Manually trigger ${el.label}`}
              >
                <div className={`${isMastered ? 'text-white' : 'text-white/70'} ${isActive ? 'animate-pulse text-blue-200' : ''}`}>
                  {el.icon}
                </div>
                <span className={`text-[11px] md:text-sm font-semibold tracking-wide ${isMastered ? 'text-white' : 'text-white/60'}`}>{el.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
