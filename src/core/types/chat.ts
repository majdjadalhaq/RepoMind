import { LLMProvider, ChatMessage } from './ai';

export interface Conversation {
  id: string;
  title: string;
  provider: LLMProvider;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  repoContext?: {
    repoId: string;
    selectedFiles: string[]; // Paths
  };
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId?: string;
}
