import { useState, useEffect, useMemo, Fragment } from 'react';
import { CheckCircle2, Search, X, Plus, Pencil, Save } from 'lucide-react';
import { CATEGORY_STYLES } from '../constants/mockData';
import { t } from '../constants/translations';
import CollapsibleCard from '../components/ui/CollapsibleCard';
import CustomSelect from '../components/ui/CustomSelect';
import {
  buildFastBotScheduleRows,
  formatFastBotScore,
  formatGroup1Score,
  getActiveSlotKeys,
  getDefaultFastBotSlotKey,
  getFastBotCellDisplay,
  getFastBotScoreValue,
  getFastBotSlotOrder,
  getGroup1BestOfficialScore,
} from '../utils/fastbotSchedule';
import {
  FastBotAttemptCard,
  LineFollowingAttemptCard,
  AMazeIngAttemptCard,
  SumoMatchCard,
  SoccerBotMatchCard,
  ScoringCard,
} from '../scoring/ScoringCards';
import { resolveBracket, groupBracketByDivision, groupByRound } from '../utils/bracket';
import {
  generateRoundRobinMatches,
  getRrBuckets,
  buildAutoBracketFromRR,
} from '../utils/roundRobin';

// Static class mapping for the slot grid so Tailwind JIT can pick them up.
function slotGridClass(count) {
  const clamped = Math.min(Math.max(count, 1), 7);
  // Mobile: 2 cols (or 1 if count===1). sm: 3 cols. lg: up to `count` cols.
  const lgMap = {
    1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
  };
  const base = clamped === 1 ? 'grid-cols-1' : 'grid-cols-2';
  return `${base} sm:grid-cols-3 ${lgMap[clamped]}`;
}

function FastBotScheduleCell({ slot, scoreFormatter = formatFastBotScore }) {
  const { timeLabel } = getFastBotCellDisplay(slot);
  const scoreLabel = scoreFormatter(getFastBotScoreValue(slot?.scoreObj));
  const hasScore = scoreLabel !== '--';

  return (
    <div className="min-w-[72px] text-center">
      <p className="font-mono text-[11px] text-ink-500">{timeLabel}</p>
      <p className={`text-xs font-black ${hasScore ? 'text-brand-700' : 'text-ink-300'}`}>{scoreLabel}</p>
    </div>
  );
}

function getFastBotCheckInStatusLabel(status, lang) {
  if (status === 'Fully Arrived') return t(lang, 'fullyArrived');
  if (status === 'Partially Arrived') return t(lang, 'partiallyArrived');
  return t(lang, 'noShow');
}

function FastBotCheckInBadge({ status, lang }) {
  const badgeClassName = status === 'Fully Arrived'
    ? 'border-saudi-200 bg-saudi-50 text-saudi-700'
    : status === 'Partially Arrived'
      ? 'border-saudi-200 bg-saudi-50 text-saudi-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeClassName}`}>
      {getFastBotCheckInStatusLabel(status, lang)}
    </span>
  );
}

