export const AVAILABLE_MODELS: Record<string, Array<{id: string, name: string, hasThinking?: boolean}>> = {
  google: [{ id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }],
  openai: [{ id: 'gpt-4o', name: 'GPT-4o' }],
  anthropic: [{ id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', hasThinking: true }],
  deepseek: [{ id: 'deepseek-reasoner', name: 'DeepSeek R1', hasThinking: true }],
  openrouter: [{ id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' }]
};
