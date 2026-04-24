import { ArrowRight, Box, XCircle, Zap } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React from 'react';

import { useChatStore } from '../application/store/chat-store';
import { useConfigStore } from '../application/store/config-store';
import { useUIStore } from '../application/store/ui-store';
import { AVAILABLE_MODELS, LLMConfig,LLMModel, Message } from '../core/types';

interface QuotaErrorOverlayProps {
  sendMessage: (text: string, configOverride?: LLMConfig) => void;
}

export const QuotaErrorOverlay: React.FC<QuotaErrorOverlayProps> = ({ sendMessage }) => {
  const { quotaError, setQuotaError } = useUIStore();
  const { llmConfig, setLLMConfig, keyCapabilities } = useConfigStore();
  const { messages, setMessages, conversations, setConversations, currentConversationId } = useChatStore();

  if (!quotaError) return null;

  return (
    <AnimatePresence>
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
          <div className="p-6 md:p-10 text-center flex-1 overflow-y-auto custom-scrollbar">
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
              <br/>Switch to a different model to continue immediately.
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
                      const discoveredIds = new Set(discoveredModels.map((m: LLMModel) => m.id));
                      finalModels = [...discoveredModels, ...hardcodedModels.filter((m: LLMModel) => !discoveredIds.has(m.id))];
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

                    const abortBotMsg: Message = {
                      id: Date.now().toString(),
                      role: 'model',
                      text: `*${sillyText}*`,
                      timestamp: Date.now(),
                      responseTime: 1 // Stop the timer
                    };

                    const abortUserMsg: Message = { id: (Date.now() + 1).toString(), role: 'user', text: 'Task Aborted.', timestamp: Date.now() };
                    const currentMsgs = useChatStore.getState().messages;
                    setMessages([...currentMsgs, abortUserMsg, abortBotMsg]);
                    setConversations(conversations.map(c =>
                      c.id === currentConversationId ? { ...c, messages: [...c.messages, abortUserMsg, abortBotMsg], lastModified: Date.now() } : c
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
    </AnimatePresence>
  );
};
