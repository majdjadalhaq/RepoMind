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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Gemini returns a JSON array over time: [ {chunk}, {chunk} ]
        // We need to find valid JSON objects within the buffer
        let startIndex = buffer.indexOf('{');
        while (startIndex !== -1) {
          let braceCount = 0;
          let inString = false;
          let escape = false;
          let endIndex = -1;

          for (let i = startIndex; i < buffer.length; i++) {
            const char = buffer[i];
            if (escape) {
              escape = false;
              continue;
            }
            if (char === '\\') {
              escape = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
          }

          if (endIndex !== -1) {
            const chunkStr = buffer.substring(startIndex, endIndex + 1);
            try {
              const json = JSON.parse(chunkStr) as GeminiChunk;
              yield* this.mapChunkToStreamChunk(json);
            } catch {
              // Ignore partial/malformed chunks
            }
            buffer = buffer.substring(endIndex + 1);
            startIndex = buffer.indexOf('{');
          } else {
            // Incomplete JSON object, wait for more data
            break;
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
