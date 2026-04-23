import { storageDriver } from '../../infrastructure/storage/indexed-db';

const MASTER_KEY_ALIAS = 'master-key';

export class EncryptionService {
  private masterKeyPromise: Promise<CryptoKey> | null = null;

  async getMasterKey(): Promise<CryptoKey> {
    if (this.masterKeyPromise) return this.masterKeyPromise;

    this.masterKeyPromise = (async () => {
      const existingKey = await storageDriver.get<CryptoKey>(MASTER_KEY_ALIAS);
      if (existingKey) return existingKey;

      const newKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false, 
        ["encrypt", "decrypt"]
      );

      await storageDriver.put(MASTER_KEY_ALIAS, newKey);
      return newKey;
    })();

    return this.masterKeyPromise;
  }

  async encrypt(data: string): Promise<string> {
    const key = await this.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Optimized binary-to-Base64 encoding (chunked for performance)
    const CHUNK_SIZE = 0x8000; // 32KB
    let binary = "";
    for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(null, combined.subarray(i, i + CHUNK_SIZE) as unknown as number[]);
    }
    return btoa(binary);
  }

  async decrypt(base64: string): Promise<string | null> {
    try {
      const key = await this.getMasterKey();
      const binaryString = atob(base64);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Decryption failed:', e);
      return null;
    }
  }

  reset() {
    this.masterKeyPromise = null;
  }
}

export const encryptionService = new EncryptionService();
