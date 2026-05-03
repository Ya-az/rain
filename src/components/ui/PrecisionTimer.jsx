import { useState, useEffect } from 'react';

/**
 * PrecisionTimer — extracted verbatim from original App.jsx
 * Logic preserved exactly. Added animate-pulse when running.
 */
export default function PrecisionTimer({ initialSeconds, onStop, isSoccerBot, disabled, disableControls, lang = 'en' }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [switchTimer, setSwitchTimer] = useState(null);
  const [hasSwitched, setHasSwitched] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && switchTimer === null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 0.01;
          if (isSoccerBot && !hasSwitched && Math.abs(next - 90.00) < 0.015) {
            setSwitchTimer(30.00);
            setHasSwitched(true);
          }
          if (next <= 0) {
            setIsRunning(false);
            return 0;
          }
          return next;
        });
      }, 10);
    } else if (switchTimer !== null) {
      interval = setInterval(() => {
        setSwitchTimer(prev => {
          const next = prev - 0.01;
          if (next <= 0) return null;
          return next;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, switchTimer, isSoccerBot, hasSwitched, timeLeft]);

  const handleStop = () => {
    setIsRunning(false);
    const elapsed = (initialSeconds - timeLeft).toFixed(2);
    const remaining = timeLeft.toFixed(2);
    onStop(elapsed, remaining);
  };

  const displayText = switchTimer !== null
    ? `${lang === 'ar' ? 'تبديل' : 'SWITCH'}: ${switchTimer.toFixed(2)}s`
    : `${timeLeft.toFixed(2)}s`;

  return (
    <div className="bg-[#061a27] rounded-2xl overflow-hidden mb-4 text-white">
      {/* Label + time + buttons */}
      <div className="px-4 pt-3 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">{disableControls ? (lang === 'ar' ? 'إدخال يدوي' : 'Manual Entry') : (lang === 'ar' ? 'مؤقت نشط' : 'Active Timer')}</div>
          <div className={`text-4xl font-mono font-black tabular-nums leading-none ${
            switchTimer !== null ? 'text-amber-400' : 'text-brand-400'
          } ${isRunning ? 'animate-pulse' : ''}`}>
            {displayText}
          </div>
        </div>

        {/* Buttons — replaced by manual badge when disableControls */}
        <div className="flex gap-2 shrink-0">
          {disableControls ? (
            <div className="px-3 py-2 bg-ink-800 rounded-xl text-center leading-tight">
              <p className="text-[10px] font-bold text-ink-500">{lang === 'ar' ? 'متوقف' : 'Stopped'}</p>
              <p className="text-[10px] font-bold text-ink-600">{lang === 'ar' ? 'أدخل الوقت يدوياً' : 'Enter time manually'}</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsRunning(true)}
                disabled={disabled || isRunning || timeLeft <= 0 || switchTimer !== null}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:bg-ink-700 disabled:opacity-40 rounded-xl font-bold transition-colors text-sm press-effect"
              >
                {lang === 'ar' ? 'بدء' : 'Start'}
              </button>
              <button
                onClick={handleStop}
                disabled={disabled || (!isRunning && timeLeft === initialSeconds)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:bg-ink-700 disabled:opacity-40 rounded-xl font-bold transition-colors text-sm press-effect"
              >
                {lang === 'ar' ? 'إيقاف' : 'Stop'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10">
        <div
          className={`h-full transition-all duration-100 ${switchTimer !== null ? 'bg-amber-400' : 'bg-brand-500'}`}
          style={{ width: `${(timeLeft / initialSeconds) * 100}%` }}
        />
      </div>
    </div>
  );
}
