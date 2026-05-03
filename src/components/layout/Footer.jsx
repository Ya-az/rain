export default function Footer({ lang = 'en', variant = 'light' }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const isDark = variant === 'dark';

  const wrapperBase = 'mt-6 sm:mt-8 px-4 py-3 sm:py-3.5 text-center text-[10px] sm:text-[11px] leading-relaxed font-medium';
  const wrapperTheme = isDark
    ? 'border-t border-white/10 text-white/45 bg-transparent'
    : 'border-t border-ink-200/70 text-ink-400 bg-white/80 backdrop-blur';

  return (
    <footer
      className={`${wrapperBase} ${wrapperTheme}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <p className="inline-flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-full">
        <span className={isDark ? 'text-white/65 font-bold' : 'text-ink-600 font-bold'}>
          {tx('Powered by RAIN Operations', 'بإدارة منصة رين للعمليات')}
        </span>
        <span className={isDark ? 'text-white/25' : 'text-ink-300'} aria-hidden="true">·</span>
        <span className="whitespace-nowrap">RoboRAVE Saudi Arabia 2026</span>
      </p>
    </footer>
  );
}
