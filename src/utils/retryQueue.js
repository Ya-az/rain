// Lightweight retry queue for failed Firestore score writes.
// Holds pending payloads in memory + localStorage, retries automatically when
// the network comes back, and exposes subscribe() so the UI can show counts.
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'roborave.retryQueue.v1';
const MAX_BACKOFF_MS = 30_000;

let queue = []; // [{ id, collection, payload, attempts, lastError }]
const listeners = new Set();
let timer = null;

function emit() {
  listeners.forEach(fn => {
    try { fn([...queue]); } catch { /* ignore */ }
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch { /* ignore quota */ }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) queue = JSON.parse(raw) || [];
  } catch { queue = []; }
}
loadFromStorage();

function scheduleNextAttempt() {
  if (timer || queue.length === 0) return;
  const minAttempts = Math.min(...queue.map(q => q.attempts));
  const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(minAttempts, 5));
  timer = setTimeout(() => {
    timer = null;
    flushQueue();
  }, delay);
}

async function flushQueue() {
  if (!navigator.onLine || queue.length === 0) {
    scheduleNextAttempt();
    return;
  }
  const items = [...queue];
  for (const item of items) {
    try {
      await setDoc(doc(db, item.collection, item.id), item.payload);
      queue = queue.filter(q => q !== item);
      emit();
    } catch (err) {
      item.attempts += 1;
      item.lastError = err?.message || String(err);
      emit();
    }
  }
  if (queue.length > 0) scheduleNextAttempt();
}

export function enqueueWrite({ collection, id, payload }) {
  // De-dupe: if a queued write for the same doc exists, replace its payload
  // so we only ever push the latest version.
  const idx = queue.findIndex(q => q.collection === collection && q.id === id);
  const entry = { collection, id, payload, attempts: 0, lastError: null, queuedAt: Date.now() };
  if (idx >= 0) queue[idx] = { ...queue[idx], payload, lastError: null };
  else queue.push(entry);
  emit();
  scheduleNextAttempt();
}

export function subscribe(fn) {
  listeners.add(fn);
  fn([...queue]);
  return () => listeners.delete(fn);
}

export function getPending() {
  return [...queue];
}

export function flushNow() {
  if (timer) { clearTimeout(timer); timer = null; }
  return flushQueue();
}

// Auto-retry when the browser regains connectivity.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushNow(); });
}
