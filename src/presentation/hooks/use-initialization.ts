import { useEffect } from 'react';

import { useChatStore } from '../../application/store/chat-store';
import { useConfigStore } from '../../application/store/config-store';
import { useRepoStore } from '../../application/store/repo-store';
import { useUIStore } from '../../application/store/ui-store';
import { LLMProvider,StoredConversation } from '../../core/types';
import { verifyKey } from '../../infrastructure/keyVerification';

export const useInitialization = () => {
  const { setConversations, setCurrentConversationId, setMessages, setActiveFiles } = useChatStore();
  const { setGithubRepoLink, setRepoDetails, setRepoTree } = useRepoStore();
  const { setLLMConfig, totalUsage } = useConfigStore();
  const { setIsOnboarding, setIsInitializing } = useUIStore();

  useEffect(() => {
    const initApp = async () => {
      const setupComplete = localStorage.getItem('app_setup_complete');
      const savedKeysStr = localStorage.getItem('llm_api_keys');
      const savedConversations = localStorage.getItem('chat_history');
      const savedUsage = localStorage.getItem('total_usage');
      const savedCurrentId = localStorage.getItem('current_conv_id');
      const savedConfig = localStorage.getItem('llm_config');

      // 1. Initial State Load
      if (savedUsage) {
        try {
          // JSON.parse(savedUsage);
          // Set via store if possible, but for now we'll just use the object
        } catch {}
      }

      if (savedConversations) {
        try {
          const parsed = JSON.parse(savedConversations);
          setConversations(parsed);
          
          if (savedCurrentId) {
            const lastConv = parsed.find((c: StoredConversation) => c.id === savedCurrentId);
            if (lastConv) {
              setCurrentConversationId(savedCurrentId);
              setMessages(lastConv.messages);
              setActiveFiles(lastConv.activeFiles);
              setGithubRepoLink(lastConv.githubRepoLink);
              setRepoDetails(lastConv.repoDetails);
              setRepoTree(lastConv.repoTree || []);
            }
          }
        } catch {}
      }

      // 2. Load keys/config
      let nextConfig = { ...useConfigStore.getState().llmConfig };
      if (savedKeysStr) {
        try {
          const parsedKeys = JSON.parse(savedKeysStr);
          nextConfig = { ...nextConfig, apiKeys: { ...nextConfig.apiKeys, ...parsedKeys } };
          
          if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            nextConfig = { ...nextConfig, ...parsedConfig };
          }
          setLLMConfig(nextConfig);
        } catch {}
      }

      // 3. Authorization Check
      if (setupComplete) {
        const providers: LLMProvider[] = ['google', 'openai', 'anthropic', 'deepseek', 'openrouter'];
        let allProvidedKeysValid = true;
        let atLeastOneKey = false;

        for (const provider of providers) {
          const key = nextConfig.apiKeys[provider];
          if (key && key.trim().length > 0) {
            atLeastOneKey = true;
            if (key.length > 20) {
              const result = await verifyKey(provider, key);
              if (!result.isValid) allProvidedKeysValid = false;
            } else {
              allProvidedKeysValid = false;
            }
          }
        }

        const onlyHasDefaultKey = nextConfig.apiKeys.google === process.env.NEXT_PUBLIC_API_KEY &&
          !nextConfig.apiKeys.openai && !nextConfig.apiKeys.anthropic && !nextConfig.apiKeys.deepseek && !nextConfig.apiKeys.openrouter;

        if (atLeastOneKey && allProvidedKeysValid && !onlyHasDefaultKey) {
          setIsOnboarding(false);
        } else {
          setIsOnboarding(true);
        }
      } else {
        setIsOnboarding(true);
      }

      setIsInitializing(false);
    };

    initApp();
  }, [setConversations, setCurrentConversationId, setMessages, setActiveFiles, setGithubRepoLink, setRepoDetails, setRepoTree, setLLMConfig, setIsOnboarding, setIsInitializing]); // Run once on mount

  const { 
    conversations, 
    currentConversationId, 
    messages, 
    activeFiles, 
    isLoading 
  } = useChatStore();
  
  const { 
    githubRepoLink, 
    repoDetails, 
    repoTree 
  } = useRepoStore();
  
  const { modelUsage } = useConfigStore();

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(conversations));
    localStorage.setItem('total_usage', JSON.stringify(totalUsage));
    localStorage.setItem('model_usage', JSON.stringify(modelUsage));
    if (currentConversationId) {
      localStorage.setItem('current_conv_id', currentConversationId);
    }
  }, [conversations, totalUsage, modelUsage, currentConversationId]);

  // Sync current state to conversations in store
  useEffect(() => {
    if (!currentConversationId || isLoading) return;

    const existing = conversations.find(c => c.id === currentConversationId);
    if (!existing) return;

    // Check if change is needed
    if (
      JSON.stringify(existing.messages) === JSON.stringify(messages) &&
      existing.activeFiles.length === activeFiles.length &&
      existing.githubRepoLink === githubRepoLink
    ) {
      return;
    }

    const updatedConversations = conversations.map(c => {
      if (c.id === currentConversationId) {
        return {
          ...c,
          messages,
          activeFiles,
          githubRepoLink,
          repoDetails,
          repoTree,
          lastModified: Date.now()
        };
      }
      return c;
    });

    setConversations(updatedConversations);
  }, [
    messages, 
    activeFiles, 
    githubRepoLink, 
    repoDetails, 
    currentConversationId, 
    isLoading
  ]);

  return null;
};
