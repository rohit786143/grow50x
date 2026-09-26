'use client';

import React from 'react';
import { CONTRACT_ADDRESSES, BSC_TESTNET_CHAIN_ID } from '@/config/contracts';

export default function ContractsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Protocol Verification</span>
        <h1 className="text-3xl font-black text-slate-100 mt-1">Smart Contract Deployment Details</h1>
        <p className="text-sm text-slate-400 mt-1">
          Verified on BNB Smart Chain Testnet (Chain ID {BSC_TESTNET_CHAIN_ID}). All user interactions execute directly against these contract addresses.
        </p>
      </div>

      <div className="space-y-4">
        {/* Core Contract Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100">Grow50XCore (Protocol Contract)</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              Verified
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Handles identity registry, dual trees, 5 boards, share pool accumulator, reserve funding, and Sub-ID batch creation.
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all">
            {CONTRACT_ADDRESSES.GROW50X_CORE}
          </div>
          <a
            href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.GROW50X_CORE}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-semibold text-cyan-400 hover:underline"
          >
            View on BscScan Explorer →
          </a>
        </div>

        {/* USDT Mock Token Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100">Mock USDT BEP-20 (Testnet Token)</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              BEP-20
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Mock Tether USD used on BNB Smart Chain Testnet. Includes an on-chain faucet allowing testers to claim testnet USDT.
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 break-all">
            {CONTRACT_ADDRESSES.USDT}
          </div>
          <a
            href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.USDT}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-semibold text-emerald-400 hover:underline"
          >
            View on BscScan Explorer →
          </a>
        </div>
      </div>
    </div>
  );
}
