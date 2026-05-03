import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
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
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full text-sm">
          <thead className="bg-[#061a27] text-white">
            <tr className="text-left">
              <th className="px-3 py-3 font-bold">{t(lang, 'teamName')}</th>
              <th className="px-3 py-3 font-bold">{t(lang, 'teamNumber')}</th>
              <th className="px-3 py-3 font-bold">{t(lang, 'divisionLabel')}</th>
              {activeSlotKeys.map(slotKey => <th key={slotKey} className="px-3 py-3 font-bold text-center">{slotKey}</th>)}
              <th className="px-3 py-3 font-bold text-center">{`Best (R1-R${activeSlotKeys.filter(k => k.startsWith('R')).length})`}</th>
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
                className="cursor-pointer transition-colors hover:bg-brand-50/60 focus:outline-none focus:bg-brand-50"
              >
                <td className="px-3 py-3">
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
                {activeSlotKeys.map(slotKey => (
                  <td key={slotKey} className="px-3 py-3 align-middle">
                    <FastBotScheduleCell slot={row.slots[slotKey]} scoreFormatter={scoreFormatter} />
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <span className={`text-sm font-black ${row.bestOfficialScore !== null ? 'text-saudi-700' : 'text-ink-300'}`}>
                    {scoreFormatter(row.bestOfficialScore)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FastBotDetailView({ row, activeSlotKey, onSlotChange, onBack, onSaveScore, onEditRequest, systemConfig, lang, activeSlotKeys = [] }) {
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

      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-${Math.min(activeSlotKeys.length, 7)}`}>
        {activeSlotKeys.map(slotKey => {
          const slot = row.slots[slotKey];
          const { timeLabel, scoreLabel } = getFastBotCellDisplay(slot);
          const isActive = slotKey === activeSlotKey;

          return (
            <button
              key={slotKey}
              onClick={() => onSlotChange(slotKey)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                isActive
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
              }`}
            >
              <p className={`text-sm font-black ${isActive ? 'text-brand-700' : 'text-ink-700'}`}>{slotKey}</p>
              <p className="font-mono text-[11px] text-ink-500 mt-1">{timeLabel}</p>
              <p className={`text-xs font-black mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
            </button>
          );
        })}
      </div>

      <FastBotAttemptCard
        key={`${row.participationId}_${activeSlotKey}`}
        title={`${activeSlotKey} • ${row.teamName} • ${activeSlot.timeLabel}`}
        categoryId="c1_fastbot"
        teamDivision={row.division}
        attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup)}
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

      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-${Math.min(activeSlotKeys.length, 7)}`}>
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
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                isActive
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
              }`}
            >
              <p className={`text-sm font-black ${isActive ? 'text-brand-700' : 'text-ink-700'}`}>{slotKey}</p>
              <p className="font-mono text-[11px] text-ink-500 mt-1">{timeLabel}</p>
              <p className={`text-xs font-black mt-2 ${scoreLabel !== '--' ? 'text-saudi-700' : 'text-ink-300'}`}>{scoreLabel}</p>
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
          attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup)}
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
          attemptNumber={getFastBotSlotOrder(activeSlotKey, systemConfig, row.divisionGroup)}
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

  const activeSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig), [systemConfig]);
  const esMsSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig, 'es_ms'), [systemConfig]);
  const hsUsSlotKeys = useMemo(() => getActiveSlotKeys(systemConfig, 'hs_us'), [systemConfig]);

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

    return buildFastBotScheduleRows(activeParticipations, teams, scores, systemConfig).map(row => ({
      ...row,
      checkInStatus: teamStatusById.get(row.teamId) || 'No-Show',
    }));
  }, [isFastBot, activeParticipations, teams, scores, getTeamStatus, systemConfig]);

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
    return buildFastBotScheduleRows(activeParticipations, teams, scores, systemConfig).map(row => ({
      ...row,
      checkInStatus: teamStatusById.get(row.teamId) || 'No-Show',
      bestOfficialScore: getGroup1BestOfficialScore(row.slots, systemConfig, row.divisionGroup),
    }));
  }, [isFastBot, activeParticipations, teams, scores, getTeamStatus, systemConfig]);

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
      setActiveFastBotSlot(getDefaultFastBotSlotKey(selectedFastBotRow, systemConfig));
    }
  }, [isFastBot, selectedFastBotRow, activeFastBotSlot, systemConfig]);

  const handleOpenFastBotRow = (row) => {
    setSelectedFastBotPId(row.participationId);
    setActiveFastBotSlot(getDefaultFastBotSlotKey(row, systemConfig));
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
      setActiveGroup1Slot(getDefaultFastBotSlotKey(selectedGroup1Row, systemConfig));
    }
  }, [isFastBot, selectedGroup1Row, activeGroup1Slot, systemConfig]);

  const handleOpenGroup1Row = (row) => {
    setSelectedP(row.participationId);
    setActiveGroup1Slot(getDefaultFastBotSlotKey(row, systemConfig));
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

  if (isFastBot) {
    const esMsRows = visibleFastBotRows.filter(row => ['ES', 'MS'].includes(row.division));
    const hsUsRows = visibleFastBotRows.filter(row => ['HS', 'US'].includes(row.division));

    return (
      <div className="space-y-5">
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
          />
        ) : (
          <div className="space-y-4">
            <CollapsibleCard title={t(lang, 'fastbotEsMsTable')} badge={esMsRows.length} badgeColor="bg-brand-500">
              <FastBotScheduleTable title={t(lang, 'fastbotEsMsTable')} rows={esMsRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={esMsSlotKeys} />
            </CollapsibleCard>
            <CollapsibleCard title={t(lang, 'fastbotHsUsTable')} badge={hsUsRows.length} badgeColor="bg-brand-500">
              <FastBotScheduleTable title={t(lang, 'fastbotHsUsTable')} rows={hsUsRows} onSelectRow={handleOpenFastBotRow} lang={lang} showHeader={false} activeSlotKeys={hsUsSlotKeys} />
            </CollapsibleCard>
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

// ─── SumoWorkflow ─────────────────────────────────────────────────────────────

function SumoWorkflow({ category, participations, teams, scores, setScores, lang, showToast }) {
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

  const regions = useMemo(() => [...new Set(teamEntries.map(e => e.region))].sort(), [teamEntries]);

  const matchesByRegion = useMemo(() =>
    Object.fromEntries(
      regions.map(region => [
        region,
        generateRoundRobinMatches(teamEntries.filter(e => e.region === region), category.id, 'all', region),
      ]),
    ),
    [teamEntries, regions, category.id],
  );

  const timeMap = useMemo(() => buildTimeMap(matchesByRegion, regions), [matchesByRegion, regions]);
  const allMatches = useMemo(() => Object.values(matchesByRegion).flat(), [matchesByRegion]);
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);
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
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">{category.name} — Round Robin</p>
          <h4 className="text-xl font-black mt-1">{selectedMatch.title}</h4>
          {timeMap[selectedMatchId] && (
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-orange-400/40 bg-orange-500/20 px-2.5 py-1 text-[10px] font-black text-orange-300">
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

  const totalMatches = Object.values(matchesByRegion).reduce((sum, arr) => sum + arr.length, 0);
  const totalPlayed = allMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1 text-xs text-ink-500 font-semibold">
        <span>{lang === 'ar' ? 'المناطق:' : 'Regions:'} {regions.length}</span>
        <span>{lang === 'ar' ? 'المباريات:' : 'Matches:'} {totalPlayed}/{totalMatches} {lang === 'ar' ? 'مكتملة' : 'played'}</span>
      </div>
      <div className="space-y-3">
        {regions.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">{lang === 'ar' ? 'لا توجد فرق.' : 'No teams.'}</div>
        ) : regions.map(region => {
          const regionMatches = matchesByRegion[region] || [];
          const playedCount = regionMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;
          return (
            <CollapsibleCard key={region} title={`${lang === 'ar' ? 'منطقة' : 'Region'}: ${region}`} badge={`${playedCount}/${regionMatches.length}`} badgeColor="bg-orange-500">
              {regionMatches.length < 2 ? (
                <div className="px-4 py-6 text-center text-ink-400 text-sm">{lang === 'ar' ? 'يلزم فريقان على الأقل.' : 'At least 2 teams needed.'}</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {regionMatches.map((match, idx) => {
                    const matchScore = scores.find(s => s.pId === match.id && s.status === 'VALID');
                    const scheduledTime = timeMap?.[match.id];
                    return (
                      <button key={match.id} onClick={() => setSelectedMatchId(match.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-50/60 transition-colors text-left gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 flex flex-col items-center gap-0.5">
                            <span className="w-6 h-6 rounded-full bg-ink-100 text-ink-500 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                            {scheduledTime && <span className="text-[9px] font-black text-orange-500 whitespace-nowrap">{scheduledTime}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-ink-800 text-sm truncate">{match.teamA}</p>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">vs</p>
                            <p className="font-bold text-ink-800 text-sm truncate">{match.teamB}</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {matchScore ? (
                            <span className="inline-flex items-center rounded-full bg-saudi-50 border border-saudi-200 px-2.5 py-1 text-[10px] font-black text-saudi-700">{matchScore.score}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-ink-50 border border-ink-200 px-2.5 py-1 text-[10px] font-bold text-ink-400">{lang === 'ar' ? 'لم تُلعب' : 'Pending'}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CollapsibleCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── SoccerWorkflow ──────────────────────────────────────────────────────────

function SoccerWorkflow({ category, participations, teams, scores, setScores, lang, showToast }) {
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

  const regions = useMemo(() => [...new Set(teamEntries.map(e => e.region))].sort(), [teamEntries]);

  const matchesByRegion = useMemo(() =>
    Object.fromEntries(
      regions.map(region => [
        region,
        generateRoundRobinMatches(teamEntries.filter(e => e.region === region), category.id, 'all', region),
      ]),
    ),
    [teamEntries, regions, category.id],
  );

  const timeMap = useMemo(() => buildTimeMap(matchesByRegion, regions), [matchesByRegion, regions]);
  const allMatches = useMemo(() => Object.values(matchesByRegion).flat(), [matchesByRegion]);
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);
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
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-r from-[#061a27] to-[#0a2a3a] p-4 text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">{category.name} — Round Robin</p>
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

  const totalMatches = Object.values(matchesByRegion).reduce((sum, arr) => sum + arr.length, 0);
  const totalPlayed = allMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1 text-xs text-ink-500 font-semibold">
        <span>{lang === 'ar' ? 'المناطق:' : 'Regions:'} {regions.length}</span>
        <span>{lang === 'ar' ? 'المباريات:' : 'Matches:'} {totalPlayed}/{totalMatches} {lang === 'ar' ? 'مكتملة' : 'played'}</span>
      </div>
      <div className="space-y-3">
        {regions.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">{lang === 'ar' ? 'لا توجد فرق.' : 'No teams.'}</div>
        ) : regions.map(region => {
          const regionMatches = matchesByRegion[region] || [];
          const playedCount = regionMatches.filter(m => scores.some(s => s.pId === m.id && s.status === 'VALID')).length;
          return (
            <CollapsibleCard key={region} title={`${lang === 'ar' ? 'منطقة' : 'Region'}: ${region}`} badge={`${playedCount}/${regionMatches.length}`} badgeColor="bg-teal-600">
              {regionMatches.length < 2 ? (
                <div className="px-4 py-6 text-center text-ink-400 text-sm">{lang === 'ar' ? 'يلزم فريقان على الأقل.' : 'At least 2 teams needed.'}</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {regionMatches.map((match, idx) => {
                    const matchScore = scores.find(s => s.pId === match.id && s.status === 'VALID');
                    const scheduledTime = timeMap?.[match.id];
                    return (
                      <button key={match.id} onClick={() => setSelectedMatchId(match.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-50/60 transition-colors text-left gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 flex flex-col items-center gap-0.5">
                            <span className="w-6 h-6 rounded-full bg-ink-100 text-ink-500 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                            {scheduledTime && <span className="text-[9px] font-black text-teal-600 whitespace-nowrap">{scheduledTime}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-ink-800 text-sm truncate">{match.teamA}</p>
                            <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest">vs</p>
                            <p className="font-bold text-ink-800 text-sm truncate">{match.teamB}</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {matchScore ? (
                            <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[10px] font-black text-teal-700">{matchScore.score}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-ink-50 border border-ink-200 px-2.5 py-1 text-[10px] font-bold text-ink-400">{lang === 'ar' ? 'لم تُلعب' : 'Pending'}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CollapsibleCard>
          );
        })}
      </div>
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
              <SumoWorkflow category={selectedCategory} participations={participations} teams={teams} scores={scores} setScores={setScores} lang={lang} showToast={showToast} />
            )}
            {selectedCategory.group === 2 && selectedCategory.id === 'c2_soccer' && (
              <SoccerWorkflow category={selectedCategory} participations={participations} teams={teams} scores={scores} setScores={setScores} lang={lang} showToast={showToast} />
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
