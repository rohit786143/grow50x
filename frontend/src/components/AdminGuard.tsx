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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
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
        {/* Top Admin Security Banner */}
        <div className="bg-slate-900 border-b border-amber-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
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

  // Render Login Gate Screen (Step 1 or Step 2)
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[320px] h-[320px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50 relative z-10">
        
        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              🛡️
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">GROW 50X ADMIN LOGIN</h1>
          <p className="text-xs text-amber-400/80 font-semibold mt-1">
            Restricted System Protocol Console • 2-Step Authentication
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              currentStep === 1
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              <span>1</span> Login ID & Password {credentialsPassed && '✓'}
            </div>
            <span className="text-slate-600 text-xs">→</span>
            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              currentStep === 2
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800 text-slate-500'
            }`}>
              <span>2</span> Connect Admin Wallet
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span>🚨</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Login ID & Password Form */}
        {currentStep === 1 && (
          <form onSubmit={handleVerifyCredentials} className="space-y-4">
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
                  placeholder="Enter Admin Login ID"
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
                  placeholder="Enter Admin Password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition-all pr-12"
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
              <span>🔑</span> Next: Verify Credentials
            </button>
          </form>
        )}

        {/* STEP 2: Connect Authorized Admin Wallet */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>Step 1 Complete: Login ID & Password Verified!</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step 2: Connect Admin Wallet
              </div>

              {account ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-mono text-slate-300">
                      {account.substring(0, 8)}...{account.substring(account.length - 6)}
                    </span>
                    {isAdminWallet(account) ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                        Admin Authorized
                      </span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                        Unauthorized
                      </span>
                    )}
                  </div>

                  {!isAdminWallet(account) && (
                    <p className="text-xs text-rose-400 font-medium leading-relaxed">
                      ⚠️ Connected wallet is not listed in the protocol Admin Registry. Please switch to Admin Wallet #1, #2, or #3 in your Web3 Wallet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Please connect an authorized Admin Wallet to unlock access to the Admin Telemetry Console.
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>👛</span> {account ? 'Switch Wallet' : 'Connect Web3 Wallet'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all text-center"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleFinalizeWalletAuth}
                disabled={!account || !isAdminWallet(account)}
                className={`w-2/3 py-3 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  account && isAdminWallet(account)
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/20 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>🔓</span> Unlock Admin Console
              </button>
            </div>
          </div>
        )}

        {/* Authorized Wallets Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Authorized Protocol Admin Wallets:
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
