/**
 * Toggle — modern pill switch, replaces browser checkbox for boolean states
 *
 * Props:
 *  checked   boolean
 *  onChange  (bool) => void
 *  disabled  boolean (optional)
 *  label     string (optional — shown next to toggle)
 *  size      'sm' | 'md' (default 'md')
 */
export default function Toggle({ checked, onChange, disabled = false, label, size = 'md' }) {
  const track = size === 'sm'
    ? 'w-9 h-5'
    : 'w-12 h-6';
  const thumb = size === 'sm'
    ? 'w-3.5 h-3.5 top-[3px] left-[3px]'
    : 'w-[18px] h-[18px] top-[3px] left-[3px]';
  const translate = size === 'sm'
    ? 'translate-x-4'
    : 'translate-x-6';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center gap-2.5 press-effect ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Track */}
      <span
        className={`relative inline-flex shrink-0 rounded-full transition-colors duration-200 ${track} ${
          checked ? 'bg-brand-500' : 'bg-ink-300'
        }`}
      >
        {/* Thumb */}
        <span
          className={`absolute rounded-full bg-white shadow-md transition-transform duration-200 ${thumb} ${
            checked ? translate : 'translate-x-0'
          }`}
        />
      </span>
      {label && (
        <span className="text-sm font-medium text-ink-700 leading-snug select-none">{label}</span>
      )}
    </button>
  );
}
