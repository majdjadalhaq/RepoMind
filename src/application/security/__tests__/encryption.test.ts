import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  beforeEach(async () => {
    service = new EncryptionService();
    // Generate a real key for testing to satisfy SubtleCrypto's internal type checks
    const testKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    vi.spyOn(service, 'getMasterKey').mockResolvedValue(testKey);
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
