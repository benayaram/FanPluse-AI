/**
 * @file ErrorBoundary.tsx
 * @description React Error Boundary component that catches JavaScript errors
 * anywhere in the child component tree and displays a fallback UI instead
 * of crashing the entire application.
 *
 * This is essential for production-grade applications where graceful
 * error handling improves user experience and aids debugging.
 */

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/** Props for the ErrorBoundary component. */
interface ErrorBoundaryProps {
  /** Child components to render within the error boundary. */
  children: React.ReactNode;
  /** Optional fallback UI to render when an error occurs. */
  fallback?: React.ReactNode;
}

/** Internal state for tracking error status. */
interface ErrorBoundaryState {
  /** Whether an error has been caught. */
  hasError: boolean;
  /** The caught error, if any. */
  error: Error | null;
}

/**
 * ErrorBoundary catches rendering errors in child components and displays
 * a user-friendly fallback UI with error details and a recovery button.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  /** Reset the error state and attempt to re-render children. */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-4">
            An unexpected error occurred in this section. The rest of the application
            is still functional. You can try refreshing this component.
          </p>
          {this.state.error && (
            <pre className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 max-w-lg overflow-x-auto mb-4">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-fifa-blue rounded-xl hover:opacity-90 transition-opacity"
            aria-label="Retry loading this section"
          >
            <RefreshCcw size={14} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
