import React, { memo,useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ChatMessage } from '../core/types/ai';

interface MessageItemProps {
  message: ChatMessage;
  thinking?: string;
}

export const MessageItem = memo(({ message, thinking }: MessageItemProps) => {
  const isAssistant = message.role === 'assistant';
  const [showThinking, setShowThinking] = useState(true);

  return (
    <div className={`flex flex-col mb-8 ${isAssistant ? 'items-start' : 'items-end'}`}>
      <div className={`max-w-[85%] px-6 py-4 rounded-2xl shadow-sm ${
        isAssistant 
          ? 'bg-secondary border border-glass-border text-text-secondary' 
          : 'bg-cyan-primary text-black font-medium'
      }`}>
        {isAssistant && thinking && (
          <div className="mb-4 border-l-2 border-cyan-primary/30 pl-4 py-1">
            <button 
              onClick={() => setShowThinking(!showThinking)}
              className="text-[10px] uppercase tracking-widest font-bold text-cyan-primary mb-2 flex items-center gap-2 hover:brightness-125 transition-all"
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-cyan-primary ${showThinking ? 'animate-pulse' : ''}`} />
              {showThinking ? 'Conceal Reasoning' : 'Reveal Reasoning'}
            </button>
            {showThinking && (
              <div className="text-xs italic text-text-muted leading-relaxed whitespace-pre-wrap">
                {thinking}
              </div>
            )}
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      <div className="mt-2 px-2 text-[10px] text-text-muted uppercase tracking-tighter opacity-50">
        {message.role}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.message.content === next.message.content &&
    prev.message.role === next.message.role &&
    prev.thinking === next.thinking
  );
});
