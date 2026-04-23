import { create } from 'zustand';
import { LLMConfig, UsageStats, LLMProvider, LLMModel } from '../../core/types';

interface ConfigState {
  llmConfig: LLMConfig;
  keyCapabilities: Record<LLMProvider, { discoveredModels: LLMModel[] }>;
  totalUsage: UsageStats;
  modelUsage: Record<string, UsageStats>;
  
  // Actions
  setLLMConfig: (config: Partial<LLMConfig>) => void;
  setApiKey: (provider: LLMProvider, key: string) => void;
  setKeyCapabilities: (provider: LLMProvider, capabilities: { discoveredModels: LLMModel[] }) => void;
  updateUsage: (model: string, stats: { promptTokens: number; completionTokens: number; cost: number }) => void;
  resetUsage: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  llmConfig: {
    provider: 'google',
    model: 'gemini-2.0-flash-exp',
    apiKey: '',
    apiKeys: {
      google: '',
      openai: '',
      anthropic: '',
      deepseek: '',
      openrouter: ''
    },
    apiKeysDates: {},
    apiKeysFirstUsed: {},
    temperature: 0.7
  },
  keyCapabilities: {
    google: { discoveredModels: [] },
    openai: { discoveredModels: [] },
    anthropic: { discoveredModels: [] },
    deepseek: { discoveredModels: [] },
    openrouter: { discoveredModels: [] }
  },
  totalUsage: {
    promptTokens: 0,
    completionTokens: 0,
    totalCost: 0
  },
  modelUsage: {},

  setLLMConfig: (config) => set((state) => {
    const nextConfig = { ...state.llmConfig, ...config };
    
    // If apiKeys are being updated, also update apiKeysDates
    if (config.apiKeys) {
      const updatedDates = { ...nextConfig.apiKeysDates };
      const providers: LLMProvider[] = ['google', 'openai', 'anthropic', 'deepseek', 'openrouter'];
      
      providers.forEach(p => {
        if (config.apiKeys?.[p] && config.apiKeys[p] !== state.llmConfig.apiKeys[p]) {
          updatedDates[p] = Date.now();
        }
      });
      nextConfig.apiKeysDates = updatedDates;
    }
    
    return { llmConfig: nextConfig };
  }),

  setApiKey: (provider, key) => set((state) => {
    const apiKeys = { ...state.llmConfig.apiKeys, [provider]: key };
    const apiKeysDates = { ...state.llmConfig.apiKeysDates, [provider]: Date.now() };
    const apiKeysFirstUsed = { ...state.llmConfig.apiKeysFirstUsed };
    
    if (!apiKeysFirstUsed[provider] && key) {
      apiKeysFirstUsed[provider] = Date.now();
    }
    
    return { 
      llmConfig: { ...state.llmConfig, apiKeys, apiKeysDates, apiKeysFirstUsed } 
    };
  }),

  setKeyCapabilities: (provider, capabilities) => set((state) => ({
    keyCapabilities: { ...state.keyCapabilities, [provider]: capabilities }
  })),

  updateUsage: (model, stats) => set((state) => {
    const newTotalUsage = {
      promptTokens: state.totalUsage.promptTokens + stats.promptTokens,
      completionTokens: state.totalUsage.completionTokens + stats.completionTokens,
      totalCost: state.totalUsage.totalCost + stats.cost
    };

    const currentModelUsage = state.modelUsage[model] || { promptTokens: 0, completionTokens: 0, totalCost: 0 };
    const newModelUsage = {
      ...state.modelUsage,
      [model]: {
        promptTokens: currentModelUsage.promptTokens + stats.promptTokens,
        completionTokens: currentModelUsage.completionTokens + stats.completionTokens,
        totalCost: currentModelUsage.totalCost + stats.cost
      }
    };

    return { totalUsage: newTotalUsage, modelUsage: newModelUsage };
  }),

  resetUsage: () => set({
    totalUsage: { promptTokens: 0, completionTokens: 0, totalCost: 0 },
    modelUsage: {}
  })
}));
