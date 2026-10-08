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
      {/* 📌 Top Header Bar 100% FIXED at top (Stays Static on Scroll) */}
      <header
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
        className="w-full max-w-full bg-white/95 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-3 shadow-md electrical-header-string overflow-hidden"
      >
        <div className="electrical-pulse-beam" />
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 relative z-10 w-full">
          {/* Left: Hamburger button (on mobile) & Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!isHomePage && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors focus:outline-none shrink-0"
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

            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <img
                src="/logo.png"
                alt="GROW 50X Official Logo"
                style={{ maxHeight: '36px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                className="h-8 sm:h-11 w-auto hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {/* Right: Wallet & Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Body Container with Top Padding for Fixed Header */}
      <div className="pt-16 sm:pt-20 flex-1 flex flex-col min-h-screen">
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
      </div>

      {/* Footer */}
      <footer className="border-t border-amber-200/80 py-5 px-4 sm:px-6 bg-white text-center text-xs text-slate-500">
        <p className="font-medium text-slate-600">© 2026 GROW 50X Protocol. Fully Decentralized Smart Contract Architecture on BNB Smart Chain.</p>
      </footer>
    </Web3Provider>
  );
}
