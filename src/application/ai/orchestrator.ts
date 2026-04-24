import { AppError } from '../../core/lib/errors';
import { AIConfig, AIProviderAdapter, ChatMessage, LLMProvider, StreamChunk } from '../../core/types/ai';
import { AnthropicAdapter } from '../../infrastructure/ai/anthropic-adapter';
import { GeminiAdapter } from '../../infrastructure/ai/gemini-adapter';
import { MockAdapter } from '../../infrastructure/ai/mock-adapter';
import { OpenAIAdapter } from '../../infrastructure/ai/openai-adapter';
import { OpenAICompatibleAdapter } from '../../infrastructure/ai/openai-compatible-adapter';

export class AIOrchestrator {
  private adapters: Map<LLMProvider, AIProviderAdapter> = new Map();

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters() {
    this.adapters.set('openai', new OpenAIAdapter());
    this.adapters.set('anthropic', new AnthropicAdapter());
    this.adapters.set('google', new GeminiAdapter());
    this.adapters.set('deepseek', new OpenAICompatibleAdapter('https://api.deepseek.com', 'DeepSeek'));
    this.adapters.set('openrouter', new OpenAICompatibleAdapter('https://openrouter.ai/api/v1', 'OpenRouter'));
    this.adapters.set('mock', new MockAdapter());
  }

  registerAdapter(provider: LLMProvider, adapter: AIProviderAdapter) {
    this.adapters.set(provider, adapter);
  }

  async *streamResponse(
    provider: LLMProvider, 
    config: AIConfig, 
    messages: ChatMessage[]
  ): AsyncGenerator<StreamChunk> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new AppError('INTERNAL_ERROR', `AI provider "${provider}" is not registered`);
    }
    yield* adapter.streamResponse(config, messages);
  }
}

export const aiOrchestrator = new AIOrchestrator();
