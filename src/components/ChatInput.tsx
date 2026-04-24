import { ArrowUp, BrainCircuit, CheckSquare,Globe, Layers, Paperclip, X, Zap } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React, { useState } from 'react';

import { useChatStore } from '../application/store/chat-store';
import { useConfigStore } from '../application/store/config-store';
import { useRepoStore } from '../application/store/repo-store';
import { useUIStore } from '../application/store/ui-store';
import { AVAILABLE_MODELS,LLMModel  } from '../core/types';
import { useFileHandler } from '../presentation/hooks/use-file-handler';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopResponse: () => void;
  onSelectAllFiles: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onStopResponse, 
  onSelectAllFiles 
}) => {
  const [input, setInput] = useState('');
  
  const { 
    isSearchEnabled, setIsSearchEnabled,
    isDesignMode, setIsDesignMode,
    thinkingMode, setThinkingMode
  } = useUIStore();

  const { repoDetails } = useRepoStore();
  const { llmConfig, keyCapabilities } = useConfigStore();
  
  const { activeFiles, setActiveFiles, isLoading } = useChatStore();

  // Derived state
  const currentModelDef = AVAILABLE_MODELS[llmConfig.provider]?.find(m => m.id === llmConfig.model);
  const discoveredModelDef = keyCapabilities?.[llmConfig.provider]?.discoveredModels?.find((m: LLMModel) => m.id === llmConfig.model);

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

  const toggleSearch = () => setIsSearchEnabled(!isSearchEnabled);

  const handleSendMessage = () => {
    onSendMessage(input);
    setInput('');
  };

  const { handleFileChange } = useFileHandler();

  return (
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

          {/* Attached Files */}
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
            <div className="flex items-center gap-0.5 md:gap-1">
              <label aria-label="Attach files" className="p-2.5 md:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-all active:scale-95">
                <Paperclip className="w-5 h-5" />
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>

              <button
                aria-label="Toggle Web Search"
                aria-pressed={isSearchEnabled}
                onClick={toggleSearch}
                className={`p-2.5 md:p-2 rounded-xl transition-all active:scale-95 ${isSearchEnabled
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                title="Web Search"
              >
                <Globe className="w-5 h-5" />
              </button>

              {repoDetails && (
                <button
                  aria-label="Attach All Repository Files"
                  onClick={onSelectAllFiles}
                  className="p-2.5 md:p-2 rounded-xl transition-all active:scale-95 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white"
                  title="Attach All Repository Files"
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              )}

              {supportsVisuals && (
                <button
                  aria-label="Toggle Design Mode"
                  aria-pressed={isDesignMode}
                  onClick={() => setIsDesignMode(!isDesignMode)}
                  className={`p-2.5 md:p-2 rounded-xl transition-all active:scale-95 ${isDesignMode
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
                      aria-label="Concise Mode"
                      aria-pressed={thinkingMode === 'concise'}
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
                      aria-label="Deep Thinking Mode"
                      aria-pressed={thinkingMode === 'deep'}
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
                aria-label={isLoading ? "Stop generating response" : "Send message"}
                onClick={isLoading ? onStopResponse : handleSendMessage}
                disabled={!isLoading && (!input.trim() && activeFiles.length === 0)}
                className={`
                  flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all shadow-sm
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
  );
};
