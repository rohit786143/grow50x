'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../config/contracts';

export default function Sidebar() {
  const pathname = usePathname();
  const [account, setAccount] = useState<string | null>(null);
  const [displayId, setDisplayId] = useState<string>('Guest');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState<boolean>(true);

  useEffect(() => {
    loadUserData();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', () => loadUserData());
    }
  }, []);

  const loadUserData = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) {
        setAccount(null);
        setDisplayId('Guest');
        setIsRegistered(false);
        return;
      }

      const wallet = accounts[0];
      setAccount(wallet);

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mIdRaw = await coreContract.walletToMainUserId(wallet);
      const mId = Number(mIdRaw);

      if (mId > 0) {
        setIsRegistered(true);
        setDisplayId(`GR${mId.toString().padStart(5, '0')}`);
      } else {
        setIsRegistered(false);
        setDisplayId('Not Registered');
      }
    } catch (err) {
      console.error('Error loading sidebar user data:', err);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen shadow-sm">
      <div className="p-5 space-y-6">
        {/* User Profile Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Identity</span>
            {isRegistered ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                Active ID
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                Unregistered
              </span>
            )}
          </div>
          <p className="text-xl font-extrabold text-slate-900">{displayId}</p>
          <p className="text-xs font-mono text-slate-500 break-all">
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connect Wallet'}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 font-medium text-sm">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/dashboard')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📊</span> Dashboard
          </Link>

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

          <Link
            href="/sub-ids"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/sub-ids')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🚀</span> Sub-IDs Manager
          </Link>

          <Link
            href="/boards"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/boards')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🧩</span> Board Matrix
          </Link>

          <Link
            href="/income"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/income')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>💰</span> Income & Pools
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/admin')
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📈</span> System Analytics
          </Link>

          <Link
            href="/contracts"
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
    </aside>
  );
}
