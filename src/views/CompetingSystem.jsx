import { useState, useEffect, useMemo, Fragment } from 'react';
import { CheckCircle2, Search, Camera } from 'lucide-react';
import QrScannerModal from '../components/ui/QrScannerModal';
import { CATEGORY_STYLES } from '../constants/mockData';
import { t } from '../constants/translations';
import { genId } from '../utils/ids';
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
  const scoreLabel = scoreFormatter(getFastBotScoreValue(slot?.scoreObj));
  const hasScore = scoreLabel !== '--';

  return (
    <div className="min-w-[72px] text-center">
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
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeClassName}`}>
      {getFastBotCheckInStatusLabel(status, lang)}
    </span>
  );
}

function FastBotScheduleTable({ title, rows, onSelectRow, lang, showHeader = true, scoreFormatter = formatFastBotScore, activeSlotKeys = [] }) {
  return (
    <div className="rounded-2xl border border-ink-200 overflow-hidden bg-white shadow-sm">
      {showHeader && (
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between gap-3 bg-ink-50/70">
          <h4 className="font-bold text-ink-800 text-sm">{title}</h4>
          <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">{rows.length} {t(lang, 'teamLabel')}</span>
        </div>
      )}

      {/* Mobile: card view (avoids horizontal table scroll on small screens) */}
      <div className="sm:hidden divide-y divide-ink-100">
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ink-400 font-medium">
            {t(lang, 'fastbotNoTeamsForGroup')}
          </div>
        )}
        {rows.map(row => (
          <button
            key={row.participationId}
            type="button"
            onClick={() => onSelectRow(row)}
            className="w-full text-start p-3 active:bg-brand-50 transition-colors press-effect"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ink-800 text-sm truncate">{row.teamName}</p>
                  <FastBotCheckInBadge status={row.checkInStatus} lang={lang} />
                </div>
                <p className="font-mono text-[11px] text-ink-500 mt-0.5">
                  #{row.participationId}
                  <span className="ms-2 inline-flex items-center rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[9px] font-black uppercase text-brand-700">{row.division}</span>
                </p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-ink-400">{t(lang, 'bestResult')}</p>
                <p className={`text-base font-black tabular-nums ${row.bestOfficialScore !== null ? 'text-saudi-700' : 'text-ink-300'}`}>
                  {scoreFormatter(row.bestOfficialScore)}
                </p>
              </div>
            </div>
            {activeSlotKeys.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeSlotKeys.map(slotKey => {
                  const slot = row.slots[slotKey];
                  const label = scoreFormatter(getFastBotScoreValue(slot?.scoreObj));
                  const has = label !== '--';
                  return (
                    <span
                      key={slotKey}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black ${
                        has ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-ink-200 bg-ink-50 text-ink-400'
                      }`}
                    >
                      <span className="opacity-70">{slotKey}</span>
                      <span className="tabular-nums">{label}</span>
                    </span>
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-[10px] text-brand-500 font-black uppercase tracking-wider">{t(lang, 'openFastBotTeam')} →</p>
          </button>
        ))}
      </div>

      {/* Desktop / tablet: table view */}
      <div className="hidden sm:block overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="min-w-[820px] sm:min-w-[1120px] w-full text-xs sm:text-sm">
          <thead className="bg-[#061a27] text-white">
            <tr className="text-left">
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold sticky start-0 bg-[#061a27] z-10">{t(lang, 'teamName')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{t(lang, 'teamNumber')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{t(lang, 'divisionLabel')}</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center whitespace-nowrap">{t(lang, 'bestResult')}</th>
              {activeSlotKeys.map(slotKey => <th key={slotKey} className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center whitespace-nowrap">{slotKey}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={3 + activeSlotKeys.length + 1} className="px-4 py-8 text-center text-sm text-ink-400 font-medium">
                  {t(lang, 'fastbotNoTeamsForGroup')}
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr
                key={row.participationId}
                tabIndex={0}
                onClick={() => onSelectRow(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectRow(row);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-brand-50/60 focus:outline-none focus:bg-brand-50 group"
              >
                <td className="px-3 py-3 sticky start-0 bg-white group-hover:bg-brand-50/60 group-focus:bg-brand-50 z-[5]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-ink-800">{row.teamName}</p>
                      <FastBotCheckInBadge status={row.checkInStatus} lang={lang} />
                    </div>
                    <p className="text-[10px] text-brand-500 font-black uppercase tracking-wider">{t(lang, 'openFastBotTeam')}</p>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-ink-500">{row.participationId}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-[10px] font-black uppercase text-brand-700">{row.division}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-sm font-black ${row.bestOfficialScore !== null ? 'text-saudi-700' : 'text-ink-300'}`}>
                    {scoreFormatter(row.bestOfficialScore)}
                  </span>
                </td>
                {activeSlotKeys.map(slotKey => (
                  <td key={slotKey} className="px-3 py-3 align-middle">
                    <FastBotScheduleCell slot={row.slots[slotKey]} scoreFormatter={scoreFormatter} />
                  </td>
                ))}
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

      <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
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
          const scoreLabel = formatFastBotScore(getFastBotScoreValue(slot?.scoreObj));
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
              <p className={`text-xs font-black mt-1.5 sm:mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
            </button>
          );
        })}
      </div>

      <FastBotAttemptCard
        key={`${row.participationId}_${activeSlotKey}`}
        title={`${activeSlotKey} • ${row.teamName}`}
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

      <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
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
              <p className={`text-xs font-black mt-1.5 sm:mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
            </button>
          );
        })}
      </div>

      {category.id === 'c1_linefollow' && (
        <LineFollowingAttemptCard
          key={`${row.participationId}_${activeSlotKey}`}
          title={`${activeSlotKey} • ${row.teamName}`}
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
          title={`${activeSlotKey} • ${row.teamName}`}
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

function Group1Workflow({ category, participations, teams, getTeamStatus, scores, setScores, systemConfig, lang, showToast }) {
  const isFastBot = category.id === 'c1_fastbot';
  const activeParticipations = participations.filter(p => p.categoryId === category.id && teams.some(tm => tm.id === p.teamId));
  const [selectedP, setSelectedP] = useState('');
  const [selectedFastBotPId, setSelectedFastBotPId] = useState('');
  const [activeFastBotSlot, setActiveFastBotSlot] = useState('');
  const [activeGroup1Slot, setActiveGroup1Slot] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');

  // Resolve a scanned QR (team.id or participation.id) → jump straight into
  // that team's scoring detail view.
  const handleScan = (raw) => {
    setScannerOpen(false);
    const text = String(raw || '').trim();
    if (!text) return;
    // Match by team.id first, then participation.id
    const partByTeam = activeParticipations.find(p => p.teamId === text);
    const partById = activeParticipations.find(p => p.id === text);
    const target = partByTeam || partById;
    if (!target) {
      const msg = lang === 'ar' ? 'لم يتم العثور على فريق مطابق في هذه الفئة.' : 'No matching team in this category.';
      setScanError(msg);
      setTimeout(() => setScanError(''), 4000);
      if (showToast) showToast(msg, 'error');
      return;
    }
    if (isFastBot) handleOpenFastBotRow({ participationId: target.id });
    else handleOpenGroup1Row({ participationId: target.id });
  };

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
      return [...prev, { id: genId('s'), pId: participationId, slotKey, score: scoreValue, inspectionData: insp, rawInput: rawData, status: 'VALID' }];
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
      return [...prev, { id: genId('s'), pId: participationId, slotKey, score: scoreValue, inspectionData: insp, rawInput: rawData, status: 'VALID' }];
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

  if (isFastBot) {
    const esMsRows = visibleFastBotRows.filter(row => ['ES', 'MS'].includes(row.division));
    // Western HS / US run as two standalone tables; other regions stay merged.
    const hsUsNonWesternRows = visibleFastBotRows.filter(row => ['HS', 'US'].includes(row.division) && row.region !== 'Western');
    const hsWesternRows = visibleFastBotRows.filter(row => row.division === 'HS' && row.region === 'Western');
    const usWesternRows = visibleFastBotRows.filter(row => row.division === 'US' && row.region === 'Western');

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            title={lang === 'ar' ? 'مسح QR' : 'Scan QR'}
            className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md press-effect"
          >
            <Camera size={18} />
          </button>
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
              <FastBotScheduleTable title={t(lang, 'fastbotEsMsTable')} rows={esMsRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={esMsSlotKeys} />
            </CollapsibleCard>
            {hsUsNonWesternRows.length > 0 && (
              <CollapsibleCard title={t(lang, 'fastbotHsUsTable')} badge={hsUsNonWesternRows.length} badgeColor="bg-brand-500">
                <FastBotScheduleTable title={t(lang, 'fastbotHsUsTable')} rows={hsUsNonWesternRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={hsUsSlotKeys} />
              </CollapsibleCard>
            )}
            {hsWesternRows.length > 0 && (
              <CollapsibleCard title={`FastBot Schedule — HS (Western)`} badge={hsWesternRows.length} badgeColor="bg-brand-500">
                <FastBotScheduleTable title="" rows={hsWesternRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={hsUsSlotKeys} />
              </CollapsibleCard>
            )}
            {usWesternRows.length > 0 && (
              <CollapsibleCard title={`FastBot Schedule — US (Western)`} badge={usWesternRows.length} badgeColor="bg-brand-500">
                <FastBotScheduleTable title="" rows={usWesternRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={hsUsSlotKeys} />
              </CollapsibleCard>
            )}
          </div>
        )}
        <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} lang={lang} />
        {scanError && (
          <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-2xl animate-fade-in">
            {scanError}
          </div>
        )}
      </div>
    );
  }

  const esMsGroup1Rows = visibleGroup1Rows.filter(row => ['ES', 'MS'].includes(row.division));
  const hsUsGroup1Rows = visibleGroup1Rows.filter(row => ['HS', 'US'].includes(row.division));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          title={lang === 'ar' ? 'مسح QR' : 'Scan QR'}
          className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md press-effect"
        >
          <Camera size={18} />
        </button>
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
          <CollapsibleCard
            title={`${category.name} — ES / MS`}
            badge={esMsGroup1Rows.length}
            badgeColor="bg-brand-500"
          >
            <FastBotScheduleTable title="" rows={esMsGroup1Rows} onSelectRow={handleOpenGroup1Row} lang={lang} showHeader={false} scoreFormatter={formatGroup1Score} activeSlotKeys={esMsSlotKeys} />
          </CollapsibleCard>
          <CollapsibleCard
            title={`${category.name} — HS / US`}
            badge={hsUsGroup1Rows.length}
            badgeColor="bg-brand-500"
          >
            <FastBotScheduleTable title="" rows={hsUsGroup1Rows} onSelectRow={handleOpenGroup1Row} lang={lang} showHeader={false} scoreFormatter={formatGroup1Score} activeSlotKeys={hsUsSlotKeys} />
          </CollapsibleCard>
        </div>
      )}
      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} lang={lang} />
      {scanError && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-2xl animate-fade-in">
          {scanError}
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
    setScores(prev => [...prev, { id: genId('s'), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
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

function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateRoundRobinMatches(teamEntries, categoryId, divisionTag, region) {
  const seed = [...`${categoryId}_${divisionTag}_${region}`].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = seededShuffle(teamEntries, seed);
  const rawMatches = [];
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const a = shuffled[i];
      const b = shuffled[j];
      rawMatches.push({
        id: `rr_${a.participationId}_vs_${b.participationId}`,
        teamA: a.teamName,
        teamB: b.teamName,
        teamAId: a.participationId,
        teamBId: b.participationId,
        title: `${a.teamName} vs ${b.teamName}`,
        categoryId,
      });
    }
  }

  // Reorder so no team plays two consecutive matches when possible.
  // Greedy: at each step, prefer a match whose teams didn't play in the previous match.
  const ordered = [];
  const remaining = [...rawMatches];
  let lastTeams = new Set();
  while (remaining.length > 0) {
    // Pick the first match that shares no team with the previous one.
    let pickIdx = remaining.findIndex(m => !lastTeams.has(m.teamAId) && !lastTeams.has(m.teamBId));
    // Fallback: if none, allow one shared team (only one team plays back-to-back).
    if (pickIdx === -1) pickIdx = remaining.findIndex(m => !(lastTeams.has(m.teamAId) && lastTeams.has(m.teamBId)));
    // Last fallback: just take the first remaining.
    if (pickIdx === -1) pickIdx = 0;
    const picked = remaining.splice(pickIdx, 1)[0];
    ordered.push(picked);
    lastTeams = new Set([picked.teamAId, picked.teamBId]);
  }

  return ordered;
}

// ─── Round-Robin buckets (FastBot-style grouping) ────────────────────────────
// SoccerBot is bucketed as ES/MS together and HS/US together.
const RR_BUCKETS = [
  { key: 'ES / MS', divs: ['ES', 'MS'] },
  { key: 'HS / US', divs: ['HS', 'US'] },
];

// Sumo: ES alone, MS alone, HS/US merged.
const SUMO_RR_BUCKETS = [
  { key: 'ES', divs: ['ES'] },
  { key: 'MS', divs: ['MS'] },
  { key: 'HS / US', divs: ['HS', 'US'] },
];

function RoundRobinBucketsView({ categoryLabel, matchesByBucket, scores, onSelectMatch, lang, accent = 'orange', buckets = RR_BUCKETS }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const accentChip = accent === 'teal'
    ? 'bg-teal-50 border-teal-200 text-teal-700'
    : 'bg-orange-50 border-orange-200 text-orange-700';
  const accentBadge = accent === 'teal' ? 'bg-teal-600' : 'bg-orange-500';

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
                  <thead className="bg-[#061a27] text-white">
                    <tr className="text-left">
                      <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold w-12 text-center">#</th>
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
                            <td colSpan={6} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink-500">
                              {tx('Region', 'منطقة')}: {region} · {list.length} {tx('matches', 'مباريات')}
                            </td>
                          </tr>
                          {list.map((m, i) => {
                            const sc = scores.find(s => s.pId === m.id && s.status === 'VALID');
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
                                <td className="px-3 py-2.5">
                                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${accentChip}`}>{region}</span>
                                </td>
                                <td className="px-3 py-2.5 font-bold text-ink-700 truncate max-w-[160px]">{m.teamA}</td>
                                <td className="px-2 py-2.5 text-center text-[10px] font-black text-ink-400">vs</td>
                                <td className="px-3 py-2.5 font-bold text-ink-700 truncate max-w-[160px]">{m.teamB}</td>
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
          ? 'bg-gradient-to-r from-[#061a27] to-[#0a2a3a] text-white border-[#061a27] shadow-md'
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
  const accentBorder = accent === 'teal' ? 'border-teal-400' : 'border-orange-400';
  const accentBg = accent === 'teal' ? 'bg-teal-50' : 'bg-orange-50';
  const accentText = accent === 'teal' ? 'text-teal-700' : 'text-orange-700';

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

function BracketView({ matches, scores, onSelectMatch, lang, accent = 'orange', categoryLabel = '' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const resolved = useMemo(() => resolveBracket(matches, scores), [matches, scores]);
  const byDivision = useMemo(() => groupBracketByDivision(resolved), [resolved]);
  const divisions = Object.keys(byDivision).sort();

  if (resolved.length === 0) {
    return (
      <div className="text-center py-12 bg-ink-50 rounded-xl border-2 border-dashed border-ink-200">
        <p className="text-ink-500 font-bold text-sm">{tx('No bracket has been generated yet.', 'لم يتم توليد جدول الإقصائيات بعد.')}</p>
        <p className="text-ink-400 text-xs mt-1">{tx('Ask the admin to generate brackets from Operations.', 'اطلب من الأدمن توليد الإقصائيات من شاشة العمليات.')}</p>
      </div>
    );
  }

  const accentChip = accent === 'teal'
    ? 'bg-teal-50 border-teal-200 text-teal-700'
    : 'bg-orange-50 border-orange-200 text-orange-700';
  const accentHeaderBadge = accent === 'teal' ? 'bg-teal-600' : 'bg-orange-500';

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
                <thead className="bg-[#061a27] text-white">
                  <tr className="text-left">
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold w-12 text-center">#</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Round', 'الجولة')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team A', 'الفريق أ')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center w-10">{tx('vs', 'ضد')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Team B', 'الفريق ب')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-center">{tx('Score', 'النتيجة')}</th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold">{tx('Winner', 'الفائز')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {rounds.map(({ roundIndex, round, matches: rMatches }) => (
                    <Fragment key={roundIndex}>
                      <tr className="bg-ink-50/80">
                        <td colSpan={7} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink-500">
                          {round}
                        </td>
                      </tr>
                      {rMatches.map((m, i) => {
                        const ready = m.teamA && m.teamB && !m.isBye;
                        const winnerName = m._winnerTeamName || '';
                        const isWinnerA = m._winnerSide === 'A';
                        const isWinnerB = m._winnerSide === 'B';
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
                              {isWinnerA && <span className="ms-1 text-saudi-600">✓</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center text-[10px] font-black text-ink-400">vs</td>
                            <td className={`px-3 py-2.5 font-bold ${isWinnerB ? 'text-saudi-700' : 'text-ink-700'} ${!m.teamB ? 'text-ink-300 italic font-medium' : ''} ${m.isBye ? 'italic text-ink-400' : ''}`}>
                              {m.teamB || tx('TBD', 'لم يُحدد')}
                              {isWinnerB && <span className="ms-1 text-saudi-600">✓</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center font-black text-ink-700">
                              {m._scoreObj?.score || (m.isBye ? tx('BYE', 'تأهل') : '--')}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-saudi-700 truncate max-w-[140px]">
                              {winnerName || (m.isBye ? (m.teamA || '--') : '--')}
                            </td>
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

// ─── SumoWorkflow ─────────────────────────────────────────────────────────────

function SumoWorkflow({ category, participations, teams, scores, setScores, group2Matches = [], lang, showToast, currentUser }) {
  const [mode, setMode] = useState('bracket'); // 'bracket' | 'roundrobin'
  const [selectedMatchId, setSelectedMatchId] = useState(null);

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

  // R.R matches grouped first by bucket (ES, MS, HS, US separately) then by region.
  const matchesByBucket = useMemo(() => {
    const result = {};
    SUMO_RR_BUCKETS.forEach(({ key, divs }) => {
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

  const allMatches = useMemo(() => {
    const flat = [];
    SUMO_RR_BUCKETS.forEach(({ key }) => {
      const regionMap = matchesByBucket[key] || {};
      Object.keys(regionMap).sort().forEach(region => {
        flat.push(...(regionMap[region] || []));
      });
    });
    return flat;
  }, [matchesByBucket]);

  // Bracket matches for this category (skeletons in Firestore) + resolved view.
  const bracketRaw = useMemo(
    () => group2Matches.filter(m => m.categoryId === category.id && m.bracket),
    [group2Matches, category.id],
  );
  const bracketResolved = useMemo(() => resolveBracket(bracketRaw, scores), [bracketRaw, scores]);
  const hasBracket = bracketResolved.length > 0;

  const selectedMatch =
    allMatches.find(m => m.id === selectedMatchId) ||
    bracketResolved.find(m => m.id === selectedMatchId) ||
    null;
  const existingScores = scores.filter(s => s.pId === selectedMatchId);

  const handleSaveScore = (s, inspA, inspB, rawData) => {
    setScores(prev => [...prev, { id: genId('s'), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
    setSelectedMatchId(null);
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };
  const handleEditRequest = (id, newScore, newInspA, newInspB, newRaw) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, proposedInspectionA: newInspA, proposedInspectionB: newInspB, proposedRawInput: newRaw, status: 'PENDING' } : s));
    setSelectedMatchId(null);
  };
  const isAdmin = currentUser?.role === 'admin';
  const handleReplay = (scoreId) => {
    const ok = window.confirm(lang === 'ar'
      ? 'سيتم حذف هذه المحاولة ويمكن إعادة تسجيلها. متأكد؟'
      : 'This attempt will be deleted and can be re-recorded. Continue?');
    if (!ok) return;
    setScores(prev => prev.filter(s => s.id !== scoreId));
    if (showToast) showToast(lang === 'ar' ? 'تم حذف المحاولة' : 'Attempt deleted', 'info');
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
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">{category.name}{selectedMatch.bracket ? ` — ${selectedMatch.round}` : ' — Round Robin'}</p>
          <h4 className="text-xl font-black mt-1">{selectedMatch.title}</h4>
        </div>
        {existingScores.map((scoreObj, index) => (
          <div key={scoreObj.id} className="space-y-2">
            <SumoMatchCard title={`${t(lang, 'matchAttempt')} ${index + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={index + 1} initialScoreObj={scoreObj} onEditRequest={handleEditRequest} lang={lang} />
            {isAdmin && (
              <button
                onClick={() => handleReplay(scoreObj.id)}
                className="w-full py-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                🔄 {lang === 'ar' ? `إعادة المحاولة ${index + 1} (حذف وإعادة تسجيل)` : `Replay attempt ${index + 1} (delete & re-record)`}
              </button>
            )}
          </div>
        ))}
        <SumoMatchCard key="new" title={`${t(lang, 'matchAttempt')} ${existingScores.length + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={existingScores.length + 1} onSaveScore={handleSaveScore} lang={lang} />
      </div>
    );
  }

  // Bracket view (default)
  if (mode === 'bracket') {
    return (
      <div className="space-y-4">
        <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
        <BracketView matches={bracketRaw} scores={scores} onSelectMatch={setSelectedMatchId} lang={lang} accent="orange" categoryLabel={category.name} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
      <RoundRobinBucketsView
        categoryLabel={category.name}
        matchesByBucket={matchesByBucket}
        scores={scores}
        onSelectMatch={setSelectedMatchId}
        lang={lang}
        accent="orange"
        buckets={SUMO_RR_BUCKETS}
      />
    </div>
  );
}

// ─── SoccerWorkflow ──────────────────────────────────────────────────────────

function SoccerWorkflow({ category, participations, teams, scores, setScores, group2Matches = [], lang, showToast, currentUser }) {
  const [mode, setMode] = useState('bracket');
  const [selectedMatchId, setSelectedMatchId] = useState(null);

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
    RR_BUCKETS.forEach(({ key, divs }) => {
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

  const allMatches = useMemo(() => {
    const flat = [];
    RR_BUCKETS.forEach(({ key }) => {
      const regionMap = matchesByBucket[key] || {};
      Object.keys(regionMap).sort().forEach(region => {
        flat.push(...(regionMap[region] || []));
      });
    });
    return flat;
  }, [matchesByBucket]);

  const bracketRaw = useMemo(
    () => group2Matches.filter(m => m.categoryId === category.id && m.bracket),
    [group2Matches, category.id],
  );
  const bracketResolved = useMemo(() => resolveBracket(bracketRaw, scores), [bracketRaw, scores]);
  const hasBracket = bracketResolved.length > 0;

  const selectedMatch =
    allMatches.find(m => m.id === selectedMatchId) ||
    bracketResolved.find(m => m.id === selectedMatchId) ||
    null;
  const existingScores = scores.filter(s => s.pId === selectedMatchId);

  const handleSaveScore = (s, inspA, inspB, rawData) => {
    setScores(prev => [...prev, { id: genId('s'), pId: selectedMatchId, score: s, inspectionA: inspA, inspectionB: inspB, rawInput: rawData, status: 'VALID' }]);
    setSelectedMatchId(null);
    if (showToast) showToast(t(lang, 'toastScoreSubmit'));
  };
  const handleEditRequest = (id, newScore, newInspA, newInspB, newRaw) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, proposedInspectionA: newInspA, proposedInspectionB: newInspB, proposedRawInput: newRaw, status: 'PENDING' } : s));
    setSelectedMatchId(null);
  };
  const isAdmin = currentUser?.role === 'admin';
  const handleReplay = (scoreId) => {
    const ok = window.confirm(lang === 'ar'
      ? 'سيتم حذف هذه المحاولة ويمكن إعادة تسجيلها. متأكد؟'
      : 'This attempt will be deleted and can be re-recorded. Continue?');
    if (!ok) return;
    setScores(prev => prev.filter(s => s.id !== scoreId));
    if (showToast) showToast(lang === 'ar' ? 'تم حذف المحاولة' : 'Attempt deleted', 'info');
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
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">{category.name}{selectedMatch.bracket ? ` — ${selectedMatch.round}` : ' — Round Robin'}</p>
          <h4 className="text-xl font-black mt-1">{selectedMatch.title}</h4>
        </div>
        {existingScores.map((scoreObj, index) => (
          <div key={scoreObj.id} className="space-y-2">
            <SoccerBotMatchCard title={`${t(lang, 'matchAttempt')} ${index + 1}: ${selectedMatch.title}`} match={selectedMatch} categoryId={category.id} attemptNumber={index + 1} initialScoreObj={scoreObj} onEditRequest={handleEditRequest} lang={lang} />
            {isAdmin && (
              <button
                onClick={() => handleReplay(scoreObj.id)}
                className="w-full py-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                🔄 {lang === 'ar' ? `إعادة المحاولة ${index + 1} (حذف وإعادة تسجيل)` : `Replay attempt ${index + 1} (delete & re-record)`}
              </button>
            )}
          </div>
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
        <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
        <BracketView matches={bracketRaw} scores={scores} onSelectMatch={setSelectedMatchId} lang={lang} accent="teal" categoryLabel={category.name} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BracketModeToggle mode={mode} setMode={setMode} lang={lang} hasBracket={hasBracket} />
      <div className="flex items-center justify-between px-1 text-xs text-ink-500 font-semibold">
        <span>{lang === 'ar' ? 'المباريات:' : 'Matches:'} {totalPlayed}/{totalMatches} {lang === 'ar' ? 'مكتملة' : 'played'}</span>
      </div>
      <RoundRobinBucketsView
        categoryLabel={category.name}
        matchesByBucket={matchesByBucket}
        scores={scores}
        onSelectMatch={setSelectedMatchId}
        lang={lang}
        accent="teal"
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
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input type="text" placeholder={t(lang, 'searchTeamOrId')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-4 py-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
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
              onEditRequest={(id, newScore, newInsp) => {
                setScores(prev => prev.map(s => s.id === id ? { ...s, proposedScore: newScore, inspectionData: newInsp || s.inspectionData, status: 'PENDING' } : s));
                setSelectedP('');
              }} />
          ))}
          <ScoringCard title={`${t(lang, 'presentationAttempt')} ${existingScores.length + 1}: ${teamName}`}
            lang={lang}
            onSaveScore={(s, insp) => {
              setScores(prev => [...prev, { id: genId('s'), pId: selectedP, score: s, inspectionData: insp || {}, status: 'VALID' }]);
              setSelectedP('');
              if (showToast) showToast(t(lang, 'toastScoreSubmit'));
            }} />
        </div>
      )}
    </div>
  );
}

// ─── CompetingSystem ─────────────────────────────────────────────────────────

export default function CompetingSystem({ categories, participations, teams, getTeamStatus, scores, setScores, currentUser, group2Matches, systemConfig, lang, showToast }) {
  const isRef = currentUser?.role === 'ref';
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
          <div className="bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 flex justify-between items-center text-white border-b-2 border-brand-500">
            <div>
              <h3 className="font-bold text-brand-400">{t(lang, 'systemWorkflow')}: {t(lang, 'group')} {selectedCategory.group}</h3>
              <p className="text-xs text-white/40 mt-0.5">{selectedCategory.name}</p>
            </div>
            <span className="text-xs bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg text-white/60">{t(lang, 'activeModule')}</span>
          </div>
          <div className="p-3 sm:p-5 min-h-[200px] sm:min-h-[400px]">
            {selectedCategory.group === 1 && (
              <Group1Workflow category={selectedCategory} participations={participations} teams={teams} getTeamStatus={getTeamStatus} scores={scores} setScores={setScores} systemConfig={systemConfig} lang={lang} showToast={showToast} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id === 'c2_sumo' && (
              <SumoWorkflow category={selectedCategory} participations={participations} teams={teams} scores={scores} setScores={setScores} group2Matches={group2Matches} lang={lang} showToast={showToast} currentUser={currentUser} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id === 'c2_soccer' && (
              <SoccerWorkflow category={selectedCategory} participations={participations} teams={teams} scores={scores} setScores={setScores} group2Matches={group2Matches} lang={lang} showToast={showToast} currentUser={currentUser} />
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
