import { AIConfig, ChatMessage, StreamChunk, AnthropicChunk } from '../../core/types/ai';
import { BaseAIAdapter } from './base-adapter';

export class AnthropicAdapter extends BaseAIAdapter<AnthropicChunk> {
  async *streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: config.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!response.ok) await this.handleResponseError(response, 'Anthropic');

    yield* this.parseSSEStream(response);
  }

  protected *mapChunkToStreamChunk(json: AnthropicChunk): IterableIterator<StreamChunk> {
    if (json.type === 'content_block_delta' && json.delta) {
      if (json.delta.text) yield { text: json.delta.text };
      if (json.delta.thinking) yield { thinking: json.delta.thinking };
    }
  }
}

export const anthropicAdapter = new AnthropicAdapter();
