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
  const { account, mainUserId, isRegistered, connectWallet } = useWeb3();

  const handleConnectClick = async () => {
    if (account && isRegistered) {
      router.push('/dashboard');
    } else if (account && !isRegistered) {
      router.push('/register');
    } else {
      const btn = document.getElementById('connect-wallet-btn');
      if (btn) {
        btn.click();
      } else {
        const res = await connectWallet();
        if (res && res.success) {
          if (res.isRegistered) {
            router.push('/dashboard');
          } else {
            router.push('/register');
          }
        }
      }
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    if (account && isRegistered) {
      e.preventDefault();
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* 🚀 Hero Section with Floating Crypto Coins */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-sky-50/50 to-slate-50 border border-slate-200 shadow-xl p-5 sm:p-8 lg:p-14 text-center">
        {/* Floating Glowing Backdrop Blur Orbs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

        {/* Floating Crypto Coin Badges */}
        <div className="absolute top-8 left-8 lg:left-16 animate-float-slow hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-lg font-bold text-xs text-emerald-600">
          <span className="text-xl">💵</span> USDT BEP-20
        </div>

        <div className="absolute top-12 right-8 lg:right-16 animate-float-fast hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-lg font-bold text-xs text-amber-600">
          <span className="text-xl">🟡</span> BNB Smart Chain
        </div>

        <div className="absolute bottom-12 left-12 animate-float-fast hidden lg:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-lg font-bold text-xs text-sky-600">
          <span className="text-xl">💎</span> 50X Share Multipliers
        </div>

        <div className="absolute bottom-16 right-12 animate-float-slow hidden lg:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-lg font-bold text-xs text-purple-600">
          <span className="text-xl">⚡</span> 10-Day Share Pool
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="relative p-2 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="GROW 50X Official Logo"
                style={{ maxHeight: '80px', maxWidth: '320px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                className="h-16 sm:h-20 lg:h-24 w-auto hover:scale-105 transition-transform"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-sky-100/80 text-sky-800 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            {title || 'BNB Smart Chain (BEP-20 USDT) Protocol'}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            GROW <span className="gradient-text-blue">50X</span> PROTOCOL
          </h1>

          <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed font-medium">
            {subtitle || 'Welcome to GROW 50X! Connect your Web3 wallet and register your Main ID to unlock your personalized live telemetry dashboard, board matrix tracking, and 10-day share pool rewards.'}
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={handleConnectClick}
              className="btn-primary-blue w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-sky-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>⚡</span> {isRegistered ? 'Enter My Dashboard' : account ? 'Complete Registration' : 'Connect Wallet to Register'}
            </button>

            <Link
              href={isRegistered ? '/dashboard' : '/register'}
              onClick={handleRegisterClick}
              className="btn-primary-emerald w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>🚀</span> {isRegistered ? `Main ID: GR${mainUserId.toString().padStart(5, '0')} (Active)` : 'Register Main ID (100 USDT)'}
            </Link>
          </div>
        </div>
      </section>

      {/* 💰 100 USDT Entry Allocation Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-extrabold text-sky-600 uppercase tracking-widest">Transparent Economics</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">100 USDT Smart Contract Allocation</h2>
          <p className="text-xs text-slate-500 mt-1">Every 100 USDT registration fee is programmatically split with 100% transparency.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase">Direct Sponsor</span>
            <p className="text-4xl font-black text-sky-600 mt-2">40% <span className="text-xs font-normal text-slate-400">($40)</span></p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Instant direct sponsor income deposited directly to referrer.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase">10-Day Share Pool</span>
            <p className="text-4xl font-black text-emerald-600 mt-2">30% <span className="text-xs font-normal text-slate-400">($30)</span></p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Periodic pool auto-distributed on 7th, 17th, and 27th of every month.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase">Reserve Bucket</span>
            <p className="text-4xl font-black text-indigo-600 mt-2">15% <span className="text-xs font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Funds board completion rewards and level bonus reserves.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase">Admin Operations</span>
            <p className="text-4xl font-black text-purple-600 mt-2">15% <span className="text-xs font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Split evenly between 3 Admin Wallets (5% each) for protocol ops.</p>
          </div>
        </div>
      </section>

      {/* 📊 5-Board Matrix & Lifetime Share Caps Table */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Growth Ladder</span>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">5-Board Matrix & Cumulative Caps</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 w-fit">
            Dual-Tree Placement Algorithm
          </span>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[640px]">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4">Board Level</th>
                  <th className="p-4">Positions</th>
                  <th className="p-4">Required Directs</th>
                  <th className="p-4">Completion Reward</th>
                  <th className="p-4">Share Multiplier</th>
                  <th className="p-4">Lifetime Share Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-sky-600">Board 1</td>
                  <td className="p-4 font-medium">7 Positions</td>
                  <td className="p-4 font-bold text-slate-800">2 Directs</td>
                  <td className="p-4 text-emerald-600 font-extrabold">$40 USDT</td>
                  <td className="p-4 font-semibold text-slate-700">1 Share</td>
                  <td className="p-4 font-black text-slate-900">$200 USDT</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-sky-600">Board 2</td>
                  <td className="p-4 font-medium">7 Positions</td>
                  <td className="p-4 font-bold text-slate-800">3 Directs</td>
                  <td className="p-4 text-emerald-600 font-extrabold">$80 USDT</td>
                  <td className="p-4 font-semibold text-slate-700">2 Shares</td>
                  <td className="p-4 font-black text-slate-900">$400 USDT</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-sky-600">Board 3</td>
                  <td className="p-4 font-medium">7 Positions</td>
                  <td className="p-4 font-bold text-slate-800">4 Directs</td>
                  <td className="p-4 text-emerald-600 font-extrabold">$160 USDT</td>
                  <td className="p-4 font-semibold text-slate-700">5 Shares</td>
                  <td className="p-4 font-black text-slate-900">$1,000 USDT</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-sky-600">Board 4</td>
                  <td className="p-4 font-medium">7 Positions</td>
                  <td className="p-4 font-bold text-slate-800">5 Directs</td>
                  <td className="p-4 text-emerald-600 font-extrabold">$320 USDT</td>
                  <td className="p-4 font-semibold text-slate-700">10 Shares</td>
                  <td className="p-4 font-black text-slate-900">$2,000 USDT</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-sky-600">Board 5</td>
                  <td className="p-4 font-medium">7 Positions</td>
                  <td className="p-4 font-bold text-slate-800">5 Directs</td>
                  <td className="p-4 text-emerald-600 font-extrabold">$640 USDT</td>
                  <td className="p-4 font-semibold text-slate-700">25 Shares</td>
                  <td className="p-4 font-black text-slate-900">$5,000 USDT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 🛡️ Protocol Security & Architecture Card */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">100% Non-Custodial Architecture</span>
          <h3 className="text-2xl font-black">Decentralized Smart Contract Execution</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All user payouts, level rewards, and share pool distributions are handled automatically by immutable smart contracts on BNB Smart Chain. No admin central pool ownership or arbitrary fund withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleConnectClick}
            className="btn-primary-emerald px-6 py-3 rounded-xl font-bold text-sm shadow-md"
          >
            {isRegistered ? 'Enter My Dashboard' : 'Connect Wallet'}
          </button>
        </div>
      </section>
    </div>
  );
}
