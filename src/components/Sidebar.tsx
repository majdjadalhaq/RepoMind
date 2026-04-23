import React, { useState } from 'react';
import { useConversations } from '../presentation/context/ConversationContext';
import { Button } from './ui/Button';
import { Repository } from '../core/types/repo';
import { FileExplorer } from './FileExplorer';
import { RepoModal } from './RepoModal';

interface SidebarProps {
  repo: Repository | null;
  selectedPaths: Set<string>;
  onToggleFile: (path: string) => void;
  onConnectRepo: (url: string) => Promise<void>;
  repoLoading?: boolean;
  repoError?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  repo, 
  selectedPaths, 
  onToggleFile, 
  onConnectRepo,
  repoLoading,
  repoError,
  isOpen,
  onClose,
  onOpenSettings
}) => {
  const { conversations, activeId, setActiveId, createConversation, deleteConversation } = useConversations();
  const [showRepoModal, setShowRepoModal] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative z-[50] md:z-auto h-screen w-80 glass-panel flex flex-col border-r border-glass-border transition-transform duration-300 ease-expo
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-1.5">
              <img src="/favicon.png" alt="RepoMind" className="w-6 h-6 object-contain" />
              <span className="text-cyan-primary -ml-1">epo</span>Mind
            </h2>
            {onClose && (
              <button onClick={onClose} className="md:hidden p-2 text-text-muted hover:text-primary" aria-label="Close Sidebar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-2">
            <Button 
              className="flex-1 justify-center gap-2" 
              onClick={() => {
                createConversation('openai', 'gpt-4o');
                onClose?.();
              }}
              aria-label="Create New Chat"
            >
              New Chat
            </Button>
            <Button 
              variant="ghost"
              className="px-3" 
              onClick={() => {
                createConversation('mock', 'mock-intelligence');
                onClose?.();
              }}
              title="Try Mock Mode (Free)"
              aria-label="Try Mock Mode"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </Button>
          </div>
          
          <Button 
            variant="ghost"
            className="w-full justify-start gap-2 text-xs h-9" 
            onClick={() => setShowRepoModal(true)}
            aria-label="Connect GitHub Repository"
          >
            <svg className="w-4 h-4 text-cyan-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
            </svg>
            {repo ? `Active: ${repo.name}` : 'Connect Repository'}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-2 text-[10px] uppercase font-bold tracking-widest text-text-muted/60">
            Intelligence Sessions
          </div>
          <nav className="flex-[0.4] overflow-y-auto px-3 space-y-1 mb-4">
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeId === conv.id 
                    ? 'bg-cyan-primary/10 text-cyan-primary' 
                    : 'text-text-muted hover:bg-glass-bg hover:text-primary'
                }`}
                onClick={() => {
                  setActiveId(conv.id);
                  onClose?.();
                }}
                role="button"
                aria-pressed={activeId === conv.id}
              >
                <svg className="w-5 h-5 mr-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                <button 
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  aria-label={`Delete ${conv.title}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </nav>

          {repo && (
            <div className="flex-1 flex flex-col min-h-0 border-t border-glass-border bg-glass-bg/50">
               <div className="px-6 py-4 flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted/60">Project Explorer</div>
                  <div className="px-2 py-0.5 rounded-full bg-cyan-primary/20 text-cyan-primary text-[10px] font-bold">
                     {selectedPaths.size} Files
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto px-4 pb-6">
                  <FileExplorer 
                    tree={repo.tree || []} 
                    selectedPaths={selectedPaths} 
                    onToggle={onToggleFile} 
                  />
               </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-glass-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-sm" 
            aria-label="Open Settings"
            onClick={onOpenSettings}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
        </div>

        {showRepoModal && (
          <RepoModal 
            onConnect={async (url) => {
              await onConnectRepo(url);
              setShowRepoModal(false);
              onClose?.();
            }}
            onClose={() => setShowRepoModal(false)}
            isLoading={repoLoading}
            error={repoError}
          />
        )}
      </aside>
    </>
  );
};
