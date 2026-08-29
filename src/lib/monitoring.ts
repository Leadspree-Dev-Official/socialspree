/**
 * Error reporting seam.
 *
 * There was no way to learn that something broke in production except a
 * customer saying so. This gives the app one place to report failures, and one
 * place to wire a vendor (Sentry, Highlight, whatever) into later — without
 * hunting through components for scattered console.error calls.
 *
 * Deliberately vendor-free: it costs nothing, ships today, and swapping in a
 * real backend is a single function body.
 */

export interface ErrorContext {
  area?: string;
  componentStack?: string;
  [key: string]: unknown;
}

type Sink = (error: Error, context: ErrorContext) => void;

const sinks: Sink[] = [];

/** Register a reporter, e.g. from a vendor SDK during app bootstrap. */
export function addErrorSink(sink: Sink): void {
  sinks.push(sink);
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const normalized = error instanceof Error ? error : new Error(String(error));

  // Always visible locally, whatever else is attached.
  console.error(`[${context.area ?? 'app'}]`, normalized, context);

  for (const sink of sinks) {
    try {
      sink(normalized, context);
    } catch {
      // A failing reporter must never take the app down with it.
    }
  }
}

/**
 * Catches failures that escape React entirely — rejected promises and errors
 * thrown outside a render. Call once during bootstrap.
 */
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', event => {
    reportError(event.reason, { area: 'unhandled-promise' });
  });

  window.addEventListener('error', event => {
    if (event.error) reportError(event.error, { area: 'window' });
  });
}
