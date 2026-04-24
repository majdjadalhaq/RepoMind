import { Box,Loader2, Menu, X } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

import { useChatStore } from './application/store/chat-store';
import { useConfigStore } from './application/store/config-store';
import { useRepoStore } from './application/store/repo-store';
import { useUIStore } from './application/store/ui-store';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { Gateway } from './components/Gateway';
import { ModelSelector } from './components/ModelSelector';
import { MobileSidebar } from './components/MobileSidebar';
import { QuotaErrorOverlay } from './components/QuotaErrorOverlay';
import { RepoModal } from './components/RepoModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import type { LLMConfig } from './core/types';
import { useFileHandler } from './presentation/hooks/use-file-handler';
import { useGithubConnect } from './presentation/hooks/use-github-connect';
import { useInitialization } from './presentation/hooks/use-initialization';
import { useSendMessage } from './presentation/hooks/use-send-message';

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { 
    isMobileMenuOpen, setIsMobileMenuOpen,
    setIsSettingsOpen,
    isOnboarding, setIsOnboarding,
    isInitializing
  } = useUIStore();

  const {
    truncationWarning, setTruncationWarning
  } = useRepoStore();

  const { setLLMConfig } = useConfigStore(); // Initialize config store listener if needed, but we don't need its variables

  useChatStore();

  useInitialization();


  const handleFullReset = () => {
    if (confirm("This will delete ALL data (history, keys, settings) and reset RepoMind. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleGatewayComplete = (config: LLMConfig) => {
    setLLMConfig(config);
    localStorage.setItem('app_setup_complete', 'true');
    setIsOnboarding(false);
  };


  const { sendMessage, stopResponse } = useSendMessage();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const { handleAttachRepoFiles, handleRepoFileClick, handleSelectAllFiles } = useGithubConnect();
  const { handleFileChange } = useFileHandler();



  // Handle settings shortcut from ModelSelector
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex h-[100dvh] w-full bg-paper text-ink overflow-hidden font-sans transition-colors duration-300">

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-amber-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[15%] w-[20%] h-[20%] bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      <AnimatePresence mode="wait">
        {isInitializing && (
          <motion.div
            key="init-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-black flex items-center justify-center flex-col gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
            <p className="text-sm font-medium text-gray-500">Verifying keys...</p>
          </motion.div>
        )}

        {!isInitializing && isOnboarding && (
          <Gateway
            onComplete={handleGatewayComplete}
          />
        )}
      </AnimatePresence>

      <SettingsModal
        onFullReset={handleFullReset}
      />

      <QuotaErrorOverlay sendMessage={sendMessage} />

      <RepoModal
        onAttachRepo={handleAttachRepoFiles}
      />

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-[340px] flex-col border-r border-gray-100 dark:border-white/10 bg-white dark:bg-black h-full overflow-hidden">
        <Sidebar
          onAddFiles={handleFileChange}
          onRepoFileClick={handleRepoFileClick}
          onSelectAllFiles={handleSelectAllFiles}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-black">

        {/* Minimal Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 shrink-0 relative z-30 border-b border-gray-100 dark:border-white/5 md:border-none">
          <div className="flex items-center gap-4">
            <button aria-label="Toggle mobile menu" onClick={toggleMobileMenu} className="md:hidden text-black dark:text-white p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </button>

            <div className="md:hidden flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <img src="/favicon.png" alt="RepoMind" className="w-5 h-5 invert dark:invert-0" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-black dark:text-white">RepoMind</span>
            </div>

            {/* Desktop Model Selector */}
            <div className="hidden md:block">
              <ModelSelector />
            </div>
          </div>
        </header>

        {/* Chat Area - Scrollable */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {truncationWarning && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                <Box className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Partial Repo Attached: Hit {truncationWarning.limit} limit (Actual: {truncationWarning.actual}).
                </span>
              </div>
              <button 
                onClick={() => setTruncationWarning(null)}
                className="p-1 hover:bg-amber-200 dark:hover:bg-amber-500/20 rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-amber-800 dark:text-amber-400" />
              </button>
            </div>
          )}
          <ChatArea onSuggestionClick={sendMessage} />

          <ChatInput 
            onSendMessage={sendMessage}
            onStopResponse={stopResponse}
            onSelectAllFiles={handleSelectAllFiles}
          />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar
        onAddFiles={handleFileChange}
        onRepoFileClick={handleRepoFileClick}
        onSelectAllFiles={handleSelectAllFiles}
      />
    </div>
  );
};

export default App;