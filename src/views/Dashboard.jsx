import { useMemo } from 'react';
import { Trophy, BarChart3, Users, MapPin, PlayCircle, Activity, CheckCircle2, Zap } from 'lucide-react';
import { t } from '../constants/translations';
import { CATEGORY_STYLES } from '../constants/mockData';

export default function Dashboard({ teams, getTeamStatus, scores, lang, participations = [], categories = [], group2Matches = [] }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const stats = useMemo(() => {
    const total = teams.length;
    const checkedIn = teams.filter(team => ['Fully Arrived', 'Partially Arrived'].includes(getTeamStatus(team))).length;
    const regions = new Set(teams.map(team => team.region)).size;
    const validScores = scores.filter(s => s.status === 'VALID').length;
    return { total, checkedIn, regions, validScores };
  }, [teams, getTeamStatus, scores]);

  const leaderboard = useMemo(() => {
    return categories.map(cat => {
      const catScores = scores
        .filter(s => s.status === 'VALID')
        .map(s => {
          const participation = participations.find(p => p.id === s.pId);
          if (!participation || participation.categoryId !== cat.id) return null;
          if (cat.id === 'c1_fastbot' && ['P1', 'P2'].includes(s.slotKey)) return null;
          const team = teams.find(tm => tm.id === participation.teamId);
          return { scoreId: s.id, score: s.score, teamName: team?.name || s.pId, division: team?.division || '', region: team?.region || '' };
        })
        .filter(Boolean);

      const isFastBot = cat.id === 'c1_fastbot';
      const sorted = [...catScores].sort((a, b) => {
        const sa = parseFloat(a.score) || 0;
        const sb = parseFloat(b.score) || 0;
        return isFastBot ? sa - sb : sb - sa;
      });

      return { cat, top3: sorted.slice(0, 3) };
    });
  }, [scores, participations, teams, categories]);

  const upcomingMatches = useMemo(() => {
    return group2Matches.filter(m => !scores.some(s => s.pId === m.id && s.status === 'VALID'));
  }, [group2Matches, scores]);

  const REGION_COLORS = { Western: 'bg-brand-400', Central: 'bg-saudi-400', Eastern: 'bg-orange-400' };

  return (
    <div className="space-y-5" dir={dir}>
      {/* Competition Status Banner */}
      <div className="bg-gradient-to-r from-navy-700 to-navy-500 rounded-2xl p-4 flex items-center gap-3 border border-white/10 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
          <Activity size={20} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm">{lang === 'ar' ? 'روبوريف 2026 المملكة العربية السعودية' : 'RoboRAVE 2026 Saudi Arabia'}</p>
          <p className="text-ink-400 text-xs font-medium mt-0.5">{lang === 'ar' ? 'لوحة المنافسة المباشرة' : 'Live Competition Dashboard'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-saudi-400 animate-pulse" />
          <span className="text-xs font-black text-saudi-400 uppercase tracking-widest">{lang === 'ar' ? 'مباشر' : 'LIVE'}</span>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t(lang, 'totalRegistered')}
          value={stats.total}
          icon={<Users size={20} />}
          iconClass="bg-ink-100 text-ink-600"
          valueClass="text-ink-900"
          accentClass="bg-ink-300"
        />
        <StatCard
          label={t(lang, 'teamsCheckedIn')}
          value={stats.checkedIn}
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-saudi-50 text-saudi-600"
          valueClass="text-saudi-700"
          progress={stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0}
          progressLabel={lang === 'ar' ? t(lang, 'checkedInProgress') : '% checked in'}
          accentClass="bg-saudi-400"
        />
        <StatCard
          label={t(lang, 'regionsCompeting')}
          value={stats.regions}
          icon={<MapPin size={20} />}
          iconClass="bg-brand-50 text-brand-600"
          valueClass="text-brand-700"
          accentClass="bg-brand-500"
        />
        <StatCard
          label={lang === 'ar' ? 'النتائج المعتمدة' : 'Verified Scores'}
          value={stats.validScores}
          icon={<Zap size={20} />}
          iconClass="bg-saudi-50 text-saudi-600"
          valueClass="text-saudi-700"
          accentClass="bg-saudi-400"
        />
      </div>

      {/* Live Leaderboard */}
      <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-saudi-50 border border-saudi-200 flex items-center justify-center">
            <Trophy className="text-saudi-500" size={17} />
          </div>
          <h2 className="text-base font-bold text-ink-800">{t(lang, 'dynamicLeaderboard')}</h2>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-saudi-400 animate-pulse" />
            <span className="text-xs font-bold text-ink-500">{stats.validScores} {lang === 'ar' ? 'معتمدة' : 'verified'}</span>
          </div>
        </div>

        {stats.validScores === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-center mb-4">
              <Trophy className="text-ink-300" size={30} />
            </div>
            <p className="text-ink-400 text-sm font-medium text-center max-w-xs">{t(lang, 'scoresPopulateMsg')}</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {leaderboard
              .filter(({ top3 }) => top3.length > 0)
              .map(({ cat, top3 }) => {
                const style = CATEGORY_STYLES[cat.id] || { from: '#334155', to: '#0f172a', icon: '🤖' };
                const MEDALS = [
                  { emoji: '🥇', bg: 'bg-saudi-50 border-saudi-200', score: 'text-saudi-600' },
                  { emoji: '🥈', bg: 'bg-ink-50 border-ink-200', score: 'text-ink-600' },
                  { emoji: '🥉', bg: 'bg-saudi-50 border-saudi-200', score: 'text-saudi-600' },
                ];
                return (
                  <div key={cat.id} className="p-4 sm:p-5">
                    {/* Category label */}
                    <div className="flex items-center gap-2.5 mb-3 rounded-xl px-3 py-2.5" style={{ background: `linear-gradient(135deg, ${style.from}18, ${style.to}12)`, borderLeft: `3px solid ${style.from}` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
                        {style.icon}
                      </div>
                      <h3 className="font-bold text-ink-700 text-sm flex-1">{cat.name}</h3>
                      <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wide">
                        {cat.id === 'c1_fastbot'
                          ? (lang === 'ar' ? '⏱ الأقل أفضل' : '⏱ Lower = Better')
                          : (lang === 'ar' ? '⬆ الأعلى أفضل' : '⬆ Higher = Better')}
                      </span>
                    </div>
                    {/* Top 3 rows */}
                    <div className="space-y-1.5">
                      {top3.map((entry, rank) => {
                        const m = MEDALS[rank];
                        return (
                          <div key={entry.scoreId}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${m.bg}`}>
                            <span className="text-base w-5 text-center shrink-0">{m.emoji}</span>
                            <span className="font-semibold text-ink-700 flex-1 truncate text-sm">{entry.teamName}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {entry.region && (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_COLORS[entry.region] || 'bg-ink-300'}`} />
                              )}
                              {entry.division && (
                                <span className="text-[10px] text-ink-400 font-bold">{entry.division}</span>
                              )}
                              <span className={`font-black text-sm ${m.score}`}>
                                {cat.id === 'c1_fastbot' ? `${parseFloat(entry.score).toFixed(2)}s` : entry.score}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Upcoming Matches */}
      <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center">
            <PlayCircle className="text-brand-500" size={17} />
          </div>
          <h2 className="text-base font-bold text-ink-800">{t(lang, 'upcomingMatches')}</h2>
          {group2Matches.length > 0 && (
            <span className="ms-auto badge bg-brand-50 text-brand-700 border border-brand-200">
              {upcomingMatches.length} {lang === 'ar' ? 'متبقية' : 'remaining'}
            </span>
          )}
        </div>
        {group2Matches.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-ink-50 border border-ink-200 flex items-center justify-center mb-3">
              <PlayCircle className="text-ink-300" size={20} />
            </div>
            <p className="text-sm font-bold text-ink-500">
              {lang === 'ar' ? 'لا توجد مباريات بعد' : 'No matches yet'}
            </p>
            <p className="text-xs text-ink-400 mt-1">
              {lang === 'ar' ? 'سيتم عرض المباريات هنا بعد توليد الجداول.' : 'Matches will appear here after brackets are generated.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {group2Matches.map(m => {
              const isDone = scores.some(s => s.pId === m.id && s.status === 'VALID');
              const style = CATEGORY_STYLES[m.categoryId] || { from: '#334155', to: '#0f172a', icon: '🤼' };
              return (
                <div key={m.id} className={`px-5 py-3.5 flex items-center gap-3 transition-opacity ${isDone ? 'opacity-40' : ''}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-700 text-sm truncate">{m.title}</p>
                    <p className="text-[10px] text-ink-400 font-mono mt-0.5">{m.id}</p>
                  </div>
                  <span className={`badge shrink-0 ${isDone ? 'bg-saudi-50 text-saudi-700 border border-saudi-200' : 'bg-saudi-50 text-saudi-700 border border-saudi-200'}`}>
                    {isDone ? (lang === 'ar' ? '✓ منتهية' : '✓ Done') : (lang === 'ar' ? 'قادمة' : 'Pending')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconClass, valueClass, progress, progressLabel, accentClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden">
      <div className={`h-1 w-full ${accentClass || 'bg-ink-200'}`} />
      <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wide leading-tight">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          {icon}
        </div>
      </div>
      <p className={`text-4xl font-black leading-none ${valueClass}`}>{value}</p>
      {progress != null && (
        <div className="mt-3">
          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-saudi-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-[10px] text-ink-400 mt-1 font-bold">{Math.round(progress)}{progressLabel || '% checked in'}</p>
        </div>
      )}
      </div>
    </div>
  );
}

