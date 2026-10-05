'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletKey: string) => Promise<void>;
  isLoading?: boolean;
}

export default function WalletModal({ isOpen, onClose, onSelectWallet, isLoading }: WalletModalProps) {
  const [step, setStep] = useState<'list' | 'awaiting'>('list');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // Ensure portal mounts only on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset modal step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('list');
      setSelectedWalletId(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Check wallet installation status
  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean((window as any).ethereum?.isMetaMask || (window as any).ethereum);
  const isTrustInstalled = typeof window !== 'undefined' && Boolean((window as any).trustwallet || (window as any).ethereum?.isTrust);
  const isCoinbaseInstalled = typeof window !== 'undefined' && Boolean((window as any).coinbaseWalletExtension);

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension or mobile app',
      badge: isMetaMaskInstalled ? 'Detected' : 'Popular',
      installed: isMetaMaskInstalled,
      icon: (
        <svg className="w-9 h-9 shrink-0 drop-shadow" viewBox="0 0 32 32" fill="none">
          <path d="M28.86 3.27a.8.8 0 00-.91-.12L17.2 9.07 19.8 3.5a.8.8 0 00-.73-1.14H12.9a.8.8 0 00-.73 1.14l2.6 5.57L4.05 3.15a.8.8 0 00-.91.12.82.8 0 00-.18.91l4.8 11.2-4.22 3.12a.8.8 0 00-.23.95l4.8 9.6a.8.8 0 00.71.45h14.36a.8.8 0 00.71-.45l4.8-9.6a.8.8 0 00-.23-.95l-4.22-3.12 4.8-11.2a.82.8 0 00-.18-.91z" fill="#E4761B"/>
          <path d="M10.8 14.5l-2.6 6.8 4.6 2.3v-9.1h-2zm10.4 0h-2v9.1l4.6-2.3-2.6-6.8z" fill="#E4761B"/>
          <path d="M16 19.5l-4.5 4.5h9L16 19.5z" fill="#D7C1B3"/>
        </svg>
      ),
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Multi-chain crypto wallet with dApp browser',
      badge: isTrustInstalled ? 'Detected' : 'Multi-chain',
      installed: isTrustInstalled,
      icon: (
        <svg className="w-9 h-9 shrink-0 drop-shadow" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="#0500FF"/>
          <path d="M16 6L7 11v8c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12v-8l-9-5z" fill="#FFFFFF"/>
          <path d="M16 8.5L9 12.4v6.2c0 4.3 3 8.3 7 9.4 4-1.1 7-5.1 7-9.4v-6.2L16 8.5z" fill="#0500FF"/>
        </svg>
      ),
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Self-custody wallet for mobile and desktop',
      badge: isCoinbaseInstalled ? 'Detected' : 'Self-custody',
      installed: isCoinbaseInstalled,
      icon: (
        <svg className="w-9 h-9 shrink-0 drop-shadow" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="#0052FF"/>
          <path d="M16 6a10 10 0 100 20 10 10 0 000-20zm-3.5 6.5h7a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5z" fill="#FFFFFF"/>
        </svg>
      ),
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 500+ Web3 wallets via QR code',
      badge: '500+ Wallets',
      installed: true,
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
    },
  ];

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  const handleWalletClick = async (walletId: string) => {
    setSelectedWalletId(walletId);
    setStep('awaiting');
    try {
      await onSelectWallet(walletId);
    } catch (err) {
      console.error('Connection aborted or failed:', err);
    }
  };

  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-all duration-200 overflow-y-auto"
      style={{ margin: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 scale-100 max-h-[90vh] my-auto"
      >
        {/* Glowing Ambient Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'awaiting' ? (
              <button
                onClick={() => setStep('list')}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-base font-bold transition-all shadow-sm"
                title="Back to wallets"
              >
                ←
              </button>
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                {step === 'awaiting' ? `Connecting ${selectedWallet.name}` : 'Connect Web3 Wallet'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'awaiting' ? 'Confirm request in your wallet' : 'Select your wallet to enter GROW 50X'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center text-sm font-bold transition-all border border-slate-700/60"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Wallet Options List */}
        {step === 'list' && (
          <div className="flex flex-col overflow-hidden">
            <div className="p-5 space-y-2.5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleWalletClick(w.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 transition-all text-left group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {w.icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">
                          {w.name}
                        </span>
                        {w.installed ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {w.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            {w.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5 leading-tight">
                        {w.description}
                      </span>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-sky-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    →
                  </div>
                </button>
              ))}
            </div>

            {/* Modal Footer Info */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>New to Web3 wallets?</span>
              <a
                href="https://ethereum.org/en/wallets/find-wallet/"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 font-bold hover:text-sky-300 hover:underline flex items-center gap-1"
              >
                Learn More →
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Awaiting Confirmation Animation */}
        {step === 'awaiting' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto max-h-[60vh]">
            <div className="relative p-6 bg-slate-950/80 rounded-3xl border border-sky-500/40 shadow-2xl shadow-sky-500/10">
              <div className="w-16 h-16 flex items-center justify-center">
                {selectedWallet.icon}
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br-2xl" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white tracking-tight">Awaiting Wallet Response</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Please approve the connection prompt in your <span className="text-slate-200 font-semibold">{selectedWallet.name}</span> window.
              </p>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-400 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              Waiting for confirmation...
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep('list')}
                className="text-xs font-semibold text-slate-400 hover:text-white underline transition-colors"
              >
                Choose a different wallet
              </button>
            </div>
          </div>
        )}

        {/* Modal Branding Footer */}
        <div className="py-2.5 bg-slate-950/90 text-center text-[10px] text-slate-500 font-medium border-t border-slate-800/60 shrink-0">
          🔒 Secure Web3 Connection • <span className="text-slate-400 font-semibold">GROW 50X Protocol</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
