// =============================================
// MOCK DATABASE — extracted from original App.jsx
// DO NOT modify logic/structure
// =============================================

export const MOCK_USERS = [
  // ─── System Admin ──────────────────────────────────────────────────
  { id: 'u_admin_main', username: '0553346688', password: '1447-2026', role: 'admin', name: 'Main Admin' },
  { id: 'u_admin_yaz', username: 'yaz', password: '1590', role: 'admin', name: 'Main Admin' },

  // ─── Region Admins ────────────────────────────────────
  { id: 'u_radmin_east', username: '0532950543', password: '2026-1447', role: 'region_admin', name: 'Eastern Region Admin', region: 'Eastern' },

  // ─── Eastern Region Referees ─── (password: 0000)
  // SoccerBot
  { id: 'e_soccer_1', username: '0509498800', password: '0000', role: 'ref', name: 'SoccerBot Ref 1', categories: ['c2_soccer'], region: 'Eastern' },
  { id: 'e_soccer_2', username: '0557949085', password: '0000', role: 'ref', name: 'SoccerBot Ref 2', categories: ['c2_soccer'], region: 'Eastern' },
  // Fastbot
  { id: 'e_fastbot_1', username: '0563566643', password: '0000', role: 'ref', name: 'Fastbot Ref 1', categories: ['c1_fastbot'], region: 'Eastern' },
  { id: 'e_fastbot_2', username: '0500804360', password: '0000', role: 'ref', name: 'Fastbot Ref 2', categories: ['c1_fastbot'], region: 'Eastern' },
  // Sumo (Ref 1 also covers AI Innovation)
  { id: 'e_sumo_1', username: '0554580458', password: '0000', role: 'ref', name: 'Sumo + AI Ref',  categories: ['c2_sumo', 'c3_ai'], region: 'Eastern' },
  { id: 'e_sumo_2', username: '0561788878', password: '0000', role: 'ref', name: 'Sumo Ref 2',     categories: ['c2_sumo'], region: 'Eastern' },
  // LineFollowing
  { id: 'e_line_1', username: '0530171940', password: '0000', role: 'ref', name: 'LineFollowing Ref 1', categories: ['c1_linefollow'], region: 'Eastern' },
  { id: 'e_line_2', username: '0505848477', password: '0000', role: 'ref', name: 'LineFollowing Ref 2', categories: ['c1_linefollow'], region: 'Eastern' },
  // a-Maze-ing
  { id: 'e_maze_1', username: '0556926126', password: '0000', role: 'ref', name: 'a-Maze-ing Ref 1', categories: ['c1_amazeing'], region: 'Eastern' },
  { id: 'e_maze_2', username: '0562274181', password: '0000', role: 'ref', name: 'a-Maze-ing Ref 2', categories: ['c1_amazeing'], region: 'Eastern' },
  // AI Innovation (0554580458 already listed under Sumo with c3_ai)
  { id: 'e_ai_1',    username: '0540697768', password: '0000', role: 'ref', name: 'AI Innovation Ref',  categories: ['c3_ai'], region: 'Eastern' },
  { id: 'e_ai_duaa', username: 'duaa_q',     password: '0000', role: 'ref', name: 'Duaa Q (AI Ref)',    categories: ['c3_ai'], region: 'Eastern' },
  // Gaming Design + WebDesign
  { id: 'e_gw_1',      username: '0505921458', password: '0000', role: 'ref', name: 'Gaming + WebDesign Ref', categories: ['c3_gaming', 'c3_webdesign'], region: 'Eastern' },
  { id: 'e_gw_nawaf',  username: 'nawaf_e',    password: '0000', role: 'ref', name: 'Nawaf Al-Jaafari',       categories: ['c3_gaming', 'c3_webdesign'], region: 'Eastern' },

  // ─── Western Region Referees ─── (password: 0000)
  // All referees also have access to AI Innovation (c3_ai)
  { id: 'w_web_1',     username: '0569508267', password: '0000', role: 'ref', name: 'WebDesign Ref',      categories: ['c3_webdesign', 'c3_ai'], region: 'Western' },
  { id: 'w_fastbot_1', username: '0554147948', password: '0000', role: 'ref', name: 'Fastbot Ref',        categories: ['c1_fastbot', 'c3_ai'],   region: 'Western' },
  { id: 'w_soccer_1',  username: '0569450620', password: '0000', role: 'ref', name: 'SoccerBot Ref 1',    categories: ['c2_soccer', 'c3_ai'],    region: 'Western' },
  { id: 'w_soccer_2',  username: '0561511180', password: '0000', role: 'ref', name: 'SoccerBot Ref 2',    categories: ['c2_soccer', 'c3_ai'],    region: 'Western' },
  { id: 'w_sumo_1',    username: '0536009227', password: '0000', role: 'ref', name: 'Sumo Ref 1',         categories: ['c2_sumo', 'c3_ai'],      region: 'Western' },
  { id: 'w_sumo_2',    username: '0581123422', password: '0000', role: 'ref', name: 'Sumo Ref 2',         categories: ['c2_sumo', 'c3_ai'],      region: 'Western' },
  { id: 'w_maze_1',    username: '0569650707', password: '0000', role: 'ref', name: 'a-Maze-ing Ref',     categories: ['c1_amazeing', 'c3_ai'],  region: 'Western' },
  { id: 'w_line_1',    username: '0555547581', password: '0000', role: 'ref', name: 'LineFollowing Ref',  categories: ['c1_linefollow', 'c3_ai'],region: 'Western' },

  // ─── Volunteers (check-in / door staff) ────────────────────────────
  { id: 'vol_east', username: 'vol_east', password: '0000', role: 'volunteer', name: 'Eastern Volunteer', region: 'Eastern' },
  { id: 'vol_west', username: 'vol_west', password: '0000', role: 'volunteer', name: 'Western Volunteer', region: 'Western' },
];

