import { useState } from 'react';
import { LogOut, Globe } from 'lucide-react';
import { t } from '../../constants/translations';

const REGION_DOTS = {
  Western: 'bg-brand-400',
  Central: 'bg-saudi-400',
  Eastern: 'bg-amber-400',
};

export default function Header({ currentUser, lang, setLang, onLogout, adminRegion, setAdminRegion }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-[49]"
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="sticky top-0 z-50" dir={dir}>
      {/* Main bar */}
      <div className="bg-white text-[#0A2A3A] shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col items-center gap-2">

          {/* Top row: rain logo (left) | logos (center) | lang toggle + user chip (right) */}
          <div className="w-full flex items-center justify-between gap-2">

            {/* Left: RAIN logo standalone */}
            <img
              src="/img/rain-o.png"
              alt="شعار رين"
              className="h-10 sm:h-14 object-contain shrink-0 ml-4 sm:ml-8"
              style={{ maxWidth: '100px' }}
            />

            {/* Center: logos */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {/* Top: RoboRAVE Saudi Arabia logo — wide */}
              <img
                src="/img/roborave-saudiarabia.png"
                alt="شعار RoboRAVE Saudi Arabia"
                className="h-7 sm:h-9 object-contain"
                style={{ maxWidth: '180px' }}
              />

              {/* Middle row: 3 sponsor logos */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[
                  { src: "/img/Logo Arena.png", alt: "شعار Ai Arena", title: "Ai Arena" },
                  { src: "/img/tech-college.png", alt: "شعار الكلية التقنية", title: "الكلية التقنية" },
                  { src: "/img/saudi-robotics-federation-o.png", alt: "شعار الاتحاد السعودي للروبوتات", title: "الاتحاد السعودي للروبوتات" },
                ].map((logo) => (
                  <img
                    key={logo.title}
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="object-contain h-10 sm:h-12"
                    style={{ maxWidth: '72px' }}
                  />
                ))}
              </div>
            </div>

            {/* Right: language toggle + user chip */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language toggle */}
              <button
                onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
                title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                className="p-2 bg-gray-100 hover:bg-teal-50 border border-gray-300 rounded-lg text-navy-500 transition-colors press-effect relative"
              >
                <Globe size={18} />
                <span className="absolute -top-1 -right-1 text-[8px] font-black bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {lang === 'en' ? 'ع' : 'EN'}
                </span>
              </button>

              {/* User chip */}
              {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-emerald-50 border border-gray-300 rounded-lg px-2 py-1.5 transition-colors press-effect"
                >
                  <div className="w-2 h-2 rounded-full bg-saudi-400 animate-pulse shrink-0" />
                  <span className="hidden sm:block text-xs font-medium text-[#0A2A3A]/70 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">
                    {currentUser.role}
                  </span>
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className={`absolute top-full mt-2 z-50 bg-[#0a2a3a] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[160px] ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-bold text-sm truncate">{currentUser.name}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">{currentUser.role}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { onLogout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 font-semibold text-sm transition-colors press-effect"
                      >
                        <LogOut size={14} />
                        <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg text-sm transition-colors shadow press-effect">
                {t(lang, 'staffPortal')}
              </button>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] bg-gradient-to-r from-brand-500 via-saudi-400 to-brand-500" />

      {/* Admin region filter bar */}
      {currentUser?.role === 'admin' && (
        <div className="bg-[#0a2a3a]/95 backdrop-blur-sm border-b border-white/8 px-3 sm:px-4 py-1.5" dir={dir}>
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-white/30 text-xs font-semibold whitespace-nowrap shrink-0 uppercase tracking-wide">
              {t(lang, 'regionFilter')}
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {['All', 'Western', 'Central', 'Eastern'].map(r => (
                <button
                  key={r}
                  onClick={() => setAdminRegion(r)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                    adminRegion === r
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {r !== 'All' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${REGION_DOTS[r] || 'bg-white/40'}`} />
                  )}
                  {r === 'All' ? t(lang, 'allRegions') : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
