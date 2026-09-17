import { useEffect, useRef, useState, useCallback } from 'react';
import { useElementStore, ElementType } from '@/store/elementStore';

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
};

const ELEMENTS: Record<string, { id: ElementType, ipa: string }> = {
  water: { id: 'water', ipa: '/ˈwɔːtər/' },
  fire: { id: 'fire', ipa: '/ˈfaɪər/' },
  earth: { id: 'earth', ipa: '/ɜːrθ/' },
  wind: { id: 'wind', ipa: '/wɪnd/' },
  air: { id: 'air', ipa: '/er/' },
};

export const useSpeechElementDetector = (onElementMastered?: (element: string) => void) => {
  const { setActiveElement, addMasteredElement, incrementStreak, resetStreak, setIsListening, isListening } = useElementStore();
  const recognitionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ word: string, ipa: string } | null>(null);
  const lastTriggerRef = useRef<number>(0);

  const initRecognition = useCallback(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access to play.');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).toLowerCase().trim();
      if (!text) return;

      const words = text.split(/\s+/).filter(Boolean);
      const lastWord = words[words.length - 1]; // Focus on the last spoken word

      if (!lastWord) return;

      const now = Date.now();
      if (now - lastTriggerRef.current < 3000) return; // 3 second debounce

      let matchedElement: ElementType = null;
      let matchedWord = '';

      // Direct match first
      for (const key of Object.keys(ELEMENTS)) {
        if (lastWord === key || words.includes(key)) {
          matchedElement = ELEMENTS[key].id;
          matchedWord = key;
          break;
        }
      }

      // Fuzzy match fallback if no direct match
      if (!matchedElement) {
        let bestDistance = Infinity;
        let bestMatch = '';

        for (const key of Object.keys(ELEMENTS)) {
          const dist = levenshtein(lastWord, key);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestMatch = key;
          }
        }

        // Tolerance
        if (bestDistance <= 2 && bestMatch) {
           // Found a fuzzy match -> likely incorrect pronunciation
           setSuggestion({ word: bestMatch, ipa: ELEMENTS[bestMatch].ipa });
           resetStreak();
           lastTriggerRef.current = now; // debounce
           return; 
        } else if (finalTranscript) {
           // Completely wrong word
           setSuggestion({ word: 'Try an element', ipa: 'water, fire, earth, wind' });
           resetStreak();
        }
      } else {
        // Success match
        setSuggestion(null);
        setActiveElement(matchedElement);
        addMasteredElement(matchedElement!);
        incrementStreak();
        lastTriggerRef.current = now;
        if (onElementMastered) onElementMastered(matchedElement!);
        
        // Auto reset effect
        setTimeout(() => {
          setActiveElement(null);
        }, 4500);
      }
    };

    recognitionRef.current = recognition;
  }, [setActiveElement, addMasteredElement, incrementStreak, resetStreak, setIsListening, onElementMastered]);

  useEffect(() => {
    initRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initRecognition]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };
  
  const playExample = (word: string) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(word);
      msg.lang = 'en-US';
      window.speechSynthesis.speak(msg);
    }
  };

  return { error, suggestion, toggleListening, isListening, playExample };
};
