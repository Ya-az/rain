// Collision-resistant ID generator. Uses crypto.randomUUID when available,
// falls back to a timestamp+random string for older browsers / SSR contexts.
export function genId(prefix = '') {
  let core;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    core = crypto.randomUUID();
  } else {
    core = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
  return prefix ? `${prefix}_${core}` : core;
}
