import { useState, useEffect } from 'react';
import { LLMProvider } from '../../core/types/ai';
import { encryptionService } from '../../application/security/encryption-service';

export type ApiKeys = Partial<Record<LLMProvider, string>>;

const PROVIDERS_KEY = 'repomind_providers';
const KEY_PREFIX = 'repomind_key_';

export const useApiKeys = () => {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const stored = localStorage.getItem(PROVIDERS_KEY);
        if (stored) {
          const providers = JSON.parse(stored) as LLMProvider[];
          const loadedKeys: ApiKeys = {};
          
          for (const p of providers) {
            const encrypted = localStorage.getItem(`${KEY_PREFIX}${p}`);
            if (encrypted) {
              const decrypted = await encryptionService.decrypt(encrypted);
              if (decrypted) loadedKeys[p] = decrypted;
            }
          }
          setKeys(loadedKeys);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load API keys:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadKeys();
  }, []);

  const updateKey = async (provider: LLMProvider, key: string) => {
    try {
      if (!key) {
        localStorage.removeItem(`${KEY_PREFIX}${provider}`);
        const newKeys = { ...keys };
        newKeys[provider] = undefined;
        setKeys(newKeys);
      } else {
        const encrypted = await encryptionService.encrypt(key);
        localStorage.setItem(`${KEY_PREFIX}${provider}`, encrypted);
        setKeys(prev => ({ ...prev, [provider]: key }));
      }

      const stored = localStorage.getItem(PROVIDERS_KEY);
      const providers = stored ? (JSON.parse(stored) as LLMProvider[]) : [];
      
      if (key && !providers.includes(provider)) {
        providers.push(provider);
      } else if (!key) {
        const idx = providers.indexOf(provider);
        if (idx > -1) providers.splice(idx, 1);
      }
      localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update API key:', error);
      throw error;
    }
  };

  return { keys, updateKey, isLoading };
};
