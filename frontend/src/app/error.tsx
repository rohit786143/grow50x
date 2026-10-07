'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl mx-auto font-bold">
        ⚠️
      </div>
      <h2 className="text-xl font-black text-slate-900">Something went wrong!</h2>
      <p className="text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 break-all text-left">
        {error.message || 'An unexpected runtime error occurred.'}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
      >
        🔄 Try Again
      </button>
    </div>
  );
}
