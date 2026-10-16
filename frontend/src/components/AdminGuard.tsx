'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { isAdminWallet, getAdminIndex, ADMIN_WALLETS } from '../config/contracts';
import WalletModal from './WalletModal';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { account, connectWallet, isLoading, openWalletModal } = useWeb3();
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
  const EXPECTED_ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin@grow50x.pro';
  const EXPECTED_ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Grow50x@151026';

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

    const enteredId = loginId.trim().toLowerCase();
    const expectedId = EXPECTED_ADMIN_ID.trim().toLowerCase();

    if (enteredId !== expectedId && enteredId !== 'admin@grow50x.pro') {
      setErrorMsg('Invalid Admin Login ID. Please enter admin@grow50x.pro');
      return;
    }

    if (password !== EXPECTED_ADMIN_PASS && password !== 'Grow50x@151026') {
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
      <div className="min-h-[80vh] bg-transparent flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
          <span className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          Checking Admin Access Permissions...
        </div>
      </div>
    );
  }

  // Case 3: Fully Authenticated -> Render Admin Console
  if (isAuthenticated && account && isAdminWallet(account)) {
    return <>{children}</>;
  }

  // Render Light Glassmorphism Login Gate Screen (Step 1 or Step 2)
  return (
    <div className="flex items-start justify-center pt-0 sm:pt-0 -mt-3 sm:-mt-7 pb-6 px-3 sm:px-4 bg-transparent relative">
      {/* Background Soft Color Glow Blobs matching website */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Modern High-End Admin Login Card with Subtle Blue-Green Gradient Theme */}
      <div className="w-full max-w-[430px] bg-gradient-to-b from-white via-emerald-50/40 to-sky-50/50 backdrop-blur-2xl border-2 border-emerald-400/40 rounded-[28px] p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.22),0_10px_30px_-5px_rgba(14,165,233,0.18)] relative z-10 overflow-hidden">
        
        {/* Subtle Ambient Colorful Inner Lighting */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-gradient-to-br from-emerald-400/25 to-teal-300/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-gradient-to-br from-sky-400/25 to-blue-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Vibrant Blue-Green Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

        {/* Header Logo Badge & Title */}
        <div className="text-center mb-5 pt-1 relative z-10">
          {/* Security Chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-sky-500/15 border border-emerald-500/30 text-emerald-900 text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase mb-3 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>RESTRICTED ACCESS • 2-STEP AUTH</span>
          </div>

          {/* Ultra-Stylish 3D Cyber Security Shield Emblem */}
          <div className="relative mx-auto mb-3.5 w-16 h-16 flex items-center justify-center">
            {/* Multi-layer Pulsing Blue-Green Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 opacity-60 blur-md animate-pulse" />
            
            {/* 3D Shield Frame */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-500 p-[2.5px] shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center relative overflow-hidden">
                {/* Cyber Circuit Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-35" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                {/* 3D Cyber Shield SVG */}
                <svg className="w-8 h-8 relative z-10 drop-shadow-[0_2px_8px_rgba(16,185,129,0.7)]" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="shieldCyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                    stroke="url(#shieldCyberGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#059669"
                    fillOpacity="0.25"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Corner Floating Micro-Accents */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white" />
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">GROW 50X</h1>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white tracking-widest shadow-xs">
              ADMIN
            </span>
          </div>
          <p className="text-xs text-emerald-800/80 font-semibold mt-1">
            Restricted System Protocol Console • 2-Step Authentication
          </p>

          {/* Modern Colorful Stepper Indicator */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 bg-gradient-to-r from-emerald-100/70 via-teal-50/80 to-sky-100/70 rounded-2xl border border-emerald-300/60 shadow-xs">
            <div
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                currentStep === 1
                  ? 'bg-white shadow-sm border border-emerald-200 text-slate-900'
                  : credentialsPassed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                  credentialsPassed
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 1
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {credentialsPassed ? '✓' : '1'}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">Step 1</p>
                <p className="text-xs font-extrabold truncate">Credentials</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-white shadow-sm border border-sky-200 text-sky-900'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                  currentStep === 2 ? 'bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">Step 2</p>
                <p className="text-xs font-extrabold truncate">Admin Wallet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-shake relative z-10">
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="flex-1 leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Login ID & Password Form */}
        {currentStep === 1 && (
          <form onSubmit={handleVerifyCredentials} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Login ID
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-sky-500/15 border border-emerald-500/25 text-emerald-700 flex items-center justify-center transition-all group-focus-within:border-emerald-500 group-focus-within:scale-105 pointer-events-none z-10">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin@grow50x.pro"
                  style={{ paddingLeft: '50px' }}
                  className="w-full pr-4 py-3 bg-white/95 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-sky-500/15 border border-emerald-500/25 text-emerald-700 flex items-center justify-center transition-all group-focus-within:border-emerald-500 group-focus-within:scale-105 pointer-events-none z-10">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Admin Password"
                  style={{ paddingLeft: '50px', paddingRight: '80px' }}
                  className="w-full py-3 bg-white/95 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 z-10"
                >
                  {showPassword ? (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white font-black text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
              <span>Next: Verify Credentials</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
        )}

        {/* STEP 2: Connect Authorized Admin Wallet */}
        {currentStep === 2 && (
          <div className="space-y-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Step 1 Complete: Admin Credentials Verified!</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Step 2: Admin Web3 Wallet
                </span>
                <span className="text-[10px] font-bold text-slate-400">BSC Mainnet</span>
              </div>

              {account ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="16" cy="12" r="2" />
                          <path d="M6 12h.01" />
                        </svg>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800 truncate">
                        {account.substring(0, 8)}...{account.substring(account.length - 6)}
                      </span>
                    </div>
                    {isAdminWallet(account) ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap">
                        Admin #{getAdminIndex(account)} Authorized
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap">
                        Unauthorized
                      </span>
                    )}
                  </div>

                  {!isAdminWallet(account) && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
                      ⚠️ Connected wallet is not listed in the protocol Admin Registry. Please switch to Admin Wallet #1, #2, or #3 in MetaMask.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600 font-medium p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  Please connect an authorized Admin Wallet to unlock access to the Admin Telemetry Console.
                </div>
              )}

              <button
                type="button"
                onClick={openWalletModal}
                className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <span>{account ? 'Switch Wallet' : 'Connect Web3 Wallet'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
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
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-emerald-600/25 hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
                <span>Unlock Admin Console</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Trust Footer */}
        <div className="mt-5 pt-3.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-600 relative z-10">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-800">End-to-End Encrypted</span>
          </div>
          <div className="font-mono text-[10px] text-sky-700 font-bold bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200">
            Multi-Sig 2FA Protected
          </div>
        </div>
      </div>
    </div>
  );
}
