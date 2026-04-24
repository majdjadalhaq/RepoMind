import { AlertTriangle, RefreshCcw } from 'lucide-react';
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch() {
    // Error tracking could be added here (e.g. Sentry)
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-red-600 dark:text-red-400 mb-3">System Anomaly Detected</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              RepoMind encountered an unexpected error. Your conversation data is safe in local storage.
            </p>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-red-500/70 truncate">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-red-500/20"
            >
              <RefreshCcw className="w-5 h-5" />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
