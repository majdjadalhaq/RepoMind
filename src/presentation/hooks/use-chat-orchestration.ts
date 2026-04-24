import { useState } from 'react';

import { PromptBuilder } from '../../application/ai/prompt-builder';
import { Conversation } from '../../core/types/chat';
import { Repository } from '../../core/types/repo';
import { useApiKeys } from './use-api-keys';
import { useLLMStream } from './use-llm-stream';

interface UseChatOrchestrationProps {
  activeConversation?: Conversation;
  repo: Repository | null;
  selectedPaths: Set<string>;
  getFileContent: (path: string) => Promise<string | null>;
  onSendMessage: (content: string) => void;
}

export const useChatOrchestration = ({
  activeConversation,
  repo,
  selectedPaths,
  getFileContent,
  onSendMessage
}: UseChatOrchestrationProps) => {
  const [input, setInput] = useState('');
  const { content, thinking, isStreaming, error, streamResponse, stopStreaming } = useLLMStream();
  const { keys } = useApiKeys();

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !activeConversation) return;

    const currentInput = input;
    setInput('');
    onSendMessage(currentInput);

    try {
      // 1. Fetch contents of selected files
      const selectedFiles: { path: string; content: string }[] = [];
      if (repo && selectedPaths.size > 0) {
        const fetchPromises = Array.from(selectedPaths).map(async (path) => {
          const fileContent = await getFileContent(path);
          if (fileContent) return { path, content: fileContent };
          return null;
        });

        const results = await Promise.all(fetchPromises);
        results.forEach(res => {
          if (res) selectedFiles.push(res);
        });
      }

      // 2. Build augmented message history
      const systemPrompt = PromptBuilder.buildSystemPrompt(repo || undefined, selectedFiles);
      const baseHistory = [...activeConversation.messages, { role: 'user', content: currentInput } as const];
      const history = PromptBuilder.augmentMessages(baseHistory, systemPrompt);
      
      // 3. Stream
      await streamResponse(
        activeConversation.provider,
        { apiKey: keys[activeConversation.provider] || '', model: activeConversation.model },
        history
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Chat orchestration failed:', err);
    }
  };

  return {
    input,
    setInput,
    content,
    thinking,
    isStreaming,
    error,
    handleSend,
    stopStreaming
  };
};
