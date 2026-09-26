'use client';

import './globals.css';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from '../components/WalletConnect';
import Sidebar from '../components/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo Image */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="GROW 50X Official Logo"
                className="h-11 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>

            {/* Wallet & Top Actions */}
            <div className="flex items-center gap-3">
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Conditional Layout: Full width on Home Landing Page, Sidebar on Inner App Pages */}
        {isHomePage ? (
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
            {children}
          </main>
        ) : (
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 py-4 px-6 bg-white text-center text-xs text-slate-500">
          <p>© 2026 GROW 50X Protocol. Fully Decentralized Smart Contract Architecture on BNB Smart Chain.</p>
        </footer>
      </body>
    </html>
  );
}
