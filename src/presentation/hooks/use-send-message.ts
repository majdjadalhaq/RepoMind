import { useRef } from 'react';

import { useChatStore } from '../../application/store/chat-store';
import { useConfigStore } from '../../application/store/config-store';
import { useRepoStore } from '../../application/store/repo-store';
import { useUIStore } from '../../application/store/ui-store';
import { LLMConfig, Message, MODEL_PRICING,StoredConversation  } from '../../core/types';
import { streamLLMResponse } from '../../infrastructure/llmFactory';

export const useSendMessage = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    messages, setMessages,
    activeFiles, setActiveFiles,
    conversations, setConversations,
    currentConversationId, setCurrentConversationId,
    setIsLoading
  } = useChatStore();

  const {
    isSearchEnabled,
    isDesignMode,
    isFullRepoMode,
    thinkingMode,
    setQuotaError
  } = useUIStore();

  const {
    githubRepoLink,
    repoTree,
    repoDetails
  } = useRepoStore();

  const {
    llmConfig,
    updateUsage
  } = useConfigStore();

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const currentMsgs = useChatStore.getState().messages;
    if (currentMsgs.length > 0) {
      const lastIndex = currentMsgs.length - 1;
      const lastMsg = currentMsgs[lastIndex];
      if (lastMsg.role === 'model' && !lastMsg.responseTime) {
        setMessages(currentMsgs.map((m, i) => i === lastIndex ? {
          ...m,
          isAborted: true,
          responseTime: Date.now() - m.timestamp
        } : m));
      }
    }
    setIsLoading(false);
  };

  const sendMessage = async (text: string, configOverride?: LLMConfig) => {
    const activeConfig = configOverride || llmConfig;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now(),
      relatedFiles: activeFiles.map(f => f.name)
    };

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'model',
      text: '',
      thinking: '',
      timestamp: Date.now(),
      isNew: true,
      model: activeConfig.model
    };

    let newConvId = currentConversationId || Date.now().toString();
    const isNewConversation = !currentConversationId;

    if (isNewConversation) {
      const newConv: StoredConversation = {
        id: newConvId,
        title: text.length > 30 ? text.substring(0, 30) + '...' : text,
        messages: [userMessage, initialBotMessage],
        activeFiles: activeFiles,
        githubRepoLink: githubRepoLink,
        repoDetails: repoDetails,
        repoTree: repoTree,
        lastModified: Date.now(),
        totalUsage: { promptTokens: 0, completionTokens: 0, totalCost: 0 }
      };
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConvId);
      setMessages([userMessage, initialBotMessage]);
    } else {
      setMessages([...messages.map(m => ({ ...m, isNew: false })), userMessage, initialBotMessage]);
    }

    setIsLoading(true);
    setActiveFiles([]);

    // Initialize AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const stream = streamLLMResponse(
        activeConfig,
        userMessage.text,
        messages,
        activeFiles,
        githubRepoLink,
        thinkingMode,
        isSearchEnabled,
        isDesignMode,
        isFullRepoMode,
        repoTree,
        conversations.find(c => c.id === newConvId)?.activeFiles || activeFiles,
        controller.signal
      );

      const responseStartTime = Date.now();
      let thinkingStartTime = Date.now();
      let hasFinishedThinking = false;

      for await (const chunk of stream) {
        // IMMEDIATE STOP CHECK: If user stopped or signal aborted, break the loop and cease all UI updates
        if (controller.signal.aborted || !abortControllerRef.current) {
          break;
        }

        if (chunk.error && (chunk.error.type === 'quota' || chunk.error.type === 'model')) {
          setQuotaError({
            type: chunk.error.type,
            message: chunk.error.message,
            model: llmConfig.model,
            originalPrompt: text,
            userMessageId: userMessage.id
          });
          setMessages(useChatStore.getState().messages.filter(m => m.id !== botMessageId));
          setIsLoading(false);
          return;
        }

        const currentMessages = useChatStore.getState().messages;
        const msgIndex = currentMessages.findIndex(m => m.id === botMessageId);
        if (msgIndex !== -1) {
          const currentBotMsg = currentMessages[msgIndex];
          let updatedMsg = { ...currentBotMsg };

          if (chunk.thinkingDelta) {
            updatedMsg.thinking = (updatedMsg.thinking || "") + chunk.thinkingDelta;
          }

          if (chunk.textDelta) {
            if (!hasFinishedThinking && updatedMsg.thinking) {
              updatedMsg.thinkingTime = Date.now() - thinkingStartTime;
              hasFinishedThinking = true;
            }
            updatedMsg.text += chunk.textDelta;
          }

          setMessages(currentMessages.map(m => m.id === botMessageId ? updatedMsg : m));
        }

        if (chunk.usage) {
          const { promptTokens, completionTokens } = chunk.usage;
          const pricing = MODEL_PRICING[llmConfig.model] || { input: 0, output: 0 };
          const cost = ((promptTokens / 1000000) * pricing.input) + ((completionTokens / 1000000) * pricing.output);
          
          updateUsage(llmConfig.model, { promptTokens, completionTokens, cost });
          
          // Update bot message with final usage
          const currentMsgs = useChatStore.getState().messages;
          setMessages(currentMsgs.map(m => m.id === botMessageId ? { ...m, usage: chunk.usage } : m));
        }
      }

      const finalMsgs = useChatStore.getState().messages;
      setMessages(finalMsgs.map(m => 
        m.id === botMessageId ? { ...m, responseTime: Date.now() - responseStartTime } : m
      ));
    } catch {
      // console.error("Streaming failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, stopResponse };
};
