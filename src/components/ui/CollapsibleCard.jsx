import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * CollapsibleCard — collapsed by default, smooth expand animation.
 * Props: title, badge, badgeColor, headerClass, children
 */
export default function CollapsibleCard({ title, badge, badgeColor = 'bg-ink-500', headerClass = 'bg-navy-700', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl shadow-sm border border-ink-200 overflow-hidden">
      <button
        className={`w-full flex justify-between items-center p-4 text-white ${headerClass} transition-colors`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-bold flex items-center gap-2">{title}</span>
        <div className="flex items-center gap-3">
          {badge !== undefined && (
            <span className={`${badgeColor} text-white px-3 py-0.5 rounded-full text-xs font-bold`}>{badge}</span>
          )}
          <ChevronDown
            size={20}
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-white">{children}</div>
      </div>
    </div>
  );
}
