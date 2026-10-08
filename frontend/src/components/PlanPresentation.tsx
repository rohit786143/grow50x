'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';

interface PlanPresentationProps {
  onConnectWallet?: () => void;
  title?: string;
  subtitle?: string;
}

export default function PlanPresentation({ onConnectWallet, title, subtitle }: PlanPresentationProps) {
  const router = useRouter();
  const { account, mainUserId, isRegistered, openWalletModal } = useWeb3();

  const handleConnectClick = async () => {
    if (account && isRegistered) {
      router.push('/dashboard');
    } else if (account && !isRegistered) {
      router.push('/register');
    } else {
      openWalletModal();
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    if (account && isRegistered) {
      e.preventDefault();
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-2 sm:py-3">
      {/* 🚀 Hero Section */}
      <section className="relative py-2 sm:py-4 lg:py-6 text-center">
        {/* Floating Ambient Gold Backdrop Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-3 sm:space-y-3.5">
          <div className="flex justify-center">
            <div className="relative p-1 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="GROW 50X Official Logo"
                style={{ maxHeight: '60px', maxWidth: '240px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                className="h-12 sm:h-14 lg:h-16 w-auto hover:scale-105 transition-transform drop-shadow-sm"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100/90 text-amber-950 text-[11px] sm:text-xs font-black uppercase tracking-wider border border-amber-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            {title || 'BNB Smart Chain (BEP-20 USDT) Protocol'}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            GROW{' '}
            <span className="relative inline-block px-1.5">
              <span className="gold-50x-shimmer font-black">50X</span>
              <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full shadow-[0_0_10px_#f59e0b] overflow-hidden">
                <span className="absolute inset-0 bg-white/90 animate-pulse" />
              </span>
            </span>{' '}
            PROTOCOL
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            {subtitle || 'Welcome to GROW 50X! Connect your Web3 wallet and register your Main ID to unlock your personalized live telemetry dashboard, board matrix tracking, and 10-day share pool rewards.'}
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={handleConnectClick}
              className="btn-primary-gold px-6 sm:px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>⚡</span> {isRegistered ? 'Enter My Dashboard' : account ? 'Complete Registration' : 'Connect Wallet to Register'}
            </button>

            <Link
              href={isRegistered ? '/dashboard' : '/register'}
              onClick={handleRegisterClick}
              className="btn-primary-emerald px-6 sm:px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>🚀</span> {isRegistered ? `Main ID: GR${mainUserId.toString().padStart(5, '0')} (Active)` : 'Register Main ID (100 USDT)'}
            </Link>
          </div>
        </div>
      </section>

      {/* 💰 100 USDT Entry Allocation Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Transparent Economics</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">100 USDT Smart Contract Allocation</h2>
          <p className="text-xs text-slate-600 font-medium mt-1">Every 100 USDT registration fee is programmatically split with 100% transparency on-chain.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Direct Sponsor */}
          <div className="glass-card-gold-circuit p-6 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/80 border-solid border-l-[6px] border-l-[#0284c7] transition-all">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">DIRECT SPONSOR</span>
            <p className="text-4xl font-black text-[#0284c7] mt-2">40% <span className="text-xs font-semibold text-slate-400">($40)</span></p>
            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">Instant direct sponsor income deposited directly to referrer.</p>
          </div>

          {/* Card 2: 10-Day Share Pool */}
          <div className="glass-card-gold-circuit p-6 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/80 border-solid border-l-[6px] border-l-[#10b981] transition-all">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">10-DAY SHARE POOL</span>
            <p className="text-4xl font-black text-[#10b981] mt-2">30% <span className="text-xs font-semibold text-slate-400">($30)</span></p>
            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">Periodic pool auto-distributed on 9th, 19th, and 29th of every month.</p>
          </div>

          {/* Card 3: Reserve Bucket */}
          <div className="glass-card-gold-circuit p-6 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/80 border-solid border-l-[6px] border-l-[#6366f1] transition-all">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RESERVE BUCKET</span>
            <p className="text-4xl font-black text-[#6366f1] mt-2">15% <span className="text-xs font-semibold text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">Funds board completion rewards and level bonus reserves.</p>
          </div>

          {/* Card 4: Admin Operations */}
          <div className="glass-card-gold-circuit p-6 rounded-2xl shadow-md hover:shadow-lg border border-slate-200/80 border-solid border-l-[6px] border-l-[#a855f7] transition-all">
            <span className="text-xs font-bold text-[#a855f7] uppercase tracking-wider">ADMIN OPERATIONS</span>
            <p className="text-4xl font-black text-[#a855f7] mt-2">15% <span className="text-xs font-semibold text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">Split evenly between 3 Admin Wallets (5% each) for protocol ops.</p>
          </div>
        </div>
      </section>

      {/* 📊 5-Board Matrix & Lifetime Share Caps Table */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Growth Ladder</span>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">5-Board Matrix & Cumulative Caps</h2>
          </div>
          <span className="text-xs font-extrabold text-amber-900 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-300/90 w-fit shadow-sm">
            Dual-Tree Placement Algorithm
          </span>
        </div>

        <div className="glass-card-gold-circuit rounded-2xl overflow-hidden border border-amber-200/90 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 min-w-[640px]">
              <thead className="bg-amber-50/90 text-xs font-black uppercase text-amber-950 border-b border-amber-200">
                <tr>
                  <th className="p-4">Board Level</th>
                  <th className="p-4">Positions</th>
                  <th className="p-4">Required Directs</th>
                  <th className="p-4">Completion Reward</th>
                  <th className="p-4">Share Multiplier</th>
                  <th className="p-4">Lifetime Share Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-black text-amber-700">Board 1</td>
                  <td className="p-4 font-semibold text-slate-800">7 Positions</td>
                  <td className="p-4 font-bold text-slate-900">
                    2 Directs
                    <div className="text-xs font-normal text-slate-500 mt-0.5">(B1 TO B2)</div>
                  </td>
                  <td className="p-4 text-emerald-600 font-extrabold">$40 USDT</td>
                  <td className="p-4 font-bold text-amber-800">1 Share</td>
                  <td className="p-4 font-black text-slate-900">$200 USDT</td>
                </tr>
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-black text-amber-700">Board 2</td>
                  <td className="p-4 font-semibold text-slate-800">7 Positions</td>
                  <td className="p-4 font-bold text-slate-900">
                    3 Directs
                    <div className="text-xs font-normal text-slate-500 mt-0.5">(B2 TO B3)</div>
                  </td>
                  <td className="p-4 text-emerald-600 font-extrabold">$80 USDT</td>
                  <td className="p-4 font-bold text-amber-800">2 Shares</td>
                  <td className="p-4 font-black text-slate-900">$400 USDT</td>
                </tr>
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-black text-amber-700">Board 3</td>
                  <td className="p-4 font-semibold text-slate-800">7 Positions</td>
                  <td className="p-4 font-bold text-slate-900">
                    4 Directs
                    <div className="text-xs font-normal text-slate-500 mt-0.5">(B3 TO B4)</div>
                  </td>
                  <td className="p-4 text-emerald-600 font-extrabold">$160 USDT</td>
                  <td className="p-4 font-bold text-amber-800">5 Shares</td>
                  <td className="p-4 font-black text-slate-900">$1,000 USDT</td>
                </tr>
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-black text-amber-700">Board 4</td>
                  <td className="p-4 font-semibold text-slate-800">7 Positions</td>
                  <td className="p-4 font-bold text-slate-900">
                    5 Directs
                    <div className="text-xs font-normal text-slate-500 mt-0.5">(B4 TO B5)</div>
                  </td>
                  <td className="p-4 text-emerald-600 font-extrabold">$320 USDT</td>
                  <td className="p-4 font-bold text-amber-800">10 Shares</td>
                  <td className="p-4 font-black text-slate-900">$2,000 USDT</td>
                </tr>
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-black text-amber-700">Board 5</td>
                  <td className="p-4 font-semibold text-slate-800">7 Positions</td>
                  <td className="p-4 font-bold text-slate-900">
                    6 Directs
                    <div className="text-xs font-normal text-slate-500 mt-0.5">(Cycle Exit)</div>
                  </td>
                  <td className="p-4 text-emerald-600 font-extrabold">$640 USDT</td>
                  <td className="p-4 font-bold text-amber-800">25 Shares</td>
                  <td className="p-4 font-black text-slate-900">$5,000 USDT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 🛡️ Security & Architecture Card */}
      <section className="glass-card-gold-circuit p-8 rounded-3xl border border-amber-300 shadow-lg border-l-[5px] border-l-amber-500 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl relative z-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">100% Non-Custodial Architecture</span>
          <h3 className="text-2xl font-black text-slate-900">Decentralized Smart Contract Execution</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            All user payouts, level rewards, and share pool distributions are handled automatically by immutable smart contracts on BNB Smart Chain. No admin central pool ownership or arbitrary fund withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            onClick={handleConnectClick}
            className="btn-primary-gold px-6 py-3 rounded-xl font-bold text-sm shadow-md"
          >
            {isRegistered ? 'Enter My Dashboard' : 'Connect Wallet'}
          </button>
        </div>
      </section>
    </div>
  );
}
