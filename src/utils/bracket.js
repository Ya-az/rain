// ─── Single-elimination bracket utilities ────────────────────────────────────
// Used for c2_sumo and c2_soccer knockout stages.
// Match docs live in Firestore `group2Matches` with these extra fields:
//   bracket:      true
//   round:        'R1' | 'R2' | 'QF' | 'SF' | 'F'  (label shown to user)
//   roundIndex:   0 = first played round, ascending
//   matchIndex:   position within the round (0-based)
//   nextMatchId:  id of the match the winner advances into (null for Final)
//   nextSlot:     'A' | 'B' (which side of nextMatch the winner fills)
//   isBye:        true when teamB is empty (auto-advance teamA)
//
// teamA/teamB/teamAId/teamBId may be empty strings for matches that depend on
// previous-round winners; resolveBracket() fills them at render time.

const BYE = '— BYE —';

// Standard seed pairing for a power-of-two bracket of size n
// Returns array of [seedA, seedB] pairs (1-indexed seeds).
// e.g. n=8 → [[1,8],[4,5],[2,7],[3,6]]
function buildSeedOrder(n) {
  let order = [1, 2];
  while (order.length < n) {
    const next = [];
    const total = order.length * 2 + 1;
    for (const seed of order) {
      next.push(seed);
      next.push(total - seed);
    }
    order = next;
  }
  // Convert flat order into pairs
  const pairs = [];
  for (let i = 0; i < order.length; i += 2) {
    pairs.push([order[i], order[i + 1]]);
  }
  return pairs;
}

function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 2);
}

function roundLabel(roundIndex, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIndex;
  if (fromEnd === 0) return 'F';
  if (fromEnd === 1) return 'SF';
  if (fromEnd === 2) return 'QF';
  return `R${Math.pow(2, fromEnd + 1)}`; // R16, R32...
}

// Build skeleton matches for one (categoryId, division) bracket.
// `entries` is an array of { teamId, teamName, region }, already filtered to
// checked-in teams. We Fisher-Yates shuffle them so seeds are random.
export function buildBracketForDivision({ entries, categoryId, division, label }) {
  if (!entries || entries.length < 2) return [];

  // Shuffle
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const bracketSize = nextPow2(shuffled.length);
  const totalRounds = Math.log2(bracketSize);
  const seedPairs = buildSeedOrder(bracketSize);

  // Map seed → entry (or null for BYE slots — top seeds get the BYEs)
  const slots = new Array(bracketSize).fill(null);
  shuffled.forEach((entry, idx) => { slots[idx] = entry; });

  const ts = Date.now();
  const mkId = (round, mi) => `bracket_${categoryId}_${division}_${round}_${mi}_${ts}`;

  const matches = [];

  // ── Round 0 (first round) ──
  const round0Label = roundLabel(0, totalRounds);
  const round0Matches = seedPairs.map(([a, b], mi) => {
    const entryA = slots[a - 1];
    const entryB = slots[b - 1];
    return {
      id: mkId(round0Label, mi),
      categoryId,
      division,
      bracket: true,
      round: round0Label,
      roundIndex: 0,
      matchIndex: mi,
      teamA: entryA?.teamName || '',
      teamB: entryB?.teamName || BYE,
      teamAId: entryA?.teamId || '',
      teamBId: entryB?.teamId || '',
      isBye: !entryA || !entryB,
      title: `${entryA?.teamName || '?'} vs ${entryB?.teamName || BYE} (${label} • ${division} • ${round0Label})`,
      nextMatchId: null,
      nextSlot: null,
    };
  });
  matches.push(...round0Matches);

  // ── Subsequent rounds (skeletons with empty teams) ──
  let prevRoundCount = round0Matches.length;
  for (let r = 1; r < totalRounds; r++) {
    const lbl = roundLabel(r, totalRounds);
    const count = prevRoundCount / 2;
    for (let mi = 0; mi < count; mi++) {
      matches.push({
        id: mkId(lbl, mi),
        categoryId,
        division,
        bracket: true,
        round: lbl,
        roundIndex: r,
        matchIndex: mi,
        teamA: '',
        teamB: '',
        teamAId: '',
        teamBId: '',
        isBye: false,
        title: `${label} • ${division} • ${lbl} #${mi + 1}`,
        nextMatchId: null,
        nextSlot: null,
      });
    }
    prevRoundCount = count;
  }

  // ── Wire nextMatchId / nextSlot ──
  for (let r = 0; r < totalRounds - 1; r++) {
    const thisRound = matches.filter(m => m.roundIndex === r).sort((a, b) => a.matchIndex - b.matchIndex);
    const nextRound = matches.filter(m => m.roundIndex === r + 1).sort((a, b) => a.matchIndex - b.matchIndex);
    thisRound.forEach((m, idx) => {
      const target = nextRound[Math.floor(idx / 2)];
      m.nextMatchId = target?.id || null;
      m.nextSlot = idx % 2 === 0 ? 'A' : 'B';
    });
  }

  return matches;
}

