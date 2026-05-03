import { useMemo, useState, useEffect } from 'react';
import { Trophy, Activity, Users, MapPin, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_STYLES } from '../constants/mockData';

const REGION_COLORS = {
  Western: { dot: 'bg-brand-400', chip: 'bg-brand-500/15 text-brand-200 border-brand-400/30' },
  Central: { dot: 'bg-saudi-400', chip: 'bg-saudi-500/15 text-saudi-200 border-saudi-400/30' },
  Eastern: { dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-200 border-amber-400/30' },
};

export default function PublicResults({ teams, getTeamStatus, scores, lang, participations = [], categories = [], group2Matches = [] }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = (en, ar) => (lang === 'ar' ? ar : en);

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

  // ─── Auto-rotating featured category (8s cycle) ─────────────────────────
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  useEffect(() => {
    if (!autoRotate || populatedCats.length === 0) return;
    const id = setInterval(() => setFeaturedIdx(i => (i + 1) % populatedCats.length), 8000);
    return () => clearInterval(id);
  }, [autoRotate, populatedCats.length]);
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
        };
      });
  }, [scores, participations, categories, teams]);

  // ─── Region medal counts (from #1 finishes) ─────────────────────────────
  const regionMedals = useMemo(() => {
    const tally = { Eastern: 0, Western: 0, Central: 0 };
    populatedCats.forEach(({ rows }) => {
      const winner = rows[0];
      if (winner?.region && tally[winner.region] != null) tally[winner.region]++;
    });
    return tally;
  }, [populatedCats]);

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-[#03101b] via-[#061a27] to-[#082233] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-saudi-500/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center shrink-0">
                <Activity size={22} className="text-brand-300" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black leading-none">{tx('Live Results', 'النتائج المباشرة')}</h1>
                <p className="text-white/50 text-xs sm:text-sm font-medium mt-1">{tx('RoboRAVE Saudi Arabia 2026', 'روبوريف 2026 المملكة العربية السعودية')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-saudi-400 animate-pulse" />
                <span className="text-xs font-black text-saudi-300 uppercase tracking-widest">{tx('LIVE', 'مباشر')}</span>
              </div>
              <div className="font-mono text-base sm:text-lg font-black tracking-wider px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                {clockStr}
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HeroStat label={tx('Verified Scores', 'النتائج المعتمدة')} value={stats.valid} icon={<Zap size={18} />} accent="from-amber-400 to-orange-500" />
            <HeroStat label={tx('Teams Checked In', 'الفرق الحاضرة')} value={`${stats.checkedIn}/${stats.total}`} icon={<Users size={18} />} accent="from-saudi-400 to-emerald-500" />
            <HeroStat label={tx('Categories Active', 'تصنيفات نشطة')} value={populatedCats.length} icon={<Trophy size={18} />} accent="from-brand-400 to-cyan-500" />
            <HeroStat label={tx('Regions', 'المناطق')} value={stats.regions} icon={<MapPin size={18} />} accent="from-rose-400 to-pink-500" />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Featured spotlight */}
        {featured ? (
          <FeaturedCategory
            featured={featured}
            populatedCats={populatedCats}
            featuredIdx={featuredIdx}
            setFeaturedIdx={setFeaturedIdx}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            tx={tx}
            lang={lang}
          />
        ) : (
          <EmptyState tx={tx} />
        )}

        {/* All-categories grid */}
        {populatedCats.length > 0 && (
          <section>
            <SectionHeader title={tx('All Category Standings', 'الترتيب لجميع التصنيفات')} subtitle={tx('Top performers across every event', 'أفضل المتنافسين في كل تصنيف')} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {populatedCats.map(({ cat, isFastBot, top5 }) => (
                <CategoryCard key={cat.id} cat={cat} top5={top5} isFastBot={isFastBot} tx={tx} />
              ))}
            </div>
          </section>
        )}

        {/* Region medal board + Recent results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <RegionBoard tally={regionMedals} tx={tx} />
          <RecentResults recent={recent} tx={tx} />
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center text-[11px] text-white/40">
        <p>{tx('Powered by RAIN Operations', 'بإدارة منصة رين للعمليات')} · RoboRAVE Saudi Arabia 2026</p>
      </footer>
    </div>
  );
}

// ─── Hero stat tile ────────────────────────────────────────────────────────
function HeroStat({ label, value, icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4">
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`} />
      <div className="relative flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</p>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow`}>
          {icon}
        </div>
      </div>
      <p className="relative text-3xl sm:text-4xl font-black leading-none">{value}</p>
    </div>
  );
}

// ─── Featured spotlight (auto-rotating) ────────────────────────────────────
function FeaturedCategory({ featured, populatedCats, featuredIdx, setFeaturedIdx, autoRotate, setAutoRotate, tx, lang }) {
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
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-amber-300/20 via-amber-200/10 to-transparent border border-amber-300/30 p-4 sm:p-5 flex items-center gap-4">
            <div className="text-5xl sm:text-6xl">🥇</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{tx('Current Leader', 'المتصدر الحالي')}</p>
              <p className="text-xl sm:text-3xl font-black truncate">{winner.teamName}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {winner.region && <RegionChip region={winner.region} tx={tx} />}
                {winner.division && <span className="text-[10px] font-bold text-white/60 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">{winner.division}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl sm:text-5xl font-black text-amber-300 tabular-nums">
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
                isWinner ? 'bg-amber-300/15 border-amber-300/30' : 'bg-white/5 border-white/10'
              }`}>
              <span className="text-base w-6 text-center shrink-0">{medal}</span>
              <span className={`flex-1 truncate text-sm ${isWinner ? 'font-black' : 'font-bold'}`}>{entry.teamName}</span>
              {entry.region && <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_COLORS[entry.region]?.dot || 'bg-white/30'}`} />}
              <span className={`tabular-nums shrink-0 text-sm ${isWinner ? 'font-black text-amber-300' : 'font-bold text-white/85'}`}>
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

// ─── Recent results feed ───────────────────────────────────────────────────
function RecentResults({ recent, tx }) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5">
      <SectionHeader inline title={tx('Recent Results', 'آخر النتائج')} subtitle={tx('Latest verified scores', 'أحدث النتائج المعتمدة')} />
      {recent.length === 0 ? (
        <p className="text-white/40 text-sm py-6 text-center">{tx('No results yet — stay tuned!', 'لا توجد نتائج بعد — ترقّبوا!')}</p>
      ) : (
        <div className="mt-4 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {recent.map(r => {
            const style = CATEGORY_STYLES[r.catId] || { from: '#334155', to: '#0f172a', icon: '🤖' };
            return (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{r.team}</p>
                  <p className="text-[10px] font-bold text-white/50 truncate">{r.cat}</p>
                </div>
                {r.region && <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_COLORS[r.region]?.dot || 'bg-white/30'}`} />}
                <span className="font-black tabular-nums text-saudi-300 shrink-0">{r.score}</span>
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
