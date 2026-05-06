import { useMemo, useState, useEffect, useRef } from 'react';
import { Trophy, Activity, Users, MapPin, Zap, ChevronLeft, ChevronRight, Maximize2, Minimize2, Filter, Tv, Medal } from 'lucide-react';
import { CATEGORY_STYLES } from '../constants/mockData';
import Footer from '../components/layout/Footer';

// Region accents — only FN matters in World Finals view; others kept for fallback.
const REGION_COLORS = {
  Western: { dot: 'bg-cyan-500',     chip: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/40' },
  Central: { dot: 'bg-emerald-500',  chip: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' },
  Eastern: { dot: 'bg-lime-500',     chip: 'bg-lime-500/15 text-lime-200 border-lime-400/40' },
  FN:      { dot: 'bg-teal-500',     chip: 'bg-teal-500/15 text-teal-200 border-teal-400/40' },
};

// Palette tokens — single source of truth so the page stays on-brand.
const PALETTE = {
  emerald: '#0B7A43',  // deep emerald
  lime:    '#63C132',  // bright lime
  teal:    '#4FA3A5',  // teal
  navy:    '#0A2A3A',  // dark navy
  cyan:    '#1DA1C9',  // cyan blue
};

export default function PublicResults({ teams: rawTeams, getTeamStatus, scores: rawScores, lang, participations: rawParticipations = [], categories = [], group2Matches = [] }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

  // ─── World Finals lock ─────────────────────────────────────────────────
  // Live Results is currently scoped to the World Finals roster only — every
  // downstream computation (stats, leaderboards, ticker, medals) sees just
  // FN-region teams and their scores.
  const teams = useMemo(() => rawTeams.filter(t => t.region === 'FN'), [rawTeams]);
  const fnTeamIds = useMemo(() => new Set(teams.map(t => t.id)), [teams]);
  const participations = useMemo(
    () => rawParticipations.filter(p => fnTeamIds.has(p.teamId)),
    [rawParticipations, fnTeamIds]
  );
  const fnPartIds = useMemo(() => new Set(participations.map(p => p.id)), [participations]);
  const scores = useMemo(() => rawScores.filter(s => fnPartIds.has(s.pId)), [rawScores, fnPartIds]);

  // ─── Live clock ────────────────────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const clockStr = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // ─── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = teams.length;
    const checkedIn = teams.filter(t => ['Fully Arrived', 'Partially Arrived'].includes(getTeamStatus(t))).length;
    const regions = new Set(teams.map(t => t.region)).size;
    const valid = scores.filter(s => s.status === 'VALID').length;
    return { total, checkedIn, regions, valid };
  }, [teams, getTeamStatus, scores]);

  // ─── Leaderboard (top 5 per category) ───────────────────────────────────
  const leaderboard = useMemo(() => {
    return categories.map(cat => {
      const isFastBot = cat.id === 'c1_fastbot';
      const rows = scores
        .filter(s => s.status === 'VALID')
        .map(s => {
          const p = participations.find(pp => pp.id === s.pId);
          if (!p || p.categoryId !== cat.id) return null;
          if (isFastBot && ['P1', 'P2'].includes(s.slotKey)) return null;
          const team = teams.find(tm => tm.id === p.teamId);
          return {
            scoreId: s.id,
            score: parseFloat(s.score) || 0,
            rawScore: s.score,
            teamName: team?.name || s.pId,
            division: team?.division || '',
            region: team?.region || '',
          };
        })
        .filter(Boolean);
      const sorted = [...rows].sort((a, b) => (isFastBot ? a.score - b.score : b.score - a.score));
      return { cat, isFastBot, rows: sorted, top5: sorted.slice(0, 5) };
    });
  }, [scores, participations, teams, categories]);

  const populatedCats = leaderboard.filter(l => l.top5.length > 0);

  // ─── Auto-rotating featured category (8s/12s in projector) ───────────────
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateProgress, setRotateProgress] = useState(0);
  useEffect(() => {
    if (!autoRotate || populatedCats.length === 0) return;
    const id = setInterval(() => setFeaturedIdx(i => (i + 1) % populatedCats.length), 8000);
    return () => clearInterval(id);
  }, [autoRotate, populatedCats.length]);
  // Reset & animate progress bar each rotation cycle
  useEffect(() => {
    if (!autoRotate || populatedCats.length === 0) { setRotateProgress(0); return; }
    setRotateProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 8000) * 100);
      setRotateProgress(pct);
    }, 100);
    return () => clearInterval(tick);
  }, [featuredIdx, autoRotate, populatedCats.length]);
  useEffect(() => {
    if (featuredIdx >= populatedCats.length) setFeaturedIdx(0);
  }, [populatedCats.length, featuredIdx]);

  const featured = populatedCats[featuredIdx];

  // ─── Recent results ticker ──────────────────────────────────────────────
  const recent = useMemo(() => {
    return scores
      .filter(s => s.status === 'VALID')
      .slice(-12)
      .reverse()
      .map(s => {
        const p = participations.find(pp => pp.id === s.pId);
        const cat = p ? categories.find(c => c.id === p.categoryId) : null;
        const team = p ? teams.find(t => t.id === p.teamId) : null;
        return {
          id: s.id,
          team: team?.name || s.pId,
          cat: cat?.name || '',
          catId: cat?.id || '',
          region: team?.region || '',
          score: cat?.id === 'c1_fastbot' ? `${(parseFloat(s.score) || 0).toFixed(2)}s` : s.score,
          ts: typeof s.ts === 'number' ? s.ts : null,
        };
      });
  }, [scores, participations, categories, teams]);

  // ─── Track newly-arrived score IDs for live highlight pulse ─────────────
  const seenScoreIdsRef = useRef(new Set());
  const [pulseIds, setPulseIds] = useState(new Set());
  useEffect(() => {
    const seen = seenScoreIdsRef.current;
    const fresh = [];
    scores.forEach(s => {
      if (s.status === 'VALID' && !seen.has(s.id)) {
        if (seen.size > 0) fresh.push(s.id); // skip first hydration burst
        seen.add(s.id);
      }
    });
    if (fresh.length === 0) return undefined;
    setPulseIds(prev => {
      const next = new Set(prev);
      fresh.forEach(id => next.add(id));
      return next;
    });
    const tid = setTimeout(() => {
      setPulseIds(prev => {
        const next = new Set(prev);
        fresh.forEach(id => next.delete(id));
        return next;
      });
    }, 6000);
    return () => clearTimeout(tid);
  }, [scores]);

  // ─── Division medal counts (from #1 finishes) — World Finals view ──────
  const divisionMedals = useMemo(() => {
    const tally = { ES: 0, MS: 0, HS: 0, US: 0 };
    populatedCats.forEach(({ rows }) => {
      const winner = rows[0];
      if (winner?.division && tally[winner.division] != null) tally[winner.division]++;
    });
    return tally;
  }, [populatedCats]);

  // ─── Region medal counts (from #1 finishes) — kept for legacy callers ─
  const regionMedals = useMemo(() => {
    const tally = { Eastern: 0, Western: 0, Central: 0 };
    populatedCats.forEach(({ rows }) => {
      const winner = rows[0];
      if (winner?.region && tally[winner.region] != null) tally[winner.region]++;
    });
    return tally;
  }, [populatedCats]);

  // ─── Top teams aggregate medal table (gold/silver/bronze across categories) ──────
  const topTeams = useMemo(() => {
    const tally = new Map();
    populatedCats.forEach(({ rows }) => {
      rows.slice(0, 3).forEach((row, i) => {
        const key = row.teamName;
        const cur = tally.get(key) || { team: row.teamName, region: row.region, division: row.division, gold: 0, silver: 0, bronze: 0 };
        if (i === 0) cur.gold++;
        else if (i === 1) cur.silver++;
        else if (i === 2) cur.bronze++;
        tally.set(key, cur);
      });
    });
    return [...tally.values()]
      .map(t => ({ ...t, weight: t.gold * 100 + t.silver * 10 + t.bronze }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
  }, [populatedCats]);

  // ─── Filters for grid ──────────────────────────────────────
  const [filterDivision, setFilterDivision] = useState('All');
  const allDivisions = useMemo(() => {
    const set = new Set();
    teams.forEach(t => t.division && set.add(t.division));
    return [...set];
  }, [teams]);
  const filteredGrid = useMemo(() => {
    if (filterDivision === 'All') return populatedCats;
    return populatedCats
      .map(({ cat, isFastBot, rows }) => {
        const filtered = rows.filter(r => r.division === filterDivision);
        return { cat, isFastBot, rows: filtered, top5: filtered.slice(0, 5) };
      })
      .filter(c => c.top5.length > 0);
  }, [populatedCats, filterDivision]);

  // ─── Flash animation on new score arrival ────────────────────────────
  const [flashKey, setFlashKey] = useState(0);
  const prevValidCount = useRef(stats.valid);
  useEffect(() => {
    if (stats.valid > prevValidCount.current) {
      setFlashKey(k => k + 1);
    }
    prevValidCount.current = stats.valid;
  }, [stats.valid]);

  // ─── Projector / TV mode (fullscreen + bigger fonts + faster rotation) ─────────
  const [projectorMode, setProjectorMode] = useState(false);
  const rootRef = useRef(null);
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await rootRef.current?.requestFullscreen?.();
        setProjectorMode(true);
      } else {
        await document.exitFullscreen?.();
        setProjectorMode(false);
      }
    } catch (e) {
      setProjectorMode(p => !p);
    }
  };
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setProjectorMode(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  return (
    <div ref={rootRef} dir={dir} className={`min-h-screen flex flex-col text-white ${projectorMode ? 'projector-mode' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #0A2A3A 0%, #08303d 35%, #0B7A43 100%)',
        backgroundAttachment: 'fixed',
      }}>
      {/* Flash overlay on new score */}
      <FlashOverlay key={flashKey} active={flashKey > 0} tx={tx} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* Decorative palette blobs */}
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full blur-3xl" style={{ backgroundColor: '#1DA1C9', opacity: 0.18 }} />
        <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full blur-3xl" style={{ backgroundColor: '#63C132', opacity: 0.16 }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: '#4FA3A5', opacity: 0.14 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-8">
          {/* Sponsor / partner logos strip */}
          <div className="mb-5 sm:mb-6 rounded-2xl border border-white/15 bg-white/95 backdrop-blur shadow-lg px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
            <img src="/img/rain-o.png" alt="RAIN" className="h-9 sm:h-12 object-contain" style={{ maxWidth: '90px' }} />
            <span className="w-px h-8 sm:h-10 bg-navy-500/15" />
            <img src="/img/roborave-saudiarabia.png" alt="RoboRAVE Saudi Arabia" className="h-7 sm:h-9 object-contain" style={{ maxWidth: '170px' }} />
            <span className="w-px h-8 sm:h-10 bg-navy-500/15" />
            <img src="/img/Logo Arena.png" alt="Ai Arena" title="Ai Arena" className="h-9 sm:h-11 object-contain" style={{ maxWidth: '70px' }} />
            <img src="/img/tech-college.png" alt="Technical College" title="الكلية التقنية" className="h-9 sm:h-11 object-contain" style={{ maxWidth: '70px' }} />
            <img src="/img/saudi-robotics-federation-o.png" alt="Saudi Robotics Federation" title="الاتحاد السعودي للروبوتات" className="h-9 sm:h-11 object-contain" style={{ maxWidth: '70px' }} />
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #1DA1C9, #4FA3A5)' }}>
                <Activity size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black leading-none truncate">{tx('Live Results', 'النتائج المباشرة')}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border" style={{ backgroundColor: 'rgba(20,184,166,0.18)', borderColor: 'rgba(45,212,191,0.5)', color: '#5eead4' }}>
                    <Trophy size={11} /> {tx('World Finals', 'النهائيات العالمية')}
                  </span>
                </div>
                <p className="text-white/60 text-[11px] sm:text-sm font-medium mt-1 truncate">{tx('FN Region · RoboRAVE Saudi Arabia 2026', 'منطقة النهائيات · روبوريف 2026 المملكة العربية السعودية')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'rgba(99,193,50,0.15)', borderColor: 'rgba(99,193,50,0.4)' }}>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{ backgroundColor: '#63C132' }} />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest" style={{ color: '#aae854' }}>{tx('LIVE', 'مباشر')}</span>
              </div>
              <div className="font-mono text-xs sm:text-lg font-black tracking-wider px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/15 tabular-nums">
                {clockStr}
              </div>
              <button
                onClick={toggleFullscreen}
                title={tx('Projector mode', 'وضع العرض')}
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-black transition"
                style={{ backgroundColor: 'rgba(29,161,201,0.2)', borderColor: 'rgba(29,161,201,0.45)', color: '#a5e9fb' }}
              >
                {projectorMode ? <Minimize2 size={14} /> : <Tv size={14} />}
                <span className="hidden md:inline">{projectorMode ? tx('Exit', 'خروج') : tx('Projector', 'عرض')}</span>
              </button>
            </div>
          </div>

          {/* Stat strip — palette gradients */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HeroStat label={tx('Verified Scores', 'النتائج المعتمدة')} value={stats.valid} icon={<Zap size={18} />} gradient="linear-gradient(135deg, #63C132, #0B7A43)" />
            <HeroStat label={tx('Teams Checked In', 'الفرق الحاضرة')} value={`${stats.checkedIn}/${stats.total}`} icon={<Users size={18} />} gradient="linear-gradient(135deg, #4FA3A5, #0B7A43)" />
            <HeroStat label={tx('Categories Active', 'تصنيفات نشطة')} value={populatedCats.length} icon={<Trophy size={18} />} gradient="linear-gradient(135deg, #1DA1C9, #4FA3A5)" />
            <HeroStat label={tx('Finals Teams', 'فرق النهائيات')} value={stats.total} icon={<Medal size={18} />} gradient="linear-gradient(135deg, #14b8a6, #0A2A3A)" />
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Featured spotlight */}
        {featured ? (
          <FeaturedCategory
            featured={featured}
            populatedCats={populatedCats}
            featuredIdx={featuredIdx}
            setFeaturedIdx={setFeaturedIdx}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            rotateProgress={rotateProgress}
            tx={tx}
            lang={lang}
          />
        ) : (
          <EmptyState tx={tx} />
        )}

        {/* Top Teams overall medal table */}
        {topTeams.length > 0 && (
          <TopTeams topTeams={topTeams} tx={tx} />
        )}

        {/* All-categories grid with filters */}
        {populatedCats.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
              <SectionHeader inline title={tx('All Category Standings', 'الترتيب لجميع التصنيفات')} subtitle={tx('Top performers across every event', 'أفضل المتنافسين في كل تصنيف')} />
              <Filters
                filterDivision={filterDivision} setFilterDivision={setFilterDivision}
                divisions={allDivisions} tx={tx}
              />
            </div>
            {filteredGrid.length === 0 ? (
              <p className="text-white/40 text-sm py-8 text-center bg-white/[0.03] rounded-2xl border border-white/10">
                {tx('No results match the selected filters.', 'لا توجد نتائج بالفلاتر المحدد.')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGrid.map(({ cat, isFastBot, top5 }) => (
                  <CategoryCard key={cat.id} cat={cat} top5={top5} isFastBot={isFastBot} tx={tx} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Division medal board + Recent results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <DivisionBoard tally={divisionMedals} tx={tx} />
          <RecentResults recent={recent} tx={tx} lang={lang} pulseIds={pulseIds} />
        </div>
      </main>

      <Footer lang={lang} variant="dark" />
    </div>
  );
}

// ─── Hero stat tile ────────────────────────────────────────────────────────
function HeroStat({ label, value, icon, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur p-4 shadow-lg">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-25 blur-2xl" style={{ background: gradient }} />
      <div className="relative flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: gradient }}>
          {icon}
        </div>
      </div>
      <p className="relative text-3xl sm:text-4xl font-black leading-none">{value}</p>
    </div>
  );
}

// ─── Featured spotlight (auto-rotating) ────────────────────────────────────
function FeaturedCategory({ featured, populatedCats, featuredIdx, setFeaturedIdx, autoRotate, setAutoRotate, rotateProgress, tx, lang }) {
  const { cat, top5, isFastBot } = featured;
  const style = CATEGORY_STYLES[cat.id] || { from: '#334155', to: '#0f172a', icon: '🤖' };
  const winner = top5[0];

  const next = () => setFeaturedIdx((featuredIdx + 1) % populatedCats.length);
  const prev = () => setFeaturedIdx((featuredIdx - 1 + populatedCats.length) % populatedCats.length);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
      style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative p-5 sm:p-7">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 px-3 py-1 rounded-full bg-white/15 border border-white/20">
              {tx('Now Featuring', 'العرض الحالي')}
            </span>
            {autoRotate && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                {tx('Auto', 'تلقائي')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition">
              {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button onClick={() => setAutoRotate(a => !a)}
              className={`px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${autoRotate ? 'bg-white/20 border-white/30' : 'bg-black/20 border-white/15 text-white/60'}`}>
              {autoRotate ? tx('Pause', 'إيقاف') : tx('Play', 'تشغيل')}
            </button>
            <button onClick={next} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition">
              {lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-4xl sm:text-5xl shrink-0">
            {style.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/60">{tx('Category', 'التصنيف')}</p>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight truncate">{cat.name}</h2>
            <p className="text-xs sm:text-sm font-bold text-white/70 mt-1">
              {isFastBot ? tx('⏱ Lower time = Better', '⏱ الزمن الأقل أفضل') : tx('⬆ Higher score = Better', '⬆ النقاط الأعلى أفضل')}
            </p>
          </div>
        </div>

        {/* Big winner spotlight */}
        {winner && (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-lime-500/20 via-lime-400/10 to-transparent border border-lime-400/40 p-4 sm:p-5 flex items-center gap-4">
            <div className="text-5xl sm:text-6xl">🥇</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-200">{tx('Current Leader', 'المتصدر الحالي')}</p>
              <p className="text-xl sm:text-3xl font-black truncate">{winner.teamName}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {winner.region && <RegionChip region={winner.region} tx={tx} />}
                {winner.division && <span className="text-[10px] font-bold text-white/60 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">{winner.division}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl sm:text-5xl font-black tabular-nums" style={{ color: '#aae854' }}>
                {isFastBot ? `${winner.score.toFixed(2)}` : winner.rawScore}
              </p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                {isFastBot ? tx('seconds', 'ثانية') : tx('points', 'نقطة')}
              </p>
            </div>
          </div>
        )}

        {/* Runners up */}
        {top5.length > 1 && (
          <div className="space-y-2">
            {top5.slice(1).map((entry, i) => {
              const rank = i + 2;
              const medal = rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              return (
                <div key={entry.scoreId} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl w-9 text-center shrink-0">{medal}</span>
                  <span className="font-black text-base sm:text-lg flex-1 truncate">{entry.teamName}</span>
                  {entry.region && <RegionChip region={entry.region} tx={tx} />}
                  <span className="font-black text-lg sm:text-xl tabular-nums shrink-0">
                    {isFastBot ? `${entry.score.toFixed(2)}s` : entry.rawScore}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {populatedCats.map((_, i) => (
            <button key={i} onClick={() => setFeaturedIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === featuredIdx ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>

        {/* Rotation progress bar */}
        {autoRotate && populatedCats.length > 1 && (
          <div className="mt-3 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/70 transition-[width] duration-100 ease-linear" style={{ width: `${rotateProgress}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Single category card ──────────────────────────────────────────────────
function CategoryCard({ cat, top5, isFastBot, tx }) {
  const style = CATEGORY_STYLES[cat.id] || { from: '#334155', to: '#0f172a', icon: '🤖' };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur overflow-hidden">
      <div className="relative px-4 py-3 border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${style.from}55, ${style.to}30)` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
            {style.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm leading-tight truncate">{cat.name}</h3>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
              {isFastBot ? tx('Lower = Better', 'الأقل أفضل') : tx('Higher = Better', 'الأعلى أفضل')}
            </p>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {top5.map((entry, i) => {
          const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
          const isWinner = i === 0;
          return (
            <div key={entry.scoreId}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${
                isWinner ? 'bg-lime-500/15 border-lime-400/40' : 'bg-white/5 border-white/10'
              }`}>
              <span className="text-base w-6 text-center shrink-0">{medal}</span>
              <span className={`flex-1 truncate text-sm ${isWinner ? 'font-black' : 'font-bold'}`}>{entry.teamName}</span>
              {entry.region && <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_COLORS[entry.region]?.dot || 'bg-white/30'}`} />}
              <span className={`tabular-nums shrink-0 text-sm ${isWinner ? 'font-black' : 'font-bold text-white/85'}`}
                style={isWinner ? { color: '#aae854' } : undefined}>
                {isFastBot ? `${entry.score.toFixed(2)}s` : entry.rawScore}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Region medal board ────────────────────────────────────────────────────
function RegionBoard({ tally, tx }) {
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const REGION_NAMES = {
    Eastern: tx('Eastern', 'الشرقية'),
    Western: tx('Western', 'الغربية'),
    Central: tx('Central', 'الوسطى'),
    FN:      tx('Finals', 'النهائيات العالمية'),
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5">
      <SectionHeader inline title={tx('Regions Leading', 'تصدر المناطق')} subtitle={tx('Categories where each region holds #1', 'عدد التصنيفات المتصدرة لكل منطقة')} />
      <div className="space-y-3 mt-4">
        {Object.entries(tally).map(([region, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const colors = REGION_COLORS[region] || { dot: 'bg-white/30', chip: 'bg-white/10 text-white/70 border-white/20' };
          return (
            <div key={region}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className="font-black text-sm">{REGION_NAMES[region]}</span>
                </div>
                <span className="font-black tabular-nums">🏆 {count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${colors.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Division medal board (World Finals) ───────────────────────────────────
function DivisionBoard({ tally, tx }) {
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const DIV_META = {
    ES: { label: tx('Elementary (ES)', 'الابتدائي (ES)'),  bar: 'bg-gradient-to-r from-lime-400 to-emerald-600',    dot: 'bg-lime-400' },
    MS: { label: tx('Middle (MS)',     'المتوسط (MS)'),    bar: 'bg-gradient-to-r from-cyan-400 to-cyan-600',        dot: 'bg-cyan-400' },
    HS: { label: tx('High (HS)',       'الثانوي (HS)'),    bar: 'bg-gradient-to-r from-teal-400 to-teal-600',        dot: 'bg-teal-400' },
    US: { label: tx('University (US)', 'الجامعي (US)'),    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-800',  dot: 'bg-emerald-500' },
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5">
      <SectionHeader inline title={tx('Divisions Leading', 'تصدر الفئات')} subtitle={tx('Categories where each division holds #1', 'عدد التصنيفات المتصدرة لكل فئة')} />
      <div className="space-y-3 mt-4">
        {Object.entries(tally).map(([div, count]) => {
          const meta = DIV_META[div];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={div}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                  <span className="font-black text-sm">{meta.label}</span>
                </div>
                <span className="font-black tabular-nums">🏆 {count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${meta.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent results feed ───────────────────────────────────────────────────
function formatAgo(ts, lang) {
  if (!ts) return '';
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60)  return lang === 'ar' ? 'الآن' : 'now';
  const min = Math.floor(sec / 60);
  if (min < 60)  return lang === 'ar' ? `قبل ${min} د` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return lang === 'ar' ? `قبل ${hr} س` : `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return lang === 'ar' ? `قبل ${d} ي` : `${d}d ago`;
}

function RecentResults({ recent, tx, lang, pulseIds }) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5">
      <SectionHeader inline title={tx('Recent Results', 'آخر النتائج')} subtitle={tx('Latest verified scores', 'أحدث النتائج المعتمدة')} />
      {recent.length === 0 ? (
        <p className="text-white/40 text-sm py-6 text-center">{tx('No results yet — stay tuned!', 'لا توجد نتائج بعد — ترقّبوا!')}</p>
      ) : (
        <div className="mt-4 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {recent.map(r => {
            const style = CATEGORY_STYLES[r.catId] || { from: '#334155', to: '#0f172a', icon: '🤖' };
            const isFresh = pulseIds?.has(r.id);
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isFresh
                    ? 'bg-lime-500/20 border-lime-400/60 ring-2 ring-lime-400/40 animate-pulse shadow-lg shadow-lime-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{r.team}</p>
                  <p className="text-[10px] font-bold text-white/50 truncate">
                    {r.cat}
                    {r.ts && <span className="ms-1.5 text-white/40">· {formatAgo(r.ts, lang)}</span>}
                  </p>
                </div>
                {r.region && <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_COLORS[r.region]?.dot || 'bg-white/30'}`} />}
                <span className="font-black tabular-nums shrink-0" style={{ color: '#aae854' }}>{r.score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, inline }) {
  return (
    <div className={inline ? '' : 'mb-4'}>
      <h2 className="text-lg sm:text-xl font-black">{title}</h2>
      {subtitle && <p className="text-xs sm:text-sm font-medium text-white/50 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function RegionChip({ region, tx }) {
  const NAMES = {
    Eastern: tx('Eastern', 'الشرقية'),
    Western: tx('Western', 'الغربية'),
    Central: tx('Central', 'الوسطى'),
    FN:      tx('Finals', 'النهائيات العالمية'),
  };
  const c = REGION_COLORS[region] || { chip: 'bg-white/10 text-white/70 border-white/20', dot: 'bg-white/30' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${c.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {NAMES[region] || region}
    </span>
  );
}

function EmptyState({ tx }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-16 text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Trophy size={40} className="text-white/30" />
      </div>
      <h2 className="text-xl sm:text-2xl font-black">{tx('Competition starting soon', 'المنافسة على وشك البدء')}</h2>
      <p className="text-white/50 text-sm font-medium mt-2 max-w-md mx-auto">
        {tx('Results will appear here in real time as referees verify scores. Stay tuned!', 'ستظهر النتائج هنا فور اعتمادها من الحكام. ترقّبوا!')}
      </p>
    </section>
  );
}

// ─── Filters bar ───────────────────────────────────────────────────────────
// Region filter is hidden in World Finals mode — only one region exists.
function Filters({ filterDivision, setFilterDivision, divisions, tx }) {
  const baseBtn = 'px-3 py-1.5 rounded-lg text-[11px] font-black border transition whitespace-nowrap';
  const active = 'bg-white text-[#03101b] border-white';
  const idle = 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10';
  if (divisions.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={14} className="text-white/40" />
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilterDivision('All')} className={`${baseBtn} ${filterDivision === 'All' ? active : idle}`}>{tx('All Divisions', 'كل الفئات')}</button>
        {divisions.map(d => (
          <button key={d} onClick={() => setFilterDivision(d)} className={`${baseBtn} ${filterDivision === d ? active : idle}`}>{d}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Top teams overall medal table ─────────────────────────────────────────
function TopTeams({ topTeams, tx }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow" style={{ background: 'linear-gradient(135deg, #1DA1C9, #0B7A43)' }}>
          <Medal size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black">{tx('Top Teams Overall', 'أفضل الفرق إجمالاً')}</h2>
          <p className="text-xs sm:text-sm font-medium text-white/50">{tx('Ranked by total medals across all categories', 'حسب مجموع الميداليات في كل التصنيفات')}</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-white/40">
              <th className="text-start px-3 py-2 w-10">#</th>
              <th className="text-start px-3 py-2">{tx('Team', 'الفريق')}</th>
              <th className="text-center px-2 py-2 w-14">🥇</th>
              <th className="text-center px-2 py-2 w-14">🥈</th>
              <th className="text-center px-2 py-2 w-14">🥉</th>
              <th className="text-end px-3 py-2 w-20">{tx('Region', 'المنطقة')}</th>
            </tr>
          </thead>
          <tbody>
            {topTeams.map((row, i) => {
              const isPodium = i < 3;
              const rowAccent = i === 0 ? 'bg-lime-400/15 border-lime-400/40' : i === 1 ? 'bg-cyan-400/10 border-cyan-400/25' : i === 2 ? 'bg-teal-400/10 border-teal-400/25' : 'bg-white/[0.03] border-white/10';
              return (
                <tr key={row.team} className={`border ${rowAccent} rounded-xl`}>
                  <td className="px-3 py-2.5 font-black text-white/60">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className={`font-black ${isPodium ? 'text-base' : 'text-sm'} truncate`}>{row.team}</div>
                    {row.division && <div className="text-[10px] font-bold text-white/40 mt-0.5">{row.division}</div>}
                  </td>
                  <td className="px-2 py-2.5 text-center font-black tabular-nums" style={{ color: '#aae854' }}>{row.gold || '·'}</td>
                  <td className="px-2 py-2.5 text-center font-black tabular-nums text-white/80">{row.silver || '·'}</td>
                  <td className="px-2 py-2.5 text-center font-black tabular-nums" style={{ color: '#5eead4' }}>{row.bronze || '·'}</td>
                  <td className="px-3 py-2.5 text-end">
                    {row.region && (
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${REGION_COLORS[row.region]?.chip || 'bg-white/10 text-white/70 border-white/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${REGION_COLORS[row.region]?.dot || 'bg-white/30'}`} />
                        {row.region}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Flash overlay (briefly pulses on new score) ───────────────────────────
function FlashOverlay({ active, tx }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(id);
  }, [active]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 animate-fadein-out" style={{ backgroundColor: 'rgba(99, 193, 50, 0.18)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-2xl text-white font-black text-lg sm:text-2xl shadow-2xl border-4 border-white/30 animate-pop"
        style={{ background: 'linear-gradient(135deg, #63C132, #0B7A43)' }}>
        ✨ {tx('NEW SCORE!', 'نتيجة جديدة!')}
      </div>
    </div>
  );
}
