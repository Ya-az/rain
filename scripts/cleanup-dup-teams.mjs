// One-time prod cleanup: merge dup Central teams (t_*_1777781000xxx) into their
// canonical seeded twins (t_central_NNN). Reassigns participations + scores then
// deletes the dups. Run with:  node scripts/cleanup-dup-teams.mjs --dry
// Drop --dry to actually commit.
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';

const cfgSrc = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const m = cfgSrc.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
// eslint-disable-next-line no-eval
const firebaseConfig = eval('(' + m[1] + ')');
const dryRun = process.argv.includes('--dry');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
await signInAnonymously(getAuth(app));

const norm = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
const isJunkId = (id) => /_1777781000\d{3}$/.test(id);

// Manual aliases for junk teams whose names don't match canonical exactly.
// Maps junk team id → canonical t_central_NNN id.
const ALIASES = {
  't_al-namothajiyah_eagles_نسور_النموذجيه_1777781000556': 't_central_125',
  't_stars_of_knowledge_-_مياسين_المعرفة_1777781000559': 't_central_224',
  't_اااا_1777781000559': 't_central_225',
  't_عبدالله_بن_أبي_أوفى_1777781000559': 't_central_233', // AI HS variant
  't_نجوم_التربية_2_1777781000556': 't_central_251',
  // 'The Next Step' (HS) — the junk participation likely belongs to 256 or 257.
  // We pick 257 since 256 is already populated by some other path; user can move
  // afterward via the inline editor if needed.
  't_the_next_step_1777781000557': 't_central_257',
};

const teamsSnap = await getDocs(collection(db, 'teams'));
const partsSnap = await getDocs(collection(db, 'participations'));
const scoresSnap = await getDocs(collection(db, 'scores'));

const teams = teamsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
const parts = partsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
const scores = scoresSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

// Build canonical lookup: only Central seeded teams keyed by name (case-insensitive)
const canonical = {};
teams.forEach(t => {
  if (t.region === 'Central' && /^t_central_\d+$/.test(t.id)) {
    const k = norm(t.name);
    (canonical[k] = canonical[k] || []).push(t);
  }
});

// For each junk Central team, find canonical
const junk = teams.filter(t => t.region === 'Central' && isJunkId(t.id));
console.log(`\nFound ${junk.length} junk Central teams.`);

const partsByTeam = {};
parts.forEach(p => { (partsByTeam[p.teamId] = partsByTeam[p.teamId] || []).push(p); });
const scoresByTeam = {};
scores.forEach(s => {
  const tid = s.teamId || s.team_id;
  if (tid) (scoresByTeam[tid] = scoresByTeam[tid] || []).push(s);
});

let plan = []; // {junkId, canonicalId, parts, scores}
let unresolved = [];

for (const j of junk) {
  const aliasTarget = ALIASES[j.id];
  const matches = aliasTarget
    ? teams.filter(t => t.id === aliasTarget)
    : (canonical[norm(j.name)] || []);
  const partsHere = partsByTeam[j.id] || [];
  const scoresHere = scoresByTeam[j.id] || [];

  if (matches.length === 0) {
    unresolved.push({ ...j, partsCount: partsHere.length, scoresCount: scoresHere.length });
    continue;
  }
  // If multiple canonical matches, try to disambiguate by participation's categoryId
  let chosen = matches[0];
  if (matches.length > 1 && partsHere.length > 0) {
    // pick the canonical whose seed participation matched the same category
    const seedParts = parts.filter(p => matches.some(c => c.id === p.teamId));
    // find matching by categoryId
    for (const p of partsHere) {
      const cand = matches.find(c =>
        seedParts.some(sp => sp.teamId === c.id && sp.categoryId === p.categoryId)
      );
      if (cand) { chosen = cand; break; }
    }
  }
  plan.push({
    junkId: j.id,
    junkName: j.name,
    canonicalId: chosen.id,
    canonicalName: chosen.name,
    partsCount: partsHere.length,
    scoresCount: scoresHere.length,
    parts: partsHere,
    scores: scoresHere,
  });
}

console.log('\n=== PLAN ===');
plan.forEach(p => {
  console.log(`  ${p.junkId}  →  ${p.canonicalId}   (parts:${p.partsCount}, scores:${p.scoresCount})`);
});
if (unresolved.length) {
  console.log('\n=== UNRESOLVED (no canonical match — will keep) ===');
  unresolved.forEach(u => console.log(`  ${u.id}  name="${u.name}"  div=${u.division}  parts=${u.partsCount} scores=${u.scoresCount}`));
}

console.log(`\nWill: reassign ${plan.reduce((n,p)=>n+p.partsCount,0)} parts + ${plan.reduce((n,p)=>n+p.scoresCount,0)} scores; delete ${plan.length} junk teams.`);

if (dryRun) {
  console.log('\n[dry-run] no writes performed. Drop --dry to commit.');
  process.exit(0);
}

// Commit in chunks (Firestore batch limit = 500 ops)
let batch = writeBatch(db);
let ops = 0;
const flush = async () => { if (ops > 0) { await batch.commit(); batch = writeBatch(db); ops = 0; } };

for (const p of plan) {
  for (const part of p.parts) {
    // Skip if reassign would create a dup (canonical already has same categoryId)
    const dup = parts.find(x => x.teamId === p.canonicalId && x.categoryId === part.categoryId && x.docId !== part.docId);
    if (dup) {
      // delete this junk-pointing participation outright
      batch.delete(doc(db, 'participations', part.docId));
    } else {
      batch.set(doc(db, 'participations', part.docId), { ...part, teamId: p.canonicalId });
      delete batch._docs; // avoid TS warning; no-op
    }
    ops++;
    if (ops >= 400) await flush();
  }
  for (const s of p.scores) {
    batch.set(doc(db, 'scores', s.docId), { ...s, teamId: p.canonicalId });
    ops++;
    if (ops >= 400) await flush();
  }
  batch.delete(doc(db, 'teams', p.junkId));
  ops++;
  if (ops >= 400) await flush();
}
await flush();
console.log('\n✓ committed.');
process.exit(0);
