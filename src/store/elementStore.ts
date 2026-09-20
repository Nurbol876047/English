import { create } from 'zustand';

export type ElementType = 'water' | 'fire' | 'earth' | 'wind' | 'air' | null;

interface ElementState {
  activeElement: ElementType;
  masteredElements: string[];
  streak: number;
  isListening: boolean;
  /** Играет полноэкранный ролик стихии — фоновое видео на это время глушится */
  isElementVideoPlaying: boolean;
  setActiveElement: (element: ElementType) => void;
  addMasteredElement: (element: string) => void;
  resetStreak: () => void;
  incrementStreak: () => void;
  setIsListening: (isListening: boolean) => void;
  setIsElementVideoPlaying: (playing: boolean) => void;
}

export const useElementStore = create<ElementState>((set) => ({
  activeElement: null,
  masteredElements: [],
  streak: 0,
  isListening: false,
  isElementVideoPlaying: false,
  setActiveElement: (element) => set({ activeElement: element }),
  addMasteredElement: (element) => set((state) => ({
    masteredElements: state.masteredElements.includes(element) 
      ? state.masteredElements 
      : [...state.masteredElements, element]
  })),
  resetStreak: () => set({ streak: 0 }),
  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
  setIsListening: (isListening) => set({ isListening }),
  setIsElementVideoPlaying: (isElementVideoPlaying) => set({ isElementVideoPlaying }),
}));
