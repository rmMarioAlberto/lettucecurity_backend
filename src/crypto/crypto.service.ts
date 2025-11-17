// src/crypto/crypto.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';

interface SessionEntry {
  aesKey: Buffer;
  expiresAt: number;
}

@Injectable()
export class CryptoService implements OnModuleDestroy {
  private sessions = new Map<string, SessionEntry>();
  private cleanupInterval = setInterval(() => this.cleanup(), 60_000);

  deriveAesKey(sharedSecret: Buffer): Buffer {
    return crypto.createHash('sha256').update(sharedSecret).digest();
  }

  storeKey(sessionId: string, aesKey: Buffer, ttlMs = 30 * 60_1000) {
    this.sessions.set(sessionId, {
      aesKey,
      expiresAt: Date.now() + ttlMs,
    });
  }

  getKey(sessionId: string): Buffer | null {
    const entry = this.sessions.get(sessionId);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return entry.aesKey;
  }

  removeKey(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.sessions.entries()) {
      if (v.expiresAt <= now) this.sessions.delete(k);
    }
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  // Util helpers for AES-GCM
  encryptWithKey(aesKey: Buffer, plaintext: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      cipherText: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  decryptWithKey(
    aesKey: Buffer,
    cipherTextB64: string,
    ivB64: string,
    tagB64: string,
  ) {
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(cipherTextB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
    return plain;
  }
}
