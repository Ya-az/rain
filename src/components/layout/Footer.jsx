export default function Footer({ lang = 'en', variant = 'light' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const isDark = variant === 'dark';
  const wrapperClass = isDark
    ? 'border-t border-white/10 py-5 text-center text-[11px] text-white/40'
    : 'border-t border-ink-200 py-5 text-center text-[11px] text-ink-400 bg-white';

  return (
    <footer className={wrapperClass} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <p>
        {tx('Powered by RAIN Operations', 'بإدارة منصة رين للعمليات')} · RoboRAVE Saudi Arabia 2026
      </p>
    </footer>
  );
}
