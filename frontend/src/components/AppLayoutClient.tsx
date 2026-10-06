'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from './WalletConnect';
import Sidebar from './Sidebar';
import NetworkBanner from './NetworkBanner';
import { Web3Provider } from '../context/Web3Context';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <Web3Provider>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Hamburger button (on mobile) & Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isHomePage && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="GROW 50X Official Logo"
                style={{ maxHeight: '38px', maxWidth: '160px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                className="h-8 sm:h-10 w-auto hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {/* Right: Wallet & Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <WalletConnect />
          </div>
        </div>
      </header>

      <NetworkBanner />

      {/* Conditional Layout: Full width on Home Landing Page, Sidebar on Inner App Pages */}
      {isHomePage ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      ) : (
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
          <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full min-w-0">
            {children}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 px-4 sm:px-6 bg-white text-center text-xs text-slate-500">
        <p>© 2026 GROW 50X Protocol. Fully Decentralized Smart Contract Architecture on BNB Smart Chain.</p>
      </footer>
    </Web3Provider>
  );
}
