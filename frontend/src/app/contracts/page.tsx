'use client';

import React from 'react';
import { CONTRACT_ADDRESSES, BSC_MAINNET_CHAIN_ID, BSC_EXPLORER_URL } from '../../config/contracts';

export default function ContractsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Protocol Verification</span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Smart Contract Deployment Details</h1>
        <p className="text-sm text-slate-600 mt-1">
          Verified on BNB Smart Chain Mainnet (Chain ID {BSC_MAINNET_CHAIN_ID}). All user interactions execute directly against these contract addresses.
        </p>
      </div>

      <div className="space-y-4">
        {/* Core Contract Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Grow50XCore (Protocol Contract)</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Handles identity registry, dual trees, 5 boards, share pool accumulator, reserve funding, and Sub-ID batch creation.
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-sky-700 break-all">
            {CONTRACT_ADDRESSES.GROW50X_CORE}
          </div>
          <a
            href={`${BSC_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.GROW50X_CORE}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-bold text-sky-600 hover:underline"
          >
            View on BscScan Explorer →
          </a>
        </div>

        {/* USDT Token Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Tether USD (BEP-20 USDT)</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">
              Official BEP-20
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Official Tether USD (USDT) token on BNB Smart Chain Mainnet used for protocol registrations and rewards.
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-emerald-700 break-all">
            {CONTRACT_ADDRESSES.USDT}
          </div>
          <a
            href={`${BSC_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.USDT}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-bold text-teal-600 hover:underline"
          >
            View on BscScan Explorer →
          </a>
        </div>
      </div>
    </div>
  );
}
