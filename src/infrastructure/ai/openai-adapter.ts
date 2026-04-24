import { AIConfig, ChatMessage, OpenAIChunk,StreamChunk } from '../../core/types/ai';
import { BaseAIAdapter } from './base-adapter';

export class OpenAIAdapter extends BaseAIAdapter<OpenAIChunk> {
  async *streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: config.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true
      })
    });

    if (!response.ok) await this.handleResponseError(response, 'OpenAI');

    yield* this.parseSSEStream(response);
  }

  protected *mapChunkToStreamChunk(json: OpenAIChunk): IterableIterator<StreamChunk> {
    const content = json.choices[0]?.delta?.content;
    const thinking = json.choices[0]?.delta?.reasoning_content || (json.choices[0]?.delta as { thought?: string })?.thought;
    
    if (content) yield { text: content };
    if (thinking) yield { thinking };
  }
}

export const openAIAdapter = new OpenAIAdapter();
