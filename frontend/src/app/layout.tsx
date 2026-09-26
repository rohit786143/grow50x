import './globals.css';
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'GROW 50X - Decentralized Web3 Protocol',
  description: 'Operating on BNB Smart Chain with USDT BEP-20',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-cyan-500/20">
                50X
              </div>
              <span className="font-extrabold text-xl tracking-wider gradient-text">GROW 50X</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
              <Link href="/boards" className="hover:text-cyan-400 transition-colors">Boards</Link>
              <Link href="/sub-ids" className="hover:text-cyan-400 transition-colors">Sub-IDs</Link>
              <Link href="/income" className="hover:text-cyan-400 transition-colors">Income & Pool</Link>
              <Link href="/admin" className="hover:text-cyan-400 transition-colors">Analytics</Link>
              <Link href="/contracts" className="hover:text-cyan-400 transition-colors">Contracts</Link>
            </nav>

            <div className="flex items-center gap-3">
              <button 
                id="connect-wallet-btn"
                className="gradient-btn px-4 py-2 rounded-xl text-slate-950 font-semibold text-sm shadow-md hover:scale-105 transition-transform"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
          <p>© 2026 GROW 50X Protocol. Fully Decentralized Smart Contract Architecture on BNB Smart Chain.</p>
        </footer>
      </body>
    </html>
  );
}
