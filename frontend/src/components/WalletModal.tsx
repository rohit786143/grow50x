'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletKey: string) => Promise<void>;
  isLoading?: boolean;
}

export interface WalletItem {
  id: string;
  name: string;
  category?: string;
  tags?: string[];
  installedCheck?: () => boolean;
  icon: React.ReactNode;
}

export default function WalletModal({
  isOpen,
  onClose,
  onSelectWallet,
  isLoading = false,
}: WalletModalProps) {
  const [view, setView] = useState<'main' | 'all' | 'awaiting'>('main');
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset view when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setView('main');
      setSelectedWallet(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Focus search input when navigating to 'all' view
  useEffect(() => {
    if (view === 'all') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (view === 'all' || view === 'awaiting') {
          setView('main');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, view, onClose]);

  // ==================== WALLET DEFINITIONS & ICONS ====================

  const allWalletsList: WalletItem[] = useMemo(() => [
    {
      id: 'metamask',
      name: 'MetaMask',
      category: 'popular',
      tags: ['ethereum', 'evm', 'fox', 'browser', 'mobile'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean(
          (window as any).ethereum?.isMetaMask ||
          (window as any).ethereum?.providers?.some((p: any) => p.isMetaMask)
        ),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#201815] p-1 flex items-center justify-center shrink-0 shadow-sm border border-orange-500/20">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <path d="M28.86 3.27a.8.8 0 00-.91-.12L17.2 9.07 19.8 3.5a.8.8 0 00-.73-1.14H12.9a.8.8 0 00-.73 1.14l2.6 5.57L4.05 3.15a.8.8 0 00-.91.12.82.8 0 00-.18.91l4.8 11.2-4.22 3.12a.8.8 0 00-.23.95l4.8 9.6a.8.8 0 00.71.45h14.36a.8.8 0 00.71-.45l4.8-9.6a.8.8 0 00-.23-.95l-4.22-3.12 4.8-11.2a.82.8 0 00-.18-.91z" fill="#E4761B"/>
            <path d="M10.8 14.5l-2.6 6.8 4.6 2.3v-9.1h-2zm10.4 0h-2v9.1l4.6-2.3-2.6-6.8z" fill="#E4761B"/>
            <path d="M16 19.5l-4.5 4.5h9L16 19.5z" fill="#F6851B"/>
            <path d="M10.8 14.5L16 19.5l5.2-5-5.2-3.2-5.2 3.2z" fill="#E4761B"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      category: 'popular',
      tags: ['binance', 'bnb', 'bsc', 'shield', 'mobile'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).trustwallet || (window as any).ethereum?.isTrust),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#0500FF] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L6 9.5v8.5c0 6.5 4.5 12.5 10 14 5.5-1.5 10-7.5 10-14V9.5L16 4z" fill="#0500FF"/>
            <path d="M16 6.8L8.2 11v7c0 5 3.5 9.7 7.8 10.9 4.3-1.2 7.8-5.9 7.8-10.9v-7L16 6.8z" fill="#FFFFFF"/>
            <path d="M16 9.2L10.2 12.3v5.5c0 3.8 2.6 7.4 5.8 8.4 3.2-1 5.8-4.6 5.8-8.4v-5.5L16 9.2z" fill="#0500FF"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      category: 'popular',
      tags: ['base', 'coinbase', 'us', 'mobile', 'web3'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#0052FF] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" fill="#FFFFFF"/>
            <rect x="12" y="12" width="8" height="8" rx="2" fill="#0052FF"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      category: 'popular',
      tags: ['rainbow', 'ethereum', 'optimism', 'arbitrum', 'ios'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).rainbow || (window as any).ethereum?.isRainbow),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#00143D] p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <path d="M4 22a12 12 0 0124 0" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round"/>
            <path d="M7.5 22a8.5 8.5 0 0117 0" stroke="#FFAE00" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11 22a5 5 0 0110 0" stroke="#00E575" strokeWidth="3" strokeLinecap="round"/>
            <path d="M14.5 22a1.5 1.5 0 013 0" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'zerion',
      name: 'Zerion',
      tags: ['zerion', 'defi', 'portfolio'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).zerionWallet || (window as any).ethereum?.isZerion),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#2962FF] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M7 9h18L13 23h12" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      tags: ['okx', 'web3', 'dex', 'exchange'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).okxwallet || (window as any).ethereum?.isOkxWallet),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 p-2 flex items-center justify-center shrink-0 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <div className="w-2 h-2 bg-white rounded-sm" />
            <div className="w-2 h-2 bg-transparent" />
            <div className="w-2 h-2 bg-white rounded-sm" />
            <div className="w-2 h-2 bg-transparent" />
            <div className="w-2 h-2 bg-white rounded-sm" />
            <div className="w-2 h-2 bg-transparent" />
            <div className="w-2 h-2 bg-white rounded-sm" />
            <div className="w-2 h-2 bg-transparent" />
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
        </div>
      ),
    },
    {
      id: 'binance',
      name: 'Binance Wallet',
      tags: ['binance', 'bnb', 'bsc', 'cz', 'web3'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).BinanceChain || (window as any).ethereum?.isBinance),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#F0B90B] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M16 6l4.5 4.5-4.5 4.5-4.5-4.5L16 6zm0 11l4.5 4.5-4.5 4.5-4.5-4.5L16 17zm7.5-3.5L28 16l-4.5 2.5-2.5-2.5 2.5-2.5zm-15 0L11 16l-2.5 2.5L4 16l4.5-2.5z" fill="#000000"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'bitget',
      name: 'Bitget Wallet',
      tags: ['bitget', 'bitkeep', 'web3', 'swap'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).bitkeep?.ethereum || (window as any).bitgetWallet?.ethereum),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0094FF] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 14l6-6 4 4-6 6H4v-4zm10-10l6 6-4 4-6-6 4-4z"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'safepal',
      name: 'SafePal',
      tags: ['safepal', 'hardware', 'sfp', 'security'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).safepal || (window as any).safepalProvider || (window as any).ethereum?.isSafePal),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#4965F6] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M10 8h12v4H10zM10 14h12v4H10zM10 20h12v4H10z" fill="#FFFFFF"/>
            <path d="M8 8a2 2 0 012-2h12a2 2 0 012 2v16a2 2 0 01-2 2H10a2 2 0 01-2-2V8z" stroke="#FFFFFF" strokeWidth="2"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'tokenpocket',
      name: 'TokenPocket',
      tags: ['tokenpocket', 'tp', 'multi-chain', 'bep20'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).tokenpocket || (window as any).ethereum?.isTokenPocket),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2980FE] to-[#1E56B6] p-1 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm tracking-tighter">
          TP
        </div>
      ),
    },
    {
      id: 'phantom',
      name: 'Phantom',
      tags: ['phantom', 'solana', 'multi-chain', 'polygon'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).phantom?.ethereum || (window as any).ethereum?.isPhantom),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#AB9FF2] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 3.7 2.01 6.94 5 8.68V19c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v2c1 .32 2 .5 3 .5s2-.18 3-.5v-2c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v1.68c2.99-1.74 5-4.98 5-8.68 0-5.52-4.48-10-10-10zm-3 10c-.83 0-1.5-.67-1.5-1.5S8.17 9 9 9s1.5.67 1.5 1.5S9.83 12 9 12zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 9 15 9s1.5.67 1.5 1.5S15.83 12 15 12z"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      tags: ['rabby', 'debank', 'security', 'evm'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).rabby || (window as any).ethereum?.isRabby),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#8697FF] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="10" r="2" />
            <circle cx="16" cy="10" r="2" />
            <path d="M6 16c1.5 2 4.5 3 6 3s4.5-1 6-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      ),
    },
    {
      id: '1inch',
      name: '1inch Wallet',
      tags: ['1inch', 'aggregator', 'dex', 'swap'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).oneInch || (window as any).ethereum?.isOneInch),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#1B2742] p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-cyan-500/20">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M22 6L14 14l-4-2 3-5 9-1z" fill="#00C087"/>
            <path d="M14 14l-6 8 8 2 4-8-6-2z" fill="#1E88E5"/>
            <path d="M22 6l-2 10 4 8 2-12-4-6z" fill="#E53935"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'coin98',
      name: 'Coin98',
      tags: ['coin98', 'c98', 'vietnam', 'asia'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).coin98?.provider || (window as any).ethereum?.isCoin98),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#E4B01E] p-1.5 flex items-center justify-center shrink-0 shadow-sm font-black text-black text-sm">
          C98
        </div>
      ),
    },
    {
      id: 'argent',
      name: 'Argent',
      tags: ['argent', 'starknet', 'smart', 'account'],
      installedCheck: () => false,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#FF6B4A] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'exodus',
      name: 'Exodus',
      tags: ['exodus', 'desktop', 'multi-asset'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).exodus?.ethereum),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F1735] to-[#0A0518] p-2 flex items-center justify-center shrink-0 shadow-sm border border-purple-500/30">
          <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 4l16 16M20 4L4 20" strokeLinecap="round"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'imtoken',
      name: 'imToken',
      tags: ['imtoken', 'chinese', 'token', 'btc', 'eth'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).imToken || (window as any).ethereum?.isImToken),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#0089FF] p-2 flex items-center justify-center shrink-0 shadow-sm font-bold text-white text-base">
          im
        </div>
      ),
    },
    {
      id: 'mathwallet',
      name: 'MathWallet',
      tags: ['math', 'mathwallet', 'multi-platform'],
      installedCheck: () =>
        typeof window !== 'undefined' &&
        Boolean((window as any).mathwallet || (window as any).ethereum?.isMathWallet),
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#FF5C00] p-2 flex items-center justify-center shrink-0 shadow-sm font-black text-white text-base">
          M+
        </div>
      ),
    },
    {
      id: 'uniswap',
      name: 'Uniswap Wallet',
      tags: ['uniswap', 'uni', 'pink', 'swap', 'dex'],
      installedCheck: () => false,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#FF007A] p-2 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5z"/>
          </svg>
        </div>
      ),
    },
    {
      id: 'frontier',
      name: 'Frontier',
      tags: ['frontier', 'chain', 'multi-chain'],
      installedCheck: () => false,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#CC33FF] p-2 flex items-center justify-center shrink-0 shadow-sm text-white font-extrabold text-sm">
          FR
        </div>
      ),
    },
    {
      id: 'safe',
      name: 'Safe (Gnosis)',
      tags: ['gnosis', 'multisig', 'safe', 'institution'],
      installedCheck: () => false,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#12FF80] p-2 flex items-center justify-center shrink-0 shadow-sm text-black font-extrabold text-sm">
          S
        </div>
      ),
    },
    {
      id: 'core',
      name: 'Core Wallet',
      tags: ['avalanche', 'core', 'avax'],
      installedCheck: () => false,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#E84142] p-2 flex items-center justify-center shrink-0 shadow-sm text-white font-black text-sm">
          C
        </div>
      ),
    },
  ], []);

  // Filtered wallets based on search query
  const filteredWallets = useMemo(() => {
    if (!searchQuery.trim()) return allWalletsList;
    const q = searchQuery.toLowerCase().trim();
    return allWalletsList.filter((wallet) => {
      return (
        wallet.name.toLowerCase().includes(q) ||
        wallet.id.toLowerCase().includes(q) ||
        wallet.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allWalletsList, searchQuery]);

  // Popular wallets displayed on the main "Sign in" view
  const mainWallets = useMemo(() => {
    return allWalletsList.filter((w) => ['metamask', 'trust', 'coinbase', 'rainbow'].includes(w.id));
  }, [allWalletsList]);

  // Click on a wallet initiates connection
  const handleWalletClick = async (wallet: WalletItem) => {
    setSelectedWallet(wallet);
    setView('awaiting');
    try {
      await onSelectWallet(wallet.id);
    } catch (err) {
      console.error('Wallet connection attempt error:', err);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all duration-200"
      style={{ margin: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0F1116] border border-zinc-800/80 text-white w-full max-w-[390px] rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 my-auto"
      >
        {/* ========================================================
            VIEW 1: SIGN IN (Main Screen - Matching Image 1)
        ======================================================== */}
        {view === 'main' && (
          <div className="flex flex-col">
            {/* Header: "Sign in" and Close Button */}
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Sign in</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List of Primary Wallets */}
            <div className="px-4 py-2 space-y-1">
              {mainWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletClick(wallet)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left group"
                >
                  {wallet.icon}
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-semibold text-base text-zinc-100 group-hover:text-white">
                      {wallet.name}
                    </span>
                    {wallet.installedCheck && wallet.installedCheck() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Detected
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {/* "All Wallets (500+)" Button */}
              <button
                onClick={() => setView('all')}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left group"
              >
                {/* 4 Dots Grid Icon (matching Image 1) */}
                <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 p-2.5 flex items-center justify-center shrink-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-white transition-colors" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-white transition-colors" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-white transition-colors" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-white transition-colors" />
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold text-base text-zinc-100 group-hover:text-white">
                    All Wallets
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                    500+
                  </span>
                </div>

                <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Modal Bottom: New to wallets? + Powered By */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 px-6 pb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>New to wallets?</span>
                <a
                  href="https://ethereum.org/en/wallets/find-wallet/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 font-semibold hover:text-sky-300 transition-colors"
                >
                  Get started
                </a>
              </div>

              {/* Powered by GROW 50X / Web3 */}
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium pt-1">
                <span>Powered by</span>
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold tracking-wider">
                  <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 18h4L14 6h-4L4 18zm6 0h4l6-12h-4l-6 12z"/>
                  </svg>
                  <span>thirdweb</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: SELECT WALLET (Searchable All Wallets - Matching Image 2)
        ======================================================== */}
        {view === 'all' && (
          <div className="flex flex-col max-h-[82vh]">
            {/* Header: Back Button, "Select Wallet", Close Button */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <button
                onClick={() => setView('main')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="text-lg font-bold text-white tracking-tight">Select Wallet</h2>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input Bar (Matching Image 2) */}
            <div className="px-5 py-2 shrink-0">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Wallet"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-zinc-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Wallets List */}
            <div className="px-4 py-2 space-y-1 overflow-y-auto flex-1 max-h-[52vh] custom-scrollbar">
              {filteredWallets.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-zinc-300">No wallets found</p>
                  <p className="text-xs text-zinc-500 mt-1">Try searching with a different name</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-amber-400 font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                filteredWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletClick(wallet)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left group"
                  >
                    {wallet.icon}
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-semibold text-base text-zinc-100 group-hover:text-white">
                        {wallet.name}
                      </span>
                      {wallet.installedCheck && wallet.installedCheck() && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Detected
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Bottom Counter */}
            <div className="px-6 py-3 border-t border-zinc-800/60 text-center text-[11px] text-zinc-500 shrink-0">
              Showing {filteredWallets.length} of {allWalletsList.length} wallets
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 3: AWAITING WALLET RESPONSE / CONFIRMATION
        ======================================================== */}
        {view === 'awaiting' && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-5">
            {/* Header: Back & Close */}
            <div className="w-full flex items-center justify-between mb-2">
              <button
                onClick={() => setView('all')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Connecting
              </span>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Icon Preview with Ripple / Glow Effect */}
            <div className="relative my-3">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl animate-pulse" />
              <div className="relative p-3 bg-zinc-900 border border-zinc-700 rounded-3xl shadow-xl flex items-center justify-center">
                {selectedWallet ? selectedWallet.icon : null}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {selectedWallet ? `Connecting to ${selectedWallet.name}` : 'Connecting Wallet'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                Please approve the request in your wallet app or browser extension to continue.
              </p>
            </div>

            {/* Animated Loading Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Awaiting confirmation...</span>
            </div>

            <div className="pt-2 flex flex-col gap-2 w-full">
              <button
                onClick={() => setView('all')}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white transition-colors"
              >
                Choose another wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
