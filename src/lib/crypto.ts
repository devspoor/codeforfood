import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcryptjs";

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits for AES-256
const AUTH_TAG_LENGTH = 16;
const BCRYPT_ROUNDS = 12;

export interface EncryptedData {
  salt: string;
  iv: string;
  ciphertext: string;
}

/**
 * Encrypts a note using AES-256-GCM with a password-derived key
 *
 * Security:
 * - Uses PBKDF2 with 100,000 iterations for key derivation
 * - Random 32-byte salt for each encryption
 * - Random 12-byte IV for AES-GCM
 * - 16-byte authentication tag for integrity
 */
export function encryptNote(note: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(note, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Concatenate ciphertext and auth tag
  const ciphertextWithTag = Buffer.concat([encrypted, authTag]);

  return {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: ciphertextWithTag.toString("base64"),
  };
}

/**
 * Decrypts a note using AES-256-GCM with a password-derived key
 *
 * @throws Error if decryption fails (wrong password or tampered data)
 */
export function decryptNote(encryptedData: EncryptedData, password: string): string {
  const salt = Buffer.from(encryptedData.salt, "base64");
  const iv = Buffer.from(encryptedData.iv, "base64");
  const ciphertextWithTag = Buffer.from(encryptedData.ciphertext, "base64");

  // Split ciphertext and auth tag
  const ciphertext = ciphertextWithTag.subarray(0, -AUTH_TAG_LENGTH);
  const authTag = ciphertextWithTag.subarray(-AUTH_TAG_LENGTH);

  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error("Decryption failed - invalid password or corrupted data");
  }
}

/**
 * Hashes password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - Contains at least one letter
 * - Contains at least one number
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters" };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  // Check for common weak passwords
  const weakPasswords = [
    "password", "12345678", "qwerty12", "abc12345", "password1",
    "iloveyou", "sunshine", "princess", "football", "baseball"
  ];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: "This password is too common. Please choose a stronger password" };
  }

  return { valid: true };
}
