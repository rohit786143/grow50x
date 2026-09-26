'use client';

import React, { useState } from 'react';

export default function DashboardPage() {
  const [sponsorInput, setSponsorInput] = useState('1');
  const [manualPlacementInput, setManualPlacementInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for preview state before web3 provider hydration
  const mockUser = {
    registered: true,
    mainUserId: 'GR00001',
    numericId: 1,
    wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    currentBoard: 3,
    directCount: 4,
    requiredDirects: 4,
    lifetimeShareEarned: 420,
    currentBoardCap: 1000,
    directIncome: 160,
    shareIncome: 420,
    levelIncome: 45,
    boardRewards: 120,
    totalOwnedIds: 5,
  };

  const remainingShareCap = mockUser.currentBoardCap - mockUser.lifetimeShareEarned;
  const shareCapPercentage = Math.min(100, (mockUser.lifetimeShareEarned / mockUser.currentBoardCap) * 100);

  const handleRegisterMainUser = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Transaction Submitted! Waiting for BNB Smart Chain confirmation...');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Account Overview</span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">Main ID: <span className="gradient-text">{mockUser.mainUserId}</span></h1>
          <p className="text-xs font-mono text-slate-400 mt-1">{mockUser.wallet}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Owned IDs</span>
            <p className="text-xl font-black text-cyan-400">{mockUser.totalOwnedIds}</p>
          </div>
          <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Board</span>
            <p className="text-xl font-black text-emerald-400">Board {mockUser.currentBoard}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Direct Qualification Progress */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Direct Qualification</span>
            <span className="text-xs font-bold text-cyan-400">{mockUser.directCount} / {mockUser.requiredDirects} Directs</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (mockUser.directCount / mockUser.requiredDirects) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {mockUser.directCount >= mockUser.requiredDirects
              ? '✓ Fully qualified for Board 4 advancement'
              : `Requires ${mockUser.requiredDirects - mockUser.directCount} more direct sponsors to qualify for next board.`}
          </p>
        </div>

        {/* Lifetime Share Income Cap Progress */}
        <div className="glass-card p-6 rounded-3xl space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Share Income vs Board Cap</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                ${mockUser.lifetimeShareEarned} USDT Earned / ${mockUser.currentBoardCap} USDT Max (Board {mockUser.currentBoard})
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
              Remaining: ${remainingShareCap} USDT
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${shareCapPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Note: Cumulative share income cap DOES NOT reset when advancing boards. Previous earnings count toward higher board maximums.
          </p>
        </div>
      </div>

      {/* Income Category Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200">Income Accounting Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Direct Sponsor Income</span>
            <p className="text-2xl font-black text-cyan-400 mt-2">${mockUser.directIncome}.00 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">10-Day Share Pool</span>
            <p className="text-2xl font-black text-emerald-400 mt-2">${mockUser.shareIncome}.00 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Sub-ID Level Income</span>
            <p className="text-2xl font-black text-indigo-400 mt-2">${mockUser.levelIncome}.00 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Board Completion Rewards</span>
            <p className="text-2xl font-black text-purple-400 mt-2">${mockUser.boardRewards}.00 <span className="text-xs font-normal text-slate-400">USDT</span></p>
          </div>
        </div>
      </div>

      {/* Registration Form for New Main ID */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 max-w-xl">
        <h2 className="text-lg font-bold text-slate-100">Register New Main ID</h2>
        <p className="text-xs text-slate-400">
          Entry Fee: <strong className="text-cyan-400 font-semibold">100 USDT</strong>. Requires approving USDT transfer to smart contract.
        </p>

        <form onSubmit={handleRegisterMainUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sponsor ID (Numeric or GR Format)</label>
            <input
              type="text"
              value={sponsorInput}
              onChange={(e) => setSponsorInput(e.target.value)}
              placeholder="e.g. 1 or GR00001"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Manual Placement ID (Optional - Leave blank for Auto Placement)</label>
            <input
              type="text"
              value={manualPlacementInput}
              onChange={(e) => setManualPlacementInput(e.target.value)}
              placeholder="Leave blank for protocol auto-placement"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-btn py-3 rounded-xl font-bold text-slate-950 text-sm shadow-md transition-transform"
          >
            {isSubmitting ? 'Processing Transaction...' : 'Register Main ID (100 USDT)'}
          </button>
        </form>
      </div>
    </div>
  );
}
