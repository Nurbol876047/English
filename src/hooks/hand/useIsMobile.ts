'use client';

import { useEffect, useState } from 'react';

/**
 * Мобильный режим: узкий экран или мобильный UA. `null` до монтирования,
 * чтобы SSR и первый клиентский рендер совпадали.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () =>
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}
