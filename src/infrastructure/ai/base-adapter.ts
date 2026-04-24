import { AppError, ErrorCode } from '../../core/lib/errors';
import { AIConfig, AIProviderAdapter, ChatMessage, StreamChunk } from '../../core/types/ai';

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
    const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
    const errorData = errorBody.error as Record<string, unknown> | undefined;
    const message = (errorData?.message as string) || (errorBody.message as string) || response.statusText;

    let code: ErrorCode = 'API_ERROR';
    if (response.status === 401 || response.status === 403) code = 'AUTH_FAILED';
    if (response.status === 429) code = 'RATE_LIMIT';

    throw new AppError(code, `${providerName} API error: ${message}`, errorBody, response.status);
  }
}
