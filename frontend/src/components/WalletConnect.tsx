'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, BSC_CHAIN_ID, isAdminWallet, getAdminIndex, ensureBscChain } from '../config/contracts';
import { useWeb3 } from '../context/Web3Context';
import WalletModal from './WalletModal';
import { UsdtIcon, BnbIcon } from './CryptoIcons';

export default function WalletConnect() {
  const router = useRouter();
  const pathname = usePathname();
  const { account, isRegistered, usdtBalance, bnbBalance, chainId, isLoading, openWalletModal, disconnectWallet, refreshWeb3State } = useWeb3();
  const [isClaimingFaucet, setIsClaimingFaucet] = useState<boolean>(false);

  const adminIdx = getAdminIndex(account);
  const isAdmin = adminIdx > 0;
  const isTestnet = chainId === 97;

  const handleLogout = () => {
    disconnectWallet();
    router.push('/');
  };

  const switchNetwork = async () => {
    await ensureBscChain();
  };

  const claimFaucetUsdt = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !account) return;
    setIsClaimingFaucet(true);
    try {
      await ensureBscChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);

      const tx = await usdtContract.faucet({ chainId: 97 });
      await tx.wait();
      alert('🎉 1,000 Mock USDT successfully minted to your wallet!');

      await refreshWeb3State();
      await addUsdtToMetaMask();
    } catch (err: any) {
      console.error('Faucet claim error:', err);
      alert(err.reason || err.message || 'Failed to claim faucet USDT');
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const addUsdtToMetaMask = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      await ensureBscChain();
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESSES.USDT,
            symbol: 'USDT',
            decimals: 18,
            image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
          },
        },
      });
    } catch (err) {
      console.error('Error adding USDT token to MetaMask:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      {!account ? (
        /* Case 1: Wallet NOT Connected */
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/register"
            className="hidden sm:inline-flex btn-primary-emerald font-extrabold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs shadow-md items-center gap-1 shrink-0"
          >
            <span>🚀</span> <span>Register Now</span>
          </Link>

          <button
            onClick={addUsdtToMetaMask}
            className="hidden md:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 transition-colors shrink-0 items-center gap-1"
            title="Import USDT Token into MetaMask"
          >
            ➕ Add to MetaMask
          </button>

          {chainId !== BSC_CHAIN_ID && (
            <button
              onClick={switchNetwork}
              className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-colors shrink-0 items-center gap-1"
            >
              ⚠️ <span>Switch Network</span>
            </button>
          )}

          <button
            onClick={openWalletModal}
            disabled={isLoading}
            id="connect-wallet-btn"
            className="btn-primary-gold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 hover:scale-[1.02] transition-all shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : isAdmin ? (
        /* Case 4: OFFICIAL ADMIN WALLET */
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/admin"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <span>👑</span> <span className="hidden xs:inline">Admin #{adminIdx}</span><span className="xs:hidden">Admin</span>
          </Link>

          <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-300 text-[11px] sm:text-xs font-mono font-bold text-amber-900 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>{formatAddress(account)}</span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            title="Disconnect Admin Wallet"
          >
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      ) : !isRegistered ? (

        /* Case 2: Connected but UNREGISTERED */
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {pathname !== '/register' && (
            <Link
              href="/register"
              className="btn-primary-emerald font-extrabold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs shadow-md flex items-center gap-1 shrink-0"
            >
              <span>🚀</span> <span>Register</span>
            </Link>
          )}

          {/* Add to MetaMask Button */}
          <button
            onClick={addUsdtToMetaMask}
            className="hidden md:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 transition-colors shrink-0 items-center gap-1"
            title="Import USDT Token into MetaMask"
          >
            ➕ Add to MetaMask
          </button>

          {chainId !== BSC_CHAIN_ID && (
            <button
              onClick={switchNetwork}
              className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs transition-colors shrink-0 items-center gap-1"
            >
              ⚠️ <span>Switch Network</span>
            </button>
          )}
        </div>
      ) : (
        /* Case 3: REGISTERED & LOGGED IN */
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Testnet Faucet Button */}
          {isTestnet && (
            <button
              onClick={claimFaucetUsdt}
              disabled={isClaimingFaucet}
              className="hidden lg:flex bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-emerald-200 transition-colors items-center gap-1 shrink-0"
              title="Claim 1,000 Free Testnet USDT"
            >
              <span>🎁</span>
              <span>{isClaimingFaucet ? 'Claiming...' : 'Get 1,000 USDT'}</span>
            </button>
          )}

          {/* Balance Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs shadow-sm shrink-0">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <UsdtIcon className="w-4 h-4" />
              ${usdtBalance} USDT
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-mono font-bold flex items-center gap-1.5">
              <BnbIcon className="w-4 h-4" />
              {bnbBalance} BNB
            </span>
          </div>

          {/* Connected Wallet Badge */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 text-[11px] sm:text-xs font-mono font-bold text-amber-900 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{formatAddress(account)}</span>
          </div>

          {/* Logout / Disconnect Button */}
          <button
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0"
            title="Disconnect Wallet & Logout"
          >
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </>
  );
}
