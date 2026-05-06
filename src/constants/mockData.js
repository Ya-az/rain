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

// =============================================
// FINALS (FN) — World Finals teams roster
// Each row: [name, division, categoryId, coachName, [members]]
// Empty coach/members → 'TBD'.  "غير محدد" division → defaults to 'ES'.
// Duplicate names create separate participations (per organiser request).
// =============================================
const FN_ROSTER = [
  // ── a-Maze-ing (c1_amazeing) ────────────────────────────────────────
  ['مبدعو دار الفرسان', 'ES', 'c1_amazeing', 'عبدالله أمين غراب',
    ['أويس ناصر المنصوري', 'بدر معتز عباس', 'اياد فيصل السعدي', 'يوسف أحمد رزق']],
  ['عالم الصغار', 'ES', 'c1_amazeing', 'TBD', []],
  ['RIYAN MAZE HEROES', 'ES', 'c1_amazeing', 'د. هناء محمد عبد الرحيم حسن',
    ['مياسة أيمن حامد السراني', 'تالية عمر حامد', 'تالا محمد سمير القرافي', 'ريمان يوسف الأحمدي']],
  ['Techno Basmat', 'ES', 'c1_amazeing', 'عبدالعزيز عبدالله العبدالعالي',
    ['فاطمة تركي القطان', 'وجود محمد ال بوحمد', 'فاطمة وثيق الشخص', 'دانا وثيق الشخص']],
  ['Jawatha Alhassa', 'ES', 'c1_amazeing', 'حمزة خالد ابودقة',
    ['تركي سعد الحمل', 'معتز صالح قوقزه', 'يوسف عبدالمحسن الموسى', 'عبدالله شاكر السعيد']],
  ['king Code', 'MS', 'c1_amazeing', 'مروءة "محمد مهدي" يخلف',
    ['Yasmeen Turabulsi', 'Joanna Banabella', 'Latifa Alsheikh', 'Salma Alnaser']],
  ['Mayasin Robe', 'ES', 'c1_amazeing', 'يوسف سباعنه',
    ['خالد تركي آل سعود', 'ابراهيم سليمان الزويد', 'فيصل عثمان القاسم', 'صالح ممدوح التميمي']],
  ['RIYAN MAZE HEROES', 'ES', 'c1_amazeing', 'د. هناء محمد عبد الرحيم حسن',
    ['مياسة أيمن حامد السراني', 'تالية عمر حامد', 'تالا محمد سمير القرافي', 'ريمان يوسف الأحمدي']],
  ['Vision', 'MS', 'c1_amazeing', 'نوره فرحان الشمري',
    ['عبدالرحمن بدر السبيعي', 'ريما خليل الفارس', 'حصة طارق البليهد', 'مزون سالم اشرف']],

  // ── FastBot (c1_fastbot) ────────────────────────────────────────────
  ['RBL', 'US', 'c1_fastbot', 'جود سالم بقشان',
    ['جود سالم بقشان', 'هيا تركي السيلاني', 'فرح ياسر الشنطي', 'غالية زيد الشميري']],
  ['Sense', 'US', 'c1_fastbot', 'د.م/ محمد إبراهيم بن ذالنون',
    ['براء عامر كوشك', 'اسماعيل حسام زمزمي', 'فيصل عبد العزيز الهلالي', 'عبد الله ياسر دحلان']],
  ['UQUxRAIC (MT)', 'US', 'c1_fastbot', 'د.م/ محمد إبراهيم بن ذالنون',
    ['زياد عمران محمدالطاف بت', 'احمد خالد احمد باكيلي', 'عبدالعزيز نايف الصبري', 'بسام احمد مايت']],
  ['فالكون', 'HS', 'c1_fastbot', 'افراح عامر المطيري',
    ['وديم صالح الجلعود', 'دانا ماجد اليحيى', 'سندس غرم القحطاني']],
  ['Digital Stars', 'US', 'c1_fastbot', 'د. ابتهال أحمد العبلاني',
    ['مروة عبدالله سبعي', 'دانا محمد العنزي', 'جنى علي آل زيدان', 'ريفال منصور العصيمي']],
  ['Dash Bots', 'US', 'c1_fastbot', 'باسل يحيى المرهون',
    ['آلاء يحيى المرهون', 'ديم دخيل المطيري']],
  ['QPS Robo', 'HS', 'c1_fastbot', 'عمرو محيى عطية',
    ['سطام مشاري عودة', 'عبدالرحمن عبيد العمرى', 'ايمن عبدالرحمن السراج']],
  ['Turbo mind', 'HS', 'c1_fastbot', 'Dr. Nagwa Afifi/ Dina Al Ostath',
    ['Talah Wael Abu Mansour', 'Amalia Ibraheem Abbas', 'Nada Mohammed Al Gadaani', 'Dyala Yasir AlMania']],
  ['UQUxRAIC (MT)', 'US', 'c1_fastbot', 'د.م/ محمد إبراهيم بن ذالنون',
    ['زياد عمران محمدالطاف بت', 'احمد خالد احمد باكيلي', 'عبدالعزيز نايف الصبري', 'بسام احمد مايت']],
  ['Jwawatha mars 14', 'HS', 'c1_fastbot', 'صالح قوقزه',
    ['رغد محمد الملحم', 'فاطمة احمد البشر', 'ريما عبدالله الشهيل']],
  ['UQUxRAIC', 'US', 'c1_fastbot', 'د.م/ محمد إبراهيم بن ذالنون',
    ['ملاذ محمد بن ذالنون', 'سارة محمد بن ذالنون']],
  ['MW2026', 'ES', 'c1_fastbot', 'مسلم محمد الرفاعي',
    ['يحيى سعد القحطاني', 'اسامة مسلم الرفاعي', 'يزن مسلم الرفاعي']],
  ['عباقرة الفرسان', 'MS', 'c1_fastbot', 'عبدالله أمين محمد غراب',
    ['تركي احمد الثبيتي', 'عزام سامي الغامدي', 'خالد سعيد الزهراني', 'فراس ريان ميره']],
  ['Jawatha one', 'ES', 'c1_fastbot', 'حمزة خالد ابو دقة',
    ['عبدالله ثامر جاسم علي الكري', 'عبدالعزيز ثامر جاسم علي الكري', 'عبدالله حمود عبدالله المغلوث', 'غسان عارف العبيدون']],
  ['Jawatha saudi', 'MS', 'c1_fastbot', 'صالح حسن قوقزه',
    ['عبدالله علي الغريب', 'ابراهيم عبداللطيف العرفج', 'مشعل فيصل الرويشد', 'حسن صالح قوقزه']],
  ['T.P.S', 'MS', 'c1_fastbot', 'محمود محمد عبد الجواد على',
    ['ريان محمد طارق', 'إبراهيم أيمن', 'سيف الدين هشام', 'ياسين شادي']],
  ['YouthDreams', 'ES', 'c1_fastbot', 'محمد العايد',
    ['محمد ثامر فهد الحارثي', 'ياسر منيف المطيري', 'كرم مهند العطار']],
  ['Mayasin Robot', 'ES', 'c1_fastbot', 'يوسف سباعنه',
    ['خالد تركي آل سعود', 'ابراهيم سليمان الزويد', 'فيصل عثمان القاسم', 'صالح ممدوح التميمي']],
  ['Al-Namothajiyah', 'MS', 'c1_fastbot', 'مصطفى اسماعيل امين',
    ['عبدالعزيز عليان العنزي', 'عبدالله فواز العيبان']],

  // ── LineFollowing (c1_linefollow) ───────────────────────────────────
  ['UQUxRAIC (TRONX)', 'HS', 'c1_linefollow', 'د.م/ محمد إبراهيم بن ذالنون',
    ['ميسون محمد بن ذالنون', 'رزان عبد الله الخزاعي']],
  ['BARG', 'HS', 'c1_linefollow', 'دكتوره عائشه النغموش',
    ['رنا يوسف المطيري', 'لمى فواز الحربي', 'حلا حسن الحربي']],
  ['SPS team', 'HS', 'c1_linefollow', 'سامح العدل سالم',
    ['حسام عمار الشريف', 'حسن احمد الحايك', 'هاني منصور العبد المحسن', 'محمد مجتبي العلي']],
  ['رواد العطاء', 'ES', 'c1_linefollow', 'TBD', []],
  ['الأسطورة', 'HS', 'c1_linefollow', 'مها علي النملة',
    ['ليان فهد الشهري', 'حصه محمد آل خليفه', 'غزل بنت فهد ب العنزي', 'ساره عبدالرحمن السلطان']],
  ['thunder 782', 'MS', 'c1_linefollow', 'نور ماهر فارس',
    ['شوق فيصل العتيبي', 'جودي عبدالرحمن الثبيتي', 'هيفاء نايف الماضي']],
  ['vision maker 614', 'ES', 'c1_linefollow', 'العنود محمد العتيبي',
    ['دانه وليد الداود', 'وتين خالد الخزيم', 'دانة عليان العنزي']],
  ['طويق 429', 'MS', 'c1_linefollow', 'نايف موسى معشي',
    ['خالد سليمان الحربي', 'عبد الرحمن منصور السليماني', 'هادي محمد عاتي', 'سالم محمد القحطاني']],

  // ── SoccerBot (c2_soccer) ───────────────────────────────────────────
  ['فريق النبلاء', 'MS', 'c2_soccer', 'سارة محمد آل سليمان',
    ['نجد فيصل الحارثي', 'جنى فيصل العتيبي', 'طرفة ابراهيم بن هزاع', 'شوق هلال آل داود']],
  ['kingdom', 'MS', 'c2_soccer', 'Marouaa Yakhlef',
    ['Ghalia Bakhsh', 'Zehra Tashkandi', 'Muneera Alfadhel', 'Majida Al sheikh']],
  ['الشيوخ', 'ES', 'c2_soccer', 'أحمد عبادة علي عبد الله',
    ['مصطفى أحمد عبادة', 'يوسف إبراهيم محمد', 'محمد حمدي', 'إياد حسن']],
  ['Al-Faris FireForce', 'ES', 'c2_soccer', 'TBD', []],
  ['the system league', 'ES', 'c2_soccer', 'وئام عباس',
    ['ديالا سعد عسيري', 'قوت عبدالكريم المطيري', 'اميرة ذيب القحطاني', 'الجوهرة حسن الشهري']],
  ['TNISArid', 'ES', 'c2_soccer', 'محمد حسن الجعفيل',
    ['مشعل محمد الشريف', 'محمد عبدلله عمري', 'نواف عبدلله الجذلاني', 'سليمان عبدلله العمرو']],
  ['فرسان تحدي الروبوت', 'ES', 'c2_soccer', 'TBD', []],
  ['Jawatha Stars', 'ES', 'c2_soccer', 'شيماء عبدالله الجعفري',
    ['ريان حسام الرميح', 'صالح محمد الرويشد']],
  ['Jawatha gold', 'ES', 'c2_soccer', 'شيماء عبدالله الجعفري',
    ['ريان حسام الرميح', 'صالح محمد الرويشد']],
  ['T.P.S - FC', 'MS', 'c2_soccer', 'أحمد عبادة علي عبد الله',
    ['مصطفى أحمد عبادة', 'يوسف إبراهيم محمد', 'محمد حمدي', 'إياد حسن']],
  ['فرسان تحدي الروبوت', 'ES', 'c2_soccer', 'TBD', []],
  ['Robo shot', 'HS', 'c2_soccer', 'Dr Nagwa Afifi/ Dina AlOstath',
    ['علي محمد محمود', 'فارس احمد عبد القادر', 'بلال مصطفي عبده']],
  ['Robo master', 'HS', 'c2_soccer', 'Dr Nagwa Afifi/ Dina al Ostath',
    ['احمد وائل مصطفى', 'نور الدين طارق عبد العظيم']],
  ['TNIS falcons', 'HS', 'c2_soccer', 'Tarek Mohamed Dewidar',
    ['محمد طلال الجريوي', 'صالح فهد الطياش', 'فيصل فهد الحماد', 'محمد عبدالوهاب الزيد']],
  ['أبطال التربية', 'HS', 'c2_soccer', 'هيفاء محمد القحطاني',
    ['جنى عبدالعزيز باوزير', 'جنى عبدالله المعثم', 'جوري عزيز الخثعمي']],
  ['Jawatha Tomados', 'HS', 'c2_soccer', 'حسن عبدالرحمن ابوفارس',
    ['يوسف خالد الجلال', 'حسين ابراهيم السماعيل', 'جواد طاهر العوض', 'محمد عبدالله العوض']],
  ['DTC 1', 'US', 'c2_soccer', 'احمد الماجد',
    ['مجتبى نذير السالم', 'علي رضا ال ابراهيم']],
  ['Abo Ashi', 'US', 'c2_soccer', 'محمد حمد بورسيس',
    ['حمد محمد بورسيس', 'غالي فهد النعيم', 'عبدالله حسين الحليمي']],

  // ── Sumo Bot (c2_sumo) ──────────────────────────────────────────────
  ['QPS joinor', 'ES', 'c2_sumo', 'هشام محمد المندراوي',
    ['فهد العريني', 'سيف مشعل', 'علي فهد الحسين', 'فهد مشعل']],
  ['UQUxRAIC', 'US', 'c2_sumo', 'د.م/ محمد إبراهيم بن ذالنون',
    ['ملاذ محمد بن ذالنون', 'سارة محمد بن ذالنون']],
  ['Jawatha heroes', 'ES', 'c2_sumo', 'حسن عبدالرحمن ابوفارس',
    ['عبدالله علي الغريب', 'محمد ناصر القحطاني', 'طلال ناصر القحطاني']],
  ['Jawatha queens', 'ES', 'c2_sumo', 'حسن عبدالرحمن ابوفارس',
    ['ديما عبداللطيف العرفج', 'فجر محمد السعيد']],
  ['ALfaris', 'ES', 'c2_sumo', 'هبة الله اخلاصي',
    ['علي حسان حلاوي', 'احمد بن ابراهيم اليحيى', 'عبدالرحمن بن ابراهيم اليحيى', 'آدم ابراهيم جرادي']],
  ['RNS TechnoBots', 'MS', 'c2_sumo', 'QAYS BOUJNAH',
    ['فهد ناصر العقيل', 'عبد الرحمن انديجاني', 'خالد سعيد السبيعي', 'ميار خالد رمضان']],
  ['فريق مبتكرات الغد', 'MS', 'c2_sumo', 'أروى حسن حُمدي',
    ['نورة عبدالله التركي', 'غاليه مشاري الشارخ', 'نورة عمر الحسيني']],
  ['Future', 'MS', 'c2_sumo', 'أحمد عبدالعزيز محمود',
    ['يحيى حسام أحمد', 'محمد هيثم محمد', 'أحمد محمد أحمد']],
  ['QPS Robot', 'HS', 'c2_sumo', 'عمرو محيى عطية',
    ['عاصم إسلام', 'أحمد محمد', 'زياد إسلام']],
  ['QPS Challenge', 'MS', 'c2_sumo', 'محمد ابراهيم محمد',
    ['زياد عبد الحميد', 'محمد احمد السعيد', 'عاصم خالد']],
  ['UQUxRAIC MT2', 'US', 'c2_sumo', 'د.م/ محمد إبراهيم بن ذالنون',
    ['hfd']],
  ['GRP', 'US', 'c2_sumo', 'د.م/ محمد إبراهيم بن ذالنون',
    ['مهند سعيد الجحدلي']],
  ['UQUxRAIC (THESLUGGER)', 'HS', 'c2_sumo', 'د.م/ محمد إبراهيم بن ذالنون',
    ['صالح حسن عبد الله الصيعري']],
  ['jawatha fighters', 'HS', 'c2_sumo', 'حسن عبدالرحمن ابوفارس',
    ['محمد فيصل الرويشد', 'مشعل طارق السعدون', 'حسين ابراهيم السماعيل', 'جواد طاهر العوض']],
  ['T.P.S - SUMO', 'MS', 'c2_sumo', 'وسام محمد المتولي علام',
    ['عبدالرحمن فايز غازي', 'حازم محمود عبد الجواد', 'أحمد أسامة عبد الظاهر', 'عمر احمد سعد']],
  ['RNS TechnoBots', 'MS', 'c2_sumo', 'QAYS BOUJNAH',
    ['فهد ناصر العقيل', 'عبد الرحمن انديجاني', 'خالد سعيد السبيعي', 'ميار خالد رمضان']],
  ['RCT', 'ES', 'c2_sumo', 'TBD', []],
  ['RoboALGhad', 'HS', 'c2_sumo', 'سجى هلال ال هليل',
    ['هيفاء طارق السويلم', 'رسيل محمد القحطاني', 'ريما محمد الشهري']],
  ['966-3', 'ES', 'c2_sumo', 'TBD', []],

  // ── AI Innovation (c3_ai) ───────────────────────────────────────────
  ['المتوسطة التاسعة', 'ES', 'c3_ai', 'TBD', []],
  ['فالكونز', 'ES', 'c3_ai', 'TBD', []],
  ['مبرمجون 2030', 'ES', 'c3_ai', 'TBD', []],
  ['player 13', 'ES', 'c3_ai', 'TBD', []],
  ['alfaris olympians', 'ES', 'c3_ai', 'هبة نهاد اخلاصي',
    ['دانه نهار إبراهيم الأحمدي', 'راية مهند حسن أبوحسين', 'ريما عبدالعزيز السواح', 'تالا احمد عبد سمور']],
  ['الأرقم روبوت ١', 'ES', 'c3_ai', 'TBD', []],
  ['مبدعي السلام بالخبر', 'MS', 'c3_ai', 'محمد عبد الحميد حسن أبوزايد',
    ['نايف عبد الاله الحازمي', 'عبد الله حسن البشراوي', 'حسن حسين السادة', 'عبد الله نايف اليوسف']],
  ['HAS5', 'US', 'c3_ai', 'عبدالمجيد محمد صالح الهوساوي',
    ['احمد محمد جعر', 'سالم عابد الصحفي']],
  ['Gegence Nexus', 'HS', 'c3_ai', 'Ahmed Shamseldin',
    ['علي محمد الخويلدي', 'عبد الله قصي الصالح']],
  ['Lever', 'ES', 'c3_ai', 'TBD', []],
  ['TBB', 'US', 'c3_ai', 'سلوان احمد الغامدي',
    ['عائشه محمد البلوشي', 'لينه محمد البلوشي', 'غدير سعد الغامدي', 'ريناد احمد العتيبي']],
  ['Clear flow', 'ES', 'c3_ai', 'TBD', []],
  ['tuwaiq falcon', 'HS', 'c3_ai', 'نواف كمال مسفر المالكي',
    ['محمد مازن الشريف', 'رائد سعود العتيبي', 'فيصل خالد الشهراني', 'محمد عبدالعزيز الراشد']],
  ['smart shoes', 'ES', 'c3_ai', 'TBD', []],
  ['viperx', 'HS', 'c3_ai', 'هالة عبد الفتاح ابوقياص',
    ['رواء ممدوح الحريري', 'جويرية اسامه الحرفوش']],

  // ── Gaming Design (c3_gaming) ───────────────────────────────────────
  ['عباقرة سكراتش', 'ES', 'c3_gaming', 'TBD', []],
  ['scratch Masters', 'ES', 'c3_gaming', 'TBD', []],
  ['Meiacode', 'ES', 'c3_gaming', 'TBD', []],
  ['scratch Stars', 'ES', 'c3_gaming', 'TBD', []],

  // ── WebDesign (c3_webdesign) ────────────────────────────────────────
  ['yWeb', 'US', 'c3_webdesign', 'د.م/ محمد إبراهيم بن ذالنون',
    ['عبد الله عادل خراز']],
  ['Web Innovators', 'US', 'c3_webdesign', 'ملاك محمد الثمالي',
    ['عائشة سامي النمري', 'دانا فيصل القرشي', 'رسيل أحمد الأحمدي', 'ياسمين يوسف الحارثي']],
  ['Coder', 'ES', 'c3_webdesign', 'منال حسين الحارثي',
    ['شهد أحمد آل قمشة', 'ميار سعيد الشهراني', 'دانة ماجد المرواني']],
  ['ثانوية الملك خالد', 'HS', 'c3_webdesign', 'خالد سعد المسعود',
    ['ابراهيم منصور السليمان', 'عبدالمجيد محمد الخميس', 'عبدالكريم عادل الثنيان', 'نواف سامي المسعود']],
  ['يوث تيمز (YouthDreams)', 'ES', 'c3_webdesign', 'محمد العايد',
    ['محمد ثامر فهد الحارثي', 'ياسر منيف المطيري', 'كرم مهند العطار']],
];

const __fnTeams = FN_ROSTER.map(([name, division, , coachName, members], i) => ({
  id:         `t_fn_${String(i + 1).padStart(3, '0')}`,
  teamNumber: `FN${String(i + 1).padStart(3, '0')}`,
  name,
  division,
  region:     'FN',
  coach:      { name: coachName || 'TBD', present: false },
  members:    (members || []).map((memberName, idx) => ({
    id:      `m_fn_${String(i + 1).padStart(3, '0')}_${idx + 1}`,
    name:    memberName,
    present: false,
  })),
}));

const __fnParticipations = FN_ROSTER.map(([, , categoryId], i) => ({
  id:         `26${String(i + 1).padStart(3, '0')}F`,
  teamId:     `t_fn_${String(i + 1).padStart(3, '0')}`,
  categoryId,
}));

export const INITIAL_TEAMS = [...__centralTeams, ...__fnTeams];
export const INITIAL_PARTICIPATIONS = [...__centralParticipations, ...__fnParticipations];

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
