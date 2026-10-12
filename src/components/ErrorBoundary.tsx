import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AKUZ APP ERROR BOUNDARY]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070a12] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0d121f] border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-[#ff0055] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-xl font-black mb-2 text-white">
              {this.props.fallbackTitle || 'Bir Hata Oluştu'}
            </h2>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Sayfa yüklenirken beklenmeyen bir hata oluştu. Verileriniz güvendedir. Sayfayı yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] font-mono text-slate-400 mb-6 text-left break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-[#ff0055] hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <RefreshCw size={15} />
                <span>Sayfayı Yenile</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home size={15} />
                <span>Ana Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
