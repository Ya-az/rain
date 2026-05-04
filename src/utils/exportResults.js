// Export tournament results to a multi-sheet .xlsx file.
// Each category becomes a sheet with team standings (best score per team).
import * as XLSX from 'xlsx';

function getBestScore(participationId, scores, mode = 'min') {
  const vals = scores
    .filter(s => s.pId === participationId && s.status === 'VALID')
    .map(s => {
      const v = typeof s.score === 'number' ? s.score : (s.score?.total ?? s.score?.value ?? null);
      return Number.isFinite(Number(v)) ? Number(v) : null;
    })
    .filter(v => v !== null);
  if (vals.length === 0) return null;
  return mode === 'max' ? Math.max(...vals) : Math.min(...vals);
}

// Best score helper for matches (Sumo / Soccer): wins-losses-draws record.
function buildMatchRecord(teamId, matches, scores) {
  let wins = 0, losses = 0, draws = 0, played = 0;
  matches.forEach(m => {
    if (!m.teamAId || !m.teamBId) return;
    if (m.teamAId !== teamId && m.teamBId !== teamId) return;
    const matchScores = scores.filter(s => s.pId === m.id && s.status === 'VALID');
    if (matchScores.length === 0) return;
    played += 1;
    // Use latest score
    const latest = matchScores[matchScores.length - 1];
    const sc = latest.score || {};
    const a = sc.scoreA ?? sc.a ?? 0;
    const b = sc.scoreB ?? sc.b ?? 0;
    const isTeamA = m.teamAId === teamId;
    const own = isTeamA ? a : b;
    const opp = isTeamA ? b : a;
    if (own > opp) wins += 1;
    else if (own < opp) losses += 1;
    else draws += 1;
  });
  return { played, wins, losses, draws };
}

function buildCategorySheet(category, participations, teams, scores, group2Matches) {
  const catParts = participations.filter(p => p.categoryId === category.id);
  const rows = catParts.map(p => {
    const team = teams.find(t => t.id === p.teamId);
    if (!team) return null;
    const base = {
      'Participation ID': p.id,
      'Team Name': team.name,
      'Team Number': team.teamNumber || '',
      'Region': team.region || '',
      'Division': team.division || '',
      'Coach': team.coach?.name || '',
    };
    // FastBot or Line Following → best official slot score
    if (category.id === 'c1_fastbot') {
      base['Best Score (sec)'] = getBestScore(p.id, scores, 'min') ?? '';
    } else if (category.id === 'c1_linefollowing' || category.id === 'c1_amazeing') {
      base['Best Score'] = getBestScore(p.id, scores, 'max') ?? '';
    } else if (category.id === 'c2_sumo' || category.id === 'c2_soccerbot') {
      const catMatches = group2Matches.filter(m => m.categoryId === category.id);
      const rec = buildMatchRecord(p.teamId, catMatches, scores);
      base['Played'] = rec.played;
      base['Wins'] = rec.wins;
      base['Losses'] = rec.losses;
      base['Draws'] = rec.draws;
      base['Points'] = rec.wins * 3 + rec.draws;
    } else {
      // Group 3 (AI / open) — total score across attempts
      const partScores = scores.filter(s => s.pId === p.id && s.status === 'VALID');
      const total = partScores.reduce((sum, s) => {
        const v = typeof s.score === 'number' ? s.score : (s.score?.total ?? 0);
        return sum + (Number(v) || 0);
      }, 0);
      base['Attempts'] = partScores.length;
      base['Total Score'] = total;
    }
    return base;
  }).filter(Boolean);
  // Sort: Group 2 by Points desc, others by Best Score desc
  if (rows.length > 0) {
    if ('Points' in rows[0]) rows.sort((a, b) => (b.Points || 0) - (a.Points || 0));
    else if ('Best Score' in rows[0]) rows.sort((a, b) => (Number(b['Best Score']) || -Infinity) - (Number(a['Best Score']) || -Infinity));
    else if ('Total Score' in rows[0]) rows.sort((a, b) => (b['Total Score'] || 0) - (a['Total Score'] || 0));
    rows.forEach((r, i) => { r.Rank = i + 1; });
  }
  return rows;
}

export function exportResultsToExcel({ categories, participations, teams, scores, group2Matches }) {
  const wb = XLSX.utils.book_new();
  const summary = [];
  categories.forEach(cat => {
    const rows = buildCategorySheet(cat, participations, teams, scores, group2Matches);
    if (rows.length === 0) return;
    const ordered = rows.map(({ Rank, ...rest }) => ({ Rank, ...rest }));
    const ws = XLSX.utils.json_to_sheet(ordered);
    const sheetName = cat.name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || cat.id;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    summary.push({ Category: cat.name, Teams: rows.length });
  });
  if (summary.length > 0) {
    const sumWs = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, sumWs, 'Summary');
  }
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `roborave-results-${stamp}.xlsx`);
}
