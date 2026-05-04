// ─── Excel Import / Export Utility ──────────────────────────────────────────
// Each row = ONE participation (team + single category).
// Teams are deduplicated by name; categories are registered dynamically.

import * as XLSX from 'xlsx';

// ─── Lookup maps ─────────────────────────────────────────────────────────────

const DIVISION_MAP = {
  'es': 'ES', 'elementary': 'ES', 'ابتدائي': 'ES', 'ابتدائية': 'ES',
  'ms': 'MS', 'middle': 'MS', 'متوسط': 'MS', 'متوسطة': 'MS',
  'hs': 'HS', 'high': 'HS', 'highschool': 'HS', 'ثانوي': 'HS', 'ثانوية': 'HS',
  'us': 'US', 'university': 'US', 'college': 'US', 'جامعة': 'US', 'جامعي': 'US', 'جامعية': 'US',
};

const REGION_MAP = {
  'western': 'Western', 'west': 'Western',
  'غرب': 'Western', 'غربي': 'Western', 'غربية': 'Western', 'المنطقة الغربية': 'Western',
  'central': 'Central', 'centre': 'Central', 'center': 'Central',
  'وسط': 'Central', 'وسطى': 'Central', 'وسطي': 'Central', 'المنطقة الوسطى': 'Central',
  'eastern': 'Eastern', 'east': 'Eastern',
  'شرق': 'Eastern', 'شرقي': 'Eastern', 'شرقية': 'Eastern', 'المنطقة الشرقية': 'Eastern',
};

// ─── Arabic column keys (trimmed) ────────────────────────────────────────────

