import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { MOCK_USERS, MOCK_CATEGORIES, INITIAL_TEAMS, INITIAL_PARTICIPATIONS, DEFAULT_SYSTEM_CONFIG } from './constants/mockData';
import { t } from './constants/translations';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import NavBar from './components/layout/NavBar';
import ConfirmDialog from './components/ui/ConfirmDialog';
const Login = lazy(() => import('./views/Login'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const PublicResults = lazy(() => import('./views/PublicResults'));
const CheckInSystem = lazy(() => import('./views/CheckInSystem'));
const CompetingSystem = lazy(() => import('./views/CompetingSystem'));
const OperationsSystem = lazy(() => import('./views/OperationsSystem'));
import { buildBracketForDivision } from './utils/bracket';
import { db, ensureAuthReady } from './firebase';
import { hashPassword, verifyPassword, looksHashed, generateSalt } from './utils/passwords';
import { saveSession, loadSession, clearSession } from './utils/session';
import { genId } from './utils/ids';
import { logAudit } from './utils/audit';
import { enqueueWrite } from './utils/retryQueue';
import { notify, requestNotificationPermission } from './utils/notify';
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs, getDoc,
} from 'firebase/firestore';

// ─── Role-based access control ────────────────────────────────────────────────
const getAllowedViews = (user) => {
  if (!user) return ['dashboard'];
  const { role } = user;
  if (role === 'admin' || role === 'region_admin') return ['dashboard', 'checkin', 'competing', 'operations'];
  if (role === 'head_ref' || role === 'ref') return ['competing'];
  if (role === 'volunteer') return ['checkin'];
  return ['dashboard'];
};

function ViewSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [publicMode, setPublicMode] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // { title, message, ... }
  const [pendingImport, setPendingImport] = useState(null); // payload waiting on confirm
  const [busyImport, setBusyImport] = useState(false);
  const [busyMatches, setBusyMatches] = useState(false);
  const showToastRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  showToastRef.current = showToast;

  const reportError = (label, err) => {
    console.error(`${label}:`, err);
    showToastRef.current?.(
      lang === 'ar' ? `تعذّر ${label}` : `${label} failed: ${err?.message || err}`,
      'error',
    );
  };

  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [participations, setParticipations] = useState(INITIAL_PARTICIPATIONS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [scores, setScores] = useState([]);
  const [group2Matches, setGroup2Matches] = useState([]);
  const [customGroups, setCustomGroups] = useState([]);
  const [adminRegion, setAdminRegion] = useState('All');
  const [systemConfig, setSystemConfig] = useState(DEFAULT_SYSTEM_CONFIG);
  const [users, setUsers] = useState(MOCK_USERS);

  // ─── Anonymous Firebase Auth (Phase 1) ───────────────────────────
  useEffect(() => {
    ensureAuthReady()
      .then(() => setAuthReady(true))
      .catch((err) => {
        console.error('Anonymous auth failed:', err);
        // Allow the app to keep running so existing users can still see UI;
        // Firestore reads/writes will fail with a clear error in dev.
        setAuthReady(true);
      });
  }, []);

  // ─── Firestore: seed initial data on first run ───────────────────────
  useEffect(() => {
    if (!authReady) return;
    const seedIfEmpty = async () => {
      try {
        const teamsSnap = await getDocs(collection(db, 'teams'));
        if (teamsSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_TEAMS.forEach(tm => batch.set(doc(db, 'teams', tm.id), tm));
          INITIAL_PARTICIPATIONS.forEach(p => batch.set(doc(db, 'participations', p.id), p));
          MOCK_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.id), c));
          await batch.commit();
        } else {
          // Backfill any INITIAL_TEAMS / INITIAL_PARTICIPATIONS that aren't in
          // Firestore yet (e.g. Central roster added after the first deploy).
          const existingTeamIds = new Set(teamsSnap.docs.map(d => d.id));
          const missingTeams = INITIAL_TEAMS.filter(tm => !existingTeamIds.has(tm.id));
          const partsSnap = await getDocs(collection(db, 'participations'));
          const existingPartIds = new Set(partsSnap.docs.map(d => d.id));
          const missingParts = INITIAL_PARTICIPATIONS.filter(p => !existingPartIds.has(p.id));
          const catsSnap = await getDocs(collection(db, 'categories'));
          const existingCatIds = new Set(catsSnap.docs.map(d => d.id));
          const missingCats = MOCK_CATEGORIES.filter(c => !existingCatIds.has(c.id));
          if (missingTeams.length || missingParts.length || missingCats.length) {
            const batch = writeBatch(db);
            missingTeams.forEach(tm => batch.set(doc(db, 'teams', tm.id), tm));
            missingParts.forEach(p => batch.set(doc(db, 'participations', p.id), p));
            missingCats.forEach(c => batch.set(doc(db, 'categories', c.id), c));
            await batch.commit();
          }
        }
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          const batch = writeBatch(db);
          MOCK_USERS.forEach(u => batch.set(doc(db, 'users', u.id), u));
          await batch.commit();
        } else {
          // Backfill any MOCK_USERS that aren't in Firestore yet (e.g. new
          // admin accounts added to the seed list after first deployment).
          const existingIds = new Set(usersSnap.docs.map(d => d.id));
          const missing = MOCK_USERS.filter(u => !existingIds.has(u.id));
          if (missing.length > 0) {
            const batch = writeBatch(db);
            missing.forEach(u => batch.set(doc(db, 'users', u.id), u));
            await batch.commit();
          }
        }
        const cfgSnap = await getDoc(doc(db, 'config', 'system'));
        if (!cfgSnap.exists()) {
          await setDoc(doc(db, 'config', 'system'), DEFAULT_SYSTEM_CONFIG);
        }
      } catch (err) {
        console.error('Firestore seed error:', err);
      }
    };
    seedIfEmpty();
  }, [authReady]);

  // ─── Firestore: live sync subscriptions ──────────────────────
  useEffect(() => {
    if (!authReady) return undefined;
    const unsubTeams = onSnapshot(collection(db, 'teams'), snap => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 0) setTeams(data);
    });
    const unsubParts = onSnapshot(collection(db, 'participations'), snap => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 0) setParticipations(data);
    });
    const unsubCats = onSnapshot(collection(db, 'categories'), snap => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 0) setCategories(data);
    });
    const unsubScores = onSnapshot(collection(db, 'scores'), snap => {
      setScores(snap.docs.map(d => d.data()));
    });
    const unsubMatches = onSnapshot(collection(db, 'group2Matches'), snap => {
      setGroup2Matches(snap.docs.map(d => d.data()));
    });
    const unsubCustomGroups = onSnapshot(collection(db, 'customGroups'), snap => {
      setCustomGroups(snap.docs.map(d => d.data()));
    });
    const unsubCfg = onSnapshot(doc(db, 'config', 'system'), snap => {
      if (snap.exists()) setSystemConfig(snap.data());
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 0) setUsers(data);
    });
    return () => {
      unsubTeams(); unsubParts(); unsubCats(); unsubScores(); unsubMatches(); unsubCustomGroups(); unsubCfg(); unsubUsers();
    };
  }, [authReady]);

  // ─── Firestore-aware setters ─────────────────────────────────────────────
  // Firestore rejects values it can't serialize (class instances, functions,
  // File/Blob, BigInt, etc.) with a vague "invalid nested entity" error. This
  // sanitizer round-trips through JSON to keep only plain primitives, arrays,
  // and plain objects — and silently drops the rest.
  const sanitizeForFirestore = (value) => {
    if (value === null || value === undefined) return value;
    try {
      return JSON.parse(JSON.stringify(value, (_k, v) => {
        if (typeof v === 'function') return undefined;
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'undefined') return undefined;
        if (v instanceof Date) return v.toISOString();
        return v;
      }));
    } catch {
      return null;
    }
  };

  const setScoresFB = (updater) => {
    setScores(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevById = new Map(prev.map(s => [String(s.id), s]));
      const nextById = new Map(next.map(s => [String(s.id), s]));
      // Upsert added/changed
      nextById.forEach((s, id) => {
        if (prevById.get(id) !== s) {
          // Stamp first-seen time so downstream UI (PublicResults "Xm ago")
          // can show how recent a score is. Preserve any existing ts.
          const stamped = s && typeof s === 'object' && !s.ts ? { ...s, ts: Date.now() } : s;
          if (stamped !== s) {
            // Reflect the stamp back into the in-memory list as well.
            next[next.indexOf(s)] = stamped;
          }
          const safe = sanitizeForFirestore(stamped);
          setDoc(doc(db, 'scores', id), safe).catch(err => {
            // Queue for retry when network or transient errors occur.
            enqueueWrite({ collection: 'scores', id, payload: safe });
            reportError('save score', err);
          });
          // ─── Audit: classify the change ─────────────────────────────
          const before = prevById.get(id);
          const target = `scores/${id}`;
          if (!before) {
            logAudit({
              user: currentUser, action: 'score.create', target,
              details: { pId: stamped.pId, slotKey: stamped.slotKey, score: stamped.score, status: stamped.status },
            });
          } else {
            const becamePending = before.status !== 'PENDING' && stamped.status === 'PENDING'
              && stamped.proposedScore !== undefined;
            const wasPending = before.status === 'PENDING' && stamped.status !== 'PENDING';
            const scoreChanged = before.score !== stamped.score;
            if (becamePending) {
              logAudit({
                user: currentUser, action: 'score.edit_request', target,
                details: { pId: stamped.pId, slotKey: stamped.slotKey, from: before.score, to: stamped.proposedScore },
              });
            } else if (wasPending && scoreChanged) {
              logAudit({
                user: currentUser, action: 'score.approve', target,
                details: { pId: stamped.pId, slotKey: stamped.slotKey, from: before.score, to: stamped.score },
              });
            } else if (wasPending && !scoreChanged) {
              logAudit({
                user: currentUser, action: 'score.reject', target,
                details: { pId: stamped.pId, slotKey: stamped.slotKey, score: stamped.score, rejectedProposal: before.proposedScore },
              });
            } else if (scoreChanged) {
              logAudit({
                user: currentUser, action: 'score.update', target,
                details: { pId: stamped.pId, slotKey: stamped.slotKey, from: before.score, to: stamped.score },
              });
            }
          }
        }
      });
      // Delete removed
      prevById.forEach((before, id) => {
        if (!nextById.has(id)) {
          deleteDoc(doc(db, 'scores', id)).catch(err => reportError('remove score', err));
          logAudit({
            user: currentUser, action: 'score.delete', target: `scores/${id}`,
            details: { pId: before?.pId, slotKey: before?.slotKey, score: before?.score },
          });
        }
      });
      return next;
    });
  };

  const setSystemConfigFB = (updater) => {
    setSystemConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setDoc(doc(db, 'config', 'system'), next).catch(err => reportError('save config', err));
      return next;
    });
  };

  // ─── Authorized teams (region-filtered) ──────────────────────────────────
  const authorizedTeams = useMemo(() => {
    if (!currentUser) return teams;
    if (currentUser.role === 'admin') {
      return adminRegion === 'All' ? teams : teams.filter(tm => tm.region === adminRegion);
    }
    return teams.filter(tm => tm.region === currentUser.region);
  }, [teams, currentUser, adminRegion]);

  // ─── Desktop notifications for new pending approvals (admins only) ───────
  // Asks for permission once after an admin logs in, then pings whenever a
  // new score enters PENDING status while the tab is hidden.
  const prevPendingIdsRef = useRef(new Set());
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      requestNotificationPermission();
    }
  }, [currentUser?.role]);
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      prevPendingIdsRef.current = new Set();
      return;
    }
    const currentPending = new Set(
      scores.filter(s => s.status === 'PENDING').map(s => String(s.id))
    );
    // Only fire once we have a baseline (skip first hydration burst).
    if (prevPendingIdsRef.current.size > 0 || prevPendingIdsRef.current.__init) {
      const fresh = [...currentPending].filter(id => !prevPendingIdsRef.current.has(id));
      if (fresh.length > 0) {
        const title = lang === 'ar'
          ? `طلبات موافقة جديدة (${fresh.length})`
          : `${fresh.length} new approval${fresh.length > 1 ? 's' : ''} pending`;
        const body = lang === 'ar'
          ? 'افتح لوحة العمليات لمراجعة التعديلات.'
          : 'Open Operations to review edit requests.';
        notify({
          title,
          body,
          tag: 'roborave-pending',
          onClick: () => safeSetView?.('operations'),
        });
      }
    } else {
      prevPendingIdsRef.current.__init = true;
    }
    prevPendingIdsRef.current = currentPending;
  }, [scores, currentUser?.role, lang]);

  // ─── Login / Logout ───────────────────────────────────────────────────────
  // Supports both hashed and legacy plain-text password records during the
  // migration window. On a successful legacy login we silently upgrade the
  // record to a hashed value.
  const handleLogin = async (username, password) => {
    if (!username || !password) return false;
    const candidate = users.find(u => u.username === username);
    if (!candidate) return false;

    let ok = false;
    if (candidate.passwordHash) {
      ok = await verifyPassword(password, candidate.passwordHash, candidate.salt || '');
    } else if (looksHashed(candidate.password)) {
      // Legacy migrations may have stored the hash directly in `password`.
      ok = (await hashPassword(password, candidate.salt || '')) === candidate.password;
    } else if (candidate.password) {
      // Legacy plain-text fallback.
      ok = candidate.password === password;
      if (ok) {
        // Auto-upgrade to a hashed record (best-effort).
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        const upgraded = { ...candidate, salt, passwordHash };
        delete upgraded.password;
        setUsers(prev => prev.map(u => (u.id === candidate.id ? upgraded : u)));
        setDoc(doc(db, 'users', candidate.id), upgraded).catch(err => reportError('upgrade password', err));
      }
    }

    if (!ok) return false;

    // Drop sensitive fields from in-memory + persisted session.
    const safeUser = { ...candidate };
    delete safeUser.password;
    delete safeUser.passwordHash;
    delete safeUser.salt;

    setCurrentUser(safeUser);
    saveSession(safeUser);

    if (safeUser.role === 'volunteer') setCurrentView('checkin');
    else if (safeUser.role === 'admin' || safeUser.role === 'region_admin') setCurrentView('operations');
    else setCurrentView('competing');
    return true;
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentView('dashboard');
    setAdminRegion('All');
  };

  // ─── Team status helper ───────────────────────────────────────────────────
  const getTeamStatus = (team) => {
    const total = team.members.length + 1;
    const present = team.members.filter(m => m.present).length + (team.coach.present ? 1 : 0);
    if (present === 0) return 'No-Show';
    if (present === total) return 'Fully Arrived';
    return 'Partially Arrived';
  };

  // ─── Confirm attendance ───────────────────────────────────────────────────
  const confirmAttendance = (teamId, coachPresent, updatedMembers) => {
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      const updated = { ...team, coach: { ...team.coach, present: coachPresent }, members: updatedMembers };
      setDoc(doc(db, 'teams', teamId), updated).catch(err => reportError('save attendance', err));
      return updated;
    }));
    showToast(t(lang, 'toastCheckIn'));
  };

  // ─── Import teams from Excel ──────────────────────────────────────────────
  // Opens a destructive type-to-confirm dialog; the actual write happens in
  // `runImport`. Returns Promise<boolean> (true on success, false on cancel).
  const importResolverRef = useRef(null);
  const importTeams = (payload) => {
    return new Promise((resolve) => {
      importResolverRef.current = resolve;
      setPendingImport(payload);
      setConfirmState({
        kind: 'import',
        variant: 'danger',
        typeToConfirm: 'RESET',
        title: lang === 'ar' ? 'إعادة تعيين البيانات' : 'Reset Tournament Data',
        message: lang === 'ar'
          ? 'سيتم حذف جميع بيانات الحضور والدرجات والمباريات واستبدالها بالفرق المستوردة. لا يمكن التراجع.'
          : 'All check-in, scoring, and bracket data will be permanently replaced with the imported teams. This cannot be undone.',
        confirmLabel: lang === 'ar' ? 'تأكيد الإعادة' : 'Reset & Import',
      });
    });
  };

  const runImport = async ({ teams: importedTeams, participations: importedParticipations, categories: importedCategories }) => {
    setBusyImport(true);
    try {
      const normalize = (v) => v?.toString().toLowerCase().trim().replace(/\s+/g, ' ') ?? '';
      const catIdRemap = {};
      importedCategories.forEach(importedCat => {
        const match = MOCK_CATEGORIES.find(
          mc => normalize(mc.name) === normalize(importedCat.name)
        );
        if (match && match.id !== importedCat.id) {
          catIdRemap[importedCat.id] = match.id;
        }
      });

      const remappedParticipations = importedParticipations.map(p => ({
        ...p,
        categoryId: catIdRemap[p.categoryId] ?? p.categoryId,
      }));

      setTeams(importedTeams);
      setParticipations(remappedParticipations);

      const knownIds = new Set(MOCK_CATEGORIES.map(c => c.id));
      const remappedCategories = importedCategories.map(c => ({
        ...c,
        id: catIdRemap[c.id] ?? c.id,
      }));
      const merged = [
        ...MOCK_CATEGORIES,
        ...remappedCategories.filter(c => !knownIds.has(c.id)),
      ];
      setCategories(merged);
      setScores([]);
      setGroup2Matches([]);

      const wipe = async (name) => {
        const snap = await getDocs(collection(db, name));
        const b = writeBatch(db);
        snap.docs.forEach(d => b.delete(d.ref));
        await b.commit();
      };
      await Promise.all([wipe('teams'), wipe('participations'), wipe('categories'), wipe('scores'), wipe('group2Matches')]);
      const b = writeBatch(db);
      importedTeams.forEach(tm => b.set(doc(db, 'teams', tm.id), tm));
      remappedParticipations.forEach(p => b.set(doc(db, 'participations', p.id), p));
      merged.forEach(c => b.set(doc(db, 'categories', c.id), c));
      await b.commit();
      showToast(lang === 'ar' ? 'تم استيراد الفرق ✓' : 'Teams imported ✓');
      importResolverRef.current?.(true);
    } catch (err) {
      reportError(lang === 'ar' ? 'استيراد الفرق' : 'team import', err);
      importResolverRef.current?.(false);
    } finally {
      importResolverRef.current = null;
      setBusyImport(false);
      setPendingImport(null);
    }
  };

  // ─── Matchmaking — Single-elimination Knockout Brackets ───────────────────
  // Builds a bracket per (category × bucket) from currently checked-in teams.
  // Buckets follow the FastBot-style grouping: ES + MS together, and HS + US
  // together. The skeleton matches are written into Firestore `group2Matches`;
  // later rounds are filled by resolveBracket() at render time as winners are saved.
  const generateMatches = () => {
    // Guard: if existing brackets already have winners recorded, regenerating
    // will wipe them. Prompt for type-to-confirm before nuking real results.
    const hasResults = group2Matches.some(m => m?.winnerSide || m?.winnerTeamId);
    const matchIds = new Set(group2Matches.map(m => m.id));
    const hasMatchScores = scores.some(s => s?.pId && matchIds.has(s.pId));
    if (hasResults || hasMatchScores) {
      setConfirmState({
        kind: 'regenMatches',
        variant: 'danger',
        typeToConfirm: 'REGEN',
        title: lang === 'ar' ? 'إعادة توليد الجداول' : 'Regenerate Brackets',
        message: lang === 'ar'
          ? 'الجداول الحالية تحتوي على نتائج مسجّلة. إعادة التوليد ستمسح كل المباريات (بما فيها الفائزين) وتنشئ قرعة جديدة. لا يمكن التراجع.'
          : 'Existing brackets already have recorded winners. Regenerating will delete all matches (including results) and create fresh brackets. This cannot be undone.',
        confirmLabel: lang === 'ar' ? 'تأكيد الإعادة' : 'Regenerate',
      });
      return;
    }
    runGenerateMatches();
  };

  const runGenerateMatches = () => {
    logAudit({ user: currentUser, action: 'matches.regenerate', target: 'group2Matches' });
    const SOCCER_BUCKETS = [
      { key: 'ES / MS', divs: ['ES', 'MS'] },
      { key: 'HS / US', divs: ['HS', 'US'] },
    ];
    // Sumo runs each division as its own standalone bracket (ES, MS, HS, US).
    const SUMO_BUCKETS = [
      { key: 'ES', divs: ['ES'] },
      { key: 'MS', divs: ['MS'] },
      { key: 'HS', divs: ['HS'] },
      { key: 'US', divs: ['US'] },
    ];
    const buildForCategory = (catId, label, BUCKETS) => {
      const partsInCat = participations.filter(p => p.categoryId === catId);
      const byBucket = Object.fromEntries(BUCKETS.map(b => [b.key, []]));
      partsInCat.forEach(p => {
        const team = teams.find(tm => tm.id === p.teamId);
        if (!team) return;
        const status = getTeamStatus(team);
        if (status === 'No-Show') return;
        const bucket = BUCKETS.find(b => b.divs.includes(team.division));
        if (!bucket) return;
        byBucket[bucket.key].push({
          teamId: team.id,
          teamName: team.name,
          region: team.region,
        });
      });
      const out = [];
      BUCKETS.forEach(({ key }) => {
        const entries = byBucket[key];
        if (entries.length < 2) return;
        out.push(...buildBracketForDivision({ entries, categoryId: catId, division: key, label }));
      });
      return out;
    };

    const matches = [
      ...buildForCategory('c2_sumo',   'Sumo',   SUMO_BUCKETS),
      ...buildForCategory('c2_soccer', 'Soccer', SOCCER_BUCKETS),
    ];
    if (matches.length === 0) {
      showToast(t(lang, 'toastNoMatchablePairs') || (lang === 'ar' ? 'لا توجد فرق كافية لتكوين مباريات' : 'No checked-in teams available to pair'), 'error');
      return;
    }
    setGroup2Matches(matches);
    setBusyMatches(true);
    (async () => {
      try {
        const existing = await getDocs(collection(db, 'group2Matches'));
        const delBatch = writeBatch(db);
        existing.docs.forEach(d => delBatch.delete(d.ref));
        await delBatch.commit();
        const b = writeBatch(db);
        matches.forEach(m => b.set(doc(db, 'group2Matches', m.id), m));
        await b.commit();
      } catch (err) {
        reportError(lang === 'ar' ? 'توليد المباريات' : 'generate matches', err);
      } finally {
        setBusyMatches(false);
      }
    })();
    const playable = matches.filter(m => m.roundIndex === 0 && !m.isBye).length;
    showToast(`${t(lang, 'toastMatchGenerated')} (${playable} ${lang === 'ar' ? 'مباراة جولة أولى' : 'R1 matches'})`);
  };

  // ─── User management (Firestore-backed) ────────────────────────────────
  const addUser = async (newUser) => {
    if (!newUser?.username || !newUser?.password) return false;
    if (users.some(u => u.username === newUser.username)) {
      showToast(lang === 'ar' ? 'اسم المستخدم موجود مسبقاً' : 'Username already exists', 'error');
      return false;
    }
    const id = newUser.id || genId('u');
    const salt = generateSalt();
    const passwordHash = await hashPassword(newUser.password, salt);
    const userDoc = { ...newUser, id, salt, passwordHash };
    delete userDoc.password;
    setUsers(prev => [...prev, userDoc]);
    setDoc(doc(db, 'users', id), userDoc).catch(err => reportError('save user', err));
    logAudit({ user: currentUser, action: 'user.create', target: `users/${id}`, details: { username: newUser.username, role: newUser.role } });
    showToast(lang === 'ar' ? 'تم إضافة المستخدم ✓' : 'User added ✓');
    return true;
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteDoc(doc(db, 'users', userId)).catch(err => reportError('delete user', err));
    logAudit({ user: currentUser, action: 'user.delete', target: `users/${userId}` });
    showToast(lang === 'ar' ? 'تم حذف المستخدم' : 'User removed', 'info');
  };

  // ─── Add a single team manually (admin-only UI) ────────────────────────
  // payload: { name, region, division, coachName, members: [{name}], categoryIds: [string] }
  const addTeam = (payload) => {
    if (!payload?.name?.trim() || !payload?.region || !payload?.division) {
      showToast(lang === 'ar' ? 'الاسم والمنطقة والمستوى مطلوبة' : 'Name, region & division are required', 'error');
      return false;
    }
    const memberList = (payload.members || [])
      .map((m, idx) => ({ id: genId('m'), name: (m.name || '').trim(), present: false }))
      .filter(m => m.name);
    if (memberList.length === 0) {
      showToast(lang === 'ar' ? 'أضف عضواً واحداً على الأقل' : 'Add at least one member', 'error');
      return false;
    }
    const catIds = (payload.categoryIds || []).filter(Boolean);
    if (catIds.length === 0) {
      showToast(lang === 'ar' ? 'اختر فئة واحدة على الأقل' : 'Pick at least one category', 'error');
      return false;
    }

    const teamId = genId('t');
    const newTeam = {
      id: teamId,
      name: payload.name.trim(),
      division: payload.division,
      region: payload.region,
      members: memberList,
      coach: { name: (payload.coachName || '').trim() || '—', present: false },
      categories: catIds,
    };

    // Generate participation IDs (26<seq><RegionLetter>) — same scheme as Excel import.
    const letter = (payload.region || 'W').charAt(0).toUpperCase();
    let maxSeq = participations.reduce((m, p) => {
      const match = p.id?.match?.(/^26(\d{3})/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    const newParts = catIds.map(catId => {
      maxSeq += 1;
      return {
        id: `26${String(maxSeq).padStart(3, '0')}${letter}`,
        teamId,
        categoryId: catId,
      };
    });

    setTeams(prev => [...prev, newTeam]);
    setParticipations(prev => [...prev, ...newParts]);

    (async () => {
      try {
        const b = writeBatch(db);
        b.set(doc(db, 'teams', teamId), newTeam);
        newParts.forEach(p => b.set(doc(db, 'participations', p.id), p));
        await b.commit();
      } catch (err) {
        reportError(lang === 'ar' ? 'إضافة الفريق' : 'add team', err);
      }
    })();

    showToast(lang === 'ar' ? `تم إضافة الفريق ✓ (${newParts.length} مشاركة)` : `Team added ✓ (${newParts.length} participations)`);
    return true;
  };

  // ─── Delete a team (admin-only UI) ─────────────────────────────────────
  // Removes team doc, all of its participations, and any scores tied to those
  // participations. Cascades both locally and in Firestore.
  const deleteTeam = (teamId) => {
    if (!teamId) return false;
    const team = teams.find(t => t.id === teamId);
    const teamParts = participations.filter(p => p.teamId === teamId);
    const partIds = new Set(teamParts.map(p => p.id));
    const teamScores = scores.filter(s => partIds.has(s.pId));

    setTeams(prev => prev.filter(t => t.id !== teamId));
    setParticipations(prev => prev.filter(p => p.teamId !== teamId));
    setScores(prev => prev.filter(s => !partIds.has(s.pId)));

    (async () => {
      try {
        const b = writeBatch(db);
        b.delete(doc(db, 'teams', teamId));
        teamParts.forEach(p => b.delete(doc(db, 'participations', p.id)));
        teamScores.forEach(s => b.delete(doc(db, 'scores', String(s.id))));
        await b.commit();
        logAudit({ user: currentUser, action: 'team.delete', target: `teams/${teamId}`, payload: { name: team?.name, removedParts: teamParts.length, removedScores: teamScores.length } });
      } catch (err) {
        reportError(lang === 'ar' ? 'حذف الفريق' : 'delete team', err);
      }
    })();

    showToast(lang === 'ar'
      ? `تم حذف "${team?.name || teamId}" (${teamParts.length} مشاركة، ${teamScores.length} نتيجة)`
      : `Removed "${team?.name || teamId}" (${teamParts.length} parts, ${teamScores.length} scores)`,
      'info'
    );
    return true;
  };

  // ─── Remove a single participation (admin) ─────────────────────────────
  // Drops the team from one specific category table; keeps the team itself.
  // Cascades any scores tied to the participation id.
  const removeParticipation = (participationId) => {
    if (!participationId) return false;
    const part = participations.find(p => p.id === participationId);
    if (!part) return false;
    const team = teams.find(t => t.id === part.teamId);
    const cat  = categories.find(c => c.id === part.categoryId);
    const partScores = scores.filter(s => s.pId === participationId);

    setParticipations(prev => prev.filter(p => p.id !== participationId));
    setScores(prev => prev.filter(s => s.pId !== participationId));

    (async () => {
      try {
        const b = writeBatch(db);
        b.delete(doc(db, 'participations', participationId));
        partScores.forEach(s => b.delete(doc(db, 'scores', String(s.id))));
        await b.commit();
        logAudit({ user: currentUser, action: 'participation.delete', target: `participations/${participationId}`, payload: { team: team?.name, category: cat?.name, removedScores: partScores.length } });
      } catch (err) {
        reportError(lang === 'ar' ? 'حذف المشاركة' : 'remove participation', err);
      }
    })();

    showToast(lang === 'ar'
      ? `تم حذف "${team?.name || ''}" من جدول ${cat?.name || ''}`
      : `Removed "${team?.name || ''}" from ${cat?.name || ''} table`,
      'info'
    );
    return true;
  };

  // ─── Add a participation (existing team → category, admin) ────────────
  const addParticipation = ({ teamId, categoryId }) => {
    if (!teamId || !categoryId) return false;
    const team = teams.find(t => t.id === teamId);
    const cat  = categories.find(c => c.id === categoryId);
    if (!team || !cat) return false;
    if (participations.some(p => p.teamId === teamId && p.categoryId === categoryId)) {
      showToast(lang === 'ar' ? 'الفريق مسجّل مسبقاً في هذه الفئة' : 'Team is already in this category', 'error');
      return false;
    }
    const letter = (team.region || 'W').charAt(0).toUpperCase();
    const maxSeq = participations.reduce((m, p) => {
      const match = p.id?.match?.(/^26(\d{3})/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    const newPart = {
      id: `26${String(maxSeq + 1).padStart(3, '0')}${letter}`,
      teamId,
      categoryId,
    };

    setParticipations(prev => [...prev, newPart]);
    // Mirror the team's categories array if missing — keeps roster card in sync.
    if (!team.categories?.includes(categoryId)) {
      const updatedTeam = { ...team, categories: [...(team.categories || []), categoryId] };
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
      setDoc(doc(db, 'teams', teamId), updatedTeam).catch(err => reportError('sync team categories', err));
    }
    setDoc(doc(db, 'participations', newPart.id), newPart)
      .then(() => logAudit({ user: currentUser, action: 'participation.add', target: `participations/${newPart.id}`, payload: { team: team.name, category: cat.name } }))
      .catch(err => reportError(lang === 'ar' ? 'إضافة مشاركة' : 'add participation', err));

    showToast(lang === 'ar' ? `أُضيف "${team.name}" إلى ${cat.name} ✓` : `Added "${team.name}" to ${cat.name} ✓`);
    return true;
  };

  // ─── Update a bracket match (admin manual matchup) ─────────────────────
  // Lets admin override teamA / teamB on a specific bracket slot — useful
  // for Sumo when the auto-generated pairing needs to be tweaked.
  const updateBracketMatch = (matchId, patch) => {
    if (!matchId || !patch) return false;
    const existing = group2Matches.find(m => m.id === matchId);
    if (!existing) return false;
    const next = { ...existing, ...patch };
    setGroup2Matches(prev => prev.map(m => m.id === matchId ? next : m));
    setDoc(doc(db, 'group2Matches', matchId), next)
      .then(() => logAudit({ user: currentUser, action: 'bracket.edit', target: `group2Matches/${matchId}`, payload: patch }))
      .catch(err => reportError(lang === 'ar' ? 'تعديل المباراة' : 'edit bracket match', err));
    showToast(lang === 'ar' ? 'تم تحديث المباراة' : 'Match updated');
    return true;
  };

  // ─── Custom Groups (admin-defined sub-tables per category) ─────────────
  // Admin can create a named bucket of teams inside a category — useful when
  // the auto ES/MS/HS/US split doesn't fit (e.g. a special demo group, or
  // splitting Sumo HS into two pools). Stored under collection 'customGroups'.
  // shape: { id, categoryId, name, teamIds: [string], createdAt }
  const addCustomGroup = ({ categoryId, name, teamIds = [] }) => {
    if (!categoryId || !name?.trim()) {
      showToast(lang === 'ar' ? 'الاسم والفئة مطلوبان' : 'Name and category required', 'error');
      return false;
    }
    const id = `cg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const group = { id, categoryId, name: name.trim(), teamIds: Array.from(new Set(teamIds)), createdAt: Date.now() };
    setCustomGroups(prev => [...prev, group]);
    setDoc(doc(db, 'customGroups', id), group)
      .then(() => logAudit({ user: currentUser, action: 'customGroup.add', target: `customGroups/${id}`, payload: { categoryId, name: group.name, count: group.teamIds.length } }))
      .catch(err => reportError(lang === 'ar' ? 'إضافة جدول مخصص' : 'add custom group', err));
    showToast(lang === 'ar' ? `تم إنشاء "${group.name}"` : `Created "${group.name}"`);
    return id;
  };

  const updateCustomGroup = (id, patch) => {
    if (!id || !patch) return false;
    const existing = customGroups.find(g => g.id === id);
    if (!existing) return false;
    const next = { ...existing, ...patch };
    if (Array.isArray(next.teamIds)) next.teamIds = Array.from(new Set(next.teamIds));
    setCustomGroups(prev => prev.map(g => g.id === id ? next : g));
    setDoc(doc(db, 'customGroups', id), next)
      .then(() => logAudit({ user: currentUser, action: 'customGroup.update', target: `customGroups/${id}`, payload: patch }))
      .catch(err => reportError(lang === 'ar' ? 'تحديث الجدول المخصص' : 'update custom group', err));
    return true;
  };

  const deleteCustomGroup = (id) => {
    if (!id) return false;
    const existing = customGroups.find(g => g.id === id);
    setCustomGroups(prev => prev.filter(g => g.id !== id));
    deleteDoc(doc(db, 'customGroups', id))
      .then(() => logAudit({ user: currentUser, action: 'customGroup.delete', target: `customGroups/${id}`, payload: { name: existing?.name } }))
      .catch(err => reportError(lang === 'ar' ? 'حذف الجدول المخصص' : 'delete custom group', err));
    showToast(lang === 'ar' ? `تم حذف "${existing?.name || id}"` : `Removed "${existing?.name || id}"`, 'info');
    return true;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // ─── Access control ───────────────────────────────────────────────────────
  const allowedViews = getAllowedViews(currentUser);
  const safeSetView = (view) => {
    if (allowedViews.includes(view)) setCurrentView(view);
  };

  // ─── Login screen (no user) ───────────────────────────────────────────────
  if (!currentUser && !publicMode) {
    return (
      <Suspense fallback={<ViewSpinner />}>
        <Login
          handleLogin={handleLogin}
          lang={lang}
          onToggleLang={() => setLang(l => l === 'en' ? 'ar' : 'en')}
          onEnterPublic={() => setPublicMode(true)}
        />
      </Suspense>
    );
  }

  // ─── Public live dashboard (no login) ───────────────────────────
  if (!currentUser && publicMode) {
    return (
      <div className="relative pt-14 sm:pt-0">
        <Suspense fallback={<ViewSpinner />}>
          <PublicResults
            teams={teams}
            getTeamStatus={getTeamStatus}
            scores={scores}
            lang={lang}
            participations={participations}
            categories={categories}
            group2Matches={group2Matches}
          />
        </Suspense>
        {/* Floating controls */}
        <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:py-1.5 rounded-full bg-black/50 backdrop-blur border border-white/15 shadow-xl">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-black transition-colors whitespace-nowrap"
          >
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <button
            onClick={() => setPublicMode(false)}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-brand-500 hover:bg-brand-400 text-white text-[11px] sm:text-xs font-black transition-colors whitespace-nowrap"
          >
            {lang === 'ar' ? 'دخول الموظفين' : 'Staff Login'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main app shell ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-ink-50 pb-20 sm:pb-0" dir={dir}>
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        adminRegion={adminRegion}
        setAdminRegion={setAdminRegion}
      />
      <NavBar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={safeSetView}
        allowedViews={allowedViews}
        lang={lang}
        pendingCount={scores.filter(s => s.status === 'PENDING').length}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
        <Suspense fallback={<ViewSpinner />}>
        {currentView === 'dashboard' && allowedViews.includes('dashboard') && (
          <Dashboard
            teams={authorizedTeams}
            getTeamStatus={getTeamStatus}
            scores={scores}
            lang={lang}
            participations={participations}
            categories={categories}
            group2Matches={group2Matches}
          />
        )}
        {currentView === 'checkin' && allowedViews.includes('checkin') && (
          <CheckInSystem
            teams={authorizedTeams}
            getTeamStatus={getTeamStatus}
            confirmAttendance={confirmAttendance}
            participations={participations}
            categories={categories}
            lang={lang}
          />
        )}
        {currentView === 'competing' && allowedViews.includes('competing') && (
          <CompetingSystem
            categories={categories}
            participations={participations}
            teams={authorizedTeams}
            allTeams={teams}
            getTeamStatus={getTeamStatus}
            scores={scores}
            setScores={setScoresFB}
            currentUser={currentUser}
            group2Matches={group2Matches}
            systemConfig={systemConfig}
            lang={lang}
            showToast={showToast}
            removeParticipation={removeParticipation}
            addParticipation={addParticipation}
            updateBracketMatch={updateBracketMatch}
            customGroups={customGroups}
            addCustomGroup={addCustomGroup}
            updateCustomGroup={updateCustomGroup}
            deleteCustomGroup={deleteCustomGroup}
          />
        )}
        {currentView === 'operations' && allowedViews.includes('operations') && (
          <OperationsSystem
            scores={scores}
            setScores={setScoresFB}
            teams={authorizedTeams}
            participations={participations}
            categories={categories}
            confirmAttendance={confirmAttendance}
            generateMatches={generateMatches}
            importTeams={importTeams}
            currentUser={currentUser}
            systemConfig={systemConfig}
            setSystemConfig={setSystemConfigFB}
            lang={lang}
            showToast={showToast}
            users={users}
            addUser={addUser}
            deleteUser={deleteUser}
            addTeam={addTeam}
            deleteTeam={deleteTeam}
            group2Matches={group2Matches}
            busyImport={busyImport}
            busyMatches={busyMatches}
          />
        )}
        </Suspense>
      </main>

      <Footer lang={lang} />

      {/* Confirm dialog (destructive actions) */}
      <ConfirmDialog
        open={!!confirmState}
        lang={lang}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        variant={confirmState?.variant}
        typeToConfirm={confirmState?.typeToConfirm}
        busy={confirmState?.kind === 'import' ? busyImport : false}
        onCancel={() => {
          setConfirmState(null);
          if (pendingImport) setPendingImport(null);
          if (importResolverRef.current) {
            importResolverRef.current(false);
            importResolverRef.current = null;
          }
        }}
        onConfirm={async () => {
          const state = confirmState;
          if (!state) return;
          if (state.kind === 'import' && pendingImport) {
            const payload = pendingImport;
            setConfirmState(null);
            await runImport(payload);
          } else if (state.kind === 'regenMatches') {
            setConfirmState(null);
            runGenerateMatches();
          } else {
            setConfirmState(null);
          }
        }}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed z-[200] bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white flex items-center gap-2 whitespace-nowrap animate-fade-in ${
            toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-brand-600' : 'bg-saudi-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
