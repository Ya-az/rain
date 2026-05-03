import { useState, useMemo, useEffect } from 'react';
import { MOCK_USERS, MOCK_CATEGORIES, INITIAL_TEAMS, INITIAL_PARTICIPATIONS, DEFAULT_SYSTEM_CONFIG } from './constants/mockData';
import { t } from './constants/translations';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import NavBar from './components/layout/NavBar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import PublicResults from './views/PublicResults';
import CheckInSystem from './views/CheckInSystem';
import CompetingSystem from './views/CompetingSystem';
import OperationsSystem from './views/OperationsSystem';
import { buildBracketForDivision } from './utils/bracket';
import { db } from './firebase';
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

export default function App() {
  const [lang, setLang] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);
  const [publicMode, setPublicMode] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [participations, setParticipations] = useState(INITIAL_PARTICIPATIONS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [scores, setScores] = useState([]);
  const [group2Matches, setGroup2Matches] = useState([]);
  const [adminRegion, setAdminRegion] = useState('All');
  const [systemConfig, setSystemConfig] = useState(DEFAULT_SYSTEM_CONFIG);
  const [users, setUsers] = useState(MOCK_USERS);

  // ─── Firestore: seed initial data on first run ───────────────────────────
  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const teamsSnap = await getDocs(collection(db, 'teams'));
        if (teamsSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_TEAMS.forEach(tm => batch.set(doc(db, 'teams', tm.id), tm));
          INITIAL_PARTICIPATIONS.forEach(p => batch.set(doc(db, 'participations', p.id), p));
          MOCK_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.id), c));
          await batch.commit();
        }
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          const batch = writeBatch(db);
          MOCK_USERS.forEach(u => batch.set(doc(db, 'users', u.id), u));
          await batch.commit();
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
  }, []);

  // ─── Firestore: live sync subscriptions ──────────────────────────────────
  useEffect(() => {
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
    const unsubCfg = onSnapshot(doc(db, 'config', 'system'), snap => {
      if (snap.exists()) setSystemConfig(snap.data());
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => d.data());
      if (data.length > 0) setUsers(data);
    });
    return () => {
      unsubTeams(); unsubParts(); unsubCats(); unsubScores(); unsubMatches(); unsubCfg(); unsubUsers();
    };
  }, []);

  // ─── Firestore-aware setters ─────────────────────────────────────────────
  const setScoresFB = (updater) => {
    setScores(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevById = new Map(prev.map(s => [String(s.id), s]));
      const nextById = new Map(next.map(s => [String(s.id), s]));
      // Upsert added/changed
      nextById.forEach((s, id) => {
        if (prevById.get(id) !== s) {
          setDoc(doc(db, 'scores', id), s).catch(err => console.error('score write:', err));
        }
      });
      // Delete removed
      prevById.forEach((_, id) => {
        if (!nextById.has(id)) {
          deleteDoc(doc(db, 'scores', id)).catch(err => console.error('score delete:', err));
        }
      });
      return next;
    });
  };

  const setSystemConfigFB = (updater) => {
    setSystemConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setDoc(doc(db, 'config', 'system'), next).catch(err => console.error('cfg write:', err));
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

  // ─── Login / Logout ───────────────────────────────────────────────────────
  const handleLogin = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'volunteer') setCurrentView('checkin');
      else if (user.role === 'admin' || user.role === 'region_admin') setCurrentView('operations');
      else setCurrentView('competing');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
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
      setDoc(doc(db, 'teams', teamId), updated).catch(err => console.error('team write:', err));
      return updated;
    }));
    showToast(t(lang, 'toastCheckIn'));
  };

  // ─── Import teams from Excel ──────────────────────────────────────────────
  const importTeams = ({ teams: importedTeams, participations: importedParticipations, categories: importedCategories }) => {
    const confirmed = window.confirm(
      '⚠️ This will reset all check-in and scoring data. Continue?'
    );
    if (!confirmed) return false;

    // Remap dynamic category IDs to existing MOCK_CATEGORIES IDs when names match
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

    // Merge imported categories with known MOCK_CATEGORIES (prefer existing entries)
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

    // Persist the entire reset to Firestore
    (async () => {
      try {
        // Wipe existing collections first
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
      } catch (err) {
        console.error('importTeams Firestore error:', err);
      }
    })();
    return true;
  };

  // ─── Matchmaking — Single-elimination Knockout Brackets ───────────────────
  // Builds a bracket per (category × bucket) from currently checked-in teams.
  // Buckets follow the FastBot-style grouping: ES + MS together, and HS + US
  // together. The skeleton matches are written into Firestore `group2Matches`;
  // later rounds are filled by resolveBracket() at render time as winners are saved.
  const generateMatches = () => {
    const BUCKETS = [
      { key: 'ES / MS', divs: ['ES', 'MS'] },
      { key: 'HS / US', divs: ['HS', 'US'] },
    ];
    const buildForCategory = (catId, label) => {
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
      ...buildForCategory('c2_sumo',   'Sumo'),
      ...buildForCategory('c2_soccer', 'Soccer'),
    ];
    if (matches.length === 0) {
      showToast(t(lang, 'toastNoMatchablePairs') || (lang === 'ar' ? 'لا توجد فرق كافية لتكوين مباريات' : 'No checked-in teams available to pair'), 'error');
      return;
    }
    setGroup2Matches(matches);
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
        console.error('generateMatches Firestore error:', err);
      }
    })();
    const playable = matches.filter(m => m.roundIndex === 0 && !m.isBye).length;
    showToast(`${t(lang, 'toastMatchGenerated')} (${playable} ${lang === 'ar' ? 'مباراة جولة أولى' : 'R1 matches'})`);
  };

  // ─── User management (Firestore-backed) ────────────────────────────────
  const addUser = (newUser) => {
    if (!newUser?.username || !newUser?.password) return false;
    if (users.some(u => u.username === newUser.username)) {
      showToast(lang === 'ar' ? 'اسم المستخدم موجود مسبقاً' : 'Username already exists', 'error');
      return false;
    }
    const id = newUser.id || `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userDoc = { ...newUser, id };
    setUsers(prev => [...prev, userDoc]);
    setDoc(doc(db, 'users', id), userDoc).catch(err => console.error('user write:', err));
    showToast(lang === 'ar' ? 'تم إضافة المستخدم ✓' : 'User added ✓');
    return true;
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteDoc(doc(db, 'users', userId)).catch(err => console.error('user delete:', err));
    showToast(lang === 'ar' ? 'تم حذف المستخدم' : 'User removed', 'info');
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
      <Login
        handleLogin={handleLogin}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'en' ? 'ar' : 'en')}
        onEnterPublic={() => setPublicMode(true)}
      />
    );
  }

  // ─── Public live dashboard (no login) ───────────────────────────
  if (!currentUser && publicMode) {
    return (
      <div className="relative pt-14 sm:pt-0">
        <PublicResults
          teams={teams}
          getTeamStatus={getTeamStatus}
          scores={scores}
          lang={lang}
          participations={participations}
          categories={categories}
          group2Matches={group2Matches}
        />
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
            getTeamStatus={getTeamStatus}
            scores={scores}
            setScores={setScoresFB}
            currentUser={currentUser}
            group2Matches={group2Matches}
            systemConfig={systemConfig}
            lang={lang}
            showToast={showToast}
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
            group2Matches={group2Matches}
          />
        )}
      </main>

      <Footer lang={lang} />

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
