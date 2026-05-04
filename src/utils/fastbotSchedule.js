export const FASTBOT_SLOT_KEYS = ['P1', 'P2', 'R1', 'R2', 'R3', 'R4', 'R5'];
export const FASTBOT_OFFICIAL_SLOT_KEYS = ['R1', 'R2', 'R3', 'R4', 'R5'];

function resolveRounds(systemConfig, divisionGroup, categoryId, type) {
  const byCat = type === 'official'
    ? systemConfig?.officialRoundsByCategory?.[categoryId]?.[divisionGroup]
    : systemConfig?.practiceRoundsByCategory?.[categoryId]?.[divisionGroup];
  if (Number.isFinite(byCat)) return byCat;
  if (type === 'official') return systemConfig?.fastbotOfficialRounds?.[divisionGroup] ?? 5;
  return systemConfig?.fastbotPracticeRounds?.[divisionGroup] ?? 2;
}

export function getActiveSlotKeys(systemConfig, divisionGroup = 'es_ms', categoryId) {
  const numPractice = resolveRounds(systemConfig, divisionGroup, categoryId, 'practice');
  const numOfficial = resolveRounds(systemConfig, divisionGroup, categoryId, 'official');
  const practiceKeys = Array.from({ length: numPractice }, (_, i) => `P${i + 1}`);
  const officialKeys = Array.from({ length: numOfficial }, (_, i) => `R${i + 1}`);
  return [...practiceKeys, ...officialKeys];
}

export function getActiveOfficialSlotKeys(systemConfig, divisionGroup = 'es_ms', categoryId) {
  const numOfficial = resolveRounds(systemConfig, divisionGroup, categoryId, 'official');
  return Array.from({ length: numOfficial }, (_, i) => `R${i + 1}`);
}

const EMPTY_SCORE_LABEL = '--';

export function formatFastBotScore(scoreValue) {
  return Number.isFinite(scoreValue) ? `${scoreValue.toFixed(2)}s` : EMPTY_SCORE_LABEL;
}

export function getFastBotSlotIndex(slotKey) {
  return FASTBOT_SLOT_KEYS.indexOf(slotKey);
}

export function getFastBotDivisionGroup(division) {
  return ['HS', 'US'].includes(division) ? 'hs_us' : 'es_ms';
}

export function getFastBotSlotOrder(slotKey, systemConfig, divisionGroup = 'es_ms', categoryId) {
  const activeKeys = getActiveSlotKeys(systemConfig, divisionGroup, categoryId);
  const slotIndex = activeKeys.indexOf(slotKey);
  return slotIndex === -1 ? 1 : slotIndex + 1;
}

export function getFastBotScoreObject(scores, participationId, slotKey) {
  return [...scores]
    .filter(score => score.pId === participationId && score.slotKey === slotKey)
    .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))[0] || null;
}

export function getFastBotScoreValue(scoreObj) {
  const value = parseFloat(scoreObj?.score);
  return Number.isFinite(value) ? value : null;
}

export function getFastBotBestOfficialScore(slots, systemConfig, divisionGroup = 'es_ms', categoryId) {
  const officialKeys = getActiveOfficialSlotKeys(systemConfig, divisionGroup, categoryId);
  const officialScores = officialKeys
    .map(slotKey => getFastBotScoreValue(slots?.[slotKey]?.scoreObj))
    .filter(scoreValue => Number.isFinite(scoreValue));

  if (officialScores.length === 0) return null;
  return Math.min(...officialScores);
}

export function formatGroup1Score(scoreValue) {
  return Number.isFinite(scoreValue) ? String(Math.round(scoreValue)) : '--';
}

export function getGroup1BestOfficialScore(slots, systemConfig, divisionGroup = 'es_ms', categoryId) {
  const officialKeys = getActiveOfficialSlotKeys(systemConfig, divisionGroup, categoryId);
  const officialScores = officialKeys
    .map(slotKey => getFastBotScoreValue(slots?.[slotKey]?.scoreObj))
    .filter(scoreValue => Number.isFinite(scoreValue));
  if (officialScores.length === 0) return null;
  return Math.max(...officialScores);
}

export function getFastBotCellDisplay(slot) {
  return {
    scoreLabel: formatFastBotScore(getFastBotScoreValue(slot?.scoreObj)),
  };
}

export function getDefaultFastBotSlotKey(row, systemConfig, categoryId) {
  const divisionGroup = getFastBotDivisionGroup(row?.division || '');
  const activeKeys = getActiveSlotKeys(systemConfig, divisionGroup, categoryId);
  const pendingSlot = activeKeys.find(slotKey => !row?.slots?.[slotKey]?.scoreObj);
  return pendingSlot || activeKeys[0];
}

export function buildFastBotScheduleRows(participations, teams, scores, systemConfig, categoryId) {
  const teamLookup = new Map(teams.map(team => [team.id, team]));
  const scopedParticipations = participations.filter(participation => teamLookup.has(participation.teamId));

  return scopedParticipations.map((participation) => {
    const team = teamLookup.get(participation.teamId);
    const division = team?.division || '';
    const groupKey = getFastBotDivisionGroup(division);
    const activeSlotKeys = getActiveSlotKeys(systemConfig, groupKey, categoryId);
    const slots = Object.fromEntries(
      activeSlotKeys.map(slotKey => [
        slotKey,
        {
          key: slotKey,
          scoreObj: getFastBotScoreObject(scores, participation.id, slotKey),
        },
      ]),
    );

    return {
      participationId: participation.id,
      teamId: participation.teamId,
      teamName: team?.name || participation.id,
      division,
      divisionGroup: groupKey,
      region: team?.region || '',
      slots,
      bestOfficialScore: getFastBotBestOfficialScore(slots, systemConfig, groupKey, categoryId),
    };
  });
}