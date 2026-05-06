// ─── Round-Robin schedule + standings (Sumo / SoccerBot) ─────────────────────
// Extracted from CompetingSystem so App.jsx and bracket utils can also reach it.
//
// Match shape: { id, teamA, teamB, teamAId, teamBId, title, categoryId }
//   NOTE: teamAId/teamBId here hold the **participationId**, not the team doc id.
//
// Score docs use `pId === match.id` and (for c2_sumo / c2_soccer) carry a
// `rawInput` object whose shape is consumed by `getMatchWinnerSide` in
// `bracket.js`.

import { getMatchWinnerSide, buildBracketForDivision } from './bracket';

// ─── Bucket grouping ────────────────────────────────────────────────────────
export const RR_BUCKETS_DEFAULT = [
  { key: 'ES / MS', divs: ['ES', 'MS'] },
  { key: 'HS / US', divs: ['HS', 'US'] },
];
export const RR_BUCKETS_BY_CATEGORY = {
  c2_soccer: [
    { key: 'ES',      divs: ['ES'] },
    { key: 'MS / HS', divs: ['MS', 'HS'] },
  ],
  c2_sumo: [
    { key: 'ES',      divs: ['ES'] },
    { key: 'MS',      divs: ['MS'] },
    { key: 'HS / US', divs: ['HS', 'US'] },
  ],
};
export function getRrBuckets(categoryId) {
  return RR_BUCKETS_BY_CATEGORY[categoryId] || RR_BUCKETS_DEFAULT;
}

