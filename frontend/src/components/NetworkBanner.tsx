'use client';

import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BSC_TESTNET_CHAIN_ID } from '../config/contracts';

export default function NetworkBanner() {
  const { account, chainId } = useWeb3();

  // Show banner only if wallet is connected and on the wrong chain
  if (!account || !chainId || chainId === BSC_TESTNET_CHAIN_ID || chainId === 56) {
    return null;
  }

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;
    const hexChainId = '0x61'; // 97 in hex for BSC Testnet

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: 'BNB Smart Chain Testnet',
                nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                blockExplorerUrls: ['https://testnet.bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding BSC Testnet network:', addError);
        }
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-3 shadow-md border-b border-amber-600/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
          <span>⚠️ <strong>Wrong Network Detected!</strong> You are connected to Chain ID <code className="bg-amber-700/50 px-1.5 py-0.5 rounded font-mono">{chainId}</code>. Please switch to BNB Smart Chain.</span>
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
