/**
 * TriStateButton
 * Cycle: null (gray) → true (green ✓) → false (red ✗)
 * Stays false after red — no cycling back.
 *
 * Props:
 *   value: null | true | false
 *   onChange: (newValue) => void
 *   label: string
 *   disabled: boolean
 */
export default function TriStateButton({ value, onChange, label, disabled = false }) {
  const handleClick = () => {
    if (disabled) return;
    if (value === null || value === undefined) onChange(true);
    else if (value === true) onChange(false);
    // value === false → stays false (no cycle back)
  };

  const styles =
    value === true
      ? 'bg-saudi-500 text-white border-saudi-600 hover:bg-saudi-600'
      : value === false
      ? 'bg-red-500 text-white border-red-600 cursor-not-allowed'
      : 'bg-ink-100 text-ink-600 border-ink-300 hover:bg-ink-200';

  const icon =
    value === true ? '✓' : value === false ? '✗' : '○';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || value === false}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all duration-150 select-none ${styles} disabled:opacity-70`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
