import { useCallback, useEffect,useRef, useState } from 'react';

export const useThrottledBuffer = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const buffer = useRef(initialValue);
  const hasChanged = useRef(false);
  const rafId = useRef<number | null>(null);

  const update = useCallback(() => {
    if (hasChanged.current) {
      setValue(buffer.current);
      hasChanged.current = false;
      rafId.current = requestAnimationFrame(update);
    } else {
      rafId.current = null;
    }
  }, []);

  const append = useCallback((chunk: string) => {
    buffer.current += chunk;
    hasChanged.current = true;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(update);
    }
  }, [update]);

  const clear = useCallback((newValue: string = '') => {
    buffer.current = newValue;
    setValue(newValue);
    hasChanged.current = false;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { value, append, clear };
};
