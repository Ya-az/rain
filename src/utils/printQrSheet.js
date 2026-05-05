// Generates a print-friendly window with one card per team containing a QR
// code (encoding the team id) plus team name, region, division and the
// participation IDs. Designed to print on A4 — 6 cards per page.

import QRCode from 'qrcode';

export async function printTeamQrSheet({ teams, participations, categories, lang = 'en' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  if (!teams || teams.length === 0) {
    alert(tx('No teams to print.', 'لا توجد فرق للطباعة.'));
    return;
  }

  // Pre-generate all QR data URLs in parallel.
  const cards = await Promise.all(
    teams.map(async (team) => {
      const dataUrl = await QRCode.toDataURL(team.id, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
      const teamParts = participations.filter(p => p.teamId === team.id);
      const cats = teamParts
        .map(p => categories.find(c => c.id === p.categoryId)?.name)
        .filter(Boolean);
      const partIds = teamParts.map(p => p.id).join(' · ');
      return { team, dataUrl, cats, partIds };
    })
  );

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const title = tx('Team QR Sheets', 'رموز QR للفِرَق');
  const labelTeam = tx('TEAM', 'الفريق');
  const labelRegion = tx('Region', 'المنطقة');
  const labelDivision = tx('Division', 'المرحلة');
  const labelCategories = tx('Categories', 'التحديات');
  const labelScanInstr = tx('Scan to check in', 'امسح لتسجيل الحضور');

  const html = `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: ${lang === 'ar' ? "'Tajawal', 'Cairo', system-ui" : "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}; margin: 0; padding: 16px; background: #f4f4f5; color: #111; }
  .toolbar { position: sticky; top: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .toolbar h1 { font-size: 16px; font-weight: 800; margin: 0; }
  .toolbar button { background: #0d9488; color: #fff; border: 0; padding: 9px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
  .toolbar button:hover { background: #0f766e; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .card { border: 2px dashed #cbd5e1; border-radius: 14px; padding: 16px; background: #fff; display: flex; gap: 14px; align-items: center; page-break-inside: avoid; break-inside: avoid; }
  .qr { width: 120px; height: 120px; flex-shrink: 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
  .qr img { width: 100%; height: 100%; display: block; }
  .info { flex: 1; min-width: 0; }
  .label { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; color: #94a3b8; text-transform: uppercase; }
  .name { font-size: 16px; font-weight: 900; color: #0f172a; margin: 2px 0 6px; line-height: 1.2; word-break: break-word; }
  .meta { font-size: 11px; color: #475569; line-height: 1.5; }
  .meta strong { color: #0f172a; font-weight: 700; }
  .ids { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #64748b; margin-top: 4px; word-break: break-all; }
  .scan-tip { font-size: 9px; color: #94a3b8; font-weight: 700; margin-top: 8px; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .toolbar { display: none; }
    .grid { gap: 8px; }
    .card { break-inside: avoid; box-shadow: none; }
    @page { size: A4; margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <h1>${title} — ${cards.length} ${tx('cards', 'بطاقة')}</h1>
    <button onclick="window.print()">${tx('Print / Save as PDF', 'طباعة / حفظ PDF')}</button>
  </div>
  <div class="grid">
    ${cards.map(({ team, dataUrl, cats, partIds }) => `
      <div class="card">
        <div class="qr"><img src="${dataUrl}" alt="QR" /></div>
        <div class="info">
          <div class="label">${labelTeam}</div>
          <div class="name">${escapeHtml(team.name)}</div>
          <div class="meta">
            <strong>${labelRegion}:</strong> ${escapeHtml(team.region || '—')}
            &nbsp;·&nbsp;
            <strong>${labelDivision}:</strong> ${escapeHtml(team.division || '—')}
          </div>
          ${cats.length ? `<div class="meta" style="margin-top:4px;"><strong>${labelCategories}:</strong> ${escapeHtml(cats.join(', '))}</div>` : ''}
          ${partIds ? `<div class="ids">#${escapeHtml(partIds)}</div>` : ''}
          <div class="scan-tip">${labelScanInstr}</div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert(tx('Pop-up blocked. Allow pop-ups and try again.', 'تم حظر النافذة المنبثقة. اسمح بها ثم أعد المحاولة.'));
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
