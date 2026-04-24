import { describe,expect, test } from 'vitest';

import { aiOrchestrator } from '../../../application/ai/orchestrator';
import { AIConfig,LLMProvider } from '../../../core/types/ai';

describe('AIOrchestrator', () => {
  test('throws error for unregistered provider', async () => {
    const provider = 'invalid-provider' as LLMProvider;
    const config = {} as AIConfig;
    const generator = aiOrchestrator.streamResponse(provider, config, []);
    await expect(generator.next()).rejects.toThrow('AI provider "invalid-provider" is not registered');
  });

  test('orchestrates known providers', async () => {
    // Access internal adapters for verification (using index signature for type safety)
    const orchestrator = aiOrchestrator as unknown as { adapters: Map<string, unknown> };
    expect(orchestrator.adapters.get('openai')).toBeDefined();
    expect(orchestrator.adapters.get('google')).toBeDefined();
  });
});
