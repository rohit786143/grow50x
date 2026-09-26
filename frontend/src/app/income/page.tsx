'use client';

import React from 'react';

export default function IncomePage() {
  const handleClaim = () => {
    alert('Claiming pending Share Pool income... Approving smart contract transaction.');
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Financial Rewards Hub</span>
        <h1 className="text-3xl font-black text-slate-100 mt-1">Income & 10-Day Share Pool</h1>
        <p className="text-sm text-slate-400 mt-1">
          30% of every $100 entry fee is allocated into the 10-day periodic Share Pool.
        </p>
      </div>

      {/* 10-Day Share Pool Card */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Current 10-Day Period #1</span>
            <h2 className="text-2xl font-black text-slate-100 mt-1">Active Share Pool Balance</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Accumulation</span>
            <p className="text-3xl font-black text-emerald-400">$3,450.00 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Total Eligible Shares</span>
            <p className="text-xl font-bold text-slate-100 mt-1">142 Shares</p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Estimated Share Value</span>
            <p className="text-xl font-bold text-cyan-400 mt-1">~$24.29 USDT / Share</p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Your Active Board Shares</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">5 Shares (Board 3)</p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">Pending Claimable</span>
            <p className="text-xl font-bold text-indigo-400 mt-1">$121.45 USDT</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            💡 Distribution is finalized on-chain every 10 days. Claiming is subject to your lifetime board cumulative share cap.
          </p>
          <button
            onClick={handleClaim}
            className="gradient-btn px-6 py-3 rounded-xl font-bold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            Claim Share Income
          </button>
        </div>
      </div>

      {/* Income Streams Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-sm font-bold text-cyan-400 uppercase">Direct Sponsor Income</h3>
          <p className="text-2xl font-black text-slate-100">$40.00 USDT <span className="text-xs font-normal text-slate-400">per qualifying referral</span></p>
          <p className="text-xs text-slate-400">Paid instantly on Sponsor Tree registration. Placement tree does NOT affect direct income.</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-sm font-bold text-indigo-400 uppercase">Sub-ID Level Income</h3>
          <p className="text-2xl font-black text-slate-100">3% / 2% / 1% <span className="text-xs font-normal text-slate-400">from Reserve</span></p>
          <p className="text-xs text-slate-400">Level 1 (3%), Level 2 (2%), Level 3 (1%). Requires 2 direct sponsors for eligibility. Aggregated to Main User.</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <h3 className="text-sm font-bold text-purple-400 uppercase">Board Completion Rewards</h3>
          <p className="text-2xl font-black text-slate-100">$40 to $640 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          <p className="text-xs text-slate-400">Paid upon 7-position board completion out of reserveForBoardRewards. Requires direct qualification.</p>
        </div>
      </div>
    </div>
  );
}
