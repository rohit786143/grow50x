import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Banner Section */}
      <section className="text-center py-12 px-6 relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="GROW 50X Official Logo"
            className="h-24 w-auto object-contain drop-shadow-md"
          />
        </div>

        <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-widest border border-sky-200 mb-4">
          BNB Smart Chain (BEP-20 USDT) Protocol
        </span>
        
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-6 text-slate-900">
          GROW <span className="gradient-text-blue">50X</span> PROTOCOL
        </h1>

        <p className="max-w-2xl mx-auto text-slate-600 text-base lg:text-lg mb-8 leading-relaxed">
          A fully autonomous, decentralized smart contract ecosystem powered by dual-tree placement algorithms, 10-day share pool distributions, and automated reserve management.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="btn-primary-emerald px-8 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
          >
            🚀 Register Main ID
          </Link>

          <Link
            href="/dashboard"
            className="btn-primary-blue px-8 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform"
          >
            📊 Launch Dashboard
          </Link>
        </div>
      </section>

      {/* Allocation Breakdown Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">100 USDT Entry Allocation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <span className="text-xs font-semibold text-slate-500 uppercase">Direct Sponsor</span>
            <p className="text-3xl font-extrabold text-sky-600 mt-1">40% <span className="text-sm font-normal text-slate-400">($40)</span></p>
            <p className="text-xs text-slate-500 mt-2">Instant direct income on Sponsor Tree</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <span className="text-xs font-semibold text-slate-500 uppercase">Share Pool</span>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">30% <span className="text-sm font-normal text-slate-400">($30)</span></p>
            <p className="text-xs text-slate-500 mt-2">10-day periodic distribution pool</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
            <span className="text-xs font-semibold text-slate-500 uppercase">Reserve Fund</span>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1">15% <span className="text-sm font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-500 mt-2">Board rewards & level income reserve</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
            <span className="text-xs font-semibold text-slate-500 uppercase">Admin Operations</span>
            <p className="text-3xl font-extrabold text-purple-600 mt-1">15% <span className="text-sm font-normal text-slate-400">($15)</span></p>
            <p className="text-xs text-slate-500 mt-2">3 Admin Wallets (5% each)</p>
          </div>
        </div>
      </section>

      {/* 5 Board Matrix & Cumulative Caps Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">5-Board Matrix & Cumulative Caps</h2>
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
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
                <td className="p-4 font-bold text-sky-600">Board 1</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4 font-semibold text-slate-700">2 Directs</td>
                <td className="p-4 text-emerald-600 font-bold">$40 USDT</td>
                <td className="p-4">1 Share</td>
                <td className="p-4 font-bold text-slate-900">$200 USDT</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-sky-600">Board 2</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4 font-semibold text-slate-700">3 Directs</td>
                <td className="p-4 text-emerald-600 font-bold">$80 USDT</td>
                <td className="p-4">2 Shares</td>
                <td className="p-4 font-bold text-slate-900">$400 USDT</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-sky-600">Board 3</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4 font-semibold text-slate-700">4 Directs</td>
                <td className="p-4 text-emerald-600 font-bold">$160 USDT</td>
                <td className="p-4">5 Shares</td>
                <td className="p-4 font-bold text-slate-900">$1,000 USDT</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-sky-600">Board 4</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4 font-semibold text-slate-700">5 Directs</td>
                <td className="p-4 text-emerald-600 font-bold">$320 USDT</td>
                <td className="p-4">10 Shares</td>
                <td className="p-4 font-bold text-slate-900">$2,000 USDT</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-sky-600">Board 5</td>
                <td className="p-4">7 Positions</td>
                <td className="p-4 font-semibold text-slate-700">5 Directs</td>
                <td className="p-4 text-emerald-600 font-bold">$640 USDT</td>
                <td className="p-4">25 Shares</td>
                <td className="p-4 font-bold text-slate-900">$5,000 USDT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Protocol Transparency Disclaimer */}
      <section className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-1">
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Protocol Transparency & Risk Disclosure</h3>
        <p className="text-xs text-amber-900/80 leading-relaxed">
          GROW 50X is an autonomous smart contract system on BNB Smart Chain. All allocations, board movements, and distributions are determined strictly by immutable smart contract logic. No fixed or guaranteed return is promised or implied. Protocol liabilities are bounded strictly by actual received USDT reserve balances.
        </p>
      </section>
    </div>
  );
}
