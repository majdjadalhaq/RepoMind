import { AIConfig, ChatMessage, OpenAIChunk,StreamChunk } from '../../core/types/ai';
import { BaseAIAdapter } from './base-adapter';

export class OpenAICompatibleAdapter extends BaseAIAdapter<OpenAIChunk> {
  constructor(private readonly baseUrl: string, private readonly providerName: string) {
    super();
  }

  async *streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Title': 'RepoMind'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      await this.handleResponseError(response, this.providerName);
    }

    yield* this.parseSSEStream(response);
  }

  protected *mapChunkToStreamChunk(json: OpenAIChunk): IterableIterator<StreamChunk> {
    const delta = json.choices?.[0]?.delta;
    if (!delta) return;

    if (delta.content) yield { text: delta.content };
    
    // Support common reasoning fields
    const thinking = delta.reasoning_content || delta.thought;
    if (thinking) yield { thinking };
  }
}
