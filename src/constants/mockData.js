// =============================================
// MOCK DATABASE — extracted from original App.jsx
// DO NOT modify logic/structure
// =============================================

export const MOCK_USERS = [
  // System admin
  { id: 'u_admin', username: 'admin', password: 'pass', role: 'admin', name: 'System Admin' },

  // ─── Eastern Region Referees ─── (password: 0000)
  // All referees also have access to AI Innovation (c3_ai)
  // SoccerBot
  { id: 'e_soccer_1', username: '0509498800', password: '0000', role: 'ref', name: 'SoccerBot Ref 1', categories: ['c2_soccer', 'c3_ai'], region: 'Eastern' },
  { id: 'e_soccer_2', username: '0557949085', password: '0000', role: 'ref', name: 'SoccerBot Ref 2', categories: ['c2_soccer', 'c3_ai'], region: 'Eastern' },
  // Fastbot
  { id: 'e_fastbot_1', username: '0563566643', password: '0000', role: 'ref', name: 'Fastbot Ref 1', categories: ['c1_fastbot', 'c3_ai'], region: 'Eastern' },
  { id: 'e_fastbot_2', username: '0500804360', password: '0000', role: 'ref', name: 'Fastbot Ref 2', categories: ['c1_fastbot', 'c3_ai'], region: 'Eastern' },
  // Sumo
  { id: 'e_sumo_1', username: '0554580458', password: '0000', role: 'ref', name: 'Sumo Ref 1', categories: ['c2_sumo', 'c3_ai'], region: 'Eastern' },
  { id: 'e_sumo_2', username: '0561788878', password: '0000', role: 'ref', name: 'Sumo Ref 2', categories: ['c2_sumo', 'c3_ai'], region: 'Eastern' },
  // LineFollowing
  { id: 'e_line_1', username: '0530171940', password: '0000', role: 'ref', name: 'LineFollowing Ref 1', categories: ['c1_linefollow', 'c3_ai'], region: 'Eastern' },
  { id: 'e_line_2', username: '0505848477', password: '0000', role: 'ref', name: 'LineFollowing Ref 2', categories: ['c1_linefollow', 'c3_ai'], region: 'Eastern' },
  // a-Maze-ing
  { id: 'e_maze_1', username: '0556926126', password: '0000', role: 'ref', name: 'a-Maze-ing Ref 1', categories: ['c1_amazeing', 'c3_ai'], region: 'Eastern' },
  { id: 'e_maze_2', username: '0562274181', password: '0000', role: 'ref', name: 'a-Maze-ing Ref 2', categories: ['c1_amazeing', 'c3_ai'], region: 'Eastern' },
  // AI Innovation
  { id: 'e_ai_1', username: '0505921458', password: '0000', role: 'ref', name: 'AI Innovation Ref 1', categories: ['c3_ai'], region: 'Eastern' },
  { id: 'e_ai_2', username: '0540697768', password: '0000', role: 'ref', name: 'AI Innovation Ref 2', categories: ['c3_ai'], region: 'Eastern' },

  // ─── Western Region Referees ─── (password: 0000)
  // All referees also have access to AI Innovation (c3_ai)
  { id: 'w_web_1',     username: '0569508267', password: '0000', role: 'ref', name: 'WebDesign Ref',      categories: ['c3_webdesign', 'c3_ai'], region: 'Western' },
  { id: 'w_fastbot_1', username: '0554147948', password: '0000', role: 'ref', name: 'Fastbot Ref',        categories: ['c1_fastbot', 'c3_ai'],   region: 'Western' },
  { id: 'w_soccer_1',  username: '0569450620', password: '0000', role: 'ref', name: 'SoccerBot Ref',      categories: ['c2_soccer', 'c3_ai'],    region: 'Western' },
  { id: 'w_sumo_1',    username: '0536009227', password: '0000', role: 'ref', name: 'Sumo Ref 1',         categories: ['c2_sumo', 'c3_ai'],      region: 'Western' },
  { id: 'w_sumo_2',    username: '0581123422', password: '0000', role: 'ref', name: 'Sumo Ref 2',         categories: ['c2_sumo', 'c3_ai'],      region: 'Western' },
  { id: 'w_maze_1',    username: '0569650707', password: '0000', role: 'ref', name: 'a-Maze-ing Ref',     categories: ['c1_amazeing', 'c3_ai'],  region: 'Western' },
  { id: 'w_line_1',    username: '0555547581', password: '0000', role: 'ref', name: 'LineFollowing Ref',  categories: ['c1_linefollow', 'c3_ai'],region: 'Western' },
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

// No seed teams — real teams will be added via Excel import
export const INITIAL_TEAMS = [];

// No seed participations — populated when teams are imported
export const INITIAL_PARTICIPATIONS = [];

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
