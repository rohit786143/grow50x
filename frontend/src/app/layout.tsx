import './globals.css';
import React from 'react';
import Link from 'next/link';
import WalletConnect from '../components/WalletConnect';
import Sidebar from '../components/Sidebar';

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
      <body className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-emerald-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-sky-500/20">
                50X
              </div>
              <span className="font-extrabold text-xl tracking-wider gradient-text-blue">GROW 50X</span>
            </Link>

            {/* Wallet & Top Actions */}
            <div className="flex items-center gap-3">
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Main Body with Left Sidebar */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Left Navigation Sidebar */}
          <Sidebar />

          {/* Main Dashboard Content Area */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-4 px-6 bg-white text-center text-xs text-slate-500">
          <p>© 2026 GROW 50X Protocol. Fully Decentralized Smart Contract Architecture on BNB Smart Chain.</p>
        </footer>
      </body>
    </html>
  );
}
