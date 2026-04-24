import React, { createContext, ReactNode, useContext } from 'react';

import { AppError } from '../../core/lib/errors';
import { ChatMessage, LLMProvider } from '../../core/types/ai';
import { Conversation } from '../../core/types/chat';
import { useConversations as useConversationsHook } from '../hooks/use-conversations';

interface ConversationContextType {
  conversations: Conversation[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  activeConversation: Conversation | undefined;
  createConversation: (provider: LLMProvider, model: string) => string;
  addMessage: (id: string, message: ChatMessage, thinking?: string) => void;
  deleteConversation: (id: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const conversationsData = useConversationsHook();
  
  return (
    <ConversationContext.Provider value={conversationsData}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new AppError('INTERNAL_ERROR', 'useConversations must be used within a ConversationProvider');
  }
  return context;
};
