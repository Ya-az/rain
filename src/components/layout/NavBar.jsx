import { useEffect, useState } from 'react';
import { BarChart3, Users, Activity, Settings } from 'lucide-react';
import { t } from '../../constants/translations';

const TABS = [
  { id: 'dashboard', iconKey: BarChart3, labelKey: 'publicDashboard' },
  { id: 'checkin',   iconKey: Users,     labelKey: 'checkIn' },
  { id: 'competing', iconKey: Activity,  labelKey: 'competing' },
  { id: 'operations', iconKey: Settings, labelKey: 'operations' },
];

// Hide the mobile bottom nav while a text/number/textarea input is focused
// (so the on-screen keyboard doesn't get covered by the nav bar).
function useInputFocused() {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const isFormControl = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') {
        const type = (el.type || 'text').toLowerCase();
        return !['checkbox', 'radio', 'button', 'submit', 'reset', 'file'].includes(type);
      }
      return el.isContentEditable === true;
    };
    const onIn = (e) => { if (isFormControl(e.target)) setFocused(true); };
    const onOut = (e) => { if (isFormControl(e.target)) setFocused(false); };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  return focused;
}

export default function NavBar({ currentView, setCurrentView, currentUser, allowedViews = [], lang, pendingCount = 0 }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const inputFocused = useInputFocused();

  if (!currentUser) return null;

  const visibleTabs = TABS.filter(({ id }) => allowedViews.includes(id));

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden sm:flex bg-white border-b border-ink-200 shadow-sm sticky top-[calc(3.5rem+2px)] z-40 overflow-x-auto scrollbar-hide" dir={dir}>
        <div className="max-w-7xl mx-auto flex w-full px-2">
          {visibleTabs.map(({ id, iconKey: Icon, labelKey }) => {
            const active = currentView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center gap-2 px-5 h-12 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                  active
                    ? 'border-teal-500 text-teal-600 bg-teal-50/60'
                    : 'border-transparent text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span>{t(lang, labelKey)}</span>
                {id === 'operations' && pendingCount > 0 && (
                  <span className="ms-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav
        className={`sm:hidden fixed bottom-0 inset-x-0 z-50 bg-navy-500 border-t border-white/10 flex pb-safe transition-transform duration-200 ${inputFocused ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}
        dir={dir}
        aria-hidden={inputFocused}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
      >
        {visibleTabs.map(({ id, iconKey: Icon, labelKey }) => {
          const active = currentView === id;
          const shortLabel = t(lang, labelKey).split(' ')[0];
          return (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 relative transition-all duration-150 press-effect ${
                active ? 'text-teal-400' : 'text-ink-400 active:text-ink-200'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-400" />
              )}
              <span className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
                active ? 'bg-teal-500/20' : ''
              }`}>
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 1.8} />
                {id === 'operations' && pendingCount > 0 && (
                  <span className="absolute top-0 right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-ink-900 animate-pulse" />
                )}
              </span>
              <span className={`text-[10px] leading-none font-bold transition-all ${
                active ? 'text-teal-400' : 'text-ink-500'
              }`}>
                {shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
