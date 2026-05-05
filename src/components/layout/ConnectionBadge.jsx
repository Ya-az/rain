import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { subscribe, flushNow } from '../../utils/retryQueue';

/**
 * Compact connectivity badge for the header. Goes through three states:
 *   • Online + queue empty   → hidden (no clutter)
 *   • Online + items queued  → amber "syncing N…" pill with retry button
 *   • Offline                → red "offline" pill (queue continues to grow)
 */
export default function ConnectionBadge({ lang = 'en' }) {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pending, setPending] = useState(0);
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const unsub = subscribe(items => setPending(items.length));
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      unsub();
    };
  }, []);

  if (online && pending === 0) return null;

  if (!online) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
        title={tx('No internet — changes will sync when you reconnect.', 'لا يوجد اتصال — ستُحفظ التعديلات عند رجوع الإنترنت.')}
      >
        <WifiOff size={12} />
        <span>{tx('Offline', 'بدون اتصال')}{pending > 0 ? ` · ${pending}` : ''}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => flushNow()}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
      title={tx('Some changes are still syncing. Click to retry now.', 'بعض التعديلات قيد المزامنة. اضغط لإعادة المحاولة.')}
    >
      <RefreshCw size={12} className="animate-spin" />
      <span>{tx(`Syncing ${pending}`, `مزامنة ${pending}`)}</span>
    </button>
  );
}
