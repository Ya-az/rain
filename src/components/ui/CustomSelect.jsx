import { ChevronDown } from 'lucide-react';

/**
 * CustomSelect — hides native browser arrows, adds custom ChevronDown icon.
 * Props: value, onChange, children, className, disabled, size ('sm' | 'md')
 */
export default function CustomSelect({ value, onChange, children, className = '', disabled = false, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 pr-8 text-sm' : 'px-4 py-3 pr-10 text-sm';
  const iconSize = size === 'sm' ? 13 : 16;
  const iconRight = size === 'sm' ? 'right-2' : 'right-3';

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full appearance-none bg-white border-2 border-ink-200 rounded-xl font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${pad}`}
      >
        {children}
      </select>
      <ChevronDown
        size={iconSize}
        className={`pointer-events-none absolute ${iconRight} top-1/2 -translate-y-1/2 text-ink-400`}
      />
    </div>
  );
}
