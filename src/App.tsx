import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RepoModal } from './components/RepoModal';
import { ModelSelector } from './components/ModelSelector';
import { Gateway } from './components/Gateway';
import { SettingsModal } from './components/SettingsModal';
import { FileContext, ChatState, Message, RepoDetails, LLMConfig, AVAILABLE_MODELS, LLMProvider, MODEL_PRICING, StoredConversation } from './core/types';
import { readFile } from './core/utils';
import { streamLLMResponse } from './infrastructure/llmFactory';
import { fetchRepoDetails, fetchRepoStructure, fetchGithubFileContent } from './infrastructure/githubService';
import { verifyKey } from './infrastructure/keyVerification';
import { useUIStore } from './application/store/ui-store';
import { useRepoStore } from './application/store/repo-store';
import { useConfigStore } from './application/store/config-store';
import { useChatStore } from './application/store/chat-store';
import { Paperclip, Menu, X, XCircle, ArrowUp, Loader2, Globe, Layers, Zap, Eye, EyeOff, ChevronDown, Check, BrainCircuit, CheckSquare, Box, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { 
    isMobileMenuOpen, setIsMobileMenuOpen,
    isDark, setIsDark,
    isSettingsOpen, setIsSettingsOpen,
    isRepoModalOpen, setIsRepoModalOpen,
    isSearchEnabled, setIsSearchEnabled,
    isDesignMode, setIsDesignMode,
    isFullRepoMode, setIsFullRepoMode,
    showThinking, setShowThinking,
    thinkingMode, setThinkingMode,
    quotaError, setQuotaError,
    isOnboarding, setIsOnboarding,
    isInitializing, setIsInitializing,
    toggleDark
  } = useUIStore();

  const {
    isRepoLoading, setIsRepoLoading,
    repoDetails, setRepoDetails,
    repoTree, setRepoTree,
    githubRepoLink, setGithubRepoLink,
    loadingFilePaths, setLoadingFilePaths
  } = useRepoStore();

  const {
    llmConfig, setLLMConfig,
    keyCapabilities, setKeyCapabilities,
    totalUsage, modelUsage, resetUsage, updateUsage
  } = useConfigStore();

  const {
    messages, setMessages,
    activeFiles, setActiveFiles,
    conversations, setConversations,
    currentConversationId, setCurrentConversationId,
    isLoading, setIsLoading,
    selectConversation, deleteConversation
  } = useChatStore();

  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleTheme = () => toggleDark();

  // Derived state
  const currentModelDef = AVAILABLE_MODELS[llmConfig.provider]?.find(m => m.id === llmConfig.model);
  const discoveredModelDef = keyCapabilities?.[llmConfig.provider]?.discoveredModels?.find((m: any) => m.id === llmConfig.model);

  const supportsThinking = !!(
    currentModelDef?.hasThinking ||
    discoveredModelDef?.hasThinking ||
    llmConfig.model.includes('gemini-2.5') ||
    llmConfig.model.includes('gemini-3') ||
    llmConfig.model.includes('thinking') ||
    llmConfig.model.includes('reasoner') ||
    llmConfig.model.includes('think') ||
    llmConfig.model.includes('deep') ||
    llmConfig.model.includes('o1')
  );

  const capableVisualModels = ['gemini', 'gpt-4', 'claude-3', 'sonnet', 'opus', 'o1', 'deepseek', 'f1'];
  const supportsVisuals = capableVisualModels.some(m => llmConfig.model.toLowerCase().includes(m));

  const isFreeVersion = llmConfig.provider === 'google' && llmConfig.apiKeys.google === process.env.NEXT_PUBLIC_API_KEY;

  // Initialization Logic
  useEffect(() => {
    const initApp = async () => {
      const setupComplete = localStorage.getItem('app_setup_complete');
      const savedKeysStr = localStorage.getItem('llm_api_keys');
      const savedConversations = localStorage.getItem('chat_history');
      const savedUsage = localStorage.getItem('total_usage');
      const savedModelUsage = localStorage.getItem('model_usage');
      const savedCurrentId = localStorage.getItem('current_conv_id');
      const savedConfig = localStorage.getItem('llm_config');

      // 1. Initial State Load
      if (savedUsage) {
        try {
          const parsed = JSON.parse(savedUsage);
          // Set via store if possible, but for now we'll just use the object
        } catch (e) { }
      }

      if (savedConversations) {
        try {
          const parsed = JSON.parse(savedConversations);
          setConversations(parsed);
          
          if (savedCurrentId) {
            const lastConv = parsed.find((c: any) => c.id === savedCurrentId);
            if (lastConv) {
              setCurrentConversationId(savedCurrentId);
              setMessages(lastConv.messages);
              setActiveFiles(lastConv.activeFiles);
              setGithubRepoLink(lastConv.githubRepoLink);
              setRepoDetails(lastConv.repoDetails);
              setRepoTree(lastConv.repoTree || []);
            }
          }
        } catch (e) { }
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
        } catch (e) { }
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
          console.warn("Invalid, missing, or default keys detected on startup, forcing onboarding.");
          setIsOnboarding(true);
        }
      } else {
        setIsOnboarding(true);
      }

      setIsInitializing(false);
    };

    initApp();
  }, []);

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
  }, [messages, activeFiles, githubRepoLink, repoDetails, currentConversationId, isLoading]);

  const { createNewConversation } = useChatStore();

  const handleNewChat = () => {

    createNewConversation();
  };

  const handleFullReset = () => {
    if (confirm("This will delete ALL data (history, keys, settings) and reset RepoMind. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleGatewayComplete = (config: LLMConfig) => {
    setLLMConfig(config);
    localStorage.setItem('app_setup_complete', 'true');
    setIsOnboarding(false);
  };


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
    setInput('');

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
          console.log("[App] Loop termination requested via AbortSignal.");
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

          const { promptTokens, completionTokens } = chunk.usage;
          const pricing = MODEL_PRICING[llmConfig.model] || { input: 0, output: 0 };
          const cost = ((promptTokens / 1000000) * pricing.input) + ((completionTokens / 1000000) * pricing.output);
          
          updateUsage(llmConfig.model, { promptTokens, completionTokens, cost });
          
          // Update bot message with final usage
          const currentMsgs = useChatStore.getState().messages;
          setMessages(currentMsgs.map(m => m.id === botMessageId ? { ...m, usage: chunk.usage } : m));
        }
        }
      }

      const finalMsgs = useChatStore.getState().messages;
      setMessages(finalMsgs.map(m => 
        m.id === botMessageId ? { ...m, responseTime: Date.now() - responseStartTime } : m
      ));
    } catch (e) {
      console.error("Streaming failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => sendMessage(input);

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allNewFiles: FileContext[] = [];

      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const extractedFiles = await readFile(e.target.files[i]);
          allNewFiles.push(...extractedFiles);
        } catch (err) {
          console.error("Error reading file", err);
        }
      }

      setActiveFiles([...activeFiles, ...allNewFiles]);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSearch = () => setIsSearchEnabled(!isSearchEnabled);

  const handleGithubEnter = async () => {
    if (!githubRepoLink.trim()) return;

    setIsRepoModalOpen(true);
    setIsRepoLoading(true);
    setRepoDetails(null);

    const details = await fetchRepoDetails(githubRepoLink);
    setRepoDetails(details);
    setIsRepoLoading(false);
  };

  const handleAttachRepoFiles = async () => {
    if (!repoDetails) return;

    setIsRepoLoading(true);

    try {
      const { tree, mapFile } = await fetchRepoStructure(repoDetails);

      setRepoTree(tree);
      setActiveFiles([...activeFiles.filter(f => f.name !== 'REPOSITORY_MAP.md'), mapFile]);

      setIsRepoModalOpen(false);
    } catch (error) {
      console.error("Failed to attach repo structure:", error);
      alert("Failed to load repository structure.");
    } finally {
      setIsRepoLoading(false);
    }
  };

  const handleRepoFileClick = async (path: string) => {
    if (!repoDetails) return;

    if (activeFiles.some(f => f.name === path)) {
      setActiveFiles(activeFiles.filter(f => f.name !== path));
      return;
    }

    if (loadingFilePaths.includes(path)) return;
    
    try {
      const { fetchFileContent } = useRepoStore.getState();
      const fileContext = await fetchFileContent(
        repoDetails.owner.login,
        repoDetails.name,
        repoDetails.default_branch,
        path
      );

      setActiveFiles([...activeFiles, fileContext]);
    } catch (e) {
      console.error("Error fetching specific file:", e);
    }
  };

  const handleSelectAllFiles = async () => {
    if (!repoDetails || !repoTree || repoTree.length === 0) return;

    setIsRepoLoading(true);
    const paths: string[] = [];

    const walk = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'blob') paths.push(node.path);
        if (node.children) walk(node.children);
      });
    };
    walk(repoTree);

    // Filter out both already active files AND files currently loading
    const filteredPaths = paths.filter(p =>
      !activeFiles.some(f => f.name === p) &&
      !loadingFilePaths.includes(p)
    ).slice(0, 40);

    if (filteredPaths.length === 0) {
      setIsRepoLoading(false);
      return;
    }

    setLoadingFilePaths([...loadingFilePaths, ...filteredPaths]);

    try {
      const promises = filteredPaths.map(path =>
        fetchGithubFileContent(
          repoDetails!.owner.login,
          repoDetails!.name,
          repoDetails!.default_branch,
          path
        )
      );

      const newFiles = await Promise.all(promises);
      setActiveFiles([...activeFiles, ...newFiles]);
    } catch (err) {
      console.error("Select all failed", err);
    } finally {
      setIsRepoLoading(false);
      setLoadingFilePaths(loadingFilePaths.filter(p => !filteredPaths.includes(p)));
    }
  };

  const handleResetConfig = () => {
    setIsOnboarding(true);
  };

  // Handle settings shortcut from ModelSelector
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex h-[100dvh] w-full bg-paper text-ink overflow-hidden font-sans transition-colors duration-300">

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-amber-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[15%] w-[20%] h-[20%] bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      <AnimatePresence mode="wait">
        {isInitializing && (
          <motion.div
            key="init-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-black flex items-center justify-center flex-col gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
            <p className="text-sm font-medium text-gray-500">Verifying keys...</p>
          </motion.div>
        )}

        {!isInitializing && isOnboarding && (
          <Gateway
            onComplete={handleGatewayComplete}
          />
        )}
      </AnimatePresence>

      <SettingsModal
        onFullReset={handleFullReset}
      />

      {/* Quota Error Overlay */}
      <AnimatePresence>
        {quotaError && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setQuotaError(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col"
            >
              <div className="p-8 md:p-10 text-center flex-1 overflow-y-auto custom-scrollbar">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${quotaError.type === 'quota' ? 'bg-amber-100 dark:bg-amber-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                  {quotaError.type === 'quota' ? (
                    <Box className="w-10 h-10 text-amber-600 dark:text-amber-500" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-500" />
                  )}
                </div>
                <h3 className="text-2xl font-black font-display text-black dark:text-white mb-3">
                  {quotaError.type === 'quota' ? 'API Quota Reached' : 'Model Unavailable'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-8">
                  {quotaError.type === 'quota' ? (
                    <>
                      The model <span className="font-bold text-black dark:text-white underline decoration-amber-500/40">{quotaError.model}</span> has temporarily reached its rate limit.
                    </>
                  ) : (
                    <>
                      The model <span className="font-bold text-black dark:text-white underline decoration-red-500/40">{quotaError.model}</span> is currently unavailable for your API key.
                    </>
                  )}
                  Switch to a different model to continue immediately.
                </p>

                <div className="flex flex-col gap-6 text-left">
                  {/* Models List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {llmConfig.provider}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold tracking-tighter animate-pulse">
                        LIVE
                      </span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5"></div>
                    </div>

                    <div className="space-y-1">
                      {(() => {
                        const provider = llmConfig.provider;
                        const hardcodedModels = AVAILABLE_MODELS[provider] || [];
                        const discoveredModels = keyCapabilities?.[provider]?.discoveredModels || [];
                        const isLive = discoveredModels.length > 0;

                        let finalModels = hardcodedModels;
                        if (provider === 'google' && isLive) {
                          finalModels = discoveredModels;
                        } else if (isLive) {
                          const discoveredIds = new Set(discoveredModels.map((m: any) => m.id));
                          finalModels = [...discoveredModels, ...hardcodedModels.filter((m: any) => !discoveredIds.has(m.id))];
                        }

                        // Sort: thinking models first, then alphabetically
                        const sortedModels = [...finalModels].sort((a, b) => {
                          if (a.hasThinking && !b.hasThinking) return -1;
                          if (!a.hasThinking && b.hasThinking) return 1;
                          return a.name.localeCompare(b.name);
                        });

                        return sortedModels
                          .filter(m => m.id !== quotaError.model)
                          .map(altModel => (
                            <button
                              key={altModel.id}
                              onClick={() => {
                                const newConfig = { ...llmConfig, model: altModel.id };

                                // Remove old message to avoid duplicates
                                setLLMConfig(newConfig);
                                setMessages(messages.filter(m => m.id !== quotaError.userMessageId));

                                localStorage.setItem('llm_config', JSON.stringify(newConfig));
                                setQuotaError(null);
                                // Auto resend with the NEW config to avoid stale closure issues
                                sendMessage(quotaError.originalPrompt, newConfig);
                              }}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all group text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                              <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="font-medium text-left truncate">{altModel.name}</span>
                                  {altModel.hasThinking && (
                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide shrink-0 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                      <Zap className="w-2.5 h-2.5" />
                                      Deep
                                    </span>
                                  )}
                                </div>
                                {altModel.hasThinking && (
                                  <span className="text-[9px] text-left text-gray-400">Reasoning available</span>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all font-bold" />
                              </div>
                            </button>
                          ));
                      })()}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                    <button
                      onClick={() => {
                        const funnyMessages = [
                          "Response aborted. My brain cells have reached their union-mandated break limit. ☕",
                          "System Error: The hamster powering my servers has stopped for a snack. Come back when he's finished his carrot. 🐹🥕",
                          "Quota reached. I'm legally obligated to stop thinking until you feed the meter. 🪙",
                          "Transmission terminated. My digital aura is currently being cleansed of excess tokens. ✨",
                          "I've hit the limit! Even AI needs a 'do nothing' day. Aborting response... 🧘‍♂️"
                        ];
                        const sillyText = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

                        setQuotaError(null);

                        const abortMessage: Message = {
                          id: Date.now().toString(),
                          role: 'model',
                          text: `*${sillyText}*`,
                          timestamp: Date.now(),
                          responseTime: 1 // Stop the timer
                        };

                        const abortMessage: Message = { id: Date.now().toString(), role: 'user', text: 'Task Aborted.', timestamp: Date.now() };
                        const currentMsgs = useChatStore.getState().messages;
                        setMessages([...currentMsgs, abortMessage]);
                        setConversations(conversations.map(c =>
                          c.id === currentConversationId ? { ...c, messages: [...c.messages, abortMessage], lastModified: Date.now() } : c
                        ));
                      }}
                      className="w-full py-4 text-gray-400 dark:text-zinc-600 font-bold text-xs hover:text-red-500 dark:hover:text-red-400 transition-all uppercase tracking-[0.2em]"
                    >
                      Abort Task
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RepoModal
        onAttachRepo={handleAttachRepoFiles}
      />

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-[340px] flex-col border-r border-gray-100 dark:border-white/10 bg-white dark:bg-black h-full overflow-hidden">
        <Sidebar
          onAddFiles={handleFileChange}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-black">

        {/* Minimal Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="md:hidden text-black dark:text-white p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </button>

            <div className="md:hidden flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <img src="/favicon.png" alt="RepoMind" className="w-5 h-5 invert dark:invert-0" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-black dark:text-white">RepoMind</span>
            </div>

            {/* Desktop Model Selector */}
            <div className="hidden md:block">
              <ModelSelector />
            </div>
          </div>
        </header>

        {/* Chat Area - Scrollable */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <ChatArea
            onSuggestionClick={handleSuggestionClick}
          />

          {/* Input Area */}
          {/* Input Area */}
          {/* Input Area */}
          <div className="p-4 md:px-12 md:pb-8 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black z-20">
            <div className="max-w-4xl mx-auto">
              <div className="group relative flex flex-col bg-white dark:bg-zinc-900 shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10 transition-all rounded-[24px]">

                {/* Textarea Area */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${llmConfig.model.split('/').pop()}...`}
                  className="w-full bg-transparent text-black dark:text-white p-5 pb-2 min-h-[60px] max-h-[200px] resize-none focus:outline-none text-[16px] leading-relaxed custom-scrollbar placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium z-10"
                  rows={1}
                  style={{ minHeight: '60px' }}
                />

                {/* Attached Files (Moved Here) */}
                <AnimatePresence>
                  {activeFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-3 flex gap-2 overflow-x-auto custom-scrollbar"
                    >
                      {activeFiles.map(f => (
                        <div key={f.id} className="group/file flex items-center gap-2 pl-2 pr-1 py-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg">
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 max-w-[100px] truncate">{f.name}</span>
                          <button
                            onClick={() => setActiveFiles(activeFiles.filter(file => file.id !== f.id))}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modern Toolbar Footer */}
                <div className="flex items-center justify-between px-3 py-2">

                  {/* Left Actions */}
                  <div className="flex items-center gap-1">
                    <label className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-all active:scale-95">
                      <Paperclip className="w-5 h-5" />
                      <input type="file" multiple className="hidden" onChange={handleFileChange} />
                    </label>

                    <button
                      onClick={toggleSearch}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${isSearchEnabled
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                      title="Web Search"
                    >
                      <Globe className="w-5 h-5" />
                    </button>

                    {repoDetails && (
                      <button
                        onClick={handleSelectAllFiles}
                        className="p-2 rounded-xl transition-all active:scale-95 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white"
                        title="Attach All Repository Files"
                      >
                        <CheckSquare className="w-5 h-5" />
                      </button>
                    )}

                    {supportsVisuals && (
                      <button
                        onClick={() => setIsDesignMode(!isDesignMode)}
                        className={`p-2 rounded-xl transition-all active:scale-95 ${isDesignMode
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                          : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white'
                          }`}
                        title="Design Mode"
                      >
                        <Layers className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3">
                    {supportsThinking && (
                      <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setThinkingMode('concise')}
                            className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg transition-all active:scale-95 ${thinkingMode === 'concise'
                              ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm ring-1 ring-black/5'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            title="Fast Response"
                          >
                            <Zap className={`w-3.5 h-3.5 ${thinkingMode === 'concise' ? 'text-amber-500 fill-amber-500' : ''}`} />
                            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Fast</span>
                          </button>

                          <button
                            onClick={() => setThinkingMode('deep')}
                            className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg transition-all active:scale-95 ${thinkingMode === 'deep'
                              ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm ring-1 ring-black/5'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            title="Deep Thinking"
                          >
                            <BrainCircuit className={`w-3.5 h-3.5 ${thinkingMode === 'deep' ? 'text-blue-500 fill-blue-500/20' : ''}`} />
                            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Deep</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={isLoading ? stopResponse : handleSendMessage}
                      disabled={!isLoading && (!input.trim() && activeFiles.length === 0)}
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm
                        ${!isLoading && (!input.trim() && activeFiles.length === 0)
                          ? 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : isLoading
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                            : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 shadow-md'}
                      `}
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 bg-white rounded-sm animate-pulse" />
                      ) : (
                        <ArrowUp className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={toggleMobileMenu}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-4/5 max-w-[320px] bg-white dark:bg-black h-full shadow-2xl md:hidden border-r border-gray-100 dark:border-white/10"
            >
              <button onClick={toggleMobileMenu} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-[60]">
                <X className="w-6 h-6 pointer-events-none" />
              </button>

              {/* Mobile Model Selector */}
              <div className="px-8 pt-6 pb-2">
                <ModelSelector />
              </div>

              <Sidebar
                className="h-full border-none"
                onAddFiles={handleFileChange}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;