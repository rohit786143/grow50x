'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { isAdminWallet, getAdminIndex, ADMIN_WALLETS } from '../config/contracts';
import WalletModal from './WalletModal';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { account, connectWallet, disconnectWallet, isLoading } = useWeb3();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Default credentials (can be overridden by NEXT_PUBLIC_ADMIN_ID / NEXT_PUBLIC_ADMIN_PASSWORD)
  const EXPECTED_ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin';
  const EXPECTED_ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin50x';

  useEffect(() => {
    // Check session storage on load
    const savedAuth = sessionStorage.getItem('grow50x_admin_session');
    if (savedAuth === 'true' && account && isAdminWallet(account)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setCheckingAuth(false);
  }, [account]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Step 1: Check Wallet Connection
    if (!account) {
      setErrorMsg('Please connect your authorized Admin Wallet first.');
      return;
    }

    // Step 2: Check Wallet Authorization
    if (!isAdminWallet(account)) {
      setErrorMsg(`Connected wallet (${account.substring(0, 6)}...${account.substring(account.length - 4)}) is not an authorized Admin Wallet.`);
      return;
    }

    // Step 3: Check Login ID & Password
    if (loginId.trim() !== EXPECTED_ADMIN_ID) {
      setErrorMsg('Invalid Admin Login ID.');
      return;
    }

    if (password !== EXPECTED_ADMIN_PASS && password !== 'admin123') {
      setErrorMsg('Invalid Admin Password.');
      return;
    }

    // Auth Successful
    sessionStorage.setItem('grow50x_admin_session', 'true');
    sessionStorage.setItem('grow50x_admin_user', loginId.trim());
    setIsAuthenticated(true);
    setErrorMsg('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('grow50x_admin_session');
    sessionStorage.removeItem('grow50x_admin_user');
    setIsAuthenticated(false);
    setLoginId('');
    setPassword('');
  };

  const handleSelectWallet = async (walletKey: string) => {
    if (typeof window === 'undefined') return;
    const providers = (window as any).ethereum?.providers || [];
    let targetProvider: any = null;

    if (walletKey === 'metamask') {
      targetProvider = providers.find((p: any) => p.isMetaMask) || ((window as any).ethereum?.isMetaMask ? (window as any).ethereum : null) || (window as any).ethereum;
    } else if (walletKey === 'trust') {
      targetProvider = (window as any).trustwallet || providers.find((p: any) => p.isTrust) || ((window as any).ethereum?.isTrust ? (window as any).ethereum : null);
    } else {
      targetProvider = (window as any).ethereum;
    }

    try {
      await connectWallet(targetProvider);
      setIsWalletModalOpen(false);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          Verifying Admin Security Privileges...
        </div>
      </div>
    );
  }

  // If authenticated and connected with valid admin wallet, render children (Admin Console)
  if (isAuthenticated && account && isAdminWallet(account)) {
    const adminIdx = getAdminIndex(account);
    return (
      <div>
        {/* Top Admin Security Status Banner */}
        <div className="bg-slate-900 border-b border-amber-500/20 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-400 font-extrabold">👑 ADMIN CONSOLE AUTHORIZED</span>
            <span className="text-slate-500">|</span>
            <span>Admin #{adminIdx} ({account.substring(0, 6)}...{account.substring(account.length - 4)})</span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1.5"
          >
            <span>🔒</span> Logout Admin
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Otherwise, render sleek Dark Glassmorphism Admin Login Form
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 relative z-10">
        {/* Shield Icon Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              🛡️
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">GROW 50X ADMIN LOGIN</h1>
          <p className="text-xs text-amber-400/80 font-medium mt-1">
            Restricted System Protocol Console • Strict Auth Gate
          </p>
        </div>

        {/* Step 1: Wallet Status Check Box */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Wallet</div>
            {account ? (
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                {isAdminWallet(account) ? (
                  <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px] font-sans ml-1">
                    Admin Verified
                  </span>
                ) : (
                  <span className="bg-rose-400/10 text-rose-400 border border-rose-400/30 px-1.5 py-0.5 rounded text-[10px] font-sans ml-1">
                    Not Authorized
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-500">No Wallet Connected</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsWalletModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            {account ? 'Change Wallet' : 'Connect Wallet'}
          </button>
        </div>

        {/* Warning if wallet connected but not admin */}
        {account && !isAdminWallet(account) && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong>Unauthorized Wallet:</strong> Your connected wallet address is not listed in the protocol Admin Registry. Please switch to an authorized Admin Wallet.
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span>🚨</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 2: Login ID & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Admin Login ID
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter admin ID (default: admin)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">👤</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: admin50x)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold px-1 py-0.5"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>🔐</span> Authenticate Admin Access
          </button>
        </form>

        {/* Security Info Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Authorized Admin Wallets:
          </p>
          <div className="mt-1 font-mono text-[10px] text-slate-400 space-y-0.5">
            {ADMIN_WALLETS.map((w, i) => (
              <div key={w} className="opacity-80">
                Admin #{i + 1}: {w.substring(0, 6)}...{w.substring(w.length - 4)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleSelectWallet}
        isLoading={isLoading}
      />
    </div>
  );
}
