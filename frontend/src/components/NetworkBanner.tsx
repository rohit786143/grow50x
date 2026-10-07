'use client';

import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ensureBscChain } from '../config/contracts';

export default function NetworkBanner() {
  const { account, chainId } = useWeb3();
  const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 56;

  // Show banner only if wallet is connected and on the wrong chain
  if (!account || !chainId || chainId === targetChainId) {
    return null;
  }

  const switchNetwork = async () => {
    await ensureBscChain();
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-3 shadow-md border-b border-amber-600/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
          <span>⚠️ <strong>Wrong Network Detected!</strong> You are connected to Chain ID <code className="bg-amber-700/50 px-1.5 py-0.5 rounded font-mono">{chainId}</code>. Please switch to BNB Smart Chain (Chain ID: {targetChainId}).</span>
        </div>
        <button
          onClick={switchNetwork}
          className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
        >
          🔄 Switch to BSC Network
        </button>
      </div>
    </div>
  );
}

