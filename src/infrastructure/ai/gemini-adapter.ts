import { AIConfig, ChatMessage, StreamChunk, GeminiChunk } from '../../core/types/ai';
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}`, {
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
    let braceCount = 0;
    let startIndex = -1;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '{') {
          if (braceCount === 0) startIndex = i;
          braceCount++;
        } else if (buffer[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            const chunkStr = buffer.substring(startIndex, i + 1);
            try {
              const json = JSON.parse(chunkStr) as GeminiChunk;
              yield* this.mapChunkToStreamChunk(json);
            } catch { /* Ignore */ }
            buffer = buffer.substring(i + 1);
            i = -1;
            startIndex = -1;
          }
        }
      }
    }
  }

  protected *mapChunkToStreamChunk(json: GeminiChunk): IterableIterator<StreamChunk> {
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) yield { text };
  }
}
