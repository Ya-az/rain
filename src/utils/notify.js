// Lightweight desktop notifications wrapper. Silently no-ops when:
//   * Notification API isn't available (older browsers / non-secure contexts)
//   * The user has not granted permission
//   * The page/tab is currently visible (avoid distracting the active user)

const supported = typeof window !== 'undefined' && 'Notification' in window;

export function notificationsSupported() {
  return supported;
}

export function notificationPermission() {
  return supported ? Notification.permission : 'denied';
}

export async function requestNotificationPermission() {
  if (!supported) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/** Fire a desktop notification. Only when permission is granted AND tab hidden. */
export function notify({ title, body, tag, onClick } = {}) {
  if (!supported) return null;
  if (Notification.permission !== 'granted') return null;
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return null;
  try {
    const n = new Notification(title || 'RoboRave', { body, tag, icon: '/img/logo.png' });
    if (onClick) {
      n.onclick = () => {
        try { window.focus(); } catch { /* ignore */ }
        onClick();
        n.close();
      };
    }
    return n;
  } catch {
    return null;
  }
}
