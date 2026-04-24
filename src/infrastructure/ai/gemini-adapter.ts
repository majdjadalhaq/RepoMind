import { AIConfig, ChatMessage, GeminiChunk,StreamChunk } from '../../core/types/ai';
import { BaseAIAdapter } from './base-adapter';

export class GeminiAdapter extends BaseAIAdapter<GeminiChunk> {
  async *streamResponse(config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const systemInstruction = messages
      .filter(m => m.role === 'system')
      .map(m => ({ parts: [{ text: m.content }] }))[0];

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        systemInstruction: systemInstruction || undefined
      })
    });

    if (!response.ok) {
      await this.handleResponseError(response, 'Google');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE sends lines starting with "data: "
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const json = JSON.parse(dataStr) as GeminiChunk;
            yield* this.mapChunkToStreamChunk(json);
          } catch {
            // Ignore malformed JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  protected *mapChunkToStreamChunk(json: GeminiChunk): IterableIterator<StreamChunk> {
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) yield { text };
  }
}
