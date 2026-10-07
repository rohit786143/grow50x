'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full p-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-rose-500/30">
            💥
          </div>
          <h2 className="text-2xl font-black text-white">Application Error</h2>
          <p className="text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 break-all text-left">
            {error.message || 'Fatal application error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            🔄 Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
