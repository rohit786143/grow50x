'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, GROW50X_CORE_ABI, isAdminWallet } from '../config/contracts';
import WalletModal from '../components/WalletModal';

export interface OwnedIdItem {
  id: number;
  displayId: string;
  label: string;
  isSubId: boolean;
}

export interface ConnectWalletResult {
  success: boolean;
  account: string | null;
  isRegistered: boolean;
  mainUserId: number;
}

interface Web3ContextType {
  account: string | null;
  mainUserId: number;
  selectedUserId: number;
  setSelectedUserId: (id: number) => void;
  ownedIds: OwnedIdItem[];
  isSubIdSelected: boolean;
  isRegistered: boolean;
  usdtBalance: string;
  bnbBalance: string;
  chainId: number | null;
  isLoading: boolean;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: (customProvider?: any) => Promise<ConnectWalletResult>;
  disconnectWallet: () => void;
  refreshWeb3State: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  mainUserId: 0,
  selectedUserId: 0,
  setSelectedUserId: () => {},
  ownedIds: [],
  isSubIdSelected: false,
  isRegistered: false,
  usdtBalance: '0',
  bnbBalance: '0',
  chainId: null,
  isLoading: true,
  isWalletModalOpen: false,
  openWalletModal: () => {},
  closeWalletModal: () => {},
  connectWallet: async (customProvider?: any) => ({ success: false, account: null, isRegistered: false, mainUserId: 0 }),
  disconnectWallet: () => {},
  refreshWeb3State: async () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [ownedIds, setOwnedIds] = useState<OwnedIdItem[]>([]);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [bnbBalance, setBnbBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);

  useEffect(() => {
    checkInitialConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          resetState();
        } else {
          loadWeb3Details(accounts[0]);
        }
      });

      ethereum.on('chainChanged', () => {
        checkInitialConnection();
      });
    }
  }, []);

  const resetState = () => {
    setAccount(null);
    setMainUserId(0);
    setSelectedUserId(0);
    setOwnedIds([]);
    setIsRegistered(false);
    setUsdtBalance('0');
    setBnbBalance('0');
    setIsLoading(false);
  };

  const disconnectWallet = () => {
    resetState();
  };

  const checkInitialConnection = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setIsLoading(false);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);

      if (accounts.length > 0) {
        await loadWeb3Details(accounts[0]);
      } else {
        resetState();
      }
    } catch (err) {
      console.error('Error checking initial Web3 connection:', err);
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayId = (id: number) => `GR${id.toString().padStart(6, '0')}`;

  const loadWeb3Details = async (walletAddress: string) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) return null;
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      setAccount(walletAddress);

      // Check Chain ID
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      // Fetch BNB balance
      const bnbRaw = await provider.getBalance(walletAddress);
      setBnbBalance(parseFloat(ethers.formatEther(bnbRaw)).toFixed(4));

      // Fetch USDT balance
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, provider);
      const usdtRaw = await usdtContract.balanceOf(walletAddress);
      const decimals = await usdtContract.decimals();
      setUsdtBalance(parseFloat(ethers.formatUnits(usdtRaw, decimals)).toFixed(2));

      // Check registration on Core Contract
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mIdRaw = await coreContract.walletToMainUserId(walletAddress);
      const mId = Number(mIdRaw);

      setMainUserId(mId);
      const registered = mId > 0;
      setIsRegistered(registered);

      // Build owned IDs list
      const idsList: OwnedIdItem[] = [];
      if (mId > 0) {
        idsList.push({ id: mId, displayId: formatDisplayId(mId), label: `${formatDisplayId(mId)} (Main ID)`, isSubId: false });
        try {
          const subIds = await coreContract.getOwnerSubIds(mId);
          for (let i = 0; i < subIds.length; i++) {
            const sId = Number(subIds[i]);
            idsList.push({ id: sId, displayId: formatDisplayId(sId), label: `${formatDisplayId(sId)} (Sub-ID ${i + 1})`, isSubId: true });
          }
        } catch (e) {
          console.warn('Could not read subIds list:', e);
        }
      }
      setOwnedIds(idsList);

      // Always reset selected user ID to current wallet's Main ID on account switch
      setSelectedUserId(mId);

      return { isRegistered: registered, mainUserId: mId };
    } catch (err) {
      console.error('Error loading Web3 details:', err);
      return null;
    }
  };

  const connectWallet = async (customProvider?: any): Promise<ConnectWalletResult> => {
    const providerToUse = customProvider || (typeof window !== 'undefined' ? (window as any).ethereum : null);

    if (!providerToUse) {
      alert('Web3 Wallet provider not detected. Please install a Web3 wallet extension such as MetaMask, Trust Wallet, or Coinbase Wallet.');
      return { success: false, account: null, isRegistered: false, mainUserId: 0 };
    }

    setIsLoading(true);
    try {
      const accounts = await providerToUse.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        const details = await loadWeb3Details(accounts[0]);
        return {
          success: true,
          account: accounts[0],
          isRegistered: details?.isRegistered ?? false,
          mainUserId: details?.mainUserId ?? 0,
        };
      }
      return { success: false, account: null, isRegistered: false, mainUserId: 0 };
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWalletFromModal = async (walletKey: string) => {
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const domain = window.location.host;
    const providers = (window as any).ethereum?.providers || [];
    let targetProvider: any = null;

    if (walletKey === 'metamask') {
      targetProvider = providers.find((p: any) => p.isMetaMask) || ((window as any).ethereum?.isMetaMask ? (window as any).ethereum : null) || (window as any).ethereum;
      if (!targetProvider) {
        window.open(`https://metamask.app.link/dapp/${domain}`, '_blank');
        setIsWalletModalOpen(false);
        return;
      }
    } else if (walletKey === 'trust') {
      targetProvider = (window as any).trustwallet || providers.find((p: any) => p.isTrust) || ((window as any).ethereum?.isTrust ? (window as any).ethereum : null);
      if (!targetProvider) {
        window.open(`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`, '_blank');
        setIsWalletModalOpen(false);
        return;
      }
    } else if (walletKey === 'coinbase') {
      targetProvider = (window as any).coinbaseWalletExtension || providers.find((p: any) => p.isCoinbaseWallet) || ((window as any).ethereum?.isCoinbaseWallet ? (window as any).ethereum : null);
      if (!targetProvider) {
        window.open(`https://go.cb-wallet.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`, '_blank');
        setIsWalletModalOpen(false);
        return;
      }
    } else {
      targetProvider = (window as any).ethereum;
      if (!targetProvider) {
        window.open(`https://metamask.app.link/dapp/${domain}`, '_blank');
        setIsWalletModalOpen(false);
        return;
      }
    }

    try {
      await connectWallet(targetProvider);
      setIsWalletModalOpen(false);
    } catch (err: any) {
      console.error('Modal wallet connect error:', err);
    }
  };

  const refreshWeb3State = async () => {
    if (account) {
      await loadWeb3Details(account);
    } else {
      await checkInitialConnection();
    }
  };

  const isSubIdSelected = selectedUserId > 0 && selectedUserId !== mainUserId;

  return (
    <Web3Context.Provider
      value={{
        account,
        mainUserId,
        selectedUserId,
        setSelectedUserId,
        ownedIds,
        isSubIdSelected,
        isRegistered,
        usdtBalance,
        bnbBalance,
        chainId,
        isLoading,
        isWalletModalOpen,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        disconnectWallet,
        refreshWeb3State,
      }}
    >
      {children}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
        onSelectWallet={handleSelectWalletFromModal}
        isLoading={isLoading}
      />
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
