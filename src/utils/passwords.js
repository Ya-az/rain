// ─── Password hashing (Phase 1) ─────────────────────────────────────────────
// We use the browser's built-in Web Crypto SubtleCrypto API to derive a
// SHA-256 hash of "<salt>:<password>". This is NOT bcrypt-grade but it's a
// huge improvement over plain-text and works without extra deps.
// Phase 4 will replace this with Firebase Auth (proper credential storage).

const APP_SALT = 'roborave-rain-2026'; // Fixed app salt; mixed with per-user salt.

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Return SHA-256 hash of `${APP_SALT}:${userSalt}:${password}` as hex. */
export async function hashPassword(password, userSalt = '') {
  if (!password) return '';
  const text = `${APP_SALT}:${userSalt}:${password}`;
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return toHex(digest);
}

/**
 * Generate a short random per-user salt (hex, 16 chars).
 * Stored alongside the password hash in the user record.
 */
export function generateSalt() {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

/**
 * Compare a plaintext password against a stored hash + salt.
 * Returns true on match.
 */
export async function verifyPassword(password, storedHash, salt = '') {
  if (!password || !storedHash) return false;
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

/**
 * Detect whether a stored value looks like a SHA-256 hex hash (64 hex chars).
 * Used during the migration window so legacy plain-text passwords still log
 * in once and get auto-upgraded to a hash on first successful login.
 */
export function looksHashed(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}
