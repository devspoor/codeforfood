import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcryptjs";

// Version 1 (legacy) - for decrypting existing data
const PBKDF2_ITERATIONS_V1 = 100000;
// Version 2 (current) - OWASP 2023 recommendation
const PBKDF2_ITERATIONS_V2 = 600000;
// Current version for new encryptions
const CURRENT_CRYPTO_VERSION = 2;

const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits for AES-256
const AUTH_TAG_LENGTH = 16;
const BCRYPT_ROUNDS = 12;

export interface EncryptedData {
  salt: string;
  iv: string;
  ciphertext: string;
  version?: number; // 1 = legacy (100k), 2 = current (600k)
}

/**
 * Encrypts a note using AES-256-GCM with a password-derived key
 *
 * Security:
 * - Uses PBKDF2 with 600,000 iterations for key derivation (OWASP 2023)
 * - Random 32-byte salt for each encryption
 * - Random 12-byte IV for AES-GCM
 * - 16-byte authentication tag for integrity
 * - Version field for backward compatibility
 */
export function encryptNote(note: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS_V2, KEY_LENGTH, "sha256");

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
    version: CURRENT_CRYPTO_VERSION,
  };
}

/**
 * Validates base64 string and returns Buffer, throws if invalid
 */
function parseBase64(value: string, fieldName: string): Buffer {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
  }
  try {
    const buffer = Buffer.from(value, "base64");
    // Verify it's valid base64 by checking round-trip
    if (buffer.toString("base64") !== value &&
        buffer.toString("base64").replace(/=+$/, "") !== value.replace(/=+$/, "")) {
      throw new Error(`Invalid ${fieldName}: not valid base64`);
    }
    return buffer;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid")) {
      throw err;
    }
    throw new Error(`Invalid ${fieldName}: failed to decode base64`);
  }
}

/**
 * Decrypts a note using AES-256-GCM with a password-derived key
 * Supports both legacy (v1: 100k iterations) and current (v2: 600k iterations)
 *
 * @throws Error if decryption fails (wrong password or tampered data)
 */
export function decryptNote(encryptedData: EncryptedData, password: string): string {
  // Validate input structure
  if (!encryptedData || typeof encryptedData !== "object") {
    throw new Error("Invalid encrypted data: must be an object");
  }
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password: must be a non-empty string");
  }

  // Parse and validate base64 fields
  const salt = parseBase64(encryptedData.salt, "salt");
  const iv = parseBase64(encryptedData.iv, "iv");
  const ciphertextWithTag = parseBase64(encryptedData.ciphertext, "ciphertext");

  // Validate lengths
  if (salt.length !== SALT_LENGTH) {
    throw new Error(`Invalid salt length: expected ${SALT_LENGTH}, got ${salt.length}`);
  }
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (ciphertextWithTag.length <= AUTH_TAG_LENGTH) {
    throw new Error("Invalid ciphertext: too short to contain auth tag");
  }

  // Split ciphertext and auth tag
  const ciphertext = ciphertextWithTag.subarray(0, -AUTH_TAG_LENGTH);
  const authTag = ciphertextWithTag.subarray(-AUTH_TAG_LENGTH);

  // Select iterations based on version (default to v1 for backward compatibility)
  const iterations = encryptedData.version === 2
    ? PBKDF2_ITERATIONS_V2
    : PBKDF2_ITERATIONS_V1;

  const key = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256");

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
