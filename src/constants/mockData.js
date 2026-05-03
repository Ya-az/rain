// =============================================
// MOCK DATABASE — extracted from original App.jsx
// DO NOT modify logic/structure
// =============================================

export const MOCK_USERS = [
  { id: 'u1', username: 'admin', password: 'pass', role: 'admin', name: 'System Admin' },
  { id: 'u1b', username: 'reg_west', password: 'pass', role: 'region_admin', name: 'Region Admin (Western)', region: 'Western' },
  { id: 'u1c', username: 'reg_cent', password: 'pass', role: 'region_admin', name: 'Region Admin (Central)', region: 'Central' },
  { id: 'u1d', username: 'reg_east', password: 'pass', role: 'region_admin', name: 'Region Admin (Eastern)', region: 'Eastern' },
  { id: 'u2', username: 'headref_w', password: 'pass', role: 'head_ref', name: 'Head Referee (Western)', region: 'Western' },
  { id: 'u3', username: 'ref_fastbot', password: 'pass', role: 'ref', name: 'Ref (FastBot)', category: 'c1_fastbot', region: 'Western' },
  { id: 'u3b', username: 'ref_amaze', password: 'pass', role: 'ref', name: 'Ref (a-Maze-ing)', category: 'c1_amazeing', region: 'Central' },
  { id: 'u3c', username: 'ref_sumo', password: 'pass', role: 'ref', name: 'Ref (Sumo Bot)', category: 'c2_sumo', region: 'Eastern' },
  { id: 'u4', username: 'vol_west', password: 'pass', role: 'volunteer', name: 'Door Staff (Western)', region: 'Western' },
  { id: 'u4b', username: 'vol_cent', password: 'pass', role: 'volunteer', name: 'Door Staff (Central)', region: 'Central' },
];

export const MOCK_CATEGORIES = [
  { id: 'c1_fastbot', name: 'FastBot', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c1_linefollow', name: 'LineFollowing', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c1_amazeing', name: 'a-Maze-ing', group: 1, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c2_sumo', name: 'Sumo Bot', group: 2, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c2_soccer', name: 'SoccerBot', group: 2, levels: ['ES', 'MS', 'HS', 'US'] },
  { id: 'c3_ai', name: 'AI Innovation', group: 3, levels: ['HS', 'US'] },
  { id: 'c3_webdesign', name: 'WebDesign', group: 3, levels: ['ES', 'MS', 'HS', 'US'] },
];

export const INITIAL_TEAMS = [
  { id: 't1', name: 'Cyber Falcons',  division: 'HS', region: 'Western', members: [{id:'m1', name:'Omar', present:false}, {id:'m2', name:'Ali', present:false}],         coach: {name:'Dr. Ahmed',    present:false} },
  { id: 't2', name: 'Desert Rovers',  division: 'MS', region: 'Central', members: [{id:'m3', name:'Sara', present:false}, {id:'m4', name:'Nour', present:false}],         coach: {name:'Eng. Fatima',  present:false} },
  { id: 't3', name: 'Tech Titans',    division: 'ES', region: 'Eastern', members: [{id:'m5', name:'Ziad', present:false}],                                                coach: {name:'Mr. Khaled',   present:false} },
  { id: 't4', name: 'Neural Nets',    division: 'US', region: 'Western', members: [{id:'m6', name:'Tariq', present:false}, {id:'m7', name:'Youssef', present:false}],    coach: {name:'Dr. Salem',    present:false} },
  { id: 't5', name: 'Maze Runners',   division: 'MS', region: 'Western', members: [{id:'m8', name:'Fahad', present:false}],                                               coach: {name:'Mr. Sami',     present:false} },
  { id: 't6', name: 'Line Masters',   division: 'MS', region: 'Central', members: [{id:'m9', name:'Layan', present:false}, {id:'m10', name:'Joud', present:false}],      coach: {name:'Ms. Reem',     present:false} },
  { id: 't7', name: 'Robo Knights',   division: 'ES', region: 'Eastern', members: [{id:'m11', name:'Saud', present:false}, {id:'m12', name:'Bader', present:false}],     coach: {name:'Dr. Tariq',    present:false} },
  { id: 't8', name: 'AI Pioneers',    division: 'US', region: 'Central', members: [{id:'m13', name:'Nasser', present:false}],                                             coach: {name:'Prof. Hind',   present:false} },
];

// One entry per team+category registration (mirrors the new Excel row structure)
export const INITIAL_PARTICIPATIONS = [
  // Cyber Falcons (Western)
  { id: '26001W', teamId: 't1', categoryId: 'c2_sumo' },
  { id: '26002W', teamId: 't1', categoryId: 'c3_ai' },
  // Desert Rovers (Central)
  { id: '26001C', teamId: 't2', categoryId: 'c1_fastbot' },
  { id: '26002C', teamId: 't2', categoryId: 'c2_sumo' },
  // Tech Titans (Eastern)
  { id: '26001E', teamId: 't3', categoryId: 'c1_linefollow' },
  { id: '26002E', teamId: 't3', categoryId: 'c2_soccer' },
  // Neural Nets (Western)
  { id: '26003W', teamId: 't4', categoryId: 'c3_ai' },
  // Maze Runners (Western)
  { id: '26004W', teamId: 't5', categoryId: 'c1_amazeing' },
  { id: '26005W', teamId: 't5', categoryId: 'c2_soccer' },
  // Line Masters (Central)
  { id: '26003C', teamId: 't6', categoryId: 'c1_linefollow' },
  { id: '26004C', teamId: 't6', categoryId: 'c1_fastbot' },
  // Robo Knights (Eastern)
  { id: '26003E', teamId: 't7', categoryId: 'c1_amazeing' },
  { id: '26004E', teamId: 't7', categoryId: 'c2_sumo' },
  // AI Pioneers (Central)
  { id: '26005C', teamId: 't8', categoryId: 'c3_ai' },
  { id: '26006C', teamId: 't8', categoryId: 'c1_fastbot' },
];

export const DEFAULT_SYSTEM_CONFIG = {
  fastbotLaps: { ES: 1, MS: 2, HS: 3, US: 4 },
  linefollowBalls: { ES: 2, MS: 3, HS: 4, US: 5 },
  fastbotPracticeRounds: { es_ms: 2, hs_us: 2 },
  fastbotOfficialRounds: { es_ms: 5, hs_us: 5 },
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
};