const COL_TEAM     = 'اسم الفريق';
const COL_DIVISION = 'المرحلة التعليمية (اختيار من متعدد)';
const COL_REGION   = 'منطقة الجهة / المدرسة / الجامعة';
const COL_COACH    = 'اسم مدرب/مدربة الفريق';
const COL_CATEGORY = 'التحدي المشارك فيه الفريق';
const COL_MEMBERS  = [
  'اسم المشارك الثلاثي (الأول)',
  'اسم المشارك الثلاثي (الثاني)',
  'اسم المشارك الثلاثي (الثالث)',
  'اسم المشارك الثلاثي (الرابع)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalize = (v) => v?.toString().toLowerCase().trim().replace(/\s+/g, ' ') ?? '';

function isBlank(v) {
  const s = normalize(v);
  return s === '' || s === 'nan' || s === 'null' || s === 'undefined';
}

/** Normalise all column headers in a raw XLSX row (trim whitespace) */
function normalizeRowKeys(rawRow) {
  const row = {};
  for (const [k, v] of Object.entries(rawRow)) {
    row[k.trim()] = v;
  }
  return row;
}

function cell(row, key) {
  const val = row[key];
  return val !== undefined ? String(val).trim() : '';
}

/** Generate formatted participation ID: 26<seq><RegionLetter> */
function makeParticipationId(region, existing) {
  const letter = (region || 'W').charAt(0).toUpperCase();
  const max = existing.reduce((m, p) => {
    const match = p.id.match(/^26(\d{3})/);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `26${String(max + 1).padStart(3, '0')}${letter}`;
}

// ─── Main parse function ──────────────────────────────────────────────────────

/**
 * @param {File} file
 * @param {Array}  existingTeams  — current teams in state (for check-in preservation)
 * @returns {Promise<{ teams, participations, categories, total, imported, warnings }>}
 */
export function parseExcelFile(file, existingTeams = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) {
          throw new Error('Workbook has no sheets');
        }
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!rows.length) {
          throw new Error('Sheet is empty');
        }

        // ── Header validation: report ALL missing required columns at once ──
        const headerKeys = new Set(Object.keys(rows[0] || {}).map(k => k.trim()));
        const required = [
          { col: COL_TEAM,     label: 'Team Name' },
          { col: COL_CATEGORY, label: 'Category' },
          { col: COL_DIVISION, label: 'Division' },
          { col: COL_REGION,   label: 'Region' },
        ];
        const missing = required.filter(r => !headerKeys.has(r.col));
        if (missing.length) {
          throw new Error(
            `Missing required column(s): ${missing.map(m => `"${m.col}" (${m.label})`).join(', ')}`
          );
        }

        // normalised-name → existing team (for check-in state preservation)
        const existingByName = new Map(
          existingTeams.map(t => [normalize(t.name), t])
        );

        const teamsMap        = new Map(); // normalised name → team object
        const categoryRegistry = new Map(); // normalised name → { id, name }
        const participations  = [];
        const warnings        = [];

        rows.forEach((rawRow, rowIdx) => {
          const row = normalizeRowKeys(rawRow);
          const humanRow = rowIdx + 2; // 1-based, skip header

          const teamNameRaw  = cell(row, COL_TEAM);
          const categoryRaw  = cell(row, COL_CATEGORY);

          // ── Validation ────────────────────────────────────────────────────
          if (isBlank(teamNameRaw)) {
            warnings.push(`Row ${humanRow}: Missing team name`);
            return;
          }
          if (isBlank(categoryRaw)) {
            warnings.push(`Row ${humanRow}: Missing category for team "${teamNameRaw}"`);
            return;
          }

          const teamKey = normalize(teamNameRaw);
          const catKey  = normalize(categoryRaw);

          // ── Category registry (dynamic) ───────────────────────────────────
          if (!categoryRegistry.has(catKey)) {
            categoryRegistry.set(catKey, {
              id:   `c_dyn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
              name: categoryRaw,
            });
          }
          const categoryId = categoryRegistry.get(catKey).id;

          // ── Team dedup ────────────────────────────────────────────────────
          if (!teamsMap.has(teamKey)) {
            const divisionRaw = normalize(cell(row, COL_DIVISION));
            const division    = DIVISION_MAP[divisionRaw] || null;
            if (!division) {
              warnings.push(`Row ${humanRow}: Unknown division "${cell(row, COL_DIVISION)}" for team "${teamNameRaw}"`);
            }

            const regionRaw = normalize(cell(row, COL_REGION));
            const region    = REGION_MAP[regionRaw] || null;
            if (!region) {
              warnings.push(`Row ${humanRow}: Unknown region "${cell(row, COL_REGION)}" for team "${teamNameRaw}"`);
            }

            const coachName = cell(row, COL_COACH) || 'TBD';

            // Members — max 4, no duplicates, skip blanks/NaN
            const seenMemberNames = new Set();
            const members = [];
            COL_MEMBERS.forEach((colKey, i) => {
              const name = cell(row, colKey);
              if (!isBlank(name) && !seenMemberNames.has(normalize(name))) {
                seenMemberNames.add(normalize(name));
                members.push({ id: `m_${teamKey.replace(/\s+/g, '_')}_${i}`, name, present: false });
              }
            });

            if (!members.length) {
              warnings.push(`Team "${teamNameRaw}": no members listed`);
            }

            // Preserve check-in state for returning teams
            const prev = existingByName.get(teamKey);
            const preservedMembers = members.map(m => {
              const em = prev?.members.find(em => normalize(em.name) === normalize(m.name));
              return em ? { ...m, present: em.present } : m;
            });

            teamsMap.set(teamKey, {
              id:       `t_${teamKey.replace(/\s+/g, '_')}_${Date.now()}`,
              name:     teamNameRaw,
              division: division || 'MS',
              region:   region   || 'Western',
              coach:    { name: coachName, present: prev?.coach.present || false },
              members:  preservedMembers,
            });
          }

          const team = teamsMap.get(teamKey);

          // ── Participation (one per row) ───────────────────────────────────
          participations.push({
            id:         makeParticipationId(team.region, participations),
            teamId:     team.id,
            categoryId,
          });
        });

        const teams      = Array.from(teamsMap.values());
        const categories = Array.from(categoryRegistry.values());

        resolve({
          teams,
          participations,
          categories,
          total:    rows.length,
          imported: teams.length,
          warnings,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Template generator ───────────────────────────────────────────────────────

export function downloadTemplate() {
  const HEADERS = [
    COL_TEAM, COL_DIVISION, COL_REGION, COL_CATEGORY,
    COL_COACH, ...COL_MEMBERS,
  ];
  const HINTS = [
    '(required)',
    'ابتدائي / متوسط / ثانوي / جامعي',
    'غربية / وسطى / شرقية',
    'اسم التحدي (صف واحد = تحدي واحد)',
    '(optional)',
    '(optional)', '', '', '',
  ];
  const SAMPLE1 = [
    'Cyber Falcons',
    'HS',
    'Western',
    'Sumo Bot',
    'Dr. Ahmed',
    'Omar Al-Zahrani', 'Ali Mohammed', 'Sara Hassan', '',
  ];
  const SAMPLE2 = [
    'Cyber Falcons',
    'HS',
    'Western',
    'AI Innovation',
    'Dr. Ahmed',
    'Omar Al-Zahrani', 'Ali Mohammed', 'Sara Hassan', '',
  ];
  const SAMPLE3 = [
    'النسور الإلكترونية',
    'متوسط',
    'وسطى',
    'FastBot',
    'م. فاطمة',
    'محمد خالد', 'نور سعيد', '', '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, HINTS, SAMPLE1, SAMPLE2, SAMPLE3]);
  ws['!cols'] = [
    { wch: 25 }, { wch: 14 }, { wch: 25 }, { wch: 30 },
    { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
  ];
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Participations');
  XLSX.writeFile(wb, 'RAIN_Participations_Template.xlsx');
}
