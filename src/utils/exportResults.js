// Export tournament results to a multi-sheet .xlsx file.
// One sheet per category, plus a Summary sheet at the front.
// - FastBot: best official time (lower = better)
// - LineFollowing / a-Maze-ing: best official points (higher = better)
// - Sumo: round-robin record (1pt per match win, no draw points)
// - SoccerBot: round-robin record (3-1-0) + GF/GA/GD
// - Group 3 (AI / Web / Gaming): total points across attempts
import * as XLSX from 'xlsx';

// ─── Score helpers ──────────────────────────────────────────────────────────

const REGION_FULL = {
  W: 'Western', C: 'Central', E: 'Eastern', F: 'FN',
  Western: 'Western', Central: 'Central', Eastern: 'Eastern', FN: 'FN',
};

function bestOfficial(participationId, scores, mode) {
  // Skip practice slots (P1, P2). Official slots are R1, R2, R3, R4.
  const vals = scores
    .filter(s => s.pId === participationId && s.status === 'VALID' && !['P1', 'P2'].includes(s.slotKey))
    .map(s => Number(typeof s.score === 'number' ? s.score : parseFloat(s.score)))
    .filter(v => Number.isFinite(v));
  if (vals.length === 0) return null;
  return mode === 'max' ? Math.max(...vals) : Math.min(...vals);
}

// Parse a match score string like "3 - 1" or "W - L (Forfeit)" into {a, b}.
function parseMatchScore(scoreStr) {
  const s = String(scoreStr || '').trim();
  if (/forfeit/i.test(s)) {
    if (/^w\s*-\s*l/i.test(s)) return { a: 1, b: 0, forfeit: true };
    if (/^l\s*-\s*w/i.test(s)) return { a: 0, b: 1, forfeit: true };
  }
  const m = s.split('-').map(p => parseInt(p.trim(), 10));
  return {
    a: Number.isFinite(m[0]) ? m[0] : 0,
    b: Number.isFinite(m[1]) ? m[1] : 0,
    forfeit: false,
  };
}

function buildMatchRecord(teamId, matches, scores) {
  let wins = 0, losses = 0, draws = 0, played = 0, gf = 0, ga = 0;
  matches.forEach(m => {
    if (!m.teamAId || !m.teamBId) return;
    if (m.teamAId !== teamId && m.teamBId !== teamId) return;
    const sc = scores.find(s => s.pId === m.id && s.status === 'VALID');
    if (!sc) return;
    const { a, b } = parseMatchScore(sc.score);
    played += 1;
    const isA = m.teamAId === teamId;
    const own = isA ? a : b;
    const opp = isA ? b : a;
    gf += own; ga += opp;
    if (own > opp) wins += 1;
    else if (own < opp) losses += 1;
    else draws += 1;
  });
  return { played, wins, losses, draws, gf, ga, gd: gf - ga };
}

// ─── Sheet builders ─────────────────────────────────────────────────────────

