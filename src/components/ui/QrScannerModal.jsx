import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

/**
 * Camera-based QR scanner modal. Lazy-loads html5-qrcode so the parser is
 * only fetched when actually needed (saves ~120KB on initial load).
 *
 * Props:
 *   open      — boolean
 *   onScan    — (text: string) => void   called once per successful scan
 *   onClose   — () => void
 *   lang      — 'en' | 'ar'
 */
export default function QrScannerModal({ open, onScan, onClose, lang = 'en' }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  // html5-qrcode throws SYNCHRONOUSLY when stop() is called while not
  // running/paused, so .catch() alone won't shield us. Wrap with try and
  // fall back to a resolved promise so .finally() still runs.
  const safeStop = (scanner) => {
    if (!scanner) return Promise.resolve();
    try {
      const state = typeof scanner.getState === 'function' ? scanner.getState() : null;
      // Html5QrcodeScannerState: NOT_STARTED=1, SCANNING=2, PAUSED=3
      if (state != null && state !== 2 && state !== 3) return Promise.resolve();
      return scanner.stop().catch(() => {});
    } catch {
      return Promise.resolve();
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setError('');
    setStarting(true);

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const elementId = 'qr-scanner-region';
        // Wait one tick for the container div to mount
        await new Promise(r => setTimeout(r, 0));
        const scanner = new Html5Qrcode(elementId, /* verbose */ false);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            // Stop immediately on first hit to avoid duplicate triggers.
            safeStop(scanner).finally(() => {
              try { scanner.clear(); } catch { /* ignore */ }
            });
            onScan?.(decodedText);
          },
          () => { /* per-frame errors are noise — ignore */ }
        );
        if (cancelled) {
          safeStop(scanner);
        }
        setStarting(false);
      } catch (err) {
        setStarting(false);
        const msg = err?.message || String(err);
        setError(msg.includes('Permission') || msg.includes('NotAllowed')
          ? tx('Camera permission denied. Allow access in your browser settings.', 'تم رفض الإذن للكاميرا. فعّله من إعدادات المتصفح.')
          : tx(`Camera error: ${msg}`, `خطأ في الكاميرا: ${msg}`));
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        safeStop(s).finally(() => {
          try { s.clear(); } catch { /* ignore */ }
        });
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="px-5 py-4 flex items-center gap-3 bg-ink-50 border-b border-ink-200">
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Camera size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-ink-800">{tx('Scan Team QR', 'مسح رمز الفريق')}</h3>
            <p className="text-[11px] text-ink-500 font-medium">{tx('Point camera at the QR code on the team sheet.', 'وجّه الكاميرا إلى رمز QR في كرت الفريق.')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
            aria-label={tx('Close', 'إغلاق')}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="px-4 py-6 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-700 text-sm font-semibold flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div ref={containerRef} id="qr-scanner-region" className="w-full rounded-xl overflow-hidden bg-black aspect-square" />
              {starting && (
                <p className="mt-3 text-xs text-ink-500 text-center font-semibold animate-pulse">
                  {tx('Starting camera…', 'جارٍ تشغيل الكاميرا…')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
