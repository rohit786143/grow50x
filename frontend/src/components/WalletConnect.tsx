'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, BSC_TESTNET_CHAIN_ID } from '../config/contracts';

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const BSC_TESTNET_HEX_CHAIN_ID = '0x61'; // 97 in decimal

  useEffect(() => {
    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalances(accounts[0]);
        } else {
          setAccount(null);
          setUsdtBalance('0');
          setBnbBalance('0');
        }
      });

      ethereum.on('chainChanged', (_chainIdHex: string) => {
        const id = parseInt(_chainIdHex, 16);
        setChainId(id);
        if (account) fetchBalances(account);
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
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const fetchBalances = async (walletAddress: string) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      // Fetch BNB Balance
      const bnbRaw = await provider.getBalance(walletAddress);
      setBnbBalance(parseFloat(ethers.formatEther(bnbRaw)).toFixed(4));

      // Fetch USDT Balance
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
      alert('MetaMask or Web3 Wallet not detected. Please install MetaMask extensions.');
      return;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setAccount(accounts[0]);

        // Check Network Chain ID
        const provider = new ethers.BrowserProvider(ethereum);
        const network = await provider.getNetwork();
        const currentChain = Number(network.chainId);
        setChainId(currentChain);

        if (currentChain !== BSC_TESTNET_CHAIN_ID) {
          await switchNetwork();
        }

        await fetchBalances(accounts[0]);
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
      // Chain not added error code 4902
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

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        id="connect-wallet-btn"
        className="gradient-btn px-5 py-2.5 rounded-xl text-slate-950 font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-950 animate-ping" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  const isWrongNetwork = chainId !== BSC_TESTNET_CHAIN_ID;

  return (
    <div className="flex items-center gap-3">
      {isWrongNetwork ? (
        <button
          onClick={switchNetwork}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
        >
          ⚠️ Switch to BSC Testnet
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-emerald-400 font-semibold">${usdtBalance} USDT</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">{bnbBalance} BNB</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-mono font-semibold text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        {formatAddress(account)}
      </div>
    </div>
  );
}