export const MOCK_CATEGORIES = [
  { id: 'c1_fastbot', name: 'FastBot', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c1_linefollow', name: 'LineFollowing', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c1_amazeing', name: 'a-Maze-ing', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c2_sumo', name: 'Sumo Bot', group: 2, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c2_soccer', name: 'SoccerBot', group: 2, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c3_ai', name: 'AI Innovation', group: 3, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c3_webdesign', name: 'WebDesign', group: 3, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c3_gaming', name: 'Gaming Design', group: 3, levels: ['ES', 'MS', 'HS', 'US'] },
];

// =============================================
// CENTRAL REGION — seeded teams (from official roster)
// Order preserved from source PDF. Each row = 1 team + 1 participation.
// Levels: ابتدائي=ES, متوسط=MS, ثانوي=HS, جامعي/جامعة/أكاديمية=US.
// =============================================
// Format: [teamNumber, name, division, categoryId]
const CENTRAL_ROSTER = [
  // ⚡ Fast (c1_fastbot) — ثانوي + جامعي
  [111, 'Dash Bots',                'US', 'c1_fastbot'],
  [112, 'BTG020',                   'US', 'c1_fastbot'],
  [113, 'Falcons',                  'HS', 'c1_fastbot'],
  [114, 'فالكون',                   'HS', 'c1_fastbot'],
  [115, 'Digital Stars',            'US', 'c1_fastbot'],
  // ⚡ Fast (c1_fastbot) — ابتدائي + متوسط
  [121, 'CodeStorm',                'ES', 'c1_fastbot'],
  [122, 'Noble coders',             'ES', 'c1_fastbot'],
  [123, 'Mayasin Robot',            'ES', 'c1_fastbot'],
  [124, 'Vision',                   'MS', 'c1_fastbot'],
  [125, 'Al-Namothajiyah Eagles',   'MS', 'c1_fastbot'],
  [126, 'Atyab future',             'MS', 'c1_fastbot'],
  [127, 'YouthDreams',              'MS', 'c1_fastbot'],
  [128, 'TNIS infinity',            'ES', 'c1_fastbot'],
  // ⚽ Soccer (c2_soccer) — ابتدائي
  [131, 'AlFaris FireForce',        'ES', 'c2_soccer'],
  [132, 'The system league',        'ES', 'c2_soccer'],
  [134, 'TNISArid',                 'ES', 'c2_soccer'],
  [135, 'RNS National',             'ES', 'c2_soccer'],
  // ⚽ Soccer (c2_soccer) — متوسط + ثانوي
  [141, 'النبلاء',                  'MS', 'c2_soccer'],
  [142, 'Kingdom Innovators',       'MS', 'c2_soccer'],
  [143, 'ابطال التربية',            'HS', 'c2_soccer'],
  [144, 'TNIS The Falcons Team',    'HS', 'c2_soccer'],
  // 🤼 Sumo (c2_sumo) — صغار (ابتدائي + متوسط)
  [151, 'AlFaris Robo Knights',     'ES', 'c2_sumo'],
  [152, 'RNS Tech Stars',           'ES', 'c2_sumo'],
  [153, 'فريق الروبوت الآلي',       'ES', 'c2_sumo'],
  [154, 'مبتكرات الغد',             'MS', 'c2_sumo'],
  [155, 'RNS-TECHNOBOTS',           'MS', 'c2_sumo'],
  // 🤼 Sumo (c2_sumo) — كبار (ثانوي + جامعي/أكاديمية)
  [161, 'RoboAlGhad',               'HS', 'c2_sumo'],
  [162, 'عبد الله بن أبي أوفى',     'HS', 'c2_sumo'],
  [163, 'RCT',                      'US', 'c2_sumo'],
  [164, '٩٦٦ واحد',                 'US', 'c2_sumo'],
  [165, '٩٦٦ اثنين',                 'US', 'c2_sumo'],
  [166, '٩٦٦ ثلاثة',                 'US', 'c2_sumo'],
  // ⬤ Ball Carrier → LineFollowing (c1_linefollow) — صغار
  [171, 'ربورت الإبداع',            'ES', 'c1_linefollow'],
  [172, 'Thunder',                  'MS', 'c1_linefollow'],
  [173, 'قد التحدي',                'MS', 'c1_linefollow'],
  [174, 'طويق',                     'MS', 'c1_linefollow'],
  [175, 'Dash-19',                  'MS', 'c1_linefollow'],
  [176, 'فريق أبطال زينب بنت عمر',  'MS', 'c1_linefollow'],
  // ⬤ Ball Carrier → LineFollowing (c1_linefollow) — كبار
  [181, 'الاسطورة',                 'HS', 'c1_linefollow'],
  [182, 'رواد العطاء',              'HS', 'c1_linefollow'],
  // 🌀 Maze (c1_amazeing) — ابتدائي
  [191, 'Vision Makers',            'ES', 'c1_amazeing'],
  [192, 'فريق ريادة الأعمال للبنات','ES', 'c1_amazeing'],
  [193, 'العباقرة',                 'ES', 'c1_amazeing'],
  // 🌀 Maze (c1_amazeing) — متوسط
  [211, 'Kingdom Code',             'MS', 'c1_amazeing'],
  [212, 'Mayasin Robo',             'MS', 'c1_amazeing'],
  [213, 'فريق المسار الذكي',        'MS', 'c1_amazeing'],
  [214, 'فريق الأفق',               'MS', 'c1_amazeing'],
  // 🎮 Game Design (c3_gaming) — ابتدائي + متوسط
  [221, 'Meiacode',                 'ES', 'c3_gaming'],
  [222, 'Gamatrix',                 'ES', 'c3_gaming'],
  [223, 'Quantum Designers',        'ES', 'c3_gaming'],
  [224, 'Stars of knowledge - مياسين','ES', 'c3_gaming'],
  [225, '1111',                     'MS', 'c3_gaming'],
  [226, 'فاندرلاند',                'MS', 'c3_gaming'],
  [227, 'Scratch Masters',          'ES', 'c3_gaming'],
  [228, 'Robopower',                'ES', 'c3_gaming'],
  [229, 'Scratch Strars',           'ES', 'c3_gaming'],
  // 🤖 AI Challenge (c3_ai) — متوسط + ثانوي
  [231, 'IQ builders بناة الذكاء',  'MS', 'c3_ai'],
  [232, 'tuwaq apex',               'HS', 'c3_ai'],
  [233, 'عبد الله بن أبي أوفى',     'HS', 'c3_ai'],
  [234, 'الربوت السريع',            'HS', 'c3_ai'],
  // 🌐 Web Design (c3_webdesign) — متوسط (per actual division in roster)
  [241, 'YouthDreams',              'MS', 'c3_webdesign'],
  // 🤖 الابتكار وريادة الأعمال → AI Innovation (c3_ai) — ثانوي
  [251, 'نجوم التربية ٢',           'HS', 'c3_ai'],
  [252, 'Tuwaiq Falcons',           'HS', 'c3_ai'],
  [253, 'Nobala programmers',       'HS', 'c3_ai'],
  [254, 'viperX',                   'HS', 'c3_ai'],
  [255, 'رواد الابتكار',            'HS', 'c3_ai'],
  [256, 'The Next Step (256)',      'HS', 'c3_ai'],
  [257, 'The Next Step (257)',      'HS', 'c3_ai'],
  // 🤖 الابتكار وريادة الأعمال → AI Innovation (c3_ai) — ابتدائي + متوسط
  [261, 'Kingdom Stars',            'ES', 'c3_ai'],
  [262, 'AlFaris Olympians',        'ES', 'c3_ai'],
  [263, 'Player#13',                'ES', 'c3_ai'],
  [264, 'الأرقم روبوت 1',           'ES', 'c3_ai'],
  [265, 'الأرقم روبوت ٢',           'MS', 'c3_ai'],
];

const __centralTeams = CENTRAL_ROSTER.map(([teamNumber, name, division]) => ({
  id:         `t_central_${teamNumber}`,
  teamNumber: String(teamNumber),
  name,
  division,
  region:     'Central',
  coach:      { name: 'TBD', present: false },
  members:    [],
}));

const __centralParticipations = CENTRAL_ROSTER.map(([teamNumber, , , categoryId], i) => ({
  id:         `26${String(i + 1).padStart(3, '0')}C`,
  teamId:     `t_central_${teamNumber}`,
  categoryId,
}));

export const INITIAL_TEAMS = __centralTeams;
export const INITIAL_PARTICIPATIONS = __centralParticipations;

export const DEFAULT_SYSTEM_CONFIG = {
  fastbotLaps: { ES: 1, MS: 2, HS: 3, US: 4 },
  linefollowBalls: { ES: 2, MS: 3, HS: 4, US: 5 },
  fastbotPracticeRounds: { es_ms: 2, hs_us: 2 },
  fastbotOfficialRounds: { es_ms: 5, hs_us: 5 },
  practiceRoundsByCategory: {
    c1_fastbot:    { es_ms: 2, hs_us: 2 },
    c1_amazeing:   { es_ms: 2, hs_us: 2 },
    c1_linefollow: { es_ms: 2, hs_us: 2 },
  },
  officialRoundsByCategory: {
    c1_fastbot:    { es_ms: 5, hs_us: 5 },
    c1_amazeing:   { es_ms: 5, hs_us: 5 },
    c1_linefollow: { es_ms: 5, hs_us: 5 },
  },
};

// Category gradient colours + robot images for category cards
export const CATEGORY_STYLES = {
  c1_fastbot:    { from: '#1da1c9', to: '#15627d', icon: '⚡', img: '/img/categories/fastbot.png' },
  c1_linefollow: { from: '#63c132', to: '#3c741e', icon: '〰️', img: '/img/categories/linefollow.png' },
  c1_amazeing:   { from: '#7c3aed', to: '#4c1d95', icon: '🌀', img: '/img/categories/amazeing.png' },
  c2_sumo:       { from: '#ea580c', to: '#991b1b', icon: '🤼', img: '/img/categories/sumo.png' },
  c2_soccer:     { from: '#0d9488', to: '#164e63', icon: '⚽', img: '/img/categories/soccer.png' },
  c3_ai:         { from: '#d97706', to: '#92400e', icon: '🧠', img: '/img/categories/ai.png' },
  c3_webdesign:  { from: '#0ea5e9', to: '#075985', icon: '🌐', img: '/img/categories/webdesign.png' },
  c3_gaming:     { from: '#ec4899', to: '#831843', icon: '🎮', img: '/img/categories/gaming.png' },
};
