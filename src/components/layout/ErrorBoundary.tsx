import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportError } from '../../lib/monitoring';

interface Props {
  children: React.ReactNode;
  /** Names the area that failed, so the message can say what broke. */
  area?: string;
}

interface State {
  error: Error | null;
}

/**
 * Stops one broken component from blanking the whole product.
 *
 * Without this, any render-time exception unmounts the React tree and the
 * customer is left staring at a white page with no way forward — which is
 * exactly what happened during development when an import went missing.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, {
      area: this.props.area ?? 'app',
      componentStack: info.componentStack ?? undefined,
    });
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="m-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 sm:p-8 max-w-2xl mx-auto"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-3 min-w-0">
            <div>
              <h2 className="text-base font-bold text-red-900 dark:text-red-200">
                {this.props.area ? `The ${this.props.area} view stopped responding` : 'Something went wrong'}
              </h2>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                Your work has not been lost. Try again, and if it keeps happening, the
                details below will help support pin it down.
              </p>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-300">
                Technical details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] text-red-900/80 dark:text-red-300/80 max-h-40 overflow-auto">
                {this.state.error.message}
              </pre>
            </details>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={this.reset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
              >
                Reload the page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
