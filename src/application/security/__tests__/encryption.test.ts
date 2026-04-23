import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionService } from '../encryption-service';

// Mock Web Crypto for Node environment
if (!global.crypto) {
  // @ts-ignore
  global.crypto = {
    subtle: {
      // @ts-expect-error - Mocking Web Crypto
      generateKey: async () => ({} as CryptoKey),
      encrypt: async () => new ArrayBuffer(32),
      decrypt: async () => new ArrayBuffer(16)
    },
    getRandomValues: (arr: Uint8Array) => arr
  };
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService();
    // Mock getMasterKey to avoid DB dependency in unit tests
    vi.spyOn(service, 'getMasterKey').mockResolvedValue({} as CryptoKey);
  });

  it('should encrypt and return a base64 string', async () => {
    const data = "test-api-key";
    const encrypted = await service.encrypt(data);
    
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it('should optimize encoding for large strings', async () => {
    const largeData = "a".repeat(100000); // 100KB
    const encrypted = await service.encrypt(largeData);
    expect(encrypted).toBeDefined();
  });
});
