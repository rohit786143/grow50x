'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, GROW50X_CORE_ABI, isAdminWallet, ensureBscChain } from '../config/contracts';
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

      // Automatically trigger network switch prompt to BSC Mainnet (or configured chain) in Trust Wallet / MetaMask
      await ensureBscChain(providerToUse);

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
    const pathname = window.location.pathname;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const providers: any[] = (window as any).ethereum?.providers || [];
    let targetProvider: any = null;

    switch (walletKey) {
      case 'metamask':
        targetProvider =
          providers.find((p: any) => p.isMetaMask && !p.isTokenPocket && !p.isTrust && !p.isOkxWallet) ||
          ((window as any).ethereum?.isMetaMask ? (window as any).ethereum : null) ||
          (window as any).ethereum;
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://metamask.app.link/dapp/${domain}${pathname}`, '_blank');
          } else {
            window.open('https://metamask.io/download/', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'trust':
        targetProvider =
          (window as any).trustwallet ||
          providers.find((p: any) => p.isTrust) ||
          ((window as any).ethereum?.isTrust ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://trustwallet.com/download', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'coinbase':
        targetProvider =
          (window as any).coinbaseWalletExtension ||
          providers.find((p: any) => p.isCoinbaseWallet) ||
          ((window as any).ethereum?.isCoinbaseWallet ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://go.cb-wallet.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://www.coinbase.com/wallet', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'rainbow':
        targetProvider =
          (window as any).rainbow ||
          providers.find((p: any) => p.isRainbow) ||
          ((window as any).ethereum?.isRainbow ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://rnbwapp.com/wc?uri=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://rainbow.me/download', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'zerion':
        targetProvider =
          (window as any).zerionWallet ||
          providers.find((p: any) => p.isZerion) ||
          ((window as any).ethereum?.isZerion ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://zerion.io/', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'okx':
        targetProvider =
          (window as any).okxwallet ||
          providers.find((p: any) => p.isOkxWallet) ||
          ((window as any).ethereum?.isOkxWallet ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`okx://wallet/dapp/details?dappUrl=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://www.okx.com/web3', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'binance':
        targetProvider =
          (window as any).BinanceChain ||
          providers.find((p: any) => p.isBinance) ||
          ((window as any).ethereum?.isBinance ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`bnc://app.binance.com/cedafi/dapp?url=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://www.binance.com/en/web3wallet', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'bitget':
        targetProvider =
          (window as any).bitkeep?.ethereum ||
          (window as any).bitgetWallet?.ethereum ||
          providers.find((p: any) => p.isBitKeep) ||
          null;
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://bkcode.vip?action=dapp&url=${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://web3.bitget.com/', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'safepal':
        targetProvider =
          (window as any).safepal ||
          (window as any).safepalProvider ||
          providers.find((p: any) => p.isSafePal) ||
          ((window as any).ethereum?.isSafePal ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://link.safepal.io/dapp/${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://safepal.com/download', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'tokenpocket':
        targetProvider =
          (window as any).tokenpocket ||
          providers.find((p: any) => p.isTokenPocket) ||
          ((window as any).ethereum?.isTokenPocket ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url: currentUrl }))}`, '_blank');
          } else {
            window.open('https://tokenpocket.pro/', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'phantom':
        targetProvider =
          (window as any).phantom?.ethereum ||
          providers.find((p: any) => p.isPhantom) ||
          ((window as any).ethereum?.isPhantom ? (window as any).ethereum : null);
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`, '_blank');
          } else {
            window.open('https://phantom.app/download', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'rabby':
        targetProvider =
          (window as any).rabby ||
          providers.find((p: any) => p.isRabby) ||
          ((window as any).ethereum?.isRabby ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://rabby.io/', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case '1inch':
        targetProvider =
          (window as any).oneInch ||
          providers.find((p: any) => p.isOneInch) ||
          ((window as any).ethereum?.isOneInch ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://1inch.io/wallet/', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'coin98':
        targetProvider =
          (window as any).coin98?.provider ||
          providers.find((p: any) => p.isCoin98) ||
          ((window as any).ethereum?.isCoin98 ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://coin98.com/wallet', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'imtoken':
        targetProvider =
          (window as any).imToken ||
          providers.find((p: any) => p.isImToken) ||
          ((window as any).ethereum?.isImToken ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://token.im/download', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'mathwallet':
        targetProvider =
          (window as any).mathwallet ||
          providers.find((p: any) => p.isMathWallet) ||
          ((window as any).ethereum?.isMathWallet ? (window as any).ethereum : null);
        if (!targetProvider) {
          window.open('https://mathwallet.org/', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      case 'exodus':
        targetProvider =
          (window as any).exodus?.ethereum ||
          (window as any).ethereum;
        if (!targetProvider) {
          window.open('https://www.exodus.com/download/', '_blank');
          setIsWalletModalOpen(false);
          return;
        }
        break;

      default:
        targetProvider = (window as any).ethereum;
        if (!targetProvider) {
          if (isMobile) {
            window.open(`https://metamask.app.link/dapp/${domain}${pathname}`, '_blank');
          } else {
            window.open('https://metamask.io/download/', '_blank');
          }
          setIsWalletModalOpen(false);
          return;
        }
        break;
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
