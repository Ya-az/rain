// ─── Session storage helpers (Phase 1) ──────────────────────────────────────
// Persist the current login across page reloads with an 8-hour expiry.
// Stored only in sessionStorage so it dies when the browser tab closes.

const KEY = 'rain_session_v1';
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function saveSession(user) {
  if (!user) return;
  try {
    const payload = { user, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { user, expiresAt } = JSON.parse(raw);
    if (!user || !expiresAt || Date.now() > expiresAt) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
