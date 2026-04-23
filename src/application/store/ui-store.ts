import { create } from 'zustand';
import { ThinkingMode } from '../../core/types';

interface UIState {
  isRepoModalOpen: boolean;
  isSettingsOpen: boolean;
  isMobileMenuOpen: boolean;
  isDark: boolean;
  isSearchEnabled: boolean;
  isDesignMode: boolean;
  isFullRepoMode: boolean;
  showThinking: boolean;
  thinkingMode: ThinkingMode;
  
  // Actions
  setIsRepoModalOpen: (isOpen: boolean) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setIsDark: (isDark: boolean) => void;
  toggleDark: () => void;
  setIsSearchEnabled: (isEnabled: boolean) => void;
  setIsDesignMode: (isEnabled: boolean) => void;
  setIsFullRepoMode: (isEnabled: boolean) => void;
  setShowThinking: (show: boolean) => void;
  setThinkingMode: (mode: ThinkingMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isRepoModalOpen: false,
  isSettingsOpen: false,
  isMobileMenuOpen: false,
  isDark: false,
  isSearchEnabled: false,
  isDesignMode: false,
  isFullRepoMode: false,
  showThinking: false,
  thinkingMode: 'concise',

  setIsRepoModalOpen: (isRepoModalOpen) => set({ isRepoModalOpen }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  setIsDark: (isDark) => set({ isDark }),
  toggleDark: () => set((state) => ({ isDark: !state.isDark })),
  setIsSearchEnabled: (isSearchEnabled) => set({ isSearchEnabled }),
  setIsDesignMode: (isDesignMode) => set({ isDesignMode }),
  setIsFullRepoMode: (isFullRepoMode) => set({ isFullRepoMode }),
  setShowThinking: (showThinking) => set({ showThinking }),
  setThinkingMode: (thinkingMode) => set({ thinkingMode }),
}));
