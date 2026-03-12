import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  lang: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isAr = this.props.lang === 'ar';
      
      let errorMessage = this.state.error?.message || '';
      let isFirestoreError = false;
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = isAr 
            ? `خطأ في قاعدة البيانات: ${parsed.error}`
            : `Database Error: ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {isAr ? 'عذراً، حدث خطأ ما' : 'Oops, something went wrong'}
            </h2>
            <p className="text-slate-500 leading-relaxed">
              {isFirestoreError ? errorMessage : (isAr ? 'حدث خطأ غير متوقع في التطبيق. يرجى إعادة تحميل الصفحة.' : 'An unexpected error occurred in the application. Please reload the page.')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100"
            >
              {isAr ? 'إعادة تحميل الصفحة' : 'Reload Page'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