// Derive who won a single bracket match from its score doc(s).
// For Sumo / SoccerBot raw input, we already know how to read the winner.
export function getMatchWinnerSide(match, scoreObj) {
  if (!match || match.isBye) return match?.isBye ? 'A' : null;
  if (!scoreObj || scoreObj.status !== 'VALID') return null;
  const raw = scoreObj.rawInput || {};

  // Sumo (c2_sumo): rawInput has r1/r2/r3 ('A'|'B'|'Draw'|null)
  if (match.categoryId === 'c2_sumo') {
    if (raw.showA && !raw.showB) return 'A';
    if (!raw.showA && raw.showB) return 'B';
    const wA = ['r1', 'r2', 'r3'].filter(k => raw[k] === 'A').length;
    const wB = ['r1', 'r2', 'r3'].filter(k => raw[k] === 'B').length;
    if (wA > wB) return 'A';
    if (wB > wA) return 'B';
    return null; // draw → no advancement (admin must replay)
  }

  // SoccerBot (c2_soccer): rawInput has goalsA/goalsB
  if (match.categoryId === 'c2_soccer') {
    if (raw.showA && !raw.showB) return 'A';
    if (!raw.showA && raw.showB) return 'B';
    const ga = Number(raw.goalsA) || 0;
    const gb = Number(raw.goalsB) || 0;
    if (ga > gb) return 'A';
    if (gb > ga) return 'B';
    return null;
  }

  // Fallback: parse "X - Y" score string
  const parts = String(scoreObj.score || '').split('-').map(s => Number(s.trim()));
  if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    if (parts[0] > parts[1]) return 'A';
    if (parts[1] > parts[0]) return 'B';
  }
  return null;
}

// Resolve bracket: walk from earliest round forward, propagating winners
// into successor matches. Returns an array of enriched matches with
// teamA/teamB filled in where derivable.
export function resolveBracket(matches, scores) {
  if (!matches || matches.length === 0) return [];

  const byId = new Map(matches.map(m => [m.id, { ...m }]));
  const sorted = [...byId.values()].sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex);

  const winnerScoreById = new Map();
  scores.forEach(s => {
    if (!s || s.status !== 'VALID') return;
    if (!byId.has(s.pId)) return;
    const prev = winnerScoreById.get(s.pId);
    // Use the latest valid score (highest id)
    if (!prev || Number(s.id || 0) > Number(prev.id || 0)) {
      winnerScoreById.set(s.pId, s);
    }
  });

  for (const match of sorted) {
    const scoreObj = winnerScoreById.get(match.id) || null;
    const winnerSide = getMatchWinnerSide(match, scoreObj);
    match._scoreObj = scoreObj;
    match._winnerSide = winnerSide;
    if (winnerSide) {
      match._winnerTeamId = winnerSide === 'A' ? match.teamAId : match.teamBId;
      match._winnerTeamName = winnerSide === 'A' ? match.teamA : match.teamB;
    } else {
      match._winnerTeamId = '';
      match._winnerTeamName = '';
    }

    // Propagate
    if (match.nextMatchId && match._winnerTeamId) {
      const target = byId.get(match.nextMatchId);
      if (target) {
        if (match.nextSlot === 'A') {
          target.teamA = match._winnerTeamName;
          target.teamAId = match._winnerTeamId;
        } else if (match.nextSlot === 'B') {
          target.teamB = match._winnerTeamName;
          target.teamBId = match._winnerTeamId;
        }
        // Refresh title once both sides resolved
        if (target.teamA && target.teamB) {
          const lbl = `${target.title.split(' • ').slice(-2).join(' • ')}`; // keep "DIV • Rxx"
          target.title = `${target.teamA} vs ${target.teamB} • ${lbl}`;
        }
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex);
}

// Group resolved bracket matches by division for rendering.
export function groupBracketByDivision(resolvedMatches) {
  const out = {};
  for (const m of resolvedMatches) {
    if (!out[m.division]) out[m.division] = [];
    out[m.division].push(m);
  }
  return out;
}

// Group matches in one division by round.
export function groupByRound(divisionMatches) {
  const map = new Map();
  for (const m of divisionMatches) {
    if (!map.has(m.roundIndex)) map.set(m.roundIndex, []);
    map.get(m.roundIndex).push(m);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([roundIndex, list]) => ({
      roundIndex,
      round: list[0].round,
      matches: list.sort((a, b) => a.matchIndex - b.matchIndex),
    }));
}
