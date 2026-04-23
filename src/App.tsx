import React, { useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Gateway } from './components/Gateway';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useApiKeys } from './presentation/hooks/use-api-keys';
import { useRepo } from './presentation/hooks/use-repo';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ConversationProvider, useConversations } from './presentation/context/ConversationContext';

const AppContent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeConversation, addMessage } = useConversations();
  const { keys, isLoading: keysLoading } = useApiKeys();
  const { 
    repo, 
    isLoading: repoLoading, 
    error: repoError, 
    selectedPaths, 
    connectRepo, 
    toggleFile, 
    getFileContent 
  } = useRepo();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasAnyKey = useMemo(() => Object.values(keys).some(k => !!k), [keys]);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.fromTo(containerRef.current, 
      { opacity: 0, scale: 0.98 }, 
      { opacity: 1, scale: 1, duration: 1, ease: "expo.out" }
    );
  }, { scope: containerRef });

  if (keysLoading) return null;

  const sendMessage = (content: string) => {
    if (activeConversation) {
      addMessage(activeConversation.id, { role: 'user', content });
    }
  };

  const receiveResponse = (content: string, thinking?: string) => {
    if (activeConversation) {
      addMessage(activeConversation.id, { role: 'assistant', content }, thinking);
    }
  };

  return (
    <ErrorBoundary>
      <div ref={containerRef} className="app-container min-h-screen bg-primary flex flex-col md:flex-row overflow-hidden relative">
        {(!hasAnyKey || showSettings) && (
          <div className="fixed inset-0 z-[60]">
            <Gateway onComplete={() => setShowSettings(false)} />
          </div>
        )}
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-glass-border bg-primary/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-primary">RepoMind</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-secondary border border-glass-border text-primary"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        <Sidebar 
          repo={repo} 
          selectedPaths={selectedPaths} 
          onToggleFile={toggleFile} 
          onConnectRepo={connectRepo}
          repoLoading={repoLoading}
          repoError={repoError}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => {
            setShowSettings(true);
            setSidebarOpen(false);
          }}
        />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <ChatWindow 
            activeConversation={activeConversation}
            repo={repo}
            selectedPaths={selectedPaths}
            getFileContent={getFileContent}
            onSendMessage={sendMessage}
            onReceiveResponse={receiveResponse}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => (
  <ConversationProvider>
    <AppContent />
  </ConversationProvider>
);

export default App;