// Deterministic Fisher-Yates with a numeric seed so the schedule stays stable
// across reloads / browsers (same teamlist + region → same order).
function seededShuffle(input, seedNumber) {
  const result = [...input];
  let s = seedNumber || 1;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateRoundRobinMatches(teamEntries, categoryId, divisionTag, region) {
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
  // Greedy reorder so the same team doesn't play back-to-back when avoidable.
  const ordered = [];
  const remaining = [...rawMatches];
  let lastTeams = new Set();
  while (remaining.length > 0) {
    let pickIdx = remaining.findIndex(m => !lastTeams.has(m.teamAId) && !lastTeams.has(m.teamBId));
    if (pickIdx === -1) pickIdx = remaining.findIndex(m => !(lastTeams.has(m.teamAId) && lastTeams.has(m.teamBId)));
    if (pickIdx === -1) pickIdx = 0;
    const picked = remaining.splice(pickIdx, 1)[0];
    ordered.push(picked);
    lastTeams = new Set([picked.teamAId, picked.teamBId]);
  }
  return ordered;
}

// ─── Standings ──────────────────────────────────────────────────────────────
// Returns an object keyed by participationId:
//   { participationId, teamId, teamName, region, division, wins, losses, draws, played, total }
//
// `entries` is the same array passed to generateRoundRobinMatches() — items
// have { participationId, teamId, teamName, division, region }.
export function computeRRStandings(rrMatches, scores, categoryId, entries) {
  const stats = {};
  const initRow = (e) => ({
    participationId: e.participationId,
    teamId: e.teamId,
    teamName: e.teamName,
    region: e.region,
    division: e.division,
    wins: 0, losses: 0, draws: 0, played: 0, total: 0,
  });
  entries.forEach(e => { stats[e.participationId] = initRow(e); });

  // Latest valid score per match.
  const latestByMatch = new Map();
  for (const s of scores) {
    if (!s || s.status !== 'VALID') continue;
    const prev = latestByMatch.get(s.pId);
    if (!prev || Number(s.id || 0) > Number(prev.id || 0)) latestByMatch.set(s.pId, s);
  }

  for (const m of rrMatches) {
    const rowA = stats[m.teamAId];
    const rowB = stats[m.teamBId];
    if (rowA) rowA.total++;
    if (rowB) rowB.total++;
    const score = latestByMatch.get(m.id);
    if (!score) continue;
    const winnerSide = getMatchWinnerSide({ ...m, isBye: false }, score);
    if (rowA) rowA.played++;
    if (rowB) rowB.played++;
    if (winnerSide === 'A') {
      if (rowA) rowA.wins++;
      if (rowB) rowB.losses++;
    } else if (winnerSide === 'B') {
      if (rowB) rowB.wins++;
      if (rowA) rowA.losses++;
    } else {
      // Draw / unresolved valid score
      if (rowA) rowA.draws++;
      if (rowB) rowB.draws++;
    }
  }
  return stats;
}

// True when every RR match in `rrMatches` has a VALID score recorded.
export function isRRComplete(rrMatches, scores) {
  if (!rrMatches || rrMatches.length === 0) return false;
  const validIds = new Set(scores.filter(s => s?.status === 'VALID').map(s => s.pId));
  return rrMatches.every(m => validIds.has(m.id));
}

// ─── Auto-bracket from Round-Robin winners ──────────────────────────────────
// For ONE bucket of one category: takes per-region RR matches + entries, waits
// until every region's RR is complete, then picks qualifiers (default = top
// half, min 1 per region) and builds a single knockout bracket combining all
// regional qualifiers for that bucket.
//
// Returns [] until ALL regions in the bucket have completed their RR.
//
// Match IDs are deterministic so scores survive reloads without writing the
// bracket to Firestore.
export function buildAutoBracketFromRR({
  rrMatchesByRegion,   // { region: [rrMatch, ...] }
  entriesByRegion,     // { region: [{ participationId, teamId, teamName, region, division }] }
  scores,
  categoryId,
  bucketKey,
  label,
  qualifiersPerRegion, // optional fn(region, entries, standings) → number
}) {
  const regions = Object.keys(rrMatchesByRegion || {});
  if (regions.length === 0) return [];

  // Gate: every region with ≥2 teams must have ALL its RR matches scored.
  for (const region of regions) {
    const rrM = rrMatchesByRegion[region] || [];
    const ents = entriesByRegion[region] || [];
    if (ents.length < 2) continue; // single-team region → no RR to wait on
    if (!isRRComplete(rrM, scores)) return [];
  }

  // Gather qualifiers from each region.
  const qualifiers = [];
  for (const region of regions) {
    const ents = entriesByRegion[region] || [];
    const rrM = rrMatchesByRegion[region] || [];
    if (ents.length === 0) continue;

    // Single-team region → that team auto-qualifies.
    if (ents.length === 1) {
      qualifiers.push({ ...ents[0], _wins: 0, _seedKey: `${region}_solo` });
      continue;
    }

    const stats = computeRRStandings(rrM, scores, categoryId, ents);
    const rows = Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.teamName.localeCompare(b.teamName);
    });
    const defaultCount = Math.max(1, Math.floor(rows.length / 2));
    const take = qualifiersPerRegion
      ? Math.max(1, Math.min(rows.length, qualifiersPerRegion(region, ents, rows)))
      : defaultCount;
    rows.slice(0, take).forEach((row, i) => {
      qualifiers.push({
        participationId: row.participationId,
        teamId: row.teamId,
        teamName: row.teamName,
        region: row.region,
        division: row.division,
        _wins: row.wins,
        _seedKey: `${region}_${i}`,
      });
    });
  }

  if (qualifiers.length < 2) return [];

  // Cross-region weaving: interleave qualifiers from each region so the top
  // seed from each region lands on a different side of the bracket.
  // We sort primarily by seed-rank-within-region (0 first), then by region
  // name, so #1s from each region come first, then #2s, etc.
  qualifiers.sort((a, b) => {
    const [aReg, aIdx] = a._seedKey.split('_');
    const [bReg, bIdx] = b._seedKey.split('_');
    const ai = Number(aIdx) || 0;
    const bi = Number(bIdx) || 0;
    if (ai !== bi) return ai - bi;
    return aReg.localeCompare(bReg);
  });

  // Strip helpers before passing to bracket builder.
  const entries = qualifiers.map(q => ({
    teamId: q.teamId,
    teamName: q.teamName,
    region: q.region,
    participationId: q.participationId,
  }));

  // Deterministic suffix from category + bucket so reloads keep the same IDs.
  const idSuffix = `auto_${bucketKey}`.replace(/[^A-Za-z0-9_]/g, '_');

  return buildBracketForDivision({
    entries,
    categoryId,
    division: bucketKey,
    label,
    presorted: true,
    idSuffix,
  });
}
