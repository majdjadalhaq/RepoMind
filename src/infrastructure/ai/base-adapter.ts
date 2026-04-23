import { AIConfig, ChatMessage, StreamChunk, AIProviderAdapter } from '../../core/types/ai';

export abstract class BaseAIAdapter<T = unknown> implements AIProviderAdapter {
  abstract streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk>;

  protected async *parseSSEStream(response: Response): AsyncGenerator<StreamChunk> {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Handle both \n and \r\n
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanedLine = line.replace(/^data: /, '').trim();
          if (!cleanedLine || cleanedLine === '[DONE]') continue;

          try {
            const json = JSON.parse(cleanedLine) as T;
            yield* this.mapChunkToStreamChunk(json);
          } catch {
            // Ignore partial/malformed chunks
          }
        }
      }
    } finally {
      // Ensure reader is released even if generator is returned early
      reader.releaseLock();
    }
  }

  protected abstract mapChunkToStreamChunk(json: T): IterableIterator<StreamChunk>;
  
  protected async handleResponseError(response: Response, providerName: string): Promise<never> {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`${providerName} API error: ${error.error?.message || response.statusText}`);
  }
}
