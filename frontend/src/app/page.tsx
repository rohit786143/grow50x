import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="text-center py-12 px-4 relative overflow-hidden rounded-3xl glass-panel border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-indigo-500/10 blur-3xl -z-10" />
        <span className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-400 text-xs font-semibold uppercase tracking-widest border border-cyan-800/40 mb-4">
          BNB Smart Chain (BEP-20 USDT) Protocol
        </span>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-6">
          GROW <span className="gradient-text">50X</span> PROTOCOL
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-base lg:text-lg mb-8 leading-relaxed">
          A fully autonomous, decentralized smart contract ecosystem powered by dual-tree placement algorithms, 10-day share pool distributions, and automated reserve management.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="gradient-btn px-6 py-3 rounded-xl font-bold text-slate-950 text-sm shadow-lg shadow-cyan-500/20"
          >
            Launch Dashboard
          </Link>
          <Link
            href="/sub-ids"
            className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Create Sub-IDs
          </Link>
        </div>
      </section>

      {/* Allocation Breakdown Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-200">100 USDT Entry Allocation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-cyan-500">
            <span className="text-xs font-semibold text-slate-400 uppercase">Direct Sponsor</span>
            <p className="text-3xl font-extrabold text-cyan-400 mt-1">40% <span className="text-sm font-normal text-slate-400">($40)</span></p>
            <p className="text-xs text-slate-400 mt-2">Instant direct income on Sponsor Tree</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
            <span className="text-xs font-semibold text-slate-400 uppercase">Share Pool</span>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">30% <span className="text-sm font-normal text-slate-400">($30)</span></p>
            <p className="text-xs text-slate-400 mt-2">10-day periodic distribution pool</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-indigo-500">
            <span className="text-xs font-semibold text-slate-400 uppercase">Reserve Fund</span>
            <p className="text-3xl font-extrabold text-indigo-400 mt-1">15% <span className="text-sm font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-400 mt-2">Board rewards & level income reserve</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-purple-500">
            <span className="text-xs font-semibold text-slate-400 uppercase">Admin Operations</span>
            <p className="text-3xl font-extrabold text-purple-400 mt-1">15% <span className="text-sm font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-400 mt-2">3 Admin Wallets (5% each)</p>
          </div>
        </div>
      </section>

      {/* 5 Board Progression Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-200">5-Board Matrix & Cumulative Caps</h2>
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Board Level</th>
                <th className="p-4">Positions</th>
                <th className="p-4">Required Directs</th>
                <th className="p-4">Completion Reward</th>
                <th className="p-4">Share Multiplier</th>
                <th className="p-4">Lifetime Share Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-cyan-400">Board 1</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4">2 Directs</td>
                <td className="p-4 text-emerald-400 font-semibold">$40 USDT</td>
                <td className="p-4">1 Share</td>
                <td className="p-4 font-bold text-slate-200">$200 USDT</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-cyan-400">Board 2</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4">3 Directs</td>
                <td className="p-4 text-emerald-400 font-semibold">$80 USDT</td>
                <td className="p-4">2 Shares</td>
                <td className="p-4 font-bold text-slate-200">$400 USDT</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-cyan-400">Board 3</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4">4 Directs</td>
                <td className="p-4 text-emerald-400 font-semibold">$160 USDT</td>
                <td className="p-4">5 Shares</td>
                <td className="p-4 font-bold text-slate-200">$1,000 USDT</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-cyan-400">Board 4</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4">5 Directs</td>
                <td className="p-4 text-emerald-400 font-semibold">$320 USDT</td>
                <td className="p-4">10 Shares</td>
                <td className="p-4 font-bold text-slate-200">$2,000 USDT</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-cyan-400">Board 5</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4">5 Directs</td>
                <td className="p-4 text-emerald-400 font-semibold">$640 USDT</td>
                <td className="p-4">25 Shares</td>
                <td className="p-4 font-bold text-slate-200">$5,000 USDT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Protocol Risk & Transparent Legal Disclaimer */}
      <section className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-950/10">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide mb-2">Protocol Transparency & Risk Disclosure</h3>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          GROW 50X is an autonomous smart contract system on BNB Smart Chain. All allocations, board movements, and distributions are determined strictly by immutable smart contract logic. No fixed, guaranteed, or risk-free returns are promised or implied. Protocol liabilities are bounded strictly by actual received USDT reserve balances.
        </p>
      </section>
    </div>
  );
}
