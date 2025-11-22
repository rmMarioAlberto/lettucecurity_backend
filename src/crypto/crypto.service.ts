// src/crypto/crypto.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface SessionEntry {
  aesKey: Buffer;
  expiresAt: number;
  createdAt: number;
  requestCount: number;
  lastNonce: number;
  seenNonces: Set<number>; // Para manejar requests en paralelo
}

@Injectable()
export class CryptoService implements OnModuleDestroy {
  private readonly logger = new Logger(CryptoService.name);
  private sessions = new Map<string, SessionEntry>();
  private cleanupInterval = setInterval(() => this.cleanup(), 60_000);

  // Configuración de seguridad
  private readonly SESSION_TTL = 30 * 60_000; // 30 minutos
  private readonly MAX_REQUESTS_PER_SESSION = 1000; // Límite de requests por sesión
  private readonly KEY_ROTATION_THRESHOLD = 500; // Sugerir rotación después de N requests
  private readonly REPLAY_WINDOW = 50; // Permitir requests desordenados en este rango

  deriveAesKey(sharedSecret: Buffer): Buffer {
    return crypto.createHash('sha256').update(sharedSecret).digest();
  }

  storeKey(sessionId: string, aesKey: Buffer, ttlMs = this.SESSION_TTL) {
    this.sessions.set(sessionId, {
      aesKey,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
      requestCount: 0,
      lastNonce: 0,
      seenNonces: new Set<number>(),
    });

    this.logger.log(`New crypto session created: ${sessionId}`);
  }

  getKey(sessionId: string): Buffer | null {
    const entry = this.sessions.get(sessionId);

    if (!entry) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return null;
    }

    // Verificar expiración
    if (entry.expiresAt <= Date.now()) {
      this.logger.log(
        `Session expired: ${sessionId} (${entry.requestCount} requests)`,
      );
      this.sessions.delete(sessionId);
      return null;
    }

    // Verificar límite de requests
    if (entry.requestCount >= this.MAX_REQUESTS_PER_SESSION) {
      this.logger.warn(
        `Session ${sessionId} reached request limit (${entry.requestCount})`,
      );
      this.sessions.delete(sessionId);
      return null;
    }

    // Incrementar contador
    entry.requestCount++;

    // Sugerir rotación si se alcanza el threshold
    if (entry.requestCount === this.KEY_ROTATION_THRESHOLD) {
      this.logger.warn(
        `Session ${sessionId} should rotate keys (${entry.requestCount} requests)`,
      );
    }

    return entry.aesKey;
  }

  validateNonce(sessionId: string, nonce: number): boolean {
    const entry = this.sessions.get(sessionId);
    if (!entry) return false;

    // 1. Verificar si el nonce ya fue usado (Replay exacto)
    if (entry.seenNonces.has(nonce)) {
      this.logger.error(
        `Replay attack detected (duplicate): ${sessionId} (nonce: ${nonce})`,
      );
      return false;
    }

    // 2. Verificar si es demasiado viejo (fuera de la ventana)
    // Si el nonce es menor que (lastNonce - window), es muy viejo
    if (nonce <= entry.lastNonce - this.REPLAY_WINDOW) {
      this.logger.error(
        `Replay attack detected (too old): ${sessionId} (nonce: ${nonce}, last: ${entry.lastNonce})`,
      );
      return false;
    }

    // 3. Actualizar estado
    entry.seenNonces.add(nonce);

    // Si es un nonce nuevo mayor al último, actualizar lastNonce
    if (nonce > entry.lastNonce) {
      entry.lastNonce = nonce;

      // Limpiar nonces viejos del Set para no consumir memoria infinita
      // Eliminamos todo lo que esté fuera de la ventana (lastNonce - window)
      const minValidNonce = entry.lastNonce - this.REPLAY_WINDOW;
      for (const seenNonce of entry.seenNonces) {
        if (seenNonce < minValidNonce) {
          entry.seenNonces.delete(seenNonce);
        }
      }
    }

    return true;
  }

  rotateKey(sessionId: string, newAesKey: Buffer): boolean {
    const entry = this.sessions.get(sessionId);
    if (!entry) return false;

    const oldRequestCount = entry.requestCount;

    // Actualizar clave y resetear contadores
    entry.aesKey = newAesKey;
    entry.requestCount = 0;
    entry.lastNonce = 0;
    entry.createdAt = Date.now();

    this.logger.log(
      `Key rotated for session ${sessionId} (previous: ${oldRequestCount} requests)`,
    );
    return true;
  }

  getSessionStats(sessionId: string) {
    const entry = this.sessions.get(sessionId);
    if (!entry) return null;

    return {
      sessionId,
      requestCount: entry.requestCount,
      age: Date.now() - entry.createdAt,
      ttl: entry.expiresAt - Date.now(),
      shouldRotate: entry.requestCount >= this.KEY_ROTATION_THRESHOLD,
      lastNonce: entry.lastNonce,
    };
  }

  removeKey(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [k, v] of this.sessions.entries()) {
      if (
        v.expiresAt <= now ||
        v.requestCount >= this.MAX_REQUESTS_PER_SESSION
      ) {
        this.sessions.delete(k);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(
        `Cleaned ${cleaned} expired sessions. Active: ${this.sessions.size}`,
      );
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
