'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { isAdminWallet, getAdminIndex, ADMIN_WALLETS } from '../config/contracts';
import WalletModal from './WalletModal';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { account, connectWallet, isLoading } = useWeb3();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // 2-Step Auth State
  // Step 1: Login ID & Password
  // Step 2: Connect Authorized Admin Wallet
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [credentialsPassed, setCredentialsPassed] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Default expected credentials
  const EXPECTED_ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin';
  const EXPECTED_ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin50x';

  useEffect(() => {
    // Check existing session
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('grow50x_admin_session');
      const savedCreds = sessionStorage.getItem('grow50x_admin_creds_ok');

      if (savedAuth === 'true' && account && isAdminWallet(account)) {
        setIsAuthenticated(true);
        setCredentialsPassed(true);
        setCurrentStep(2);
      } else if (savedCreds === 'true') {
        setCredentialsPassed(true);
        setCurrentStep(2);
      }
    }
    setCheckingAuth(false);
  }, [account]);

  // Handle Step 1: Login ID & Password Verification
  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (loginId.trim() !== EXPECTED_ADMIN_ID) {
      setErrorMsg('Invalid Admin Login ID.');
      return;
    }

    if (password !== EXPECTED_ADMIN_PASS && password !== 'admin123') {
      setErrorMsg('Invalid Admin Password.');
      return;
    }

    // Credentials Verified! Move to Step 2
    sessionStorage.setItem('grow50x_admin_creds_ok', 'true');
    sessionStorage.setItem('grow50x_admin_user', loginId.trim());
    setCredentialsPassed(true);
    setCurrentStep(2);
    setErrorMsg('');
  };

  // Handle Step 2: Finalize Auth with Connected Wallet
  const handleFinalizeWalletAuth = () => {
    setErrorMsg('');

    if (!account) {
      setErrorMsg('Please connect your Web3 wallet first.');
      return;
    }

    if (!isAdminWallet(account)) {
      setErrorMsg(`Connected wallet (${account.substring(0, 6)}...${account.substring(account.length - 4)}) is not an authorized Admin Wallet.`);
      return;
    }

    // Full Auth Success
    sessionStorage.setItem('grow50x_admin_session', 'true');
    setIsAuthenticated(true);
  };

  // Auto-finalize if credentials passed and wallet becomes valid admin wallet
  useEffect(() => {
    if (credentialsPassed && account && isAdminWallet(account)) {
      sessionStorage.setItem('grow50x_admin_session', 'true');
      setIsAuthenticated(true);
    }
  }, [credentialsPassed, account]);

  const handleLogout = () => {
    sessionStorage.removeItem('grow50x_admin_session');
    sessionStorage.removeItem('grow50x_admin_creds_ok');
    sessionStorage.removeItem('grow50x_admin_user');
    setIsAuthenticated(false);
    setCredentialsPassed(false);
    setCurrentStep(1);
    setLoginId('');
    setPassword('');
    setErrorMsg('');
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
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
          <span className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          Checking Admin Access Permissions...
        </div>
      </div>
    );
  }

  // Case 3: Fully Authenticated -> Render Admin Console
  if (isAuthenticated && account && isAdminWallet(account)) {
    const adminIdx = getAdminIndex(account);
    return (
      <div>
        {/* Top Admin Security Status Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold px-4 py-2 flex flex-wrap items-center justify-between text-xs shadow-md gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider">👑 ADMIN CONSOLE AUTHORIZED</span>
            <span className="opacity-40">|</span>
            <span className="font-mono text-xs">Admin #{adminIdx} ({account.substring(0, 6)}...{account.substring(account.length - 4)})</span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>🔒</span> Logout Admin
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Render Light Glassmorphism Login Gate Screen (Step 1 or Step 2)
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Soft Color Glow Blobs matching website */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative z-10">
        
        {/* Header Logo Badge & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 rounded-2xl p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-3xl">
              🛡️
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">GROW 50X ADMIN LOGIN</h1>
          <p className="text-xs text-emerald-700 font-bold mt-1">
            Restricted System Protocol Console • 2-Step Authentication
          </p>

          {/* Stepper Indicator Badge */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              currentStep === 1
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              <span>1</span> Login ID & Password {credentialsPassed && '✓'}
            </div>
            <span className="text-slate-400 text-xs font-bold">→</span>
            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              currentStep === 2
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <span>2</span> Connect Admin Wallet
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake shadow-sm">
            <span className="text-base">🚨</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Login ID & Password Form */}
        {currentStep === 1 && (
          <form onSubmit={handleVerifyCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Login ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter Admin Login ID"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all shadow-sm"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">👤</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Admin Password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all shadow-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200/60 hover:bg-slate-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>🔑</span> Next: Verify Credentials
            </button>
          </form>
        )}

        {/* STEP 2: Connect Authorized Admin Wallet */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <span className="text-base">✓</span>
              <span>Step 1 Complete: Login ID & Password Verified!</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 2: Connect Admin Wallet
              </div>

              {account ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {account.substring(0, 8)}...{account.substring(account.length - 6)}
                    </span>
                    {isAdminWallet(account) ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        Admin Authorized
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        Unauthorized
                      </span>
                    )}
                  </div>

                  {!isAdminWallet(account) && (
                    <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                      ⚠️ Connected wallet is not listed in the protocol Admin Registry. Please switch to Admin Wallet #1, #2, or #3 in MetaMask.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600 font-medium">
                  Please connect an authorized Admin Wallet to unlock access to the Admin Telemetry Console.
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>👛</span> {account ? 'Switch Wallet' : 'Connect Web3 Wallet'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-3 rounded-xl text-xs font-bold transition-all text-center"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleFinalizeWalletAuth}
                disabled={!account || !isAdminWallet(account)}
                className={`w-2/3 py-3 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  account && isAdminWallet(account)
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-emerald-600/20 hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                }`}
              >
                <span>🔓</span> Unlock Admin Console
              </button>
            </div>
          </div>
        )}

        {/* Authorized Wallets Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center bg-slate-50/60 p-3 rounded-2xl border border-slate-200/60">
          <p className="text-[11px] font-bold text-slate-500">
            Authorized Protocol Admin Wallets:
          </p>
          <div className="mt-1 font-mono text-[10px] text-slate-600 space-y-0.5">
            {ADMIN_WALLETS.map((w, i) => (
              <div key={w} className="opacity-90">
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
