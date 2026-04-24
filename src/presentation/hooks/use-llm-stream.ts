import { useCallback,useRef, useState } from 'react';

import { aiOrchestrator } from '../../application/ai/orchestrator';
import { AIConfig,ChatMessage, LLMProvider } from '../../core/types/ai';
import { useThrottledBuffer } from './use-throttled-buffer';

export const useLLMStream = () => {
  const { value: content, append: appendContent, clear: clearContent } = useThrottledBuffer();
  const { value: thinking, append: appendThinking, clear: clearThinking } = useThrottledBuffer();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const streamResponse = useCallback(async (
    provider: LLMProvider,
    config: AIConfig,
    messages: ChatMessage[]
  ) => {
    setIsStreaming(true);
    setError(null);
    clearContent();
    clearThinking();
    
    abortControllerRef.current = new AbortController();

    try {
      const generator = aiOrchestrator.streamResponse(provider, config, messages);
      
      for await (const chunk of generator) {
        if (chunk.text) appendContent(chunk.text);
        if (chunk.thinking) appendThinking(chunk.thinking);
        if (chunk.isDone) break;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setIsStreaming(false);
    }
  }, [appendContent, appendThinking, clearContent, clearThinking]);

  return { content, thinking, isStreaming, error, streamResponse, stopStreaming };
};
