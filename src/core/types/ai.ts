export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter' | 'mock';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
}

export interface StreamChunk {
  text?: string;
  thinking?: string;
  isDone?: boolean;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export interface AIProviderAdapter {
  streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk>;
}

// Internal API Types for Infrastructure
export interface OpenAIChunk {
  choices: Array<{
    delta: {
      content?: string;
      reasoning_content?: string;
      thought?: string;
    };
  }>;
}

export interface AnthropicChunk {
  type: 'content_block_delta' | 'message_start' | 'message_delta' | 'message_stop';
  delta?: { text?: string; thinking?: string };
}

export interface GeminiChunk {
  candidates: Array<{
    content: {
      parts: Array<{ text?: string }>;
    };
  }>;
}