function FastBotScheduleTable({ title, rows, onSelectRow, lang, showHeader = true, scoreFormatter = formatFastBotScore, activeSlotKeys = [], editable = false, onRemoveRow, addPool = null, onAddTeam }) {
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedAddId, setPickedAddId] = useState('');
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const showActions = editable && editMode;
  const canAdd = !!onAddTeam && Array.isArray(addPool);

  return (
    <div className="rounded-2xl border border-ink-200 overflow-hidden bg-white shadow-sm">
      {(showHeader || editable || canAdd) && (
        <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between gap-3 bg-white">
          {showHeader ? (
            <h4 className="font-semibold text-ink-800 text-sm">{title}</h4>
          ) : <span />}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-ink-400">{rows.length} {t(lang, 'teamLabel')}</span>
            {editable && (
              <button
                type="button"
                onClick={() => setEditMode(m => !m)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                  editMode
                    ? 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
                    : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                <Pencil size={11} /> {editMode ? tx('Done', 'انتهيت') : tx('Edit', 'تعديل')}
              </button>
            )}
            {canAdd && (
              <button
                type="button"
                onClick={() => { setAddOpen(o => !o); setPickedAddId(''); }}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                  addOpen
                    ? 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
                    : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                <Plus size={11} /> {tx('Add', 'اضف')}
              </button>
            )}
          </div>
        </div>
      )}
      {canAdd && addOpen && (
        <div className="px-4 py-2.5 border-b border-ink-100 bg-ink-50/50 flex flex-wrap items-center gap-2">
          <select
            value={pickedAddId}
            onChange={(e) => setPickedAddId(e.target.value)}
            className="flex-1 min-w-[200px] text-xs px-2.5 py-1.5 rounded-md border border-ink-200 bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">{tx('Select a team…', 'اختر فريق…')}</option>
            {addPool.map(tm => (
              <option key={tm.id} value={tm.id}>{tm.name}{tm.division ? ` — ${tm.division}` : ''}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!pickedAddId}
            onClick={() => { if (pickedAddId) { onAddTeam(pickedAddId); setPickedAddId(''); setAddOpen(false); } }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {tx('Add', 'اضف')}
          </button>
          <button
            type="button"
            onClick={() => { setAddOpen(false); setPickedAddId(''); }}
            className="inline-flex items-center text-[11px] font-medium px-3 py-1.5 rounded-md text-ink-500 hover:text-ink-800 hover:bg-ink-100"
          >
            {tx('Cancel', 'إلغاء')}
          </button>
          {addPool.length === 0 && (
            <span className="text-[11px] font-medium text-ink-400">{tx('No more teams available', 'لا توجد فرق متاحة')}</span>
          )}
        </div>
      )}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="min-w-[820px] sm:min-w-[1120px] w-full text-xs sm:text-sm">
          <thead className="bg-navy-700 text-white">
            <tr className="text-left">
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{t(lang, 'teamName')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{t(lang, 'teamNumber')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{t(lang, 'divisionLabel')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center whitespace-nowrap bg-saudi-600/20">{`Best (R1-R${activeSlotKeys.filter(k => k.startsWith('R')).length})`}</th>
              {activeSlotKeys.map(slotKey => <th key={slotKey} className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center whitespace-nowrap">{slotKey}</th>)}
              {showActions && <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center w-12">{tx('Remove', 'حذف')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4 + activeSlotKeys.length + (showActions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-ink-400 font-medium">
                  {t(lang, 'fastbotNoTeamsForGroup')}
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr
                key={row.participationId}
                tabIndex={showActions ? -1 : 0}
                onClick={() => { if (!showActions) onSelectRow(row); }}
                onKeyDown={(event) => {
                  if (showActions) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectRow(row);
                  }
                }}
                className={`transition-colors focus:outline-none ${
                  showActions
                    ? 'bg-ink-50/40 hover:bg-ink-50/80'
                    : 'cursor-pointer hover:bg-brand-50/60 focus:bg-brand-50'
                }`}
              >
                <td className="px-3 py-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-ink-800">{row.teamName}</p>
                      <FastBotCheckInBadge status={row.checkInStatus} lang={lang} />
                    </div>
                    {!showActions && (
                      <p className="text-[10px] text-brand-500 font-black uppercase tracking-wider">{t(lang, 'openFastBotTeam')}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-ink-500">{row.participationId}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-[10px] font-black uppercase text-brand-700">{row.division}</span>
                </td>
                <td className="px-3 py-3 text-center bg-saudi-50/40">
                  <span className={`text-sm font-black ${row.bestOfficialScore !== null ? 'text-saudi-700' : 'text-ink-300'}`}>
                    {scoreFormatter(row.bestOfficialScore)}
                  </span>
                </td>
                {activeSlotKeys.map(slotKey => (
                  <td key={slotKey} className="px-3 py-3 align-middle">
                    <FastBotScheduleCell slot={row.slots[slotKey]} scoreFormatter={scoreFormatter} />
                  </td>
                ))}
                {showActions && (
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const ok = window.confirm(lang === 'ar'
                          ? `إزالة "${row.teamName}" من هذا الجدول؟`
                          : `Remove "${row.teamName}" from this table?`);
                        if (ok) onRemoveRow?.(row);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors"
                      aria-label={tx('Remove', 'حذف')}
                    >
                      <X size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FastBotDetailView({ row, activeSlotKey, onSlotChange, onBack, onSaveScore, onEditRequest, systemConfig, lang, activeSlotKeys = [], categoryId }) {
  const activeSlot = row?.slots?.[activeSlotKey];

  if (!row || !activeSlot) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-100 transition-colors"
      >
        ← {t(lang, 'backToFastBotSchedule')}
      </button>

      <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-navy-700 to-navy-500 p-4 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">{t(lang, 'fastbotTeamSchedule')}</p>
            <h4 className="text-xl font-black mt-1">{row.teamName}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase">{row.division}</span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-mono">{row.participationId}</span>
              {row.region && <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold">{row.region}</span>}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 sm:min-w-[160px]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{t(lang, 'bestResult')}</p>
            <p className={`text-xl font-black mt-1 ${row.bestOfficialScore !== null ? 'text-saudi-300' : 'text-white/35'}`}>{formatFastBotScore(row.bestOfficialScore)}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-2 sm:gap-3 ${slotGridClass(activeSlotKeys.length)}`}>
        {activeSlotKeys.map(slotKey => {
          const slot = row.slots[slotKey];
          const { timeLabel, scoreLabel } = getFastBotCellDisplay(slot);
          const isActive = slotKey === activeSlotKey;

          return (
            <button
              key={slotKey}
              onClick={() => onSlotChange(slotKey)}
              className={`rounded-2xl border px-2.5 sm:px-3 py-2.5 sm:py-3 text-left transition-all ${
                isActive
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
              }`}
            >
              <p className={`text-sm font-black ${isActive ? 'text-brand-700' : 'text-ink-700'}`}>{slotKey}</p>
              <p className="font-mono text-[10px] sm:text-[11px] text-ink-500 mt-1">{timeLabel}</p>
              <p className={`text-xs font-black mt-1.5 sm:mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
            </button>
          );
        })}
      </div>

      <FastBotAttemptCard
        key={`${row.participationId}_${activeSlotKey}`}
        title={`${activeSlotKey} • ${row.teamName} • ${activeSlot.timeLabel}`}
        categoryId="c1_fastbot"
        teamDivision={row.division}
        attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup, categoryId)}
        initialScoreObj={activeSlot.scoreObj}
        onSaveScore={onSaveScore}
        onEditRequest={onEditRequest}
        systemConfig={systemConfig}
        participationId={row.participationId}
        teamName={row.teamName}
        lang={lang}
      />
    </div>
  );
}

// ─── Group1DetailView ────────────────────────────────────────────────────────

function Group1DetailView({ row, category, activeSlotKey, onSlotChange, onBack, onSaveScore, onEditRequest, systemConfig, lang, activeSlotKeys = [] }) {
  const activeSlot = row?.slots?.[activeSlotKey];

  if (!row || !activeSlot) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-100 transition-colors"
      >
        {t(lang, 'backToSchedule')}
      </button>

      <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-navy-700 to-navy-500 p-4 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">{category.name}</p>
            <h4 className="text-xl font-black mt-1">{row.teamName}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase">{row.division}</span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-mono">{row.participationId}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 sm:min-w-[160px]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{t(lang, 'bestResult')}</p>
            <p className={`text-xl font-black mt-1 ${row.bestOfficialScore !== null ? 'text-saudi-300' : 'text-white/35'}`}>
              {row.bestOfficialScore !== null ? String(Math.round(row.bestOfficialScore)) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className={`grid gap-2 sm:gap-3 ${slotGridClass(activeSlotKeys.length)}`}>
        {activeSlotKeys.map(slotKey => {
          const slot = row.slots[slotKey];
          const { timeLabel } = getFastBotCellDisplay(slot);
          const scoreValue = getFastBotScoreValue(slot?.scoreObj);
          const scoreLabel = formatGroup1Score(scoreValue);
          const isActive = slotKey === activeSlotKey;
          return (
            <button
              key={slotKey}
              onClick={() => onSlotChange(slotKey)}
              className={`rounded-2xl border px-2.5 sm:px-3 py-2.5 sm:py-3 text-left transition-all ${
                isActive
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
              }`}
            >
              <p className={`text-sm font-black ${isActive ? 'text-brand-700' : 'text-ink-700'}`}>{slotKey}</p>
              <p className="font-mono text-[10px] sm:text-[11px] text-ink-500 mt-1">{timeLabel}</p>
              <p className={`text-xs font-black mt-1.5 sm:mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
            </button>
          );
        })}
      </div>

      {category.id === 'c1_linefollow' && (
        <LineFollowingAttemptCard
          key={`${row.participationId}_${activeSlotKey}`}
          title={`${activeSlotKey} • ${row.teamName} • ${activeSlot.timeLabel}`}
          categoryId={category.id}
          teamDivision={row.division}
          attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup, category.id)}
          initialScoreObj={activeSlot.scoreObj}
          onSaveScore={onSaveScore}
          onEditRequest={onEditRequest}
          systemConfig={systemConfig}
          participationId={row.participationId}
          teamName={row.teamName}
          lang={lang}
        />
      )}
      {category.id === 'c1_amazeing' && (
        <AMazeIngAttemptCard
          key={`${row.participationId}_${activeSlotKey}`}
          title={`${activeSlotKey} • ${row.teamName} • ${activeSlot.timeLabel}`}
          categoryId={category.id}
          teamDivision={row.division}
          attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup, category.id)}
          initialScoreObj={activeSlot.scoreObj}
          onSaveScore={onSaveScore}
          onEditRequest={onEditRequest}
          participationId={row.participationId}
          teamName={row.teamName}
          lang={lang}
        />
      )}
    </div>
  );
}

// ─── Group1Workflow ──────────────────────────────────────────────────────────

function Group1Workflow({ category, participations, teams, allTeams, getTeamStatus, scores, setScores, systemConfig, lang, showToast, isAdmin = false, removeParticipation, addParticipation, customGroups = [], addCustomGroup, updateCustomGroup, deleteCustomGroup }) {
  const isFastBot = category.id === 'c1_fastbot';
  const activeParticipations = participations.filter(p => p.categoryId === category.id && teams.some(tm => tm.id === p.teamId));
  const [selectedP, setSelectedP] = useState('');
  const [selectedFastBotPId, setSelectedFastBotPId] = useState('');
  const [activeFastBotSlot, setActiveFastBotSlot] = useState('');
  const [activeGroup1Slot, setActiveGroup1Slot] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const activeSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig, 'es_ms', category.id), [systemConfig, category.id]);
  const esMsSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig, 'es_ms', category.id), [systemConfig, category.id]);
  const hsUsSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig, 'hs_us', category.id), [systemConfig, category.id]);

  useEffect(() => {
    setSelectedP('');
    setSelectedFastBotPId('');
    setActiveFastBotSlot('');
    setActiveGroup1Slot('');
  }, [category.id]);

  const filteredParticipations = activeParticipations.filter(p => {
    const tm = teams.find(team => team.id === p.teamId);
    if (!tm) return false;
    const matchSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || tm.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = levelFilter ? tm.division === levelFilter : true;
    return matchSearch && matchLevel;
  });

  const fastBotRows = useMemo(() => {
    if (!isFastBot) return [];
    const teamStatusById = new Map(
      teams.map(team => [team.id, getTeamStatus ? getTeamStatus(team) : 'No-Show'])
    );

    return buildFastBotScheduleRows(activeParticipations, teams, scores, systemConfig, category.id).map(row => ({
      ...row,
      checkInStatus: teamStatusById.get(row.teamId) || 'No-Show',
    }));
  }, [isFastBot, activeParticipations, teams, scores, getTeamStatus, systemConfig, category.id]);

  const visibleFastBotRows = useMemo(() => {
    if (!isFastBot) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return fastBotRows.filter(row => {
      const matchSearch = !normalizedQuery
        || row.participationId.toLowerCase().includes(normalizedQuery)
        || row.teamName.toLowerCase().includes(normalizedQuery);
      const matchLevel = levelFilter ? row.division === levelFilter : true;
      return matchSearch && matchLevel;
    });
  }, [isFastBot, fastBotRows, searchQuery, levelFilter]);

  const selectedFastBotRow = useMemo(
    () => fastBotRows.find(row => row.participationId === selectedFastBotPId) || null,
    [fastBotRows, selectedFastBotPId],
  );

  // ─── Group1 (LineFollowing / a-Maze-ing) rows ────────────────────────────
  const group1Rows = useMemo(() => {
    if (isFastBot) return [];
    const teamStatusById = new Map(
      teams.map(team => [team.id, getTeamStatus ? getTeamStatus(team) : 'No-Show'])
    );
    return buildFastBotScheduleRows(activeParticipations, teams, scores, systemConfig, category.id).map(row => ({
      ...row,
      checkInStatus: teamStatusById.get(row.teamId) || 'No-Show',
      bestOfficialScore: getGroup1BestOfficialScore(row.slots, systemConfig, row.divisionGroup, category.id),
    }));
  }, [isFastBot, activeParticipations, teams, scores, getTeamStatus, systemConfig, category.id]);

  const visibleGroup1Rows = useMemo(() => {
    if (isFastBot) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return group1Rows.filter(row => {
      const matchSearch = !normalizedQuery
        || row.participationId.toLowerCase().includes(normalizedQuery)
        || row.teamName.toLowerCase().includes(normalizedQuery);
      const matchLevel = levelFilter ? row.division === levelFilter : true;
      return matchSearch && matchLevel;
    });
  }, [isFastBot, group1Rows, searchQuery, levelFilter]);

  const selectedGroup1Row = useMemo(
    () => group1Rows.find(row => row.participationId === selectedP) || null,
    [group1Rows, selectedP],
  );

  useEffect(() => {
    if (!isFastBot || !selectedFastBotPId) return;
    if (!selectedFastBotRow) {
      setSelectedFastBotPId('');
      setActiveFastBotSlot('');
    }
  }, [isFastBot, selectedFastBotPId, selectedFastBotRow]);

  useEffect(() => {
    if (!isFastBot || !selectedFastBotRow) return;
    if (!activeFastBotSlot || !selectedFastBotRow.slots[activeFastBotSlot]) {
      setActiveFastBotSlot(getDefaultFastBotSlotKey(selectedFastBotRow, systemConfig, category.id));
    }
  }, [isFastBot, selectedFastBotRow, activeFastBotSlot, systemConfig]);

  const handleOpenFastBotRow = (row) => {
    setSelectedFastBotPId(row.participationId);
    setActiveFastBotSlot(getDefaultFastBotSlotKey(row, systemConfig, category.id));
  };

  const onSaveFastBotScore = (participationId, slotKey, scoreValue, insp, rawData) => {
    setScores(prev => {
      const existingScore = prev.find(score => score.pId === participationId && score.slotKey === slotKey);
      if (existingScore) {
        return prev.map(score => score.id === existingScore.id ? {
          ...score,
          score: scoreValue,
          inspectionData: insp,
          rawInput: rawData,
          status: 'VALID',
          proposedScore: undefined,
          proposedInspection: undefined,
          proposedRawInput: undefined,
        } : score);
      }
      return [...prev, { id: Date.now() + Math.random(), pId: participationId, slotKey, score: scoreValue, inspectionData: insp, rawInput: rawData, status: 'VALID' }];
    });
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };

  const onFastBotEditRequest = (scoreId, newScore, newInsp, newRaw) => {
    setScores(prev => prev.map(score => score.id === scoreId ? {
      ...score,
      proposedScore: newScore,
      proposedInspection: newInsp,
      proposedRawInput: newRaw,
      status: 'PENDING',
    } : score));
  };

  // ─── Group1 slot effects & handlers ──────────────────────────────────────
  useEffect(() => {
    if (isFastBot || !selectedP) return;
    if (!selectedGroup1Row) {
      setSelectedP('');
      setActiveGroup1Slot('');
    }
  }, [isFastBot, selectedP, selectedGroup1Row]);

  useEffect(() => {
    if (isFastBot || !selectedGroup1Row) return;
    if (!activeGroup1Slot || !selectedGroup1Row.slots[activeGroup1Slot]) {
      setActiveGroup1Slot(getDefaultFastBotSlotKey(selectedGroup1Row, systemConfig, category.id));
    }
  }, [isFastBot, selectedGroup1Row, activeGroup1Slot, systemConfig]);

  const handleOpenGroup1Row = (row) => {
    setSelectedP(row.participationId);
    setActiveGroup1Slot(getDefaultFastBotSlotKey(row, systemConfig, category.id));
  };

  const onSaveGroup1Score = (participationId, slotKey, scoreValue, insp, rawData) => {
    setScores(prev => {
      const existingScore = prev.find(score => score.pId === participationId && score.slotKey === slotKey);
      if (existingScore) {
        return prev.map(score => score.id === existingScore.id ? {
          ...score,
          score: scoreValue,
          inspectionData: insp,
          rawInput: rawData,
          status: 'VALID',
          proposedScore: undefined,
          proposedInspection: undefined,
          proposedRawInput: undefined,
        } : score);
      }
      return [...prev, { id: Date.now() + Math.random(), pId: participationId, slotKey, score: scoreValue, inspectionData: insp, rawInput: rawData, status: 'VALID' }];
    });
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };

  const onGroup1EditRequest = (scoreId, newScore, newInsp, newRaw) => {
    setScores(prev => prev.map(score => score.id === scoreId ? {
      ...score,
      proposedScore: newScore,
      proposedInspection: newInsp,
      proposedRawInput: newRaw,
      status: 'PENDING',
    } : score));
  };

  if (activeParticipations.length === 0) {
    return (
      <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-3xl mb-3">🏙️</p>
        <p className="text-ink-600 font-bold text-sm mb-1">{t(lang, 'noTeamsCheckedIn')}</p>
        <p className="text-ink-400 text-xs">{lang === 'ar' ? 'سجّل حضور الفرق أولاً من تبويب تسجيل الحضور' : 'Check in teams first from the Check-In tab'}</p>
      </div>
    );
  }

  const inCategoryTeamIds = new Set(participations.filter(p => p.categoryId === category.id).map(p => p.teamId));
  const teamsForCategory = (allTeams || teams).filter(tm => !category.levels || category.levels.includes(tm.division));
  const esMsAddPool = teamsForCategory.filter(tm => !inCategoryTeamIds.has(tm.id) && ['ES','MS'].includes(tm.division));
  const hsUsAddPool = teamsForCategory.filter(tm => !inCategoryTeamIds.has(tm.id) && ['HS','US'].includes(tm.division));
  const customGroupAddPool = (g) => (allTeams || teams).filter(tm => !g.teamIds.includes(tm.id));

  if (isFastBot) {
    // Sort: best (lowest) time first; teams with no score go to the bottom.
    // Tie-break alphabetically by team name.
    const sortFastBotRows = (rows) => [...rows].sort((a, b) => {
      const aVal = a.bestOfficialScore == null ? Infinity : Number(a.bestOfficialScore);
      const bVal = b.bestOfficialScore == null ? Infinity : Number(b.bestOfficialScore);
      if (aVal !== bVal) return aVal - bVal;
      return (a.teamName || '').localeCompare(b.teamName || '');
    });
    const esMsRows = sortFastBotRows(visibleFastBotRows.filter(row => ['ES', 'MS'].includes(row.division)));
    const hsUsRows = sortFastBotRows(visibleFastBotRows.filter(row => ['HS', 'US'].includes(row.division)));
    const customGroupCards = customGroups.map(g => {
      const rows = sortFastBotRows(visibleFastBotRows.filter(row => g.teamIds.includes(row.teamId)));
      // Decide which slot keys to use — if all rows are HS/US use that schedule.
      const slotKeys = rows.length > 0 && rows.every(r => ['HS','US'].includes(r.division)) ? hsUsSlotKeys : esMsSlotKeys;
      return { id: g.id, name: g.name, rows, slotKeys };
    });

    return (
      <div className="space-y-5">
        {isAdmin && removeParticipation && addParticipation && (
          <CategoryRosterAdmin
            category={category}
            participations={participations}
            teams={teams}
            allTeams={allTeams}
            removeParticipation={removeParticipation}
            addParticipation={addParticipation}
            lang={lang}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
          </div>
          <CustomSelect value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">{t(lang, 'allLevelsOption')}</option>
            {category.levels.map(l => <option key={l} value={l}>{l}</option>)}
          </CustomSelect>
        </div>

        {selectedFastBotRow ? (
          <FastBotDetailView
            row={selectedFastBotRow}
            activeSlotKey={activeFastBotSlot}
            onSlotChange={setActiveFastBotSlot}
            onBack={() => {
              setSelectedFastBotPId('');
              setActiveFastBotSlot('');
            }}
            onSaveScore={(scoreValue, insp, rawData) => onSaveFastBotScore(selectedFastBotRow.participationId, activeFastBotSlot, scoreValue, insp, rawData)}
            onEditRequest={onFastBotEditRequest}
            systemConfig={systemConfig}
            lang={lang}
            activeSlotKeys={selectedFastBotRow.divisionGroup === 'hs_us' ? hsUsSlotKeys : esMsSlotKeys}
            categoryId={category.id}
          />
        ) : (
          <div className="space-y-4">
            <CollapsibleCard title={t(lang, 'fastbotEsMsTable')} badge={esMsRows.length} badgeColor="bg-brand-500">
              <FastBotScheduleTable title={t(lang, 'fastbotEsMsTable')} rows={esMsRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={esMsSlotKeys} editable={isAdmin && !!removeParticipation} onRemoveRow={(row) => removeParticipation?.(row.participationId)} addPool={isAdmin && addParticipation ? esMsAddPool : null} onAddTeam={(teamId) => addParticipation?.({ teamId, categoryId: category.id })} />
            </CollapsibleCard>
            <CollapsibleCard title={t(lang, 'fastbotHsUsTable')} badge={hsUsRows.length} badgeColor="bg-brand-500">
              <FastBotScheduleTable title={t(lang, 'fastbotHsUsTable')} rows={hsUsRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={hsUsSlotKeys} editable={isAdmin && !!removeParticipation} onRemoveRow={(row) => removeParticipation?.(row.participationId)} addPool={isAdmin && addParticipation ? hsUsAddPool : null} onAddTeam={(teamId) => addParticipation?.({ teamId, categoryId: category.id })} />
            </CollapsibleCard>
            {customGroupCards.map(({ id, name, rows, slotKeys }) => (
              <CollapsibleCard key={id} title={`${category.name} — ${name}`} badge={rows.length} badgeColor="bg-saudi-500">
                <FastBotScheduleTable title={name} rows={rows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={slotKeys} editable={isAdmin && !!updateCustomGroup} onRemoveRow={(row) => {
                  const grp = customGroups.find(g => g.id === id);
                  if (grp) updateCustomGroup?.(id, { teamIds: grp.teamIds.filter(tid => tid !== row.teamId) });
                }} addPool={isAdmin && updateCustomGroup ? customGroupAddPool(customGroups.find(g => g.id === id) || { teamIds: [] }) : null} onAddTeam={(teamId) => {
                  const grp = customGroups.find(g => g.id === id);
                  if (grp && !grp.teamIds.includes(teamId)) updateCustomGroup?.(id, { teamIds: [...grp.teamIds, teamId] });
                }} />
              </CollapsibleCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  // LineFollowing standings: best (highest points) first; no-score → bottom; alphabetical tiebreak.
  // (LineFollowing is points-based, max 400. Higher = better, NOT time.)
  const sortGroup1Rows = (rows) => {
    if (category.id !== 'c1_linefollow') return rows;
    return [...rows].sort((a, b) => {
      const aVal = a.bestOfficialScore == null ? -Infinity : Number(a.bestOfficialScore);
      const bVal = b.bestOfficialScore == null ? -Infinity : Number(b.bestOfficialScore);
      if (aVal !== bVal) return bVal - aVal; // descending
      return (a.teamName || '').localeCompare(b.teamName || '');
    });
  };
  const esMsGroup1Rows = sortGroup1Rows(visibleGroup1Rows.filter(row => ['ES', 'MS'].includes(row.division)));
  const hsUsGroup1Rows = sortGroup1Rows(visibleGroup1Rows.filter(row => ['HS', 'US'].includes(row.division)));

  // Per-category bucket override (e.g. a-Maze-ing: ES alone + MS alone).
  const group1Buckets = (category.id === 'c1_amazeing')
    ? [
        { key: 'ES', divs: ['ES'], rows: sortGroup1Rows(visibleGroup1Rows.filter(r => r.division === 'ES')), slotKeys: esMsSlotKeys },
        { key: 'MS', divs: ['MS'], rows: sortGroup1Rows(visibleGroup1Rows.filter(r => r.division === 'MS')), slotKeys: esMsSlotKeys },
      ]
    : [
        { key: 'ES / MS', divs: ['ES', 'MS'], rows: esMsGroup1Rows, slotKeys: esMsSlotKeys },
        { key: 'HS / US', divs: ['HS', 'US'], rows: hsUsGroup1Rows, slotKeys: hsUsSlotKeys },
      ];

  const customGroup1Buckets = customGroups.map(g => {
    const rows = sortGroup1Rows(visibleGroup1Rows.filter(row => g.teamIds.includes(row.teamId)));
    const slotKeys = rows.length > 0 && rows.every(r => ['HS','US'].includes(r.division)) ? hsUsSlotKeys : esMsSlotKeys;
    return { id: g.id, key: g.name, custom: true, rows, slotKeys };
  });

  return (
    <div className="space-y-5">
      {isAdmin && removeParticipation && addParticipation && (
        <CategoryRosterAdmin
          category={category}
          participations={participations}
          teams={teams}
          allTeams={allTeams}
          removeParticipation={removeParticipation}
          addParticipation={addParticipation}
          lang={lang}
          customGroups={customGroups}
          addCustomGroup={addCustomGroup}
          updateCustomGroup={updateCustomGroup}
          deleteCustomGroup={deleteCustomGroup}
        />
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
        </div>
        <CustomSelect value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option value="">{t(lang, 'allLevelsOption')}</option>
          {category.levels.map(l => <option key={l} value={l}>{l}</option>)}
        </CustomSelect>
      </div>

      {selectedGroup1Row ? (
        <Group1DetailView
          row={selectedGroup1Row}
          category={category}
          activeSlotKey={activeGroup1Slot}
          onSlotChange={setActiveGroup1Slot}
          onBack={() => { setSelectedP(''); setActiveGroup1Slot(''); }}
          onSaveScore={(scoreValue, insp, rawData) => onSaveGroup1Score(selectedGroup1Row.participationId, activeGroup1Slot, scoreValue, insp, rawData)}
          onEditRequest={onGroup1EditRequest}
          systemConfig={systemConfig}
          lang={lang}
          activeSlotKeys={selectedGroup1Row.divisionGroup === 'hs_us' ? hsUsSlotKeys : esMsSlotKeys}
        />
      ) : (
        <div className="space-y-4">
          {group1Buckets.map(({ key, divs, rows, slotKeys }) => (
            <CollapsibleCard
              key={key}
              title={`${category.name} — ${key}`}
              badge={rows.length}
              badgeColor="bg-brand-500"
            >
              <FastBotScheduleTable title="" rows={rows} onSelectRow={handleOpenGroup1Row} lang={lang} showHeader={false} scoreFormatter={formatGroup1Score} activeSlotKeys={slotKeys} editable={isAdmin && !!removeParticipation} onRemoveRow={(row) => removeParticipation?.(row.participationId)} addPool={isAdmin && addParticipation ? teamsForCategory.filter(tm => !inCategoryTeamIds.has(tm.id) && divs.includes(tm.division)) : null} onAddTeam={(teamId) => addParticipation?.({ teamId, categoryId: category.id })} />
            </CollapsibleCard>
          ))}
          {customGroup1Buckets.map(({ id, key, rows, slotKeys }) => (
            <CollapsibleCard
              key={`custom_${id}`}
              title={`${category.name} — ${key}`}
              badge={rows.length}
              badgeColor="bg-saudi-500"
            >
              <FastBotScheduleTable title="" rows={rows} onSelectRow={handleOpenGroup1Row} lang={lang} showHeader={false} scoreFormatter={formatGroup1Score} activeSlotKeys={slotKeys} editable={isAdmin && !!updateCustomGroup} onRemoveRow={(row) => {
                const grp = customGroups.find(g => g.id === id);
                if (grp) updateCustomGroup?.(id, { teamIds: grp.teamIds.filter(tid => tid !== row.teamId) });
              }} addPool={isAdmin && updateCustomGroup ? customGroupAddPool(customGroups.find(g => g.id === id) || { teamIds: [] }) : null} onAddTeam={(teamId) => {
                const grp = customGroups.find(g => g.id === id);
                if (grp && !grp.teamIds.includes(teamId)) updateCustomGroup?.(id, { teamIds: [...grp.teamIds, teamId] });
              }} />
            </CollapsibleCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Group2Workflow ──────────────────────────────────────────────────────────

function Group2Workflow({ category, matches, scores, setScores, lang, showToast }) {
  const [selectedMatchId, setSelectedMatchId] = useState('');
  useEffect(() => setSelectedMatchId(''), [category.id]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);
  const existingScores = scores.filter(s => s.pId === selectedMatchId);

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-medium">{t(lang, 'waitingSchedule')}</p>
      </div>
    );
  }

  const onSaveScore = (s, inspA, inspB, rawData) => {
    setScores(prev => [...prev, { id: Date.now(), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
    setSelectedMatchId('');
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };
  const onEditRequest = (id, newScore, newInspA, newInspB, newRaw) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, proposedInspectionA: newInspA, proposedInspectionB: newInspB, proposedRawInput: newRaw, status: 'PENDING' } : s));
    setSelectedMatchId('');
  };

  return (
    <div className="space-y-5">
      <CustomSelect value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
        <option value="">{t(lang, 'selectMatch')}</option>
        {matches.map(m => <option key={m.id} value={m.id}>[{m.id}] — {m.title}</option>)}
      </CustomSelect>

      {selectedMatch && (
        <div key={`grp2_${selectedMatchId}`} className="space-y-4 pt-4 border-t border-ink-200">
          {existingScores.map((scoreObj, index) => {
            const props = { key: scoreObj.id, title: `${t(lang, 'matchAttempt')} ${index + 1}: ${selectedMatch.title}`, match: selectedMatch, categoryId: category.id, attemptNumber: index + 1, initialScoreObj: scoreObj, onEditRequest, lang };
            if (category.id === 'c2_sumo') return <SumoMatchCard {...props} />;
            if (category.id === 'c2_soccer') return <SoccerBotMatchCard {...props} />;
            return null;
          })}
          {(() => {
            const props = { title: `${t(lang, 'matchAttempt')} ${existingScores.length + 1}: ${selectedMatch.title}`, match: selectedMatch, categoryId: category.id, attemptNumber: existingScores.length + 1, onSaveScore, lang };
            if (category.id === 'c2_sumo') return <SumoMatchCard key="new" {...props} />;
            if (category.id === 'c2_soccer') return <SoccerBotMatchCard key="new" {...props} />;
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Sumo Round-Robin helpers ────────────────────────────────────────────────

function minutesToTimeString(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function buildTimeMap(matchesByRegion, regions) {
  const map = {};
  let minutes = 11 * 60; // start 11:00 AM
  regions.forEach(region => {
    (matchesByRegion[region] || []).forEach(match => {
      map[match.id] = minutesToTimeString(minutes);
      minutes += 15;
    });
  });
  return map;
}

function RoundRobinStandings({ matches, scores, lang, accent = 'orange', scoringMode = 'soccer' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const isSumo = scoringMode === 'sumo';
  const rows = useMemo(() => {
    const stats = new Map();
    const ensure = (id, name) => {
      if (!id) return null;
      if (!stats.has(id)) {
        stats.set(id, { teamId: id, teamName: name || id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
      }
      const row = stats.get(id);
      if (!row.teamName && name) row.teamName = name;
      return row;
    };
    matches.forEach(m => {
      const sc = scores.find(s => s.pId === m.id && s.status === 'VALID');
      const a = ensure(m.teamAId, m.teamA);
      const b = ensure(m.teamBId, m.teamB);
      if (!sc || !a || !b) return;
      const parts = String(sc.score || '').split('-').map(p => parseInt(p.trim(), 10));
      const sa = Number.isFinite(parts[0]) ? parts[0] : 0;
      const sb = Number.isFinite(parts[1]) ? parts[1] : 0;
      a.played += 1; b.played += 1;
      a.gf += sa; a.ga += sb; b.gf += sb; b.ga += sa;
      if (sa > sb) { a.wins += 1; b.losses += 1; }
      else if (sa < sb) { b.wins += 1; a.losses += 1; }
      else { a.draws += 1; b.draws += 1; }
    });
    return [...stats.values()]
      .map(r => ({
        ...r,
        // Sumo: 1 point per win (per round). Soccer: 3-1-0 standard.
        points: isSumo ? r.wins : (r.wins * 3 + r.draws),
        gd: r.gf - r.ga,
      }))
      .sort((x, y) => {
        if (isSumo) {
          // Sumo tiebreaker: more wins → alphabetical
          return y.points - x.points
            || (x.teamName || '').localeCompare(y.teamName || '');
        }
        return y.points - x.points
          || y.gd - x.gd
          || y.gf - x.gf
          || (x.teamName || '').localeCompare(y.teamName || '');
      });
  }, [matches, scores, isSumo]);

  if (rows.length === 0) return null;
  const accentChipSolid = accent === 'teal'
    ? 'bg-teal-600 text-white'
    : 'bg-saudi-500 text-white';
  const accentSoft = accent === 'teal'
    ? 'bg-teal-50 text-teal-700 border-teal-200'
    : 'bg-saudi-50 text-saudi-700 border-saudi-200';
  const rankBadge = (i) => {
    if (i === 0) return { label: '🥇', cls: 'bg-yellow-400 text-yellow-900' };
    if (i === 1) return { label: '🥈', cls: 'bg-ink-200 text-ink-700' };
    if (i === 2) return { label: '🥉', cls: 'bg-orange-300 text-orange-900' };
    return { label: `${i + 1}`, cls: 'bg-ink-100 text-ink-600' };
  };

  return (
    <div className="mt-3 rounded-xl border border-ink-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2.5 bg-gradient-to-r from-navy-700 to-navy-500 text-white flex items-center justify-between gap-2">
        <h5 className="text-[11px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
          🏅 {tx('Standings', 'الترتيب')}
        </h5>
        <span className="text-[9px] sm:text-[10px] font-bold text-white/60 truncate">{tx('Best teams by points', 'الأفضل حسب النقاط')}</span>
      </div>

      {/* Mobile view: compact cards */}
      <ul className="sm:hidden divide-y divide-ink-100">
        {rows.map((r, i) => {
          const badge = rankBadge(i);
          return (
            <li key={r.teamId} className={`px-3 py-2.5 flex items-center gap-2.5 ${i < 3 ? 'bg-saudi-50/30' : ''}`}>
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${badge.cls}`}>
                {badge.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-ink-800 truncate">{r.teamName}</p>
                <p className="text-[10px] font-semibold text-ink-500 mt-0.5">
                  <span className="text-saudi-700">{r.wins}{tx('W', 'ف')}</span>
                  <span className="text-ink-400"> · </span>
                  <span>{r.draws}{tx('D', 'ت')}</span>
                  <span className="text-ink-400"> · </span>
                  <span className="text-rose-600">{r.losses}{tx('L', 'خ')}</span>
                  <span className="text-ink-300 mx-1">|</span>
                  <span>{tx('GD', 'الفارق')} {r.gd > 0 ? `+${r.gd}` : r.gd}</span>
                </p>
              </div>
              <span className={`flex-shrink-0 inline-flex flex-col items-center justify-center min-w-[44px] px-2 py-1 rounded-lg text-[10px] font-black uppercase ${accentChipSolid}`}>
                <span className="text-base leading-none">{r.points}</span>
                <span className="text-[8px] opacity-80 mt-0.5">{tx('pts', 'نقطة')}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* Desktop view: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-ink-50 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2 font-black w-10 text-center">#</th>
              <th className="px-3 py-2 font-black">{tx('Team', 'الفريق')}</th>
              <th className="px-2 py-2 font-black text-center" title={tx('Played', 'لعب')}>{tx('P', 'لعب')}</th>
              <th className="px-2 py-2 font-black text-center" title={tx('Wins', 'فوز')}>{tx('W', 'ف')}</th>
              <th className="px-2 py-2 font-black text-center" title={tx('Draws', 'تعادل')}>{tx('D', 'ت')}</th>
              <th className="px-2 py-2 font-black text-center" title={tx('Losses', 'خسارة')}>{tx('L', 'خ')}</th>
              <th className="px-2 py-2 font-black text-center" title={tx('Goal difference', 'فارق الأهداف')}>{tx('GD', '±')}</th>
              <th className="px-3 py-2 font-black text-center">{tx('Pts', 'النقاط')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r, i) => {
              const badge = rankBadge(i);
              return (
                <tr key={r.teamId} className={`${i < 3 ? 'bg-saudi-50/30' : ''} hover:bg-ink-50/60`}>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-ink-800 truncate max-w-[200px]">{r.teamName}</td>
                  <td className="px-2 py-2 text-center text-ink-600">{r.played}</td>
                  <td className="px-2 py-2 text-center text-saudi-700 font-black">{r.wins}</td>
                  <td className="px-2 py-2 text-center text-ink-600">{r.draws}</td>
                  <td className="px-2 py-2 text-center text-rose-600">{r.losses}</td>
                  <td className="px-2 py-2 text-center font-bold text-ink-700">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black ${accentSoft}`}>{r.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoundRobinBucketsView({ categoryLabel, matchesByBucket, timeMap, scores, onSelectMatch, lang, accent = 'orange', buckets, scoringMode = 'soccer', showGoalsBesideTeams = false }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const accentChip = accent === 'teal'
    ? 'bg-teal-50 border-teal-200 text-teal-700'
    : 'bg-saudi-50 border-saudi-200 text-saudi-700';
  const accentBadge = accent === 'teal' ? 'bg-teal-600' : 'bg-saudi-500';

  return (
    <div className="space-y-4">
      {buckets.map(({ key: bucketKey }) => {
        const regionMap = matchesByBucket[bucketKey] || {};
        const regions = Object.keys(regionMap).sort();
        const allBucketMatches = regions.flatMap(r => regionMap[r] || []);
        const total = allBucketMatches.length;
        const played = allBucketMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;
        return (
          <CollapsibleCard
            key={bucketKey}
            title={`${categoryLabel} ${tx('Schedule', 'جدول')} — ${bucketKey}`}
            badge={total > 0 ? `${played}/${total}` : tx('No teams', 'لا فرق')}
            badgeColor={accentBadge}
          >
            {total === 0 ? (
              <div className="px-4 py-8 text-center text-ink-400 text-sm">{tx('No matchable teams in this group.', 'لا توجد فرق كافية في هذه الفئة.')}</div>
            ) : (
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <table className="min-w-[720px] sm:min-w-[920px] w-full text-xs sm:text-sm">
                  <thead className="bg-navy-700 text-white">
                    <tr className="text-left">
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold w-12 text-center">#</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Time', 'الوقت')}</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Region', 'المنطقة')}</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team A', 'الفريق أ')}</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center w-10">{tx('vs', 'ضد')}</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team B', 'الفريق ب')}</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center">{tx('Score', 'النتيجة')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 bg-white">
                    {regions.map(region => {
                      const list = regionMap[region] || [];
                      if (list.length === 0) return null;
                      return (
                        <Fragment key={region}>
                          <tr className="bg-ink-50/80">
                            <td colSpan={7} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink-500">
                              {tx('Region', 'منطقة')}: {region} · {list.length} {tx('matches', 'مباريات')}
                            </td>
                          </tr>
                          {list.map((m, i) => {
                            const sc = scores.find(s => s.pId === m.id && s.status === 'VALID');
                            let goalsA = null;
                            let goalsB = null;
                            if (showGoalsBesideTeams && sc) {
                              const parts = String(sc.score || '').split('-').map(p => parseInt(p.trim(), 10));
                              if (Number.isFinite(parts[0])) goalsA = parts[0];
                              if (Number.isFinite(parts[1])) goalsB = parts[1];
                            }
                            return (
                              <tr
                                key={m.id}
                                tabIndex={0}
                                onClick={() => onSelectMatch?.(m.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectMatch?.(m.id);
                                  }
                                }}
                                className="cursor-pointer hover:bg-brand-50/60 focus:bg-brand-50 focus:outline-none transition-colors"
                              >
                                <td className="px-3 py-2.5 text-center font-mono text-[11px] text-ink-500">{i + 1}</td>
                                <td className="px-3 py-2.5 font-mono text-[11px] text-ink-500 whitespace-nowrap">{timeMap?.[m.id] || '--'}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${accentChip}`}>{region}</span>
                                </td>
                                <td className="px-3 py-2.5 font-bold text-ink-700 max-w-[180px]">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="truncate">{m.teamA}</span>
                                    {goalsA != null && (
                                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black" title={tx('Goals', 'الأهداف')}>⚽{goalsA}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center text-[10px] font-black text-ink-400">vs</td>
                                <td className="px-3 py-2.5 font-bold text-ink-700 max-w-[180px]">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="truncate">{m.teamB}</span>
                                    {goalsB != null && (
                                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black" title={tx('Goals', 'الأهداف')}>⚽{goalsB}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-black">
                                  {sc ? (
                                    <span className="inline-flex items-center rounded-full bg-saudi-50 border border-saudi-200 px-2.5 py-1 text-[10px] font-black text-saudi-700">{sc.score}</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-ink-50 border border-ink-200 px-2.5 py-1 text-[10px] font-bold text-ink-400">{tx('Pending', 'لم تُلعب')}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-3 pb-3 pt-1 bg-white">
                  <RoundRobinStandings matches={allBucketMatches} scores={scores} lang={lang} accent={accent} scoringMode={scoringMode} />
                </div>
              </div>
            )}
          </CollapsibleCard>
        );
      })}
    </div>
  );
}

// ─── BracketView (shared by Sumo + Soccer) ───────────────────────────────────

function BracketModeToggle({ mode, setMode, lang, hasBracket }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const Btn = ({ value, label, hint }) => (
    <button
      onClick={() => setMode(value)}
      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
        mode === value
          ? 'bg-gradient-to-r from-navy-700 to-navy-500 text-white border-navy-700 shadow-md'
          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
      }`}
    >
      <div>{label}</div>
      {hint && <div className={`text-[9px] font-bold mt-0.5 ${mode === value ? 'text-white/60' : 'text-ink-400'}`}>{hint}</div>}
    </button>
  );
  return (
    <div className="flex items-center gap-2 p-1.5 bg-ink-50 rounded-2xl border border-ink-200">
      <Btn value="bracket" label={tx('🏆 Knockout Bracket', '🏆 الإقصائيات')} hint={hasBracket ? '' : tx('No bracket yet', 'لم يُولّد بعد')} />
      <Btn value="roundrobin" label={tx('🌀 Round-Robin', '🌀 الدوري')} hint={tx('Grouped by ES/MS · HS/US', 'مقسّم ES/MS · HS/US')} />
    </div>
  );
}

function BracketMatchTile({ match, onSelect, lang, accent = 'orange' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const winnerSide = match._winnerSide;
  const score = match._scoreObj;
  const ready = match.teamA && match.teamB && !match.isBye;
  const accentBorder = accent === 'teal' ? 'border-teal-400' : 'border-saudi-400';
  const accentBg = accent === 'teal' ? 'bg-teal-50' : 'bg-saudi-50';
  const accentText = accent === 'teal' ? 'text-teal-700' : 'text-saudi-700';

  const TeamRow = ({ name, side, isBye }) => {
    const isWinner = winnerSide === side;
    const empty = !name;
    return (
      <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-bold ${
        isWinner ? `${accentBg} ${accentText} border ${accentBorder}` :
        empty ? 'bg-ink-50 text-ink-300' :
        isBye ? 'bg-ink-100 text-ink-400 italic' :
        'bg-white text-ink-700 border border-ink-200'
      }`}>
        <span className="truncate">{empty ? tx('TBD', 'لم يُحدد') : name}</span>
        {isWinner && <span className="text-[10px]">✓</span>}
      </div>
    );
  };

  return (
    <button
      onClick={() => ready && !match.isBye && onSelect?.(match.id)}
      disabled={!ready || match.isBye}
      className={`w-full text-left rounded-xl p-2 space-y-1 transition-all border ${
        ready ? `bg-white border-ink-200 hover:shadow-sm cursor-pointer` :
        'bg-ink-50/50 border-ink-100 cursor-not-allowed opacity-70'
      }`}
    >
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-ink-400 px-1">
        <span>{match.round} #{match.matchIndex + 1}</span>
        {match.isBye && <span className="text-saudi-600">{tx('BYE', 'تأهل تلقائي')}</span>}
        {score && <span className={accentText}>{score.score}</span>}
      </div>
      <TeamRow name={match.teamA} side="A" />
      <TeamRow name={match.teamB} side="B" isBye={match.isBye} />
    </button>
  );
}

function BracketView({ matches, scores, onSelectMatch, lang, accent = 'orange', categoryLabel = '', editable = false, editingMatchId = null, onRequestEdit, onSaveEdit, onCancelEdit, teamPool = [] }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const resolved = useMemo(() => resolveBracket(matches, scores), [matches, scores]);
  const byDivision = useMemo(() => groupBracketByDivision(resolved), [resolved]);
  const divisions = Object.keys(byDivision).sort();

  if (resolved.length === 0) {
    return (
      <div className="text-center py-12 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-bold text-sm">{tx('No bracket has been generated yet.', 'لم يتم توليد جدول الإقصائيات بعد.')}</p>
        <p className="text-ink-400 text-xs mt-1">{tx('Finish the Round-Robin matches first — winners advance here automatically.', 'أكمل مباريات الدوري أولاً، الفائزون يتأهلون هنا تلقائياً.')}</p>
      </div>
    );
  }

  const accentChip = accent === 'teal'
    ? 'bg-teal-50 border-teal-200 text-teal-700'
    : 'bg-saudi-50 border-saudi-200 text-saudi-700';
  const accentHeaderBadge = accent === 'teal' ? 'bg-teal-600' : 'bg-saudi-500';

  return (
    <div className="space-y-4">
      {divisions.map(div => {
        const divMatches = byDivision[div];
        const rounds = groupByRound(divMatches);
        const final = rounds[rounds.length - 1]?.matches?.[0];
        const champion = final?._winnerTeamName || '';
        const playableCount = divMatches.filter(m => !m.isBye).length;
        const playedCount = divMatches.filter(m => !m.isBye && m._winnerSide).length;
        return (
          <CollapsibleCard
            key={div}
            title={`${categoryLabel ? `${categoryLabel} ` : ''}${tx('Bracket', 'جدول الإقصائيات')} — ${div}`}
            badge={champion ? `🏆 ${champion}` : `${playedCount}/${playableCount}`}
            badgeColor={champion ? 'bg-saudi-600' : accentHeaderBadge}
          >
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="min-w-[720px] sm:min-w-[920px] w-full text-xs sm:text-sm">
                <thead className="bg-navy-700 text-white">
                  <tr className="text-left">
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold w-12 text-center">#</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Round', 'الجولة')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team A', 'الفريق أ')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center w-10">{tx('vs', 'ضد')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team B', 'الفريق ب')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center">{tx('Score', 'النتيجة')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Winner', 'الفائز')}</th>
                    {editable && <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center w-16">{tx('Edit', 'تعديل')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {rounds.map(({ roundIndex, round, matches: rMatches }) => (
                    <Fragment key={roundIndex}>
                      <tr className="bg-ink-50/80">
                        <td colSpan={editable ? 8 : 7} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink-500">
                          {round}
                        </td>
                      </tr>
                      {rMatches.map((m, i) => {
                        const ready = m.teamA && m.teamB && !m.isBye;
                        const winnerName = m._winnerTeamName || '';
                        const isWinnerA = m._winnerSide === 'A';
                        const isWinnerB = m._winnerSide === 'B';
                        const isEditing = editingMatchId === m.id;
                        if (isEditing && editable) {
                          return (
                            <BracketEditorRow
                              key={m.id}
                              match={m}
                              teamPool={teamPool}
                              onSave={(patch) => onSaveEdit?.(m.id, patch)}
                              onCancel={() => onCancelEdit?.()}
                              lang={lang}
                            />
                          );
                        }
                        return (
                          <tr
                            key={m.id}
                            tabIndex={ready ? 0 : -1}
                            onClick={() => ready && onSelectMatch?.(m.id)}
                            onKeyDown={(e) => {
                              if (ready && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                onSelectMatch?.(m.id);
                              }
                            }}
                            className={`transition-colors ${
                              ready ? 'cursor-pointer hover:bg-brand-50/60 focus:bg-brand-50 focus:outline-none' : 'opacity-70 cursor-not-allowed'
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center font-mono text-[11px] text-ink-500">{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${accentChip}`}>{round}</span>
                            </td>
                            <td className={`px-3 py-2.5 font-bold ${isWinnerA ? 'text-saudi-700' : 'text-ink-700'} ${!m.teamA ? 'text-ink-300 italic font-medium' : ''}`}>
                              {m.teamA || tx('TBD', 'لم يُحدد')}
                              {isWinnerA && <span className="ml-1 text-saudi-600">✓</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center text-[10px] font-black text-ink-400">vs</td>
                            <td className={`px-3 py-2.5 font-bold ${isWinnerB ? 'text-saudi-700' : 'text-ink-700'} ${!m.teamB ? 'text-ink-300 italic font-medium' : ''} ${m.isBye ? 'italic text-ink-400' : ''}`}>
                              {m.teamB || tx('TBD', 'لم يُحدد')}
                              {isWinnerB && <span className="ml-1 text-saudi-600">✓</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center font-black text-ink-700">
                              {m._scoreObj?.score || (m.isBye ? tx('BYE', 'تأهل') : '--')}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-saudi-700 truncate max-w-[140px]">
                              {winnerName || (m.isBye ? (m.teamA || '--') : '--')}
                            </td>
                            {editable && (
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onRequestEdit?.(m.id); }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600 hover:text-ink-900 bg-white hover:bg-ink-50 border border-ink-200 px-2 py-1 rounded-md transition-colors"
                                >
                                  <Pencil size={10} /> {tx('Edit', 'تعديل')}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {champion && (
              <div className="px-4 py-3 bg-saudi-50 border-t border-saudi-200 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-saudi-600">{tx('Champion', 'البطل')}</p>
                <p className="text-base font-black text-saudi-700 mt-0.5">🏆 {champion}</p>
              </div>
            )}
          </CollapsibleCard>
        );
      })}
    </div>
  );
}

// ─── CategoryRosterAdmin (admin-only manage teams in a category) ─────────────
// Lets the admin remove a team from a category's match table or add an
// existing team that's not yet participating. Compact panel rendered above
// each Group-2/3 workflow's tables when role==='admin'.

function CategoryRosterAdmin({ category, participations, teams, allTeams, removeParticipation, addParticipation, lang, customGroups = [], addCustomGroup, updateCustomGroup, deleteCustomGroup }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedTeamId, setPickedTeamId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [groupTeamPickerId, setGroupTeamPickerId] = useState(null);
  const [groupTeamPicked, setGroupTeamPicked] = useState('');

  // Teams currently in this category
  const myParts = participations.filter(p => p.categoryId === category.id);
  const myRows = myParts
    .map(p => {
      const team = (allTeams || teams).find(t => t.id === p.teamId);
      return team ? { participationId: p.id, team } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.team.region || '').localeCompare(b.team.region || '') || a.team.name.localeCompare(b.team.name));

  // Eligible to add: not already in category, division allowed (if category specifies levels)
  const inIds = new Set(myParts.map(p => p.teamId));
  const pool = (allTeams || teams).filter(t => {
    if (inIds.has(t.id)) return false;
    if (category.levels && !category.levels.includes(t.division)) return false;
    return true;
  }).sort((a, b) => (a.region || '').localeCompare(b.region || '') || a.name.localeCompare(b.name));

  const handleRemove = (participationId, teamName) => {
    const ok = window.confirm(lang === 'ar'
      ? `إزالة "${teamName}" من جدول ${category.name}؟ ستُحذف نتائجه في هذه الفئة فقط.`
      : `Remove "${teamName}" from ${category.name}? Only this category's scores will be removed.`);
    if (ok) removeParticipation(participationId);
  };

  const handleAdd = () => {
    if (!pickedTeamId) return;
    addParticipation({ teamId: pickedTeamId, categoryId: category.id });
    setPickedTeamId('');
    setPickerOpen(false);
  };

  return (
    <CollapsibleCard
      title={<>👮 {tx('Manage Teams in this Category', 'إدارة فرق هذه الفئة')}</>}
      badge={`${myRows.length} ${tx('team(s)', 'فريق')}`}
      badgeColor="bg-brand-600"
    >
      <div className="p-4 space-y-3 bg-ink-50">
        <p className="text-[11px] text-ink-500 leading-relaxed">
          {tx(
            'Add or remove teams here to update both the round-robin schedule and the bracket inputs. Removing a team also clears its scores in this category.',
            'أضف أو أزل الفرق هنا لتحديث جدول الدوري ومدخلات الإقصائيات معاً. إزالة فريق يحذف نتائجه في هذه الفئة فقط.'
          )}
        </p>

        {/* Current teams as chips */}
        {myRows.length === 0 ? (
          <p className="text-xs text-ink-400 italic">{tx('No teams yet.', 'لا توجد فرق بعد.')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {myRows.map(({ participationId, team }) => (
              <span
                key={participationId}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-bold text-ink-700"
              >
                <span className="text-ink-400 font-mono text-[9px]">{team.region?.[0] || '—'}·{team.division}</span>
                <span>{team.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(participationId, team.name)}
                  className="ml-0.5 text-ink-300 hover:text-rose-600 transition-colors"
                  aria-label={tx('Remove', 'إزالة')}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add picker */}
        <div className="pt-2 border-t border-ink-200">
          {!pickerOpen ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-white border border-brand-200 hover:border-brand-400 px-3 py-1.5 rounded-lg"
            >
              <Plus size={12} /> {tx('Add team to this category', 'إضافة فريق إلى هذه الفئة')}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CustomSelect value={pickedTeamId} onChange={e => setPickedTeamId(e.target.value)}>
                <option value="">{tx('— pick a team —', '— اختر فريقاً —')}</option>
                {pool.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.region}/{t.division})
                  </option>
                ))}
              </CustomSelect>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!pickedTeamId}
                className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                <Plus size={12} /> {tx('Add', 'أضف')}
              </button>
              <button
                type="button"
                onClick={() => { setPickerOpen(false); setPickedTeamId(''); }}
                className="text-[11px] font-bold text-ink-500 hover:text-ink-700 px-2 py-1.5"
              >
                {tx('Cancel', 'إلغاء')}
              </button>
              {pool.length === 0 && (
                <p className="text-[11px] text-ink-400 italic">{tx('All eligible teams already added.', 'كل الفرق المؤهلة مُضافة مسبقاً.')}</p>
              )}
            </div>
          )}
        </div>

        {/* ─── Custom tables ─── */}
        {addCustomGroup && (
          <div className="pt-3 border-t border-ink-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                {tx('Custom Tables', 'جداول مخصّصة')}
              </h5>
              {!creatingGroup && (
                <button
                  type="button"
                  onClick={() => setCreatingGroup(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-brand-700 bg-white border border-brand-200 hover:border-brand-400 px-2 py-1 rounded-md"
                >
                  <Plus size={11} /> {tx('New table', 'جدول جديد')}
                </button>
              )}
            </div>

            {creatingGroup && (
              <div className="flex flex-wrap items-center gap-2 bg-white border border-ink-200 rounded-lg p-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder={tx('Table name (e.g. Demo Pool A)', 'اسم الجدول (مثلاً مجموعة أ)')}
                  className="flex-1 min-w-[180px] p-2 border-2 border-ink-200 rounded-lg text-xs font-medium text-ink-700 focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newGroupName.trim()) return;
                    addCustomGroup({ categoryId: category.id, name: newGroupName.trim(), teamIds: [] });
                    setNewGroupName('');
                    setCreatingGroup(false);
                  }}
                  disabled={!newGroupName.trim()}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={12} /> {tx('Create', 'إنشاء')}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatingGroup(false); setNewGroupName(''); }}
                  className="text-[11px] font-bold text-ink-500 hover:text-ink-700 px-2 py-1.5"
                >
                  {tx('Cancel', 'إلغاء')}
                </button>
              </div>
            )}

            {customGroups.length === 0 && !creatingGroup && (
              <p className="text-[11px] text-ink-400 italic">
                {tx('No custom tables yet. Use "New table" to split this category into named pools.', 'لا توجد جداول مخصصة. استخدم "جدول جديد" لتقسيم هذه الفئة إلى مجموعات مسماة.')}
              </p>
            )}

            {customGroups.map(g => {
              const groupTeams = g.teamIds
                .map(id => (allTeams || teams).find(t => t.id === id))
                .filter(Boolean);
              const inGroupIds = new Set(g.teamIds);
              const groupPool = (allTeams || teams).filter(t => !inGroupIds.has(t.id) && (!category.levels || category.levels.includes(t.division)));
              const isEditing = editingGroupId === g.id;
              const isPicking = groupTeamPickerId === g.id;
              return (
                <div key={g.id} className="bg-white border border-ink-200 rounded-lg p-2.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={groupNameDraft}
                          onChange={e => setGroupNameDraft(e.target.value)}
                          className="p-1.5 border-2 border-ink-200 rounded text-xs font-bold text-ink-700 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (groupNameDraft.trim()) updateCustomGroup(g.id, { name: groupNameDraft.trim() });
                            setEditingGroupId(null);
                          }}
                          className="text-saudi-700 hover:text-saudi-900"
                          aria-label={tx('Save', 'حفظ')}
                        >
                          <Save size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGroupId(null)}
                          className="text-ink-400 hover:text-ink-700"
                          aria-label={tx('Cancel', 'إلغاء')}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-ink-800">{g.name}</span>
                        <span className="text-[10px] font-bold text-ink-400">({groupTeams.length})</span>
                        <button
                          type="button"
                          onClick={() => { setEditingGroupId(g.id); setGroupNameDraft(g.name); }}
                          className="text-ink-400 hover:text-brand-600"
                          aria-label={tx('Rename', 'إعادة تسمية')}
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const ok = window.confirm(lang === 'ar' ? `حذف الجدول "${g.name}"؟` : `Delete table "${g.name}"?`);
                        if (ok) deleteCustomGroup(g.id);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-500 hover:text-rose-600 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <X size={10} /> {tx('Delete', 'حذف')}
                    </button>
                  </div>

                  {/* Team chips */}
                  <div className="flex flex-wrap gap-1">
                    {groupTeams.length === 0 ? (
                      <span className="text-[10px] text-ink-400 italic">{tx('No teams in this table.', 'لا توجد فرق في هذا الجدول.')}</span>
                    ) : groupTeams.map(team => (
                      <span
                        key={team.id}
                        className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[10px] font-bold text-ink-700"
                      >
                        <span className="text-ink-400 font-mono text-[9px]">{team.region?.[0] || '—'}·{team.division}</span>
                        <span>{team.name}</span>
                        <button
                          type="button"
                          onClick={() => updateCustomGroup(g.id, { teamIds: g.teamIds.filter(id => id !== team.id) })}
                          className="text-ink-300 hover:text-rose-600 transition-colors"
                          aria-label={tx('Remove from table', 'إزالة من الجدول')}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add team to this group */}
                  {isPicking ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-ink-100">
                      <CustomSelect value={groupTeamPicked} onChange={e => setGroupTeamPicked(e.target.value)}>
                        <option value="">{tx('— pick a team —', '— اختر فريقاً —')}</option>
                        {groupPool.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.region}/{t.division})</option>
                        ))}
                      </CustomSelect>
                      <button
                        type="button"
                        onClick={() => {
                          if (!groupTeamPicked) return;
                          updateCustomGroup(g.id, { teamIds: [...g.teamIds, groupTeamPicked] });
                          setGroupTeamPicked('');
                          setGroupTeamPickerId(null);
                        }}
                        disabled={!groupTeamPicked}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 px-2 py-1 rounded"
                      >
                        <Plus size={10} /> {tx('Add', 'أضف')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGroupTeamPickerId(null); setGroupTeamPicked(''); }}
                        className="text-[10px] font-bold text-ink-500 hover:text-ink-700"
                      >
                        {tx('Cancel', 'إلغاء')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setGroupTeamPickerId(g.id); setGroupTeamPicked(''); }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 rounded"
                    >
                      <Plus size={10} /> {tx('Add team to this table', 'إضافة فريق لهذا الجدول')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

// ─── BracketEditorRow (admin manual matchup) ─────────────────────────────────
// Inline editor for a single bracket match; lets admin pick teamA/teamB from
// the category's teams. Returns null when not in edit mode.

function BracketEditorRow({ match, teamPool, onSave, onCancel, lang }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const [aId, setAId] = useState(match.teamAId || '');
  const [bId, setBId] = useState(match.teamBId || '');

  const findTeam = (id) => teamPool.find(t => t.teamId === id || t.participationId === id);
  const handleSave = () => {
    const a = findTeam(aId);
    const b = findTeam(bId);
    onSave({
      teamA: a?.teamName || '',
      teamB: b?.teamName || '',
      teamAId: a?.teamId || '',
      teamBId: b?.teamId || '',
    });
  };

  return (
    <tr className="bg-saudi-50/50 border-y border-saudi-200">
      <td colSpan={8} className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-500 mr-1">
            {tx('Editing', 'تعديل')} {match.round} #{match.matchIndex + 1}:
          </span>
          <CustomSelect value={aId} onChange={e => setAId(e.target.value)}>
            <option value="">{tx('— Team A —', '— الفريق أ —')}</option>
            {teamPool.map(t => (
              <option key={`a-${t.teamId}`} value={t.teamId}>{t.teamName} ({t.region}/{t.division})</option>
            ))}
          </CustomSelect>
          <span className="text-[10px] font-black text-ink-400">vs</span>
          <CustomSelect value={bId} onChange={e => setBId(e.target.value)}>
            <option value="">{tx('— Team B —', '— الفريق ب —')}</option>
            {teamPool.map(t => (
              <option key={`b-${t.teamId}`} value={t.teamId}>{t.teamName} ({t.region}/{t.division})</option>
            ))}
          </CustomSelect>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-saudi-600 hover:bg-saudi-700 px-3 py-1.5 rounded-lg"
          >
            <Save size={12} /> {tx('Save', 'حفظ')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] font-bold text-ink-500 hover:text-ink-700 px-2 py-1.5"
          >
            {tx('Cancel', 'إلغاء')}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── SumoWorkflow ─────────────────────────────────────────────────────────────

function SumoWorkflow({ category, participations, teams, allTeams, scores, setScores, group2Matches = [], lang, showToast, isAdmin = false, removeParticipation, addParticipation, updateBracketMatch, customGroups = [], addCustomGroup, updateCustomGroup, deleteCustomGroup }) {
  const [mode, setMode] = useState('bracket'); // 'bracket' | 'roundrobin'
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);

  const teamEntries = useMemo(() =>
    participations
      .filter(p => p.categoryId === category.id)
      .map(p => {
        const team = teams.find(t => t.id === p.teamId);
        if (!team) return null;
        return { participationId: p.id, teamId: team.id, teamName: team.name, division: team.division, region: team.region };
      })
      .filter(Boolean),
    [participations, teams, category.id],
  );

  // R.R matches grouped first by bucket (ES/MS, HS/US) then by region.
  const matchesByBucket = useMemo(() => {
    const result = {};
    getRrBuckets(category.id).forEach(({ key, divs }) => {
      const bucketEntries = teamEntries.filter(e => divs.includes(e.division));
      const regionsInBucket = [...new Set(bucketEntries.map(e => e.region))].sort();
      result[key] = Object.fromEntries(
        regionsInBucket.map(region => [
          region,
          generateRoundRobinMatches(bucketEntries.filter(e => e.region === region), category.id, 'all', region),
        ]),
      );
    });
    return result;
  }, [teamEntries, category.id]);

  const { timeMap, allMatches } = useMemo(() => {
    const flatByRegion = {};
    const orderedKeys = [];
    getRrBuckets(category.id).forEach(({ key }) => {
      const regionMap = matchesByBucket[key] || {};
      Object.keys(regionMap).sort().forEach(region => {
        const composite = `${key}::${region}`;
        flatByRegion[composite] = regionMap[region];
        orderedKeys.push(composite);
      });
    });
    return {
      timeMap: buildTimeMap(flatByRegion, orderedKeys),
      allMatches: orderedKeys.flatMap(k => flatByRegion[k]),
    };
  }, [matchesByBucket]);

  // Bracket matches for this category (skeletons in Firestore) + resolved view.
  const bracketRaw = useMemo(
    () => group2Matches.filter(m => m.categoryId === category.id && m.bracket),
    [group2Matches, category.id],
  );

  // Auto-bracket from RR winners — used when the admin hasn't generated a
  // Firestore bracket yet. Built per bucket once every region's RR finishes.
  const autoBracket = useMemo(() => {
    if (bracketRaw.length > 0) return [];
    const out = [];
    getRrBuckets(category.id).forEach(({ key, divs }) => {
      const bucketEntries = teamEntries.filter(e => divs.includes(e.division));
      const regions = [...new Set(bucketEntries.map(e => e.region))].sort();
      const rrMatchesByRegion = {};
      const entriesByRegion = {};
      regions.forEach(r => {
        entriesByRegion[r] = bucketEntries.filter(e => e.region === r);
        rrMatchesByRegion[r] = (matchesByBucket[key] || {})[r] || [];
      });
      const built = buildAutoBracketFromRR({
        rrMatchesByRegion,
        entriesByRegion,
        scores,
        categoryId: category.id,
        bucketKey: key,
        label: 'Sumo',
      });
      out.push(...built);
    });
    return out;
  }, [bracketRaw, teamEntries, matchesByBucket, scores, category.id]);

  const effectiveBracket = bracketRaw.length > 0 ? bracketRaw : autoBracket;
  const bracketResolved = useMemo(() => resolveBracket(effectiveBracket, scores), [effectiveBracket, scores]);
  const hasBracket = bracketResolved.length > 0;

  const selectedMatch =
    allMatches.find(m => m.id === selectedMatchId) ||
    bracketResolved.find(m => m.id === selectedMatchId) ||
    null;
  const existingScores = scores.filter(s => s.pId === selectedMatchId);

  const handleSaveScore = (s, inspA, inspB, rawData) => {
    setScores(prev => [...prev, { id: Date.now(), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
    setSelectedMatchId(null);
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };
  const handleEditRequest = (id, newScore, newInspA, newInspB, newRaw) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, proposedInspectionA: newInspA, proposedInspectionB: newInspB, proposedRawInput: newRaw, status: 'PENDING' } : s));
    setSelectedMatchId(null);
  };

  if (teamEntries.length === 0) {
    return (
      <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-medium text-sm">{t(lang, 'noTeamsCheckedIn')}</p>
      </div>
    );
  }

  if (selectedMatch) {
    return (
      <div className="space-y-4 animate-slide-up">
        <button onClick={() => setSelectedMatchId(null)} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-100 transition-colors">
          {lang === 'ar' ? '→ العودة للجدول' : '← Back to Schedule'}
        </button>
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-navy-700 to-navy-500 p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">{category.name}{selectedMatch.bracket ? ` — ${selectedMatch.round}` : ' — Round Robin'}</p>
          <h4 className="text-xl font-black mt-1">{selectedMatch.title}</h4>
          {timeMap[selectedMatchId] && (
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-saudi-400/40 bg-saudi-500/20 px-2.5 py-1 text-[10px] font-black text-saudi-300">
                🕐 {timeMap[selectedMatchId]}
              </span>
            </div>
          )}
        </div>
        {existingScores.map((scoreObj, index) => (
          <SumoMatchCard key={scoreObj.id} title={`${t(lang, 'matchAttempt')} ${index + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={index + 1} initialScoreObj={scoreObj} onEditRequest={handleEditRequest} lang={lang} />
        ))}
        <SumoMatchCard key="new" title={`${t(lang, 'matchAttempt')} ${existingScores.length + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={existingScores.length + 1} onSaveScore={handleSaveScore} lang={lang} />
      </div>
    );
  }

  // Bracket view (default)
  if (mode === 'bracket') {
    return (
      <div className="space-y-4">
        {isAdmin && removeParticipation && addParticipation && (
          <CategoryRosterAdmin
            category={category}
            participations={participations}
            teams={teams}
            allTeams={allTeams}
            removeParticipation={removeParticipation}
            addParticipation={addParticipation}
            lang={lang}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
          />
        )}
        <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
        <BracketView
          matches={effectiveBracket}
          scores={scores}
          onSelectMatch={setSelectedMatchId}
          lang={lang}
          accent="orange"
          categoryLabel={category.name}
          editable={isAdmin && !!updateBracketMatch}
          editingMatchId={editingMatchId}
          onRequestEdit={setEditingMatchId}
          onSaveEdit={(id, patch) => { updateBracketMatch?.(id, patch); setEditingMatchId(null); }}
          onCancelEdit={() => setEditingMatchId(null)}
          teamPool={teamEntries}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isAdmin && removeParticipation && addParticipation && (
        <CategoryRosterAdmin
          category={category}
          participations={participations}
          teams={teams}
          allTeams={allTeams}
          removeParticipation={removeParticipation}
          addParticipation={addParticipation}
          lang={lang}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
        />
      )}
      <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
      <RoundRobinBucketsView
        categoryLabel={category.name}
        matchesByBucket={matchesByBucket}
        timeMap={timeMap}
        scores={scores}
        onSelectMatch={setSelectedMatchId}
        lang={lang}
        accent="orange"
        buckets={getRrBuckets(category.id)}
        scoringMode="sumo"
      />
    </div>
  );
}

// ─── SoccerWorkflow ──────────────────────────────────────────────────────────

function SoccerWorkflow({ category, participations, teams, allTeams, scores, setScores, group2Matches = [], lang, showToast, isAdmin = false, removeParticipation, addParticipation, updateBracketMatch, customGroups = [], addCustomGroup, updateCustomGroup, deleteCustomGroup }) {
  const [mode, setMode] = useState('bracket');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [editingMatchId, setEditingMatchId] = useState(null);

  const teamEntries = useMemo(() =>
    participations
      .filter(p => p.categoryId === category.id)
      .map(p => {
        const team = teams.find(t => t.id === p.teamId);
        if (!team) return null;
        return { participationId: p.id, teamId: team.id, teamName: team.name, division: team.division, region: team.region };
      })
      .filter(Boolean),
    [participations, teams, category.id],
  );

  // R.R matches grouped first by bucket (ES/MS, HS/US) then by region.
  const matchesByBucket = useMemo(() => {
    const result = {};
    getRrBuckets(category.id).forEach(({ key, divs }) => {
      const bucketEntries = teamEntries.filter(e => divs.includes(e.division));
      const regionsInBucket = [...new Set(bucketEntries.map(e => e.region))].sort();
      result[key] = Object.fromEntries(
        regionsInBucket.map(region => [
          region,
          generateRoundRobinMatches(bucketEntries.filter(e => e.region === region), category.id, 'all', region),
        ]),
      );
    });
    return result;
  }, [teamEntries, category.id]);

  const { timeMap, allMatches } = useMemo(() => {
    const flatByRegion = {};
    const orderedKeys = [];
    getRrBuckets(category.id).forEach(({ key }) => {
      const regionMap = matchesByBucket[key] || {};
      Object.keys(regionMap).sort().forEach(region => {
        const composite = `${key}::${region}`;
        flatByRegion[composite] = regionMap[region];
        orderedKeys.push(composite);
      });
    });
    return {
      timeMap: buildTimeMap(flatByRegion, orderedKeys),
      allMatches: orderedKeys.flatMap(k => flatByRegion[k]),
    };
  }, [matchesByBucket]);

  const bracketRaw = useMemo(
    () => group2Matches.filter(m => m.categoryId === category.id && m.bracket),
    [group2Matches, category.id],
  );

  // Auto-bracket from RR winners (used until admin generates a Firestore one).
  const autoBracket = useMemo(() => {
    if (bracketRaw.length > 0) return [];
    const out = [];
    getRrBuckets(category.id).forEach(({ key, divs }) => {
      const bucketEntries = teamEntries.filter(e => divs.includes(e.division));
      const regions = [...new Set(bucketEntries.map(e => e.region))].sort();
      const rrMatchesByRegion = {};
      const entriesByRegion = {};
      regions.forEach(r => {
        entriesByRegion[r] = bucketEntries.filter(e => e.region === r);
        rrMatchesByRegion[r] = (matchesByBucket[key] || {})[r] || [];
      });
      const built = buildAutoBracketFromRR({
        rrMatchesByRegion,
        entriesByRegion,
        scores,
        categoryId: category.id,
        bucketKey: key,
        label: 'Soccer',
      });
      out.push(...built);
    });
    return out;
  }, [bracketRaw, teamEntries, matchesByBucket, scores, category.id]);

  const effectiveBracket = bracketRaw.length > 0 ? bracketRaw : autoBracket;
  const bracketResolved = useMemo(() => resolveBracket(effectiveBracket, scores), [effectiveBracket, scores]);
  const hasBracket = bracketResolved.length > 0;

  const selectedMatch =
    allMatches.find(m => m.id === selectedMatchId) ||
    bracketResolved.find(m => m.id === selectedMatchId) ||
    null;
  const existingScores = scores.filter(s => s.pId === selectedMatchId);

  const handleSaveScore = (s, inspA, inspB, rawData) => {
    setScores(prev => [...prev, { id: Date.now(), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
    setSelectedMatchId(null);
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };
  const handleEditRequest = (id, newScore, newInspA, newInspB, newRaw) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, proposedInspectionA: newInspA, proposedInspectionB: newInspB, proposedRawInput: newRaw, status: 'PENDING' } : s));
    setSelectedMatchId(null);
  };

  if (teamEntries.length === 0) {
    return (
      <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-medium text-sm">{t(lang, 'noTeamsCheckedIn')}</p>
      </div>
    );
  }

  if (selectedMatch) {
    return (
      <div className="space-y-4 animate-slide-up">
        <button onClick={() => setSelectedMatchId(null)} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-100 transition-colors">
          {lang === 'ar' ? '→ العودة للجدول' : '← Back to Schedule'}
        </button>
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-navy-700 to-navy-500 p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">{category.name}{selectedMatch.bracket ? ` — ${selectedMatch.round}` : ' — Round Robin'}</p>
          <h4 className="text-xl font-black mt-1">{selectedMatch.title}</h4>
          {timeMap[selectedMatchId] && (
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-teal-400/40 bg-teal-500/20 px-2.5 py-1 text-[10px] font-black text-teal-300">
                🕐 {timeMap[selectedMatchId]}
              </span>
            </div>
          )}
        </div>
        {existingScores.map((scoreObj, index) => (
          <SoccerBotMatchCard key={scoreObj.id} title={`${t(lang, 'matchAttempt')} ${index + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={index + 1} initialScoreObj={scoreObj} onEditRequest={handleEditRequest} lang={lang} />
        ))}
        <SoccerBotMatchCard key="new" title={`${t(lang, 'matchAttempt')} ${existingScores.length + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={existingScores.length + 1} onSaveScore={handleSaveScore} lang={lang} />
      </div>
    );
  }

  const totalMatches = allMatches.length;
  const totalPlayed = allMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;

  if (mode === 'bracket') {
    return (
      <div className="space-y-4">
        {isAdmin && removeParticipation && addParticipation && (
          <CategoryRosterAdmin
            category={category}
            participations={participations}
            teams={teams}
            allTeams={allTeams}
            removeParticipation={removeParticipation}
            addParticipation={addParticipation}
            lang={lang}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
          />
        )}
        <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
        <BracketView
          matches={effectiveBracket}
          scores={scores}
          onSelectMatch={setSelectedMatchId}
          lang={lang}
          accent="teal"
          categoryLabel={category.name}
          editable={isAdmin && !!updateBracketMatch}
          editingMatchId={editingMatchId}
          onRequestEdit={setEditingMatchId}
          onSaveEdit={(id, patch) => { updateBracketMatch?.(id, patch); setEditingMatchId(null); }}
          onCancelEdit={() => setEditingMatchId(null)}
          teamPool={teamEntries}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isAdmin && removeParticipation && addParticipation && (
        <CategoryRosterAdmin
          category={category}
          participations={participations}
          teams={teams}
          allTeams={allTeams}
          removeParticipation={removeParticipation}
          addParticipation={addParticipation}
          lang={lang}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
        />
      )}
      <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
      <div className="flex items-center justify-between px-1 text-xs text-ink-500 font-semibold">
        <span>{lang === 'ar' ? 'المباريات:' : 'Matches:'} {totalPlayed}/{totalMatches} {lang === 'ar' ? 'مكتملة' : 'played'}</span>
      </div>
      <RoundRobinBucketsView
        categoryLabel={category.name}
        matchesByBucket={matchesByBucket}
        timeMap={timeMap}
        scores={scores}
        onSelectMatch={setSelectedMatchId}
        lang={lang}
        accent="teal"
        buckets={getRrBuckets(category.id)}
        scoringMode="soccer"
        showGoalsBesideTeams
      />
    </div>
  );
}

// ─── Group3Workflow ──────────────────────────────────────────────────────────

function Group3Workflow({ category, participations, teams, scores, setScores, lang, showToast }) {
  const activeParticipations = participations.filter(p => p.categoryId === category.id && teams.some(tm => tm.id === p.teamId));
  const [selectedP, setSelectedP] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => setSelectedP(''), [category.id]);

  if (activeParticipations.length === 0) {
    return (
      <div className="text-center py-16 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-medium text-sm">{t(lang, 'noTeamsCheckedIn')}</p>
      </div>
    );
  }

  const filteredParticipations = activeParticipations.filter(p => {
    const tm = teams.find(team => team.id === p.teamId);
    if (!tm) return false;
    const matchSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || tm.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = levelFilter ? tm.division === levelFilter : true;
    return matchSearch && matchLevel;
  });

  const teamName = selectedP ? teams.find(tm => tm.id === activeParticipations.find(p => p.id === selectedP)?.teamId)?.name : '';
  const existingScores = scores.filter(s => s.pId === selectedP);

  return (
    <div className="space-y-5">
      <div className="bg-brand-50 text-brand-800 p-4 rounded-xl border border-brand-200 flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 size={16} /> {t(lang, 'group3Notice')}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
        </div>
        <CustomSelect value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option value="">{t(lang, 'allLevelsOption')}</option>
          {category.levels.map(l => <option key={l} value={l}>{l}</option>)}
        </CustomSelect>
      </div>
      <CustomSelect value={selectedP} onChange={e => setSelectedP(e.target.value)}>
        <option value="">{t(lang, 'selectTeam')}</option>
        {filteredParticipations.map(p => {
          const tm = teams.find(tm => tm.id === p.teamId);
          return <option key={p.id} value={p.id}>[{p.id}] — {tm?.name} ({tm?.division})</option>;
        })}
      </CustomSelect>

      {selectedP && (
        <div key={`grp3_${selectedP}`} className="space-y-4 pt-4 border-t border-ink-200">
          {existingScores.map((scoreObj, index) => (
            <ScoringCard key={scoreObj.id} title={`${t(lang, 'presentationAttempt')} ${index + 1}: ${teamName}`}
              initialScoreObj={scoreObj}
              lang={lang}
              onEditRequest={(id, newScore) => {
                setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, status: 'PENDING' } : s));
                setSelectedP('');
              }} />
          ))}
          <ScoringCard title={`${t(lang, 'presentationAttempt')} ${existingScores.length + 1}: ${teamName}`}
            lang={lang}
            onSaveScore={s => {
              setScores(prev => [...prev, { id: Date.now(), pId: selectedP, score: s, status: 'VALID' }]);
              setSelectedP('');
              if (showToast) showToast(t(lang, 'toastScoreSubmit'));
            }} />
        </div>
      )}
    </div>
  );
}

// ─── CompetingSystem ─────────────────────────────────────────────────────────

export default function CompetingSystem({ categories, participations, teams, allTeams, getTeamStatus, scores, setScores, currentUser, group2Matches, systemConfig, lang, showToast, removeParticipation, addParticipation, updateBracketMatch, customGroups = [], addCustomGroup, updateCustomGroup, deleteCustomGroup }) {
  const isRef = currentUser?.role === 'ref';
  const isAdmin = currentUser?.role === 'admin';
  // Allowed categories for refs: prefer `categories` array, fall back to legacy single `category`
  const refAllowedIds = isRef
    ? (currentUser?.categories ?? (currentUser?.category ? [currentUser.category] : []))
    : null;
  const visibleCategories = isRef
    ? categories.filter(c => refAllowedIds.includes(c.id))
    : categories;
  // Auto-select if ref has only one allowed category
  const initialCatId = isRef && refAllowedIds.length === 1 ? refAllowedIds[0] : '';
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCatId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Show selector for non-refs OR for refs with multiple allowed categories
  const showSelector = !isRef || refAllowedIds.length > 1;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6" dir={dir}>
      {/* Category selector — hidden when a referee has only one allowed category */}
      {showSelector && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-ink-100">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3 sm:mb-4">{t(lang, 'selectCategory')}</p>
          {/* Mobile: horizontal scroll row */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 sm:hidden justify-start px-1">
            {visibleCategories.map(c => {
              const style = CATEGORY_STYLES[c.id] || { from: '#334155', to: '#0f172a', icon: '🤖' };
              const isActive = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200 press-effect ${isActive ? 'scale-105' : 'opacity-70 active:opacity-100'}`}
                >
                  <div
                    className="w-[72px] h-[80px] flex items-center justify-center overflow-hidden"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      backgroundImage: style.img
                        ? `linear-gradient(to top, ${style.to}ee 0%, ${style.from}99 55%, transparent 100%), url(${style.img})`
                        : `linear-gradient(160deg, ${style.from}, ${style.to})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: isActive ? `drop-shadow(0 0 6px white) drop-shadow(0 0 14px ${style.from}cc)` : 'none',
                    }}
                  >
                    {!style.img && <span className="text-2xl">{style.icon}</span>}
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight max-w-[72px] ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {/* Desktop: hex grid */}
          <div className="hidden sm:flex flex-wrap justify-center gap-6 py-2">
            {visibleCategories.map(c => {
              const style = CATEGORY_STYLES[c.id] || { from: '#334155', to: '#0f172a', icon: '🤖' };
              const isActive = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`flex flex-col items-center gap-2 transition-all duration-200 press-effect ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-95 hover:scale-105'}`}
                >
                  <div
                    className="w-[110px] h-[124px] flex items-center justify-center overflow-hidden"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      backgroundImage: style.img
                        ? `linear-gradient(to top, ${style.to}f0 0%, ${style.from}99 55%, transparent 100%), url(${style.img})`
                        : `linear-gradient(160deg, ${style.from}, ${style.to})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: isActive ? 'drop-shadow(0 0 12px ' + style.from + 'aa)' : 'none',
                    }}
                  >
                    {!style.img && <span className="text-3xl">{style.icon}</span>}
                  </div>
                  <span className={`text-xs font-bold text-center leading-tight max-w-[110px] ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflow area */}
      {selectedCategory ? (
        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 overflow-hidden">
          <div className="bg-gradient-to-r from-navy-700 to-navy-500 p-4 flex justify-between items-center text-white border-b-2 border-brand-500">
            <div>
              <h3 className="font-bold text-brand-400">{t(lang, 'systemWorkflow')}: {t(lang, 'group')} {selectedCategory.group}</h3>
              <p className="text-xs text-white/40 mt-0.5">{selectedCategory.name}</p>
            </div>
            <span className="text-xs bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg text-white/60">{t(lang, 'activeModule')}</span>
          </div>
          <div className="p-3 sm:p-5 min-h-[200px] sm:min-h-[400px]">
            {selectedCategory.group === 1 && (
              <Group1Workflow category={selectedCategory} participations={participations} teams={teams} allTeams={allTeams} getTeamStatus={getTeamStatus} scores={scores} setScores={setScores} systemConfig={systemConfig} lang={lang} showToast={showToast} isAdmin={isAdmin} removeParticipation={removeParticipation} addParticipation={addParticipation} customGroups={customGroups.filter(g => g.categoryId === selectedCategory.id)} addCustomGroup={addCustomGroup} updateCustomGroup={updateCustomGroup} deleteCustomGroup={deleteCustomGroup} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id === 'c2_sumo' && (
              <SumoWorkflow category={selectedCategory} participations={participations} teams={teams} allTeams={allTeams} scores={scores} setScores={setScores} group2Matches={group2Matches} lang={lang} showToast={showToast} isAdmin={isAdmin} removeParticipation={removeParticipation} addParticipation={addParticipation} updateBracketMatch={updateBracketMatch} customGroups={customGroups.filter(g => g.categoryId === selectedCategory.id)} addCustomGroup={addCustomGroup} updateCustomGroup={updateCustomGroup} deleteCustomGroup={deleteCustomGroup} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id === 'c2_soccer' && (
              <SoccerWorkflow category={selectedCategory} participations={participations} teams={teams} allTeams={allTeams} scores={scores} setScores={setScores} group2Matches={group2Matches} lang={lang} showToast={showToast} isAdmin={isAdmin} removeParticipation={removeParticipation} addParticipation={addParticipation} updateBracketMatch={updateBracketMatch} customGroups={customGroups.filter(g => g.categoryId === selectedCategory.id)} addCustomGroup={addCustomGroup} updateCustomGroup={updateCustomGroup} deleteCustomGroup={deleteCustomGroup} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id !== 'c2_sumo' && selectedCategory.id !== 'c2_soccer' && (
              <Group2Workflow category={selectedCategory} matches={group2Matches.filter(m => m.categoryId === selectedCategory.id)} scores={scores} setScores={setScores} lang={lang} showToast={showToast} />
            )}
            {selectedCategory.group === 3 && (
              <Group3Workflow category={selectedCategory} participations={participations} teams={teams} scores={scores} setScores={setScores} lang={lang} showToast={showToast} />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <p className="text-ink-400 font-medium">{t(lang, 'selectCategory')}</p>
        </div>
      )}
    </div>
  );
}
