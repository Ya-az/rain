import { INITIAL_TEAMS, INITIAL_PARTICIPATIONS } from '../src/constants/mockData.js';

const byCat = {};
INITIAL_PARTICIPATIONS.forEach(p => {
  const t = INITIAL_TEAMS.find(tm => tm.id === p.teamId);
  if (!t) { console.log('MISSING TEAM for participation', p); return; }
  byCat[p.categoryId] = byCat[p.categoryId] || [];
  byCat[p.categoryId].push(t);
});

let any = false;
Object.entries(byCat).forEach(([cat, arr]) => {
  const seen = {};
  arr.forEach(t => { seen[t.name] = (seen[t.name] || 0) + 1; });
  const dups = Object.entries(seen).filter(([, n]) => n > 1);
  if (dups.length) { any = true; console.log(cat, '→', dups); }
});

// Also: same teamNumber appearing twice
const numSeen = {};
INITIAL_TEAMS.forEach(t => { numSeen[t.teamNumber] = (numSeen[t.teamNumber] || 0) + 1; });
const numDups = Object.entries(numSeen).filter(([, n]) => n > 1);
if (numDups.length) { any = true; console.log('duplicate team numbers:', numDups); }

// Same id appearing twice
const idSeen = {};
INITIAL_TEAMS.forEach(t => { idSeen[t.id] = (idSeen[t.id] || 0) + 1; });
const idDups = Object.entries(idSeen).filter(([, n]) => n > 1);
if (idDups.length) { any = true; console.log('duplicate team ids:', idDups); }

console.log('---', INITIAL_TEAMS.length, 'teams,', INITIAL_PARTICIPATIONS.length, 'participations');
if (!any) console.log('NO DUPLICATES in seed data ✓');
