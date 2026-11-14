import crypto from 'crypto';
import { config } from '../config/environment';

/**
 * Generates a cryptographically secure random External ID for cross-account IAM role assumption.
 * Format: opsradar-<uuid4>-<randomHex>
 */
export function generateExternalId(): string {
  const uuid = crypto.randomUUID();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `opsradar-${uuid}-${randomBytes}`;
}

/**
 * AES-256-GCM encryption for storing sensitive metadata at rest.
 */
export function encryptText(plainText: string): { iv: string; encryptedData: string; tag: string } {
  const key = Buffer.from(config.security.encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag
  };
}

/**
 * AES-256-GCM decryption for sensitive metadata at rest.
 */
export function decryptText(encryptedData: string, ivHex: string, tagHex: string): string {
  const key = Buffer.from(config.security.encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
