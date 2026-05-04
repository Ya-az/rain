// Backup/Restore: dump full Firestore competition state to JSON and restore.
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTIONS = ['teams', 'participations', 'categories', 'scores', 'group2Matches', 'users'];
const SINGLE_DOCS = [{ collection: 'config', id: 'system' }];

export async function exportBackupJson() {
  const out = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    collections: {},
    docs: {},
  };
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    out.collections[name] = snap.docs.map(d => d.data());
  }
  for (const { collection: cname, id } of SINGLE_DOCS) {
    const snap = await getDocs(collection(db, cname));
    const found = snap.docs.find(d => d.id === id);
    out.docs[`${cname}/${id}`] = found ? found.data() : null;
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `roborave-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return out;
}

export async function importBackupJson(jsonText) {
  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('Invalid JSON file');
  }
  if (!payload?.collections) throw new Error('Backup missing collections');
  // Wipe + restore each collection
  for (const name of COLLECTIONS) {
    const items = payload.collections[name];
    if (!Array.isArray(items)) continue;
    const snap = await getDocs(collection(db, name));
    const wipeBatch = writeBatch(db);
    snap.docs.forEach(d => wipeBatch.delete(d.ref));
    await wipeBatch.commit();
    if (items.length === 0) continue;
    // Firestore batch limit is 500; chunk to be safe
    for (let i = 0; i < items.length; i += 400) {
      const chunk = items.slice(i, i + 400);
      const b = writeBatch(db);
      chunk.forEach(item => {
        if (item?.id) b.set(doc(db, name, String(item.id)), item);
      });
      await b.commit();
    }
  }
  // Restore single docs
  for (const { collection: cname, id } of SINGLE_DOCS) {
    const data = payload.docs?.[`${cname}/${id}`];
    if (data) {
      const b = writeBatch(db);
      b.set(doc(db, cname, id), data);
      await b.commit();
    }
  }
  return {
    counts: Object.fromEntries(COLLECTIONS.map(name => [name, payload.collections[name]?.length || 0])),
  };
}
