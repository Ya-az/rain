import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { X, Activity, Search, Download, Filter } from 'lucide-react';

/**
 * Read-only viewer for the `audit_log` Firestore collection. Subscribes only
 * while open to keep idle bandwidth at zero; cap of 500 most-recent entries
 * keeps the modal fast even after months of activity.
 */

const ACTION_LABELS = {
  'score.create':        { en: 'Score Created',         ar: 'نتيجة جديدة',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'score.update':        { en: 'Score Updated',         ar: 'تعديل نتيجة',            color: 'text-sky-700 bg-sky-50 border-sky-200' },
  'score.edit_request':  { en: 'Edit Requested',        ar: 'طلب تعديل',              color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'score.approve':       { en: 'Edit Approved',         ar: 'تمت الموافقة',           color: 'text-green-700 bg-green-50 border-green-200' },
  'score.reject':        { en: 'Edit Rejected',         ar: 'رُفض التعديل',           color: 'text-rose-700 bg-rose-50 border-rose-200' },
  'score.delete':        { en: 'Score Deleted',         ar: 'حذف نتيجة',              color: 'text-rose-700 bg-rose-50 border-rose-200' },
  'team.delete':         { en: 'Team Deleted',          ar: 'حذف فريق',               color: 'text-rose-700 bg-rose-50 border-rose-200' },
  'user.create':         { en: 'User Created',          ar: 'مستخدم جديد',            color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  'user.delete':         { en: 'User Deleted',          ar: 'حذف مستخدم',             color: 'text-rose-700 bg-rose-50 border-rose-200' },
  'matches.regenerate':  { en: 'Matches Regenerated',   ar: 'إعادة توليد المباريات',  color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

function timeAgo(iso, lang) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return lang === 'ar' ? 'الآن' : 'just now';
  if (m < 60) return lang === 'ar' ? `قبل ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'ar' ? `قبل ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === 'ar' ? `قبل ${d} ي` : `${d}d ago`;
}

function formatDetails(action, details, lang) {
  if (!details) return null;
  if (action === 'score.edit_request' || action === 'score.approve' || action === 'score.update') {
    return `${details.from ?? '—'} → ${details.to ?? '—'}`;
  }
  if (action === 'score.create') return `${lang === 'ar' ? 'النتيجة:' : 'Score:'} ${details.score ?? '—'}`;
  if (action === 'score.delete') return `${lang === 'ar' ? 'كانت:' : 'Was:'} ${details.score ?? '—'}`;
  if (action === 'score.reject') return `${lang === 'ar' ? 'بقيت' : 'Kept'} ${details.score ?? '—'} (${lang === 'ar' ? 'رُفض' : 'rejected'} ${details.rejectedProposal ?? '—'})`;
  if (action === 'user.create') return `${details.username ?? ''} (${details.role ?? ''})`;
  return JSON.stringify(details);
}

export default function AuditLogViewer({ open, onClose, lang = 'en', currentUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    if (!open) return undefined;
    setLoading(true);
    const q = query(collection(db, 'audit_log'), orderBy('at', 'desc'), limit(500));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => d.data()));
      setLoading(false);
    }, err => {
      console.warn('audit log subscribe failed:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (!q) return true;
      return (
        (e.username || '').toLowerCase().includes(q) ||
        (e.action || '').toLowerCase().includes(q) ||
        (e.target || '').toLowerCase().includes(q) ||
        JSON.stringify(e.details || {}).toLowerCase().includes(q)
      );
    });
  }, [entries, search, actionFilter]);

  const exportCsv = () => {
    const rows = [['timestamp', 'user', 'role', 'action', 'target', 'details']];
    filtered.forEach(e => {
      rows.push([
        e.at,
        e.username || '',
        e.role || '',
        e.action || '',
        e.target || '',
        JSON.stringify(e.details || {}),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const uniqueActions = Array.from(new Set(entries.map(e => e.action))).sort();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 bg-gradient-to-r from-ink-50 to-white border-b border-ink-200 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-ink-800">{tx('Audit Log', 'سجل التدقيق')}</h3>
            <p className="text-[11px] text-ink-500 font-medium">
              {tx(`Showing ${filtered.length} of ${entries.length}`, `يُعرض ${filtered.length} من ${entries.length}`)}
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 disabled:opacity-40 transition-colors"
          >
            <Download size={13} /> CSV
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
            aria-label={tx('Close', 'إغلاق')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row gap-2 border-b border-ink-100 bg-ink-50/50 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder={tx('Search user, action, score…', 'ابحث عن مستخدم أو إجراء…')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full ps-9 pe-3 py-2 text-sm border border-ink-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="ps-9 pe-3 py-2 text-sm border border-ink-200 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-brand-400 outline-none w-full sm:w-auto"
            >
              <option value="all">{tx('All actions', 'كل الإجراءات')}</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>
                  {(ACTION_LABELS[a]?.[lang]) || a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-12 text-center text-ink-400 text-sm font-semibold">
              {tx('Loading audit log…', 'جارٍ تحميل السجل…')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={32} className="mx-auto text-ink-300 mb-2" />
              <p className="text-sm text-ink-500 font-bold">
                {tx('No entries match your filters.', 'لا توجد سجلات مطابقة.')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {filtered.map(e => {
                const meta = ACTION_LABELS[e.action] || { en: e.action, ar: e.action, color: 'text-ink-700 bg-ink-50 border-ink-200' };
                return (
                  <li key={e.id} className="px-4 sm:px-5 py-3 hover:bg-ink-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide ${meta.color}`}>
                        {meta[lang] || meta.en}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-ink-800 text-sm">{e.username || tx('system', 'النظام')}</span>
                          <span className="text-[10px] text-ink-400 font-semibold uppercase">{e.role}</span>
                          <span className="text-[10px] text-ink-400">·</span>
                          <span className="text-[11px] text-ink-500" title={e.at}>{timeAgo(e.at, lang)}</span>
                        </div>
                        {formatDetails(e.action, e.details, lang) && (
                          <p className="text-xs text-ink-700 mt-0.5 font-mono">{formatDetails(e.action, e.details, lang)}</p>
                        )}
                        <p className="text-[10px] text-ink-400 mt-0.5 font-mono truncate">{e.target}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
