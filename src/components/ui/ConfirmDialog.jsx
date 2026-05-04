import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirm dialog. Replaces window.confirm() for destructive
 * operations and supports an optional "type to confirm" guard.
 *
 * Props:
 *   open         — boolean
 *   title        — string
 *   message      — string | ReactNode
 *   confirmLabel — string (default: "Confirm")
 *   cancelLabel  — string (default: "Cancel")
 *   variant      — 'danger' | 'default'
 *   typeToConfirm — optional string the user must type to enable confirm
 *   onConfirm    — () => void
 *   onCancel     — () => void
 *   busy         — boolean (disables buttons + shows spinner)
 *   lang         — 'en' | 'ar'
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  typeToConfirm,
  onConfirm,
  onCancel,
  busy = false,
  lang = 'en',
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const requiresType = typeof typeToConfirm === 'string' && typeToConfirm.length > 0;
  const canConfirm = !busy && (!requiresType || typed === typeToConfirm);
  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => !busy && onCancel?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className={`px-5 py-4 flex items-start gap-3 ${isDanger ? 'bg-red-50 border-b border-red-200' : 'bg-ink-50 border-b border-ink-200'}`}>
          <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100 text-red-600' : 'bg-ink-100 text-ink-600'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className={`text-base font-black ${isDanger ? 'text-red-700' : 'text-ink-800'}`}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => !busy && onCancel?.()}
            disabled={busy}
            className="shrink-0 p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label={tx('Close', 'إغلاق')}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-ink-600 leading-relaxed">{message}</div>
          {requiresType && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-ink-500 mb-1 block">
                {tx(`Type "${typeToConfirm}" to confirm`, `اكتب "${typeToConfirm}" للتأكيد`)}
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={busy}
                autoFocus
                className="w-full p-2.5 border-2 border-ink-200 rounded-xl text-sm font-mono text-ink-700 focus:ring-2 focus:ring-red-500 outline-none bg-white disabled:opacity-50"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 text-sm font-bold text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelLabel || tx('Cancel', 'إلغاء')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors flex items-center gap-2 ${
                isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {busy && (
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmLabel || tx('Confirm', 'تأكيد')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
