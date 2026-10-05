'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function SidebarInner({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');

  const { account, mainUserId, selectedUserId, setSelectedUserId, ownedIds, isSubIdSelected, isRegistered } = useWeb3();
  const [txMenuOpen, setTxMenuOpen] = useState<boolean>(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState<boolean>(true);
  const [subIdMenuOpen, setSubIdMenuOpen] = useState<boolean>(true);

  const isAdminRoute = pathname?.startsWith('/admin');
  const isActive = (path: string) => pathname === path;

  const isTransactionsRoute = pathname === '/transactions';
  const isIncomeActive = isTransactionsRoute && viewParam !== 'deposits';
  const isDepositsActive = isTransactionsRoute && viewParam === 'deposits';

  // Render Admin Navigation Sidebar if on /admin route
  if (isAdminRoute) {
    const adminContent = (
      <div className="flex flex-col justify-between h-full min-h-screen">
        <div className="p-5 space-y-6">
          {/* Admin Identity Badge */}
          <div className="bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">ADMIN CONTROL</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                PROTOCOL READ-ONLY
              </span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">System Admin</p>
            <p className="text-xs font-mono text-slate-500 break-all">
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Public Analytics View'}
            </p>
          </div>

          {/* Admin Navigation Menu */}
          <nav className="space-y-1.5 font-medium text-sm">
            <Link
              href="/admin"
              onClick={() => onCloseMobile?.()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin' && (typeof window === 'undefined' || !window.location.search.includes('tab='))
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🛡️</span> Protocol Telemetry
            </Link>

            <Link
              href="/admin?tab=funds"
              onClick={() => onCloseMobile?.()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin' && (typeof window !== 'undefined' && window.location.search.includes('tab=funds'))
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>💰</span> All Funds Details
            </Link>

            <Link
              href="/admin?tab=users"
              onClick={() => onCloseMobile?.()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin' && (typeof window !== 'undefined' && window.location.search.includes('tab=users'))
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>👥</span> All Users Directory
            </Link>

            <Link
              href="/admin?tab=boards"
              onClick={() => onCloseMobile?.()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin' && (typeof window !== 'undefined' && window.location.search.includes('tab=boards'))
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🧩</span> All Boards Details
            </Link>

            <Link
              href="/admin?tab=contracts"
              onClick={() => onCloseMobile?.()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin' && (typeof window !== 'undefined' && window.location.search.includes('tab=contracts'))
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>📄</span> Smart Contracts & Verification
            </Link>

            <div className="pt-4 border-t border-slate-200">
              <Link
                href="/dashboard"
                onClick={() => onCloseMobile?.()}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <span>⬅️</span> Return to User App
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 text-center text-[11px] font-medium text-slate-400">
          GROW 50X Admin Console v1.0
        </div>
      </div>
    );

    return (
      <>
        {/* Desktop Admin Sidebar */}
        <aside className="w-64 bg-white text-slate-800 border-r border-slate-200 hidden lg:flex flex-col justify-between shrink-0 min-h-screen shadow-sm">
          {adminContent}
        </aside>

        {/* Mobile Slide-Over Drawer for Admin */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={onCloseMobile}
            />
            <div className="relative w-72 max-w-[80vw] bg-white text-slate-800 h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <span className="font-extrabold text-sm text-sky-700">Admin Navigation</span>
                <button
                  onClick={onCloseMobile}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              {adminContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Do NOT render left user sidebar if wallet is not connected or user is not registered on user pages
  if (!account || !isRegistered) {
    return null;
  }

  const userContent = (
    <div className="flex flex-col justify-between h-full min-h-screen">
      <div className="p-5 space-y-6">
        {/* User Profile Card with ID Selector Dropdown */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Identity</span>
            {isSubIdSelected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-300">
                Sub-ID Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                Main ID Active
              </span>
            )}
          </div>

          {/* Dropdown for selecting active ID (Main ID vs Sub-IDs) */}
          <select
            value={selectedUserId || mainUserId}
            onChange={(e) => {
              setSelectedUserId(Number(e.target.value));
              onCloseMobile?.();
            }}
            className="w-full bg-white border border-slate-300 text-slate-900 font-extrabold text-xs rounded-xl pl-2.5 pr-6 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer shadow-sm transition-all tracking-tight"
          >
            {ownedIds.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 font-medium text-sm">
          <Link
            href="/dashboard"
            onClick={() => onCloseMobile?.()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/dashboard')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📊</span> Dashboard
          </Link>

          {/* 💸 My Transactions (Collapsible Sub-Menu) */}
          <div>
            <button
              onClick={() => setTxMenuOpen(!txMenuOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isTransactionsRoute
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>💸</span> My Transactions
              </div>
              <span className="text-xs">{txMenuOpen ? '▼' : '▶'}</span>
            </button>

            {txMenuOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <Link
                  href="/transactions?view=income"
                  onClick={() => onCloseMobile?.()}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isIncomeActive
                      ? 'bg-sky-100 text-sky-800 font-bold border border-sky-300'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  💰 My Income
                </Link>
                <Link
                  href="/transactions?view=deposits"
                  onClick={() => onCloseMobile?.()}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isDepositsActive
                      ? 'bg-purple-100 text-purple-800 font-bold border border-purple-300'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  📥 My Deposits
                </Link>
              </div>
            )}
          </div>

          {/* My Team (Collapsible Menu) */}
          <div>
            <button
              onClick={() => setTeamMenuOpen(!teamMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span>👥</span> My Team
              </div>
              <span className="text-xs">{teamMenuOpen ? '▼' : '▶'}</span>
            </button>

            {teamMenuOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <Link
                  href="/team/directs"
                  onClick={() => onCloseMobile?.()}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/team/directs')
                      ? 'bg-sky-50 text-sky-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  🔗 My Directs
                </Link>
                <Link
                  href="/team/downline"
                  onClick={() => onCloseMobile?.()}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/team/downline')
                      ? 'bg-sky-50 text-sky-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  🌿 My Downline
                </Link>
              </div>
            )}
          </div>

          {/* 🚀 Sub-IDs Manager (Collapsible Menu - HIDDEN WHEN SUB-ID IS SELECTED!) */}
          {!isSubIdSelected && (
            <div>
              <button
                onClick={() => setSubIdMenuOpen(!subIdMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span>🚀</span> Sub-IDs Manager
                </div>
                <span className="text-xs">{subIdMenuOpen ? '▼' : '▶'}</span>
              </button>

              {subIdMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <Link
                    href="/sub-ids"
                    onClick={() => onCloseMobile?.()}
                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive('/sub-ids')
                        ? 'bg-sky-50 text-sky-700 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    ✨ Create Sub-IDs
                  </Link>
                  <Link
                    href="/sub-ids/my-sub-ids"
                    onClick={() => onCloseMobile?.()}
                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive('/sub-ids/my-sub-ids')
                        ? 'bg-sky-50 text-sky-700 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    🤖 My Sub-IDs
                  </Link>
                </div>
              )}
            </div>
          )}

          <Link
            href="/boards"
            onClick={() => onCloseMobile?.()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/boards')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🧩</span> Board Matrix
          </Link>

          <Link
            href="/contracts"
            onClick={() => onCloseMobile?.()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/contracts')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📄</span> Contracts & Explorer
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 text-center text-xs text-slate-400">
        GROW 50X Protocol v1.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between shrink-0 min-h-screen shadow-sm">
        {userContent}
      </aside>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Slide-in Panel */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
                <span className="font-extrabold text-sm text-slate-900">Menu</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            {userContent}
          </div>
        </div>
      )}
    </>
  );
}

export default function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <Suspense fallback={<aside className="w-64 bg-white border-r border-slate-200 min-h-screen shrink-0 hidden lg:block" />}>
      <SidebarInner isMobileOpen={isMobileOpen} onCloseMobile={onCloseMobile} />
    </Suspense>
  );
}
