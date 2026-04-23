import { create } from 'zustand';
import { Message, FileContext, StoredConversation, UsageStats } from '../../core/types';

interface ChatState {
  messages: Message[];
  activeFiles: FileContext[];
  conversations: StoredConversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setActiveFiles: (files: FileContext[]) => void;
  addActiveFile: (file: FileContext) => void;
  removeActiveFile: (id: string) => void;
  setConversations: (conversations: StoredConversation[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  
  // Logic
  createNewConversation: () => string;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeFiles: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) => m.id === id ? { ...m, ...updates } : m)
  })),

  setActiveFiles: (activeFiles) => set({ activeFiles }),

  addActiveFile: (file) => set((state) => {
    if (state.activeFiles.some(f => f.name === file.name)) return state;
    return { activeFiles: [...state.activeFiles, file] };
  }),

  removeActiveFile: (id) => set((state) => ({
    activeFiles: state.activeFiles.filter(f => f.id !== id)
  })),

  setConversations: (conversations) => set({ conversations }),
  
  setCurrentConversationId: (currentConversationId) => set({ currentConversationId }),
  
  setIsLoading: (isLoading) => set({ isLoading }),

  createNewConversation: () => {
    const id = Math.random().toString(36).substring(7);
    const newConv: StoredConversation = {
      id,
      title: 'New Chat',
      messages: [],
      activeFiles: [],
      githubRepoLink: '',
      repoDetails: null,
      repoTree: [],
      lastModified: Date.now()
    };
    
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      currentConversationId: id,
      messages: [],
      activeFiles: []
    }));
    
    return id;
  },

  loadConversation: (id) => {
    const conv = get().conversations.find(c => c.id === id);
    if (conv) {
      set({
        currentConversationId: id,
        messages: conv.messages,
        activeFiles: conv.activeFiles
      });
    }
  },

  deleteConversation: (id) => {
    set((state) => {
      const newConversations = state.conversations.filter(c => c.id !== id);
      const isDeletingCurrent = state.currentConversationId === id;
      
      return {
        conversations: newConversations,
        currentConversationId: isDeletingCurrent ? (newConversations[0]?.id || null) : state.currentConversationId,
        messages: isDeletingCurrent ? (newConversations[0]?.messages || []) : state.messages,
        activeFiles: isDeletingCurrent ? (newConversations[0]?.activeFiles || []) : state.activeFiles
      };
    });
  }
}));
