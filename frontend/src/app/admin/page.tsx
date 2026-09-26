'use client';

import React from 'react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Protocol Telemetry & Invariants</span>
        <h1 className="text-3xl font-black text-slate-100 mt-1">System Health & Financial Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Read-only real-time accounting view. The smart contract contains ZERO privileged functions to modify user balances or alter placement trees.
        </p>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Registered Main IDs</span>
          <p className="text-3xl font-black text-slate-100 mt-2">1,248</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Active Sub-IDs</span>
          <p className="text-3xl font-black text-cyan-400 mt-2">4,890</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total USDT Deposited</span>
          <p className="text-3xl font-black text-emerald-400 mt-2">$613,800</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Completed 5-Board Cycles</span>
          <p className="text-3xl font-black text-indigo-400 mt-2">18</p>
        </div>
      </div>

      {/* Contract Reserve & Accounting Buckets */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-slate-100">Smart Contract Reserves & Accounting Buckets</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase">Share Pool Balance (30%)</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">$184,140.00 USDT</p>
            <p className="text-[11px] text-slate-500 mt-2">Accumulated for 10-day distribution</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase">Reserve For Board Rewards (10%)</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">$61,380.00 USDT</p>
            <p className="text-[11px] text-slate-500 mt-2">Dedicated for board completion payouts</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase">Reserve For Level Income (5%)</span>
            <p className="text-2xl font-black text-indigo-400 mt-1">$30,690.00 USDT</p>
            <p className="text-[11px] text-slate-500 mt-2">Dedicated for 3%/2%/1% Sub-ID rewards</p>
          </div>
        </div>

        {/* Governance & Security Note */}
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200/90 space-y-1">
          <p className="font-bold uppercase tracking-wide">🔒 Governance Invariant Enforced</p>
          <p>
            Functions like `adminSetUserBalance()`, `adminMoveUser()`, or `adminWithdrawUserFunds()` do NOT exist. Any change to privileged admin addresses requires transparent on-chain governance event logging.
          </p>
        </div>
      </div>
    </div>
  );
}
