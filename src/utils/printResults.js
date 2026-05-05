// Print-to-PDF for tournament results. Opens a clean print window with a
// branded header + per-category leaderboards. The user picks "Save as PDF"
// from the system print dialog. No extra dependencies.

function fastBotSort(a, b) { return a.scoreNum - b.scoreNum; } // lower is better
function pointsSort(a, b)  { return b.scoreNum - a.scoreNum; } // higher is better

function buildLeaderboard(category, participations, teams, scores) {
  const isFastBot = category.id === 'c1_fastbot';
  const rows = scores
    .filter(s => s.status === 'VALID')
    .map(s => {
      const p = participations.find(pp => pp.id === s.pId);
      if (!p || p.categoryId !== category.id) return null;
      if (isFastBot && ['P1', 'P2'].includes(s.slotKey)) return null;
      const team = teams.find(tm => tm.id === p.teamId);
      return {
        teamName: team?.name || s.pId,
        division: team?.division || '',
        region: team?.region || '',
        scoreNum: parseFloat(s.score) || 0,
        scoreDisplay: isFastBot ? `${(parseFloat(s.score) || 0).toFixed(2)}s` : String(s.score),
      };
    })
    .filter(Boolean);
  rows.sort(isFastBot ? fastBotSort : pointsSort);
  return rows;
}

export function printResultsPdf({ categories, participations = [], teams = [], scores = [], lang = 'en' }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) return;

  const sectionsHtml = categories.map(cat => {
    const rows = buildLeaderboard(cat, participations, teams, scores);
    if (rows.length === 0) {
      return `<section class="cat"><h2>${cat.name}</h2><p class="empty">${tx('No results yet.', 'لا توجد نتائج بعد.')}</p></section>`;
    }
    const tbody = rows.map((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      return `<tr class="${i < 3 ? 'top' : ''}">
        <td class="rank">${medal} <span>#${i + 1}</span></td>
        <td class="team">${escapeHtml(r.teamName)}</td>
        <td>${escapeHtml(r.division)}</td>
        <td>${escapeHtml(r.region)}</td>
        <td class="score">${escapeHtml(r.scoreDisplay)}</td>
      </tr>`;
    }).join('');
    return `<section class="cat">
      <h2>${escapeHtml(cat.name)} <span class="count">(${rows.length})</span></h2>
      <table>
        <thead><tr>
          <th>${tx('Rank', 'المركز')}</th>
          <th>${tx('Team', 'الفريق')}</th>
          <th>${tx('Division', 'الفئة')}</th>
          <th>${tx('Region', 'المنطقة')}</th>
          <th>${tx('Score', 'النتيجة')}</th>
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
      th,td{padding:6px 8px;text-align:start;border-bottom:1px solid #e5e7eb}
      th{background:#f1f5f9;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
      tr.top{background:#fff7ed}
      td.rank{font-weight:800;width:80px}
      td.team{font-weight:700}
      td.score{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;text-align:end;width:90px}
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

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
