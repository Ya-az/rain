import { useState } from 'react';
import { ShieldCheck, User, Lock, ChevronDown, Globe } from 'lucide-react';
import { t } from '../constants/translations';

export default function Login({ handleLogin, lang, onToggleLang, onEnterPublic }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = () => {
    if (!user.trim() || !pass.trim()) {
      setError(t(lang, 'loginEmptyFields'));
      return;
    }
    setLoading(true);
    setError('');
    const success = handleLogin(user.trim(), pass.trim());
    if (!success) {
      setError(t(lang, 'loginError'));
      setLoading(false);
    }
  };

  const fillAndSubmit = (username, password) => {
    setUser(username);
    setPass(password);
    setError('');
    setLoading(true);
    const success = handleLogin(username, password);
    if (!success) {
      setError(t(lang, 'loginError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={dir}>
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-gradient-to-br from-navy-500 via-[#0a2a3a] to-[#091f2e] p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full bg-teal-500/8 border border-teal-500/15" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-emerald-500/8 border border-emerald-500/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/3" />

        {/* Top: Logo */}
        <div>
          <img src="/img/rain-o.png" alt="شعار رين" className="h-12 object-contain" />
          <p className="text-white/40 text-sm font-medium mt-1">
            RoboRAVE Saudi Arabia 2026 — Operations Platform
          </p>
        </div>

        {/* Middle: Feature bullets */}
        <div className="space-y-6 relative z-10">
          <h1 className="text-white font-black text-3xl leading-tight">
            {lang === 'ar' ? 'منصة تحكيم بطولة روبوتات المملكة' : 'Saudi Arabia Robotics Competition'}
            <br />
            <span className="text-teal-400">Operations Center</span>
          </h1>
          <div className="space-y-3">
            {[
              { icon: '🏆', text: lang === 'ar' ? 'لوحة نتائج مباشرة' : 'Live leaderboard & scoring' },
              { icon: '🤖', text: lang === 'ar' ? 'إدارة مسارات ٦ تصنيفات' : '6 competition categories managed' },
              { icon: '✅', text: lang === 'ar' ? 'تسجيل حضور الفرق' : 'Real-time team check-in system' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-white/70 font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-[2px] bg-gradient-to-r from-teal-500 via-emerald-400 to-saudi-400 rounded-full opacity-60" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-ink-50">
        {/* Top bar with lang toggle */}
        <div className="flex justify-end px-4 pt-4">
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
              className="p-2 bg-ink-100 hover:bg-teal-50 border border-ink-200 rounded-lg text-ink-600 transition-colors press-effect relative"
            >
              <Globe size={18} />
              <span className="absolute -top-1 -right-1 text-[8px] font-black bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {lang === 'en' ? 'ع' : 'EN'}
              </span>
            </button>
          )}
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 sm:px-6 sm:pb-12">
          <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/img/rain-o.png" alt="شعار رين" className="h-10 object-contain mx-auto mb-1" />
            <p className="text-ink-500 text-xs font-medium">RoboRAVE Saudi Arabia 2026</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-br from-navy-500 to-[#0a2a3a] px-5 py-5 sm:px-8 sm:py-7 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 mb-3">
                <ShieldCheck className="text-emerald-300" size={28} />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">{t(lang, 'authorizedOnly')}</h2>
              <p className="text-white/40 text-xs mt-1">{t(lang, 'signInPrompt')}</p>
            </div>

            {/* Form */}
            <div className="px-5 py-5 sm:px-8 sm:py-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5 uppercase tracking-wide">{t(lang, 'username')}</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <input
                    type="text"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="input-base pl-10"
                    placeholder="e.g., admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5 uppercase tracking-wide">{t(lang, 'password')}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <input
                    type="password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="input-base pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span className="text-rose-400">&#9888;</span> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t(lang, 'authenticate')}</>
                ) : t(lang, 'authenticate')}
              </button>

              {onEnterPublic && (
                <>
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink-200" /></div>
                    <div className="relative flex justify-center"><span className="px-2 bg-white text-[10px] font-black uppercase tracking-widest text-ink-400">{lang === 'ar' ? 'أو' : 'or'}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterPublic}
                    className="w-full py-3 text-sm font-black rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  >
                    🏆 {lang === 'ar' ? 'عرض النتائج المباشرة (للجمهور)' : 'View Live Results (Public)'}
                  </button>
                </>
              )}

              {/* Demo credentials removed — real referee accounts in use */}
            </div>
          </div>
          </div>{/* /max-w-sm */}
        </div>
      </div>
    </div>
  );
}
