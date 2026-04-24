import { useCallback, useEffect, useRef,useState } from 'react';

import { ChatMessage, LLMProvider } from '../../core/types/ai';
import { Conversation } from '../../core/types/chat';

const STORAGE_KEY = 'repomind_conversations';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse conversations:', e);
      }
    }
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [conversations]);

  const createConversation = useCallback((provider: LLMProvider, model: string) => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      provider,
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newConv.id);
    return newConv.id;
  }, []);

  const addMessage = useCallback((id: string, message: ChatMessage, thinking?: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== id) return conv;
      
      const updatedMessage = { ...message };
      if (thinking) updatedMessage.thinking = thinking;

      const newMessages = [...conv.messages, updatedMessage];
      let title = conv.title;
      if (conv.messages.length === 0 && message.role === 'user') {
        title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
      }

      return {
        ...conv,
        messages: newMessages,
        title,
        updatedAt: Date.now()
      };
    }));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const activeConversation = conversations.find(c => c.id === activeId);

  return {
    conversations,
    activeId,
    setActiveId,
    activeConversation,
    createConversation,
    addMessage,
    deleteConversation
  };
};
