import React, { useEffect,useRef } from 'react';

import { Conversation } from '../core/types/chat';
import { Repository } from '../core/types/repo';
import { useChatOrchestration } from '../presentation/hooks/use-chat-orchestration';
import { MessageItem } from './MessageItem';
import { Button } from './ui/Button';

interface ChatWindowProps {
  activeConversation?: Conversation;
  repo: Repository | null;
  selectedPaths: Set<string>;
  getFileContent: (path: string) => Promise<string | null>;
  onSendMessage: (content: string) => void;
  onReceiveResponse: (content: string, thinking?: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = (props) => {
  const { activeConversation, repo, selectedPaths, onReceiveResponse } = props;
  const {
    input,
    setInput,
    content,
    thinking,
    isStreaming,
    error,
    handleSend,
    stopStreaming
  } = useChatOrchestration(props);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, thinking, activeConversation?.messages]);

  useEffect(() => {
    if (!isStreaming && content) {
      onReceiveResponse(content, thinking);
    }
  }, [isStreaming]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 rounded-3xl bg-cyan-primary/5 flex items-center justify-center mb-8 border border-cyan-primary/20">
          <svg className="w-12 h-12 text-cyan-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">No Conversation Selected</h2>
        <p className="text-text-muted max-w-sm">Pick a thread from the sidebar or start a new intelligence session.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen relative bg-primary">
      {/* Header */}
      <header className="px-8 py-4 border-b border-glass-border bg-primary/50 backdrop-blur-md flex items-center justify-between z-10">
        <div>
          <h3 className="font-bold text-primary flex items-center gap-2">
            {activeConversation.title}
            <span className="px-2 py-0.5 rounded-full bg-cyan-primary/10 text-cyan-primary text-[10px] uppercase font-bold tracking-widest border border-cyan-primary/20">
              {activeConversation.model}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-muted">
           {repo && (
             <span className="text-cyan-primary/80">
               Project: {repo.name} ({selectedPaths.size} files)
             </span>
           )}
           {isStreaming && (
             <div className="flex items-center gap-2 text-cyan-primary animate-pulse ml-4">
               <div className="w-2 h-2 rounded-full bg-cyan-primary" />
               Analyzing
             </div>
           )}
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 pt-24 pb-48 space-y-2 overscroll-contain"
        style={{ overflowAnchor: 'auto' }}
      >
        <div className="max-w-4xl mx-auto">
          {activeConversation.messages.map((m, i) => (
            <MessageItem key={i} message={m} />
          ))}
          
          {/* Current Streaming Message */}
          {(content || thinking) && (
            <MessageItem 
              message={{ role: 'assistant', content }} 
              thinking={thinking} 
            />
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mb-8 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-primary via-primary to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-primary/30 to-purple-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col bg-secondary border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
            <textarea 
              rows={1}
              placeholder={repo ? `Query ${repo.name}...` : "Query the mind..."}
              className="w-full bg-transparent p-6 pr-24 text-primary resize-none outline-none max-h-64 min-h-[80px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-4 bottom-4 flex gap-2">
              {isStreaming ? (
                <Button variant="destructive" size="sm" onClick={stopStreaming}>
                  Abort
                </Button>
              ) : (
                <Button size="sm" disabled={!input.trim()} onClick={handleSend}>
                  Execute
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-center text-[10px] text-text-muted gap-4 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {selectedPaths.size > 0 ? `${selectedPaths.size} files in context` : 'No files selected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
