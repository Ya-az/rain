// Audit live Firestore for duplicate teams.
// Run with: node scripts/audit-firestore.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';

// Read firebase config from src/firebase.js
const cfgSrc = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const m = cfgSrc.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
if (!m) { console.error('cant find firebaseConfig'); process.exit(1); }
// eslint-disable-next-line no-eval
const firebaseConfig = eval('(' + m[1] + ')');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
await signInAnonymously(getAuth(app));

const teamsSnap = await getDocs(collection(db, 'teams'));
const partsSnap = await getDocs(collection(db, 'participations'));
const teams = teamsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
const parts = partsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

const norm = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

console.log('=== TOTALS ===');
console.log('teams:', teams.length, 'participations:', parts.length);

console.log('\n=== TEAMS WITH SAME NORMALIZED NAME (any region) ===');
const byName = {};
teams.forEach(t => { (byName[norm(t.name)] = byName[norm(t.name)] || []).push(t); });
Object.entries(byName).filter(([, arr]) => arr.length > 1).forEach(([name, arr]) => {
  console.log(`\n  "${name}" (${arr.length}):`);
  arr.forEach(t => console.log(`    - id=${t.id}  num=${t.teamNumber}  div=${t.division}  region=${t.region}  name="${t.name}"`));
});

console.log('\n=== TEAMS WITH SAME NAME WITHIN SAME REGION ===');
const byRegName = {};
teams.forEach(t => { const k = `${t.region}|${norm(t.name)}`; (byRegName[k] = byRegName[k] || []).push(t); });
let regDups = 0;
Object.entries(byRegName).filter(([, arr]) => arr.length > 1).forEach(([k, arr]) => {
  regDups += arr.length - 1;
  console.log(`\n  ${k} (${arr.length}):`);
  arr.forEach(t => console.log(`    - id=${t.id}  num=${t.teamNumber}  div=${t.division}`));
});
if (regDups === 0) console.log('  (none)');

console.log('\n=== DUPLICATE TEAM NUMBERS (within region) ===');
const byRegNum = {};
teams.forEach(t => { const k = `${t.region}|${t.teamNumber}`; (byRegNum[k] = byRegNum[k] || []).push(t); });
let numDups = 0;
Object.entries(byRegNum).filter(([, arr]) => arr.length > 1).forEach(([k, arr]) => {
  numDups++;
  console.log(`  ${k} →`, arr.map(t => `id=${t.id} name="${t.name}"`).join(' | '));
});
if (numDups === 0) console.log('  (none)');

console.log('\n=== DUPLICATE PARTICIPATIONS (same teamId + categoryId) ===');
const byPair = {};
parts.forEach(p => { const k = `${p.teamId}|${p.categoryId}`; (byPair[k] = byPair[k] || []).push(p); });
let pairDups = 0;
Object.entries(byPair).filter(([, arr]) => arr.length > 1).forEach(([k, arr]) => {
  pairDups++;
  console.log(`  ${k} →`, arr.map(p => p.docId).join(', '));
});
if (pairDups === 0) console.log('  (none)');

console.log('\n=== PARTICIPATIONS POINTING TO MISSING TEAMS ===');
const teamIds = new Set(teams.map(t => t.id));
const orphans = parts.filter(p => !teamIds.has(p.teamId));
if (orphans.length === 0) console.log('  (none)');
else orphans.forEach(p => console.log(`  ${p.docId} → teamId=${p.teamId} categoryId=${p.categoryId}`));

console.log('\n=== TEAMS WITH NO PARTICIPATIONS ===');
const partTeamIds = new Set(parts.map(p => p.teamId));
const lonely = teams.filter(t => !partTeamIds.has(t.id));
if (lonely.length === 0) console.log('  (none)');
else lonely.forEach(t => console.log(`  id=${t.id} name="${t.name}" region=${t.region}`));

console.log('\n=== DONE ===');
process.exit(0);
