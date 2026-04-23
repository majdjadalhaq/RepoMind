import { test, expect, vi } from 'vitest';
import { encryptionService } from '../../../application/security/encryption-service';

// Mock the storage driver
vi.mock('../../../infrastructure/storage/indexed-db', () => {
  const store = new Map();
  return {
    storageDriver: {
      get: vi.fn(async (key) => store.get(key)),
      put: vi.fn(async (key, val) => store.set(key, val)),
      delete: vi.fn(async (key) => store.delete(key)),
      init: vi.fn(async () => ({}))
    }
  };
});

test('encryptionService encrypts and decrypts data correctly', async () => {
  const secret = 'my-super-secret-key';
  const encrypted = await encryptionService.encrypt(secret);
  expect(encrypted).not.toBe(secret);
  
  const decrypted = await encryptionService.decrypt(encrypted);
  expect(decrypted).toBe(secret);
});

test('encryptionService handles decryption failure gracefully', async () => {
  const invalid = 'not-base64';
  const result = await encryptionService.decrypt(invalid);
  expect(result).toBeNull();
});

test('encryptionService master key is persistent', async () => {
  const k1 = await encryptionService.getMasterKey();
  encryptionService.reset();
  const k2 = await encryptionService.getMasterKey();
  expect(k1).toEqual(k2);
});