function buildCategoryRows(category, participations, teams, scores, group2Matches) {
  const catParts = participations.filter(p => p.categoryId === category.id);
  const catMatches = (group2Matches || []).filter(m => m.categoryId === category.id);

  const rows = catParts.map(p => {
    const team = teams.find(t => t.id === p.teamId);
    if (!team) return null;
    const base = {
      'Team Name': team.name || '',
      'Team Number': team.teamNumber || '',
      'Region': REGION_FULL[team.region] || team.region || '',
      'Division': team.division || '',
      'Coach': team.coach?.name || '',
      'Participation ID': p.id,
    };

    if (category.id === 'c1_fastbot') {
      const best = bestOfficial(p.id, scores, 'min');
      base['Best Time (s)'] = best != null ? Number(best.toFixed(2)) : '';
      base.__sortKey = best != null ? best : Infinity;
      base.__sortDir = 'asc';
    } else if (category.id === 'c1_linefollow' || category.id === 'c1_amazeing') {
      const best = bestOfficial(p.id, scores, 'max');
      base['Best Score'] = best != null ? Math.round(best) : '';
      base.__sortKey = best != null ? best : -Infinity;
      base.__sortDir = 'desc';
    } else if (category.id === 'c2_sumo') {
      const r = buildMatchRecord(p.teamId, catMatches, scores);
      base['Played'] = r.played;
      base['Wins'] = r.wins;
      base['Draws'] = r.draws;
      base['Losses'] = r.losses;
      // Sumo: 1 point per match win
      base['Points'] = r.wins;
      base.__sortKey = r.wins;
      base.__sortDir = 'desc';
    } else if (category.id === 'c2_soccer') {
      const r = buildMatchRecord(p.teamId, catMatches, scores);
      base['Played'] = r.played;
      base['Wins'] = r.wins;
      base['Draws'] = r.draws;
      base['Losses'] = r.losses;
      base['Goals For'] = r.gf;
      base['Goals Against'] = r.ga;
      base['Goal Diff'] = r.gd;
      base['Points'] = r.wins * 3 + r.draws;
      base.__sortKey = r.wins * 3 + r.draws;
      base.__sortDir = 'desc';
    } else {
      // Group 3 (AI / Web / Gaming) — total of attempts
      const partScores = scores.filter(s => s.pId === p.id && s.status === 'VALID');
      const total = partScores.reduce((sum, s) => {
        const v = typeof s.score === 'number' ? s.score : parseFloat(s.score);
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0);
      base['Attempts'] = partScores.length;
      base['Total Score'] = Number(total.toFixed(2));
      base.__sortKey = total;
      base.__sortDir = 'desc';
    }
    return base;
  }).filter(Boolean);

  if (rows.length > 0) {
    const dir = rows[0].__sortDir;
    rows.sort((a, b) => {
      const av = a.__sortKey, bv = b.__sortKey;
      if (av !== bv) return dir === 'asc' ? av - bv : bv - av;
      if (category.id === 'c2_soccer') {
        if ((b['Goal Diff'] || 0) !== (a['Goal Diff'] || 0)) return (b['Goal Diff'] || 0) - (a['Goal Diff'] || 0);
        if ((b['Goals For'] || 0) !== (a['Goals For'] || 0)) return (b['Goals For'] || 0) - (a['Goals For'] || 0);
      }
      return String(a['Team Name']).localeCompare(String(b['Team Name']));
    });
    rows.forEach((r, i) => { r.Rank = i + 1; });
  }

  return rows.map(({ __sortKey, __sortDir, Rank, ...rest }) => ({ Rank, ...rest }));
}

function autoFitColumns(rows) {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map(k => {
    const maxLen = Math.max(
      String(k).length,
      ...rows.map(r => String(r[k] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 8), 38) };
  });
}

function styleSheet(ws, rows) {
  if (rows.length === 0) return;
  ws['!cols'] = autoFitColumns(rows);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function exportResultsToExcel({ categories, participations, teams, scores, group2Matches }) {
  const wb = XLSX.utils.book_new();
  const summary = [];
  const usedNames = new Set();

  categories.forEach(cat => {
    const rows = buildCategoryRows(cat, participations, teams, scores, group2Matches);
    if (rows.length === 0) {
      summary.push({ Category: cat.name, Group: cat.group, Teams: 0, 'Top Team': '—', 'Top Score': '—' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    styleSheet(ws, rows);

    let sheetName = cat.name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || cat.id;
    const baseName = sheetName;
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      sheetName = `${baseName.slice(0, 28)} (${suffix++})`;
    }
    usedNames.add(sheetName);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const top = rows[0];
    const scoreField = ['Best Time (s)', 'Best Score', 'Points', 'Total Score'].find(k => k in top);
    summary.push({
      Category: cat.name,
      Group: cat.group,
      Teams: rows.length,
      'Top Team': top['Team Name'],
      'Top Score': scoreField ? top[scoreField] : '—',
    });
  });

  if (summary.length > 0) {
    const sumWs = XLSX.utils.json_to_sheet(summary);
    styleSheet(sumWs, summary);
    XLSX.utils.book_append_sheet(wb, sumWs, 'Summary');
    wb.SheetNames = ['Summary', ...wb.SheetNames.filter(n => n !== 'Summary')];
  }

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  XLSX.writeFile(wb, `RoboRAVE-2026-Results-${stamp}.xlsx`);
}
