import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Top-level error boundary. Renders a friendly fallback when a child component
 * throws during render or in a lifecycle method, instead of unmounting the
 * entire app and leaving the user with a blank page.
 *
 * Async / event-handler errors (e.g. inside Promises) are NOT caught here —
 * those are surfaced through the toast system in App.jsx.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI crash:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    // Hard reload as a last resort so any corrupt in-memory state is wiped.
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const lang = this.props.lang || 'en';
    const isAr = lang === 'ar';
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-white to-rose-50"
      >
        <div className="max-w-lg w-full bg-white border border-rose-200 rounded-3xl shadow-xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center">
              <AlertTriangle size={22} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-rose-700">
                {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
              </h2>
              <p className="text-xs text-ink-500">
                {isAr ? 'تم إيقاف الواجهة لحماية بياناتك.' : 'The interface was stopped to protect your data.'}
              </p>
            </div>
          </div>
          <pre className="text-[11px] leading-relaxed text-ink-600 bg-ink-50 border border-ink-200 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap">
            {String(error?.message || error)}
          </pre>
          <button
            onClick={this.handleReload}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm transition-colors press-effect"
          >
            <RotateCcw size={16} />
            {isAr ? 'إعادة تحميل الصفحة' : 'Reload the page'}
          </button>
        </div>
      </div>
    );
  }
}
