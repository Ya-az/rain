import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, CheckCircle2, Clock, XCircle, Camera, Copy, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { t } from '../constants/translations';
import CustomSelect from '../components/ui/CustomSelect';
import Toggle from '../components/ui/Toggle';
import QrScannerModal from '../components/ui/QrScannerModal';

const REGION_COLORS = {
  Western: 'bg-brand-500',
  Central: 'bg-saudi-500',
  Eastern: 'bg-orange-500',
  FN: 'bg-teal-500',
};

function CopyIdButton({ id, lang }) {
  const [copied, setCopied] = useState(false);
  const handle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = id;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* ignore */ }
    };
    try {
      navigator.clipboard?.writeText(id).catch(fallback) || fallback();
    } catch { fallback(); }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={handle}
      title={lang === 'ar' ? `نسخ ID: ${id}` : `Copy ID: ${id}`}
      className="ms-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/70 border border-ink-200 text-ink-500 hover:text-brand-700 hover:border-brand-300 transition-colors"
    >
      {copied ? <Check size={10} className="text-saudi-600" /> : <Copy size={10} />}
      {copied ? (lang === 'ar' ? 'نُسخ' : 'Copied') : id.slice(-6)}
    </button>
  );
}

function TeamAttendanceCard({ team, getTeamStatus, confirmAttendance, participations, categories, lang, highlight, isAdmin = false, onEditRequest }) {
  const [draftCoachPresent, setDraftCoachPresent] = useState(team.coach.present);
  const [draftMembers, setDraftMembers] = useState(team.members.map(m => ({ ...m })));
  const [collapsed, setCollapsed] = useState(true);
  const cardRef = useRef(null);

  // When this card is the QR-scan target, expand + scroll into view + flash.
  useEffect(() => {
    if (highlight) {
      setCollapsed(false);
      const id = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [highlight]);

  useEffect(() => {
    setDraftCoachPresent(team.coach.present);
    setDraftMembers(team.members.map(m => ({ ...m })));
  }, [team]);

  const total = draftMembers.length + 1;
  const presentCount = draftMembers.filter(m => m.present).length + (draftCoachPresent ? 1 : 0);
  const originalStatus = getTeamStatus(team);

  let draftStatus = 'Partially Arrived';
  if (presentCount === 0) draftStatus = 'No-Show';
  if (presentCount === total) draftStatus = 'Fully Arrived';

  const STATUS_STYLES = {
    'No-Show':           { border: 'border-rose-200',   bg: 'bg-rose-50/40',   badge: 'bg-rose-100 text-rose-700',     icon: <XCircle size={13} className="text-rose-500" /> },
    'Partially Arrived': { border: 'border-orange-300', bg: 'bg-orange-50/40', badge: 'bg-orange-100 text-orange-800', icon: <Clock size={13} className="text-orange-500" /> },
    'Fully Arrived':     { border: 'border-saudi-400', bg: 'bg-saudi-50/30',  badge: 'bg-saudi-100 text-saudi-800',   icon: <CheckCircle2 size={13} className="text-saudi-500" /> },
  };
  const ss = STATUS_STYLES[draftStatus];

  let buttonText = t(lang, 'checkInBtn');
  let isButtonDisabled = false;
  if (originalStatus === 'No-Show' && draftStatus === 'No-Show') isButtonDisabled = true;
  if (originalStatus === 'Partially Arrived' && draftStatus === 'No-Show') buttonText = t(lang, 'submit');

  const teamParts = participations ? participations.filter(p => p.teamId === team.id) : [];
  const regionColor = REGION_COLORS[team.region] || 'bg-ink-400';
  const teamCategoryNames = teamParts
    .map(p => categories?.find(c => c.id === p.categoryId)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div ref={cardRef} className={`rounded-2xl border-2 transition-all overflow-hidden shadow-card ${ss.border} ${ss.bg} ${highlight ? 'ring-4 ring-brand-400 ring-offset-2 animate-pulse' : ''}`}>
      <div className="relative">
        {isAdmin && onEditRequest && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEditRequest(team); }}
            title={lang === 'ar' ? 'تعديل بيانات الفريق' : 'Edit team info'}
            className="absolute top-3 end-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 border border-ink-200 text-ink-600 hover:text-brand-700 hover:border-brand-400 hover:bg-brand-50 text-xs font-bold shadow-sm transition"
          >
            <Pencil size={12} />
            {lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
        )}
      <button
        className="w-full flex items-center gap-3 p-4 text-start hover:bg-black/3 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Region color bar */}
        <div className={`w-1 self-stretch rounded-full ${regionColor} shrink-0`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-ink-800 text-sm">{team.name}</h3>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${ss.badge}`}>
              {ss.icon}
              {draftStatus === 'Fully Arrived' ? t(lang, 'fullyArrived')
                : draftStatus === 'Partially Arrived' ? t(lang, 'partiallyArrived')
                : t(lang, 'noShow')}
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5 font-medium flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${regionColor}`} />
            {team.region} · {t(lang, 'divisionLabel')} {team.division}
            <CopyIdButton id={team.id} lang={lang} />
          </p>
          <p className="text-xs text-ink-300 mt-0.5 truncate">
            {teamCategoryNames}
          </p>
          {teamParts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {teamParts.map(p => (
                <span key={p.id} className="text-[10px] font-black font-mono bg-white border border-ink-200 text-ink-500 px-2 py-0.5 rounded-lg">
                  #{p.id}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Presence counter */}
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-ink-700">{presentCount}<span className="text-xs text-ink-400 font-bold">/{total}</span></div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`ml-auto mt-1 text-ink-300 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
        <div className="px-4 pb-4 space-y-2">
          <div className="bg-white rounded-xl border border-ink-100 overflow-hidden divide-y divide-ink-50">
            {/* Coach row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 transition-colors">
              <div>
                <span className="text-[10px] font-black text-ink-400 uppercase tracking-wide block">{t(lang, 'coachLabel')}</span>
                <span className="font-semibold text-ink-700 text-sm">{team.coach.name}</span>
              </div>
              <Toggle checked={draftCoachPresent} onChange={setDraftCoachPresent} />
            </div>
            {/* Member rows */}
            {draftMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 transition-colors">
                <div>
                  <span className="text-[10px] font-black text-ink-400 uppercase tracking-wide block">{t(lang, 'studentLabel')}</span>
                  <span className="font-medium text-ink-700 text-sm">{member.name}</span>
                </div>
                <Toggle
                  checked={member.present}
                  onChange={v => setDraftMembers(prev => prev.map(m => m.id === member.id ? { ...m, present: v } : m))}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => confirmAttendance(team.id, draftCoachPresent, draftMembers)}
            disabled={isButtonDisabled}
            className={`w-full font-bold py-3 rounded-xl text-sm transition-colors ${
              isButtonDisabled
                ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── EditTeamModal (admin) ────────────────────────────────────────────────
function EditTeamModal({ team, lang, onSave, onClose }) {
  const [name, setName] = useState(team.name || '');
  const [coachName, setCoachName] = useState(team.coach?.name || '');
  const [members, setMembers] = useState((team.members || []).map(m => ({ id: m.id, name: m.name, present: !!m.present })));
  const tx = (en, ar) => lang === 'ar' ? ar : en;

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), coachName: coachName.trim(), members });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <div>
            <h3 className="text-lg font-black text-ink-800">{tx('Edit Team', 'تعديل الفريق')}</h3>
            <p className="text-xs text-ink-400 font-mono mt-0.5">{team.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-black text-ink-500 uppercase tracking-wide mb-1.5">{tx('Team name', 'اسم الفريق')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-semibold" />
          </div>

          <div>
            <label className="block text-xs font-black text-ink-500 uppercase tracking-wide mb-1.5">{tx('Coach name', 'اسم المدرب')}</label>
            <input type="text" value={coachName} onChange={e => setCoachName(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-ink-500 uppercase tracking-wide">{tx('Members', 'الأعضاء')} ({members.length})</label>
              <button type="button" onClick={() => setMembers(prev => [...prev, { id: `${team.id}_m${Date.now()}`, name: '', present: false }])}
                className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100">
                <Plus size={12} /> {tx('Add member', 'إضافة عضو')}
              </button>
            </div>
            <div className="space-y-2">
              {members.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-ink-100 text-ink-500 shrink-0">{idx + 1}</span>
                  <input type="text" value={m.name} onChange={e => setMembers(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    placeholder={tx('Member name', 'اسم العضو')}
                    className="flex-1 px-3 py-2 border-2 border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                  <button type="button" onClick={() => setMembers(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-ink-400 italic">{tx('No members yet.', 'لا يوجد أعضاء بعد.')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-ink-100 bg-ink-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-ink-200 bg-white text-sm font-bold text-ink-600 hover:bg-ink-100">
            {tx('Cancel', 'إلغاء')}
          </button>
          <button onClick={submit} disabled={!name.trim()}
            className="px-5 py-2 rounded-xl btn-primary text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {tx('Save changes', 'حفظ التغييرات')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckInSystem({ teams, getTeamStatus, confirmAttendance, participations, categories, lang, currentUser, updateTeamInfo }) {
  const isAdmin = currentUser?.role === 'admin';
  const [editingTeam, setEditingTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('No-Show');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [highlightTeamId, setHighlightTeamId] = useState(null);
  const [scanError, setScanError] = useState('');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Resolve a scanned QR payload (team.id OR participation.id) to a team,
  // switch to the right tab, expand its card and clear the highlight after a
  // few seconds so it doesn't pulse forever.
  const handleScan = (raw) => {
    setScannerOpen(false);
    setScanError('');
    const text = String(raw || '').trim();
    if (!text) return;
    let team = teams.find(tm => tm.id === text);
    if (!team) {
      const part = participations.find(p => p.id === text);
      if (part) team = teams.find(tm => tm.id === part.teamId);
    }
    if (!team) {
      setScanError(lang === 'ar' ? `لم يُعثر على فريق للرمز: ${text}` : `No team found for code: ${text}`);
      setTimeout(() => setScanError(''), 4000);
      return;
    }
    const status = getTeamStatus(team);
    setActiveTab(status === 'No-Show' ? 'No-Show' : status === 'Partially Arrived' ? 'Partially Arrived' : 'Fully Arrived');
    setSearchQuery('');
    setLevelFilter('');
    setCategoryFilter('');
    setHighlightTeamId(team.id);
    setTimeout(() => setHighlightTeamId(null), 3500);
  };

  const totalTeams = teams.length;
  const checkedInTeams = teams.filter(t => getTeamStatus(t) === 'Fully Arrived').length;
  const partiallyChecked = teams.filter(t => getTeamStatus(t) === 'Partially Arrived').length;
  const noShowCount = totalTeams - checkedInTeams - partiallyChecked;

  // Filter all teams (used for both pending + fully arrived tabs)
  const allFiltered = teams.filter(team => {
    const pIds = participations.filter(p => p.teamId === team.id).map(p => p.id.toLowerCase());
    const matchSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pIds.some(id => id.includes(searchQuery.toLowerCase()));
    const matchLevel = levelFilter ? team.division === levelFilter : true;
    const matchCat = categoryFilter
      ? participations.some(p => p.teamId === team.id && p.categoryId === categoryFilter)
      : true;
    return matchSearch && matchLevel && matchCat;
  });

  const noShowTeams = allFiltered.filter(team => getTeamStatus(team) === 'No-Show');
  const partialTeams = allFiltered.filter(team => getTeamStatus(team) === 'Partially Arrived');
  const fullyArrivedTeams = allFiltered.filter(team => getTeamStatus(team) === 'Fully Arrived');
  const visibleTeams = activeTab === 'No-Show' ? noShowTeams
    : activeTab === 'Partially Arrived' ? partialTeams
    : fullyArrivedTeams;

  return (
    <div className="space-y-4" dir={dir}>
      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center">
          <MapPin className="text-brand-600" size={18} />
        </div>
        <h2 className="text-xl font-black text-ink-900">{t(lang, 'registrationDesk')}</h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl shadow-card border border-saudi-200 p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-saudi-700">{checkedInTeams}</div>
          <div className="text-[10px] sm:text-xs font-bold text-saudi-500 mt-0.5 leading-tight">{t(lang, 'fullyArrived')}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-orange-200 p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-orange-700">{partiallyChecked}</div>
          <div className="text-[10px] sm:text-xs font-bold text-orange-500 mt-0.5 leading-tight">{t(lang, 'partiallyArrived')}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-rose-200 p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-black text-rose-700">{noShowCount}</div>
          <div className="text-[10px] sm:text-xs font-bold text-rose-500 mt-0.5 leading-tight">{t(lang, 'noShow')}</div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-4 space-y-3">
        {/* Region color legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-ink-500">
          <span className="uppercase tracking-wider text-[10px] text-ink-400">{lang === 'ar' ? 'دليل المناطق' : 'Region legend'}:</span>
          {[
            { name: 'Western', cls: 'bg-brand-500',  ar: 'الغربية' },
            { name: 'Central', cls: 'bg-saudi-500',  ar: 'الوسطى' },
            { name: 'Eastern', cls: 'bg-orange-500', ar: 'الشرقية' },
            { name: 'FN',      cls: 'bg-teal-500',   ar: 'النهائيات العالمية' },
          ].map(r => (
            <span key={r.name} className="inline-flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${r.cls}`} />
              {lang === 'ar' ? r.ar : r.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t(lang, 'searchTeam')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-10 h-12 text-base"
            />
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            title={lang === 'ar' ? 'مسح رمز QR' : 'Scan QR'}
            aria-label={lang === 'ar' ? 'مسح رمز QR' : 'Scan QR'}
            className="shrink-0 h-12 w-12 rounded-xl border-2 border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 transition-colors flex items-center justify-center press-effect"
          >
            <Camera size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CustomSelect value={levelFilter} onChange={e => setLevelFilter(e.target.value)} size="sm">
            <option value="">{t(lang, 'allLevels')}</option>
            {['ES', 'MS', 'HS', 'US'].map(l => <option key={l} value={l}>{l}</option>)}
          </CustomSelect>
          <CustomSelect value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} size="sm">
            <option value="">{t(lang, 'allCategories')}</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </CustomSelect>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab('No-Show')}
          className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all press-effect ${
            activeTab === 'No-Show'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-300'
          }`}
        >
          {t(lang, 'noShow')} ({noShowTeams.length})
        </button>
        <button
          onClick={() => setActiveTab('Partially Arrived')}
          className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all press-effect ${
            activeTab === 'Partially Arrived'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-orange-600 border border-orange-200 hover:border-orange-300'
          }`}
        >
          {t(lang, 'partialCheckin')} ({partialTeams.length})
        </button>
        <button
          onClick={() => setActiveTab('Fully Arrived')}
          className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all press-effect ${
            activeTab === 'Fully Arrived'
              ? 'bg-saudi-500 text-white shadow-sm'
              : 'bg-white text-saudi-600 border border-saudi-200 hover:border-saudi-300'
          }`}
        >
          {t(lang, 'fullyArrivedTab')} ({fullyArrivedTeams.length})
        </button>
      </div>

      {/* Team cards */}
      {visibleTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-card border border-ink-100">
          <div className="w-12 h-12 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-center mb-3">
            <Search className="text-ink-300" size={22} />
          </div>
          <p className="text-ink-400 font-medium text-sm">{t(lang, 'noTeamsMatch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-24 sm:pb-4">
          {visibleTeams.map(team => (
            <TeamAttendanceCard
              key={team.id}
              team={team}
              getTeamStatus={getTeamStatus}
              confirmAttendance={confirmAttendance}
              participations={participations}
              categories={categories}
              lang={lang}
              highlight={highlightTeamId === team.id}
              isAdmin={isAdmin}
              onEditRequest={updateTeamInfo ? setEditingTeam : undefined}
            />
          ))}
        </div>
      )}

      {editingTeam && updateTeamInfo && (
        <EditTeamModal
          team={editingTeam}
          lang={lang}
          onSave={(patch) => updateTeamInfo(editingTeam.id, patch)}
          onClose={() => setEditingTeam(null)}
        />
      )}

      {scanError && (
        <div className="fixed bottom-24 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[120] max-w-md mx-auto sm:mx-0 px-4 py-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-700 text-sm font-bold shadow-lg">
          ⚠ {scanError}
        </div>
      )}

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        lang={lang}
      />
    </div>
  );
}
