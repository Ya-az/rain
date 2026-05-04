// Lightweight audit log: append-only writes to Firestore `audit_log` collection.
// Intentionally fire-and-forget so it never blocks the main UX flow.
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { genId } from './ids';

export function logAudit({ user, action, target, details = {} }) {
  try {
    const id = genId('a');
    const entry = {
      id,
      at: new Date().toISOString(),
      userId: user?.id || null,
      username: user?.username || 'system',
      role: user?.role || 'unknown',
      action,        // e.g. 'score.delete', 'team.delete', 'matches.regenerate'
      target,        // e.g. 'scores/abc123' or 'teams/t_xyz'
      details,
    };
    setDoc(doc(db, 'audit_log', id), entry).catch(err => {
      // Audit must never crash the app
      console.warn('audit log failed:', err);
    });
  } catch (err) {
    console.warn('audit log threw:', err);
  }
}
