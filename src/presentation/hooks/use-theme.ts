import { useEffect } from 'react';
import { useUIStore } from '../../application/store/ui-store';

export const useTheme = () => {
  const { isDark, setIsDark } = useUIStore();

  // 1. Initial Load from LocalStorage or System Preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('repomind_theme');
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      // Fallback to system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(systemDark);
    }
  }, [setIsDark]);

  // 2. Synchronize State to DOM and LocalStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('repomind_theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('repomind_theme', 'light');
    }
  }, [isDark]);

  return { isDark };
};
