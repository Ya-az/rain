// Print-to-PDF for tournament results. Opens a clean print window with a
// branded header + per-category leaderboards. The user picks "Save as PDF"
// from the system print dialog. No extra dependencies.
//
// Standings per category match the in-app & Excel export logic:
//   - FastBot: best official time (lower = better)
//   - LineFollowing / a-Maze-ing: best official points (higher = better)
//   - Sumo: 1pt per match win
//   - SoccerBot: 3-1-0 + GF/GA/GD
//   - Group 3: total of attempts (higher = better)

const REGION_FULL = {
  W: 'Western', C: 'Central', E: 'Eastern', F: 'FN',
  Western: 'Western', Central: 'Central', Eastern: 'Eastern', FN: 'FN',
};

function bestOfficial(participationId, scores, mode) {
  const vals = scores
    .filter(s => s.pId === participationId && s.status === 'VALID' && !['P1', 'P2'].includes(s.slotKey))
    .map(s => Number(typeof s.score === 'number' ? s.score : parseFloat(s.score)))
    .filter(v => Number.isFinite(v));
  if (vals.length === 0) return null;
  return mode === 'max' ? Math.max(...vals) : Math.min(...vals);
}

function parseMatchScore(scoreStr) {
  const s = String(scoreStr || '').trim();
  if (/forfeit/i.test(s)) {
    if (/^w\s*-\s*l/i.test(s)) return { a: 1, b: 0 };
    if (/^l\s*-\s*w/i.test(s)) return { a: 0, b: 1 };
  }
  const m = s.split('-').map(p => parseInt(p.trim(), 10));
  return { a: Number.isFinite(m[0]) ? m[0] : 0, b: Number.isFinite(m[1]) ? m[1] : 0 };
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

function buildLeaderboard(category, participations, teams, scores, group2Matches) {
  const catParts = participations.filter(p => p.categoryId === category.id);
  const catMatches = (group2Matches || []).filter(m => m.categoryId === category.id);

  const rows = catParts.map(p => {
    const team = teams.find(t => t.id === p.teamId);
    if (!team) return null;
    const baseRow = {
      teamName: team.name || '',
      teamNumber: team.teamNumber || '',
      division: team.division || '',
      region: REGION_FULL[team.region] || team.region || '',
    };

    if (category.id === 'c1_fastbot') {
      const v = bestOfficial(p.id, scores, 'min');
      return { ...baseRow, sortKey: v != null ? v : Infinity, sortDir: 'asc',
        scoreDisplay: v != null ? `${v.toFixed(2)}s` : '—', detail: '' };
    }
    if (category.id === 'c1_linefollow' || category.id === 'c1_amazeing') {
      const v = bestOfficial(p.id, scores, 'max');
      return { ...baseRow, sortKey: v != null ? v : -Infinity, sortDir: 'desc',
        scoreDisplay: v != null ? String(Math.round(v)) : '—', detail: '' };
    }
    if (category.id === 'c2_sumo') {
      const r = buildMatchRecord(p.teamId, catMatches, scores);
      return { ...baseRow, sortKey: r.wins, sortDir: 'desc',
        scoreDisplay: `${r.wins} pt${r.wins === 1 ? '' : 's'}`,
        detail: `${r.played} P · ${r.wins} W · ${r.draws} D · ${r.losses} L` };
    }
    if (category.id === 'c2_soccer') {
      const r = buildMatchRecord(p.teamId, catMatches, scores);
      const pts = r.wins * 3 + r.draws;
      return { ...baseRow, sortKey: pts, sortDir: 'desc', tieGd: r.gd, tieGf: r.gf,
        scoreDisplay: `${pts} pt${pts === 1 ? '' : 's'}`,
        detail: `${r.played} P · ${r.wins}-${r.draws}-${r.losses} · GF ${r.gf} · GA ${r.ga} · GD ${r.gd >= 0 ? '+' : ''}${r.gd}` };
    }
    // Group 3
    const partScores = scores.filter(s => s.pId === p.id && s.status === 'VALID');
    const total = partScores.reduce((sum, s) => {
      const v = typeof s.score === 'number' ? s.score : parseFloat(s.score);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
    return { ...baseRow, sortKey: total, sortDir: 'desc',
      scoreDisplay: total ? String(Number(total.toFixed(2))) : '—',
      detail: `${partScores.length} attempt${partScores.length === 1 ? '' : 's'}` };
  }).filter(Boolean);

  if (rows.length > 0) {
    const dir = rows[0].sortDir;
    rows.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return dir === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey;
      if (category.id === 'c2_soccer') {
        if ((b.tieGd || 0) !== (a.tieGd || 0)) return (b.tieGd || 0) - (a.tieGd || 0);
        if ((b.tieGf || 0) !== (a.tieGf || 0)) return (b.tieGf || 0) - (a.tieGf || 0);
      }
      return String(a.teamName).localeCompare(String(b.teamName));
    });
  }
  return rows;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function printResultsPdf({ categories, participations = [], teams = [], scores = [], group2Matches = [], lang = 'en' }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) return;

  const sectionsHtml = categories.map(cat => {
    const rows = buildLeaderboard(cat, participations, teams, scores, group2Matches);
    if (rows.length === 0) {
      return `<section class="cat"><h2>${escapeHtml(cat.name)}</h2><p class="empty">${tx('No results yet.', 'لا توجد نتائج بعد.')}</p></section>`;
    }
    const tbody = rows.map((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      return `<tr class="${i < 3 ? 'top' : ''}">
        <td class="rank">${medal} <span>#${i + 1}</span></td>
        <td class="team"><div class="tname">${escapeHtml(r.teamName)}</div>${r.teamNumber ? `<div class="tnum">#${escapeHtml(r.teamNumber)}</div>` : ''}</td>
        <td>${escapeHtml(r.division)}</td>
        <td>${escapeHtml(r.region)}</td>
        <td class="score">${escapeHtml(r.scoreDisplay)}${r.detail ? `<div class="detail">${escapeHtml(r.detail)}</div>` : ''}</td>
      </tr>`;
    }).join('');
    return `<section class="cat">
      <h2>${escapeHtml(cat.name)} <span class="count">(${rows.length} ${tx('teams', 'فريق')})</span></h2>
      <table>
        <thead><tr>
          <th>${tx('Rank', 'المركز')}</th>
          <th>${tx('Team', 'الفريق')}</th>
          <th>${tx('Division', 'الفئة')}</th>
          <th>${tx('Region', 'المنطقة')}</th>
          <th class="score-h">${tx('Score', 'النتيجة')}</th>
        </tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </section>`;
  }).join('');

  win.document.write(`<!doctype html><html lang="${lang}" dir="${dir}"><head>
    <meta charset="utf-8" />
    <title>${tx('Tournament Results', 'نتائج البطولة')} — RoboRAVE 2026</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Tahoma',sans-serif;color:#0A2A3A;margin:0;padding:24px;background:#fff}
      header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #0A2A3A;padding-bottom:14px;margin-bottom:18px}
      header img{height:46px}
      header h1{margin:0;font-size:22px;font-weight:900}
      header .meta{margin-inline-start:auto;text-align:end;font-size:11px;color:#666}
      h2{font-size:15px;margin:18px 0 8px;border-inline-start:4px solid #0A2A3A;padding-inline-start:8px}
      h2 .count{font-weight:400;color:#888;font-size:12px;margin-inline-start:4px}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
      th,td{padding:6px 8px;text-align:start;border-bottom:1px solid #e5e7eb;vertical-align:top}
      th{background:#f1f5f9;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
      tr.top{background:#fff7ed}
      td.rank{font-weight:800;width:80px;white-space:nowrap}
      td.team .tname{font-weight:700}
      td.team .tnum{font-size:9px;color:#888;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      td.score{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;text-align:end;width:160px}
      td.score .detail{font-size:9px;color:#666;font-weight:500;margin-top:2px}
      th.score-h{text-align:end}
      .empty{font-size:11px;color:#999;font-style:italic;margin:4px 0 14px}
      .cat{page-break-inside:avoid}
      @media print {body{padding:14px} header{margin-bottom:12px}}
    </style>
  </head><body>
    <header>
      <img src="${window.location.origin}/img/rain-o.png" alt="RAIN" />
      <h1>${tx('Tournament Results', 'نتائج البطولة')}</h1>
      <div class="meta">RoboRAVE 2026<br>${new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</div>
    </header>
    ${sectionsHtml}
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
  </body></html>`);
  win.document.close();
}
