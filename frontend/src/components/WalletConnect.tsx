'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, GROW50X_CORE_ABI, BSC_TESTNET_CHAIN_ID } from '../config/contracts';

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState<boolean>(false);

  const BSC_TESTNET_HEX_CHAIN_ID = '0x61'; // 97 in decimal

  useEffect(() => {
    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalances(accounts[0]);
          checkRegistration(accounts[0]);
        } else {
          setAccount(null);
          setUsdtBalance('0');
          setBnbBalance('0');
          setIsRegistered(false);
        }
      });

      ethereum.on('chainChanged', (_chainIdHex: string) => {
        const id = parseInt(_chainIdHex, 16);
        setChainId(id);
        if (account) {
          fetchBalances(account);
          checkRegistration(account);
        }
      });
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));

        const accounts = await provider.send('eth_accounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await fetchBalances(accounts[0]);
          await checkRegistration(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const checkRegistration = async (walletAddress: string) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mId = await coreContract.walletToMainUserId(walletAddress);
      setIsRegistered(Number(mId) > 0);
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  const fetchBalances = async (walletAddress: string) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      const bnbRaw = await provider.getBalance(walletAddress);
      setBnbBalance(parseFloat(ethers.formatEther(bnbRaw)).toFixed(4));

      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, provider);
      const usdtRaw = await usdtContract.balanceOf(walletAddress);
      const decimals = await usdtContract.decimals();
      setUsdtBalance(parseFloat(ethers.formatUnits(usdtRaw, decimals)).toFixed(2));
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or Web3 Wallet not detected. Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setAccount(accounts[0]);

        const provider = new ethers.BrowserProvider(ethereum);
        const network = await provider.getNetwork();
        const currentChain = Number(network.chainId);
        setChainId(currentChain);

        if (currentChain !== BSC_TESTNET_CHAIN_ID) {
          await switchNetwork();
        }

        await fetchBalances(accounts[0]);
        await checkRegistration(accounts[0]);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      alert(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_HEX_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_TESTNET_HEX_CHAIN_ID,
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

  const claimFaucetUsdt = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !account) return;
    setIsClaimingFaucet(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);

      const tx = await usdtContract.faucet();
      await tx.wait();
      alert('🎉 1,000 Mock USDT successfully minted to your wallet!');

      await fetchBalances(account);
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

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        id="connect-wallet-btn"
        className="btn-primary-blue px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  const isWrongNetwork = chainId !== BSC_TESTNET_CHAIN_ID;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Show Register Button ONLY IF NOT REGISTERED */}
      {!isRegistered && (
        <Link
          href="/register"
          className="btn-primary-emerald font-extrabold px-4 py-2 rounded-xl text-xs shadow-md animate-pulse flex items-center gap-1.5"
        >
          <span>🚀</span> Register Now
        </Link>
      )}

      {/* Faucet & Import Tokens Buttons */}
      <button
        onClick={claimFaucetUsdt}
        disabled={isClaimingFaucet}
        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-200 transition-colors flex items-center gap-1.5"
        title="Claim 1,000 Free Testnet USDT"
      >
        <span>🎁</span>
        {isClaimingFaucet ? 'Claiming...' : 'Get 1,000 USDT'}
      </button>

      <button
        onClick={addUsdtToMetaMask}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 transition-colors"
        title="Import USDT Token into MetaMask"
      >
        ➕ Add to MetaMask
      </button>

      {isWrongNetwork ? (
        <button
          onClick={switchNetwork}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
        >
          ⚠️ Switch to BSC Testnet
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-emerald-600 font-bold">${usdtBalance} USDT</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono font-semibold">{bnbBalance} BNB</span>
        </div>
      )}

      {/* Connected Wallet Badge */}
      <div className="flex items-center gap-2 bg-sky-50 px-3.5 py-2 rounded-xl border border-sky-200 text-xs font-mono font-bold text-sky-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {formatAddress(account)}
      </div>
    </div>
  );
}
