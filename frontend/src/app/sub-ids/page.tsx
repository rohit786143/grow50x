'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI, ensureBscTestnetChain } from '../../config/contracts';
import { validatePlacementEligibility } from '../../utils/placementValidation';

export default function SubIdsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [ownedIds, setOwnedIds] = useState<{ id: number; display: string }[]>([]);
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [isClaimingFaucet, setIsClaimingFaucet] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'manual' | 'auto'>('manual');
  
  // Auto Batch State (Max 5)
  const [batchCount, setBatchCount] = useState<number>(1);
  
  // Manual State
  const [manualSponsorId, setManualSponsorId] = useState<number>(0);
  const [manualPlacementId, setManualPlacementId] = useState<string>('');
  const [placementStatus, setPlacementStatus] = useState<{ isChecking: boolean; isEligible: boolean; message: string }>({
    isChecking: false,
    isEligible: false,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Real-time Placement ID Eligibility Check
  useEffect(() => {
    const clean = manualPlacementId.replace(/^GR/i, '').trim();
    if (!clean || clean === '0') {
      setPlacementStatus({ isChecking: false, isEligible: false, message: '' });
      return;
    }

    setPlacementStatus({ isChecking: true, isEligible: false, message: 'Checking placement eligibility...' });
    const timer = setTimeout(async () => {
      const res = await validatePlacementEligibility(clean);
      setPlacementStatus({
        isChecking: false,
        isEligible: res.isEligible,
        message: res.message,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [manualPlacementId]);

  useEffect(() => {
    loadOwnedIds();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', () => loadOwnedIds());
    }
  }, []);

  const loadOwnedIds = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) return;

      const userWallet = accounts[0];
      setAccount(userWallet);

      // Load USDT Balance
      try {
        const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, provider);
        const balWei = await usdtContract.balanceOf(userWallet);
        setUsdtBalance(ethers.formatEther(balWei));
      } catch (e) {
        console.warn('Could not load USDT balance:', e);
      }

      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      if (!coreAddress || coreAddress === '0x0000000000000000000000000000000000000000') {
        setOwnedIds([]);
        return;
      }

      const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);
      const mIdRaw = await coreContract.walletToMainUserId(userWallet);
      const mId = Number(mIdRaw);
      setMainUserId(mId);

      if (mId > 0) {
        setManualSponsorId(0); // Default to Auto Assign (0)
        const subIdsRaw = await coreContract.getOwnerSubIds(mId);

        const list = [
          { id: 0, display: '✨ Auto Assign (Recommended - Smart Contract Auto-Selects Eligible ID)' },
        ];

        try {
          const mData = await coreContract.users(mId);
          const mDirects = Number(mData.directCount || 0);
          list.push({ id: mId, display: `GR${mId.toString().padStart(6, '0')} (Main ID ⭐) - ${mDirects} Directs` });
        } catch (e) {
          list.push({ id: mId, display: `GR${mId.toString().padStart(6, '0')} (Main ID ⭐)` });
        }

        for (let idx = 0; idx < subIdsRaw.length; idx++) {
          const sId = Number(subIdsRaw[idx]);
          let sDirects = 0;
          try {
            const sData = await coreContract.users(sId);
            sDirects = Number(sData.directCount || 0);
          } catch (e) {}
          list.push({ id: sId, display: `GR${sId.toString().padStart(6, '0')} (Sub-ID #${idx + 1}) - ${sDirects} Directs` });
        }

        setOwnedIds(list);
      } else {
        setOwnedIds([]);
      }
    } catch (err) {
      console.error('Error loading owned IDs:', err);
    }
  };

  const handleClaimFaucet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    setIsClaimingFaucet(true);
    setStatusMessage('Checking network and claiming 1,000 Mock USDT from testnet faucet...');
    try {
      await ensureBscTestnetChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);

      const tx = await usdtContract.faucet({ chainId: 97 });
      await tx.wait(1);
      setStatusMessage('🎉 1,000 Mock USDT claimed successfully!');
      alert('🎉 1,000 Mock USDT successfully added to your wallet!');
      await loadOwnedIds();
    } catch (err: any) {
      console.error('Faucet error:', err);
      const msg = err.reason || err.shortMessage || err.message || 'Failed to claim faucet';
      setStatusMessage(`❌ Faucet Error: ${msg}`);
      alert(`Faucet Error: ${msg}`);
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const totalBatchCost = batchCount * 100;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    if (mainUserId === 0) {
      alert('Please register your Main ID on the Dashboard first before creating Sub-IDs!');
      return;
    }

    if (batchCount < 1 || batchCount > 5) {
      alert('Batch creation limit is maximum 5 Sub-IDs at a time.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(`Verifying USDT balance for ${batchCount} Sub-ID(s)...`);

    try {
      await ensureBscTestnetChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const totalCostWei = ethers.parseEther(totalBatchCost.toString());

      // 0. Check USDT Balance First
      const balanceWei = await usdtContract.balanceOf(userAddr);
      if (balanceWei < totalCostWei) {
        const balFormatted = Number(ethers.formatEther(balanceWei)).toLocaleString();
        const errStr = `Insufficient Mock USDT balance! You currently have ${balFormatted} USDT, but ${totalBatchCost} USDT is required to create ${batchCount} Sub-ID(s). Please click "Claim 1,000 USDT Faucet" below.`;
        setStatusMessage(`❌ ${errStr}`);
        alert(`❌ ${errStr}`);
        setIsSubmitting(false);
        return;
      }

      // 1. Check Allowance
      let allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < totalCostWei) {
        setStatusMessage('Approving USDT transfer (Step 1/2)...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256, { chainId: 97 });
        await approveTx.wait(1);
        allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
        if (allowance < totalCostWei) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        setStatusMessage('USDT approval confirmed! Creating Sub-ID batch...');
      }

      // 2. Execute Batch Sub-ID Creation
      setStatusMessage(`Creating ${batchCount} Sub-ID(s) automatically (Step 2/2)...`);
      let gasLimit: bigint = BigInt(220000 + batchCount * 140000);
      try {
        const estGas = await coreContract.createBatchSubIds.estimateGas(batchCount);
        gasLimit = (estGas * BigInt(115)) / BigInt(100);
        const minFloor = BigInt(220000 + batchCount * 130000);
        if (gasLimit < minFloor) {
          gasLimit = minFloor;
        }
      } catch (e) {
        console.warn('Could not estimate batch gas, using calculated fallback limit:', e);
        gasLimit = BigInt(220000 + batchCount * 140000);
      }

      const batchTx = await coreContract.createBatchSubIds(batchCount, { gasLimit, chainId: 97 });
      await batchTx.wait(1);

      setStatusMessage(`🎉 Successfully created ${batchCount} Sub-IDs!`);
      alert(`🎉 Success! ${batchCount} Sub-IDs created automatically!`);

      await loadOwnedIds();
    } catch (err: any) {
      console.error('Batch creation error:', err);
      let msg = err.reason;
      if (!msg) {
        if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
          msg = 'Transaction rejected by user in wallet.';
        } else if (err.message?.includes('insufficient funds')) {
          msg = 'Insufficient BNB balance for network gas fees!';
        } else if (err.shortMessage) {
          msg = err.shortMessage;
        } else {
          msg = 'Transaction execution reverted. Please verify your wallet balance and network connection.';
        }
      }
      setStatusMessage(`❌ Error: ${msg}`);
      alert(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    if (mainUserId === 0) {
      alert('Please register your Main ID on the Dashboard first!');
      return;
    }

    // Compulsory Placement ID Validation
    if (!manualPlacementId || manualPlacementId.trim() === '' || Number(manualPlacementId) <= 0) {
      alert('Placement Parent ID is COMPULSORY! Please specify a valid Placement ID.');
      return;
    }

    if (!placementStatus.isEligible) {
      alert(`❌ Not Eligible for placement Id! ${placementStatus.message}`);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Verifying USDT balance for 100 USDT Sub-ID creation...');

    try {
      await ensureBscTestnetChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      // 0. Check USDT Balance First
      const balanceWei = await usdtContract.balanceOf(userAddr);
      if (balanceWei < entryFeeWei) {
        const balFormatted = Number(ethers.formatEther(balanceWei)).toLocaleString();
        const errStr = `Insufficient Mock USDT balance! You currently have ${balFormatted} USDT, but 100 USDT is required to create a Sub-ID. Please click "Claim 1,000 USDT Faucet" below.`;
        setStatusMessage(`❌ ${errStr}`);
        alert(`❌ ${errStr}`);
        setIsSubmitting(false);
        return;
      }

      let allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Approving 100 USDT transfer...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256, { chainId: 97 });
        await approveTx.wait(1);
        allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
        if (allowance < entryFeeWei) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      const pId = Number(manualPlacementId);

      // Pre-validate Placement Parent ID against the 3 placement rules
      try {
        const pUserData = await coreContract.users(pId);
        if (!pUserData.active) {
          alert(`Placement Parent ID GR${pId} does not exist or is inactive!`);
          setIsSubmitting(false);
          return;
        }

        const pActiveBoardId = Number(await coreContract.userActiveBoardUnit(pId));
        if (pActiveBoardId === 0) {
          alert(`Placement Parent ID GR${pId} has no active board unit!`);
          setIsSubmitting(false);
          return;
        }

        const boardPositions = await coreContract.getBoardUnitPositions(pActiveBoardId);
        const boardLevel = pActiveBoardId >= 1000 ? Math.floor(pActiveBoardId / 1000) : 1;

        if (boardLevel > 1) {
          alert(`Manual placement is strictly ONLY allowed in Board Level 1! Placement Parent GR${pId} is in Board Level ${boardLevel}.`);
          setIsSubmitting(false);
          return;
        }

        let parentSlot = -1;
        for (let i = 0; i < 7; i++) {
          if (Number(boardPositions[i]) === pId) {
            parentSlot = i;
            break;
          }
        }

        if (parentSlot >= 3) {
          alert(`Cannot use bottom row position (Pos 4-7) as placement parent! Placement Parent GR${pId} is currently in Position ${parentSlot + 1}.`);
          setIsSubmitting(false);
          return;
        }

        if (parentSlot === 0) {
          if (Number(boardPositions[1]) > 0 && Number(boardPositions[2]) > 0) {
            alert(`Placement Parent GR${pId} already has 2 direct placement children filled! Please choose another placement parent.`);
            setIsSubmitting(false);
            return;
          }
        } else if (parentSlot === 1) {
          if (Number(boardPositions[3]) > 0 && Number(boardPositions[4]) > 0) {
            alert(`Placement Parent GR${pId} already has 2 direct placement children filled! Please choose another placement parent.`);
            setIsSubmitting(false);
            return;
          }
        } else if (parentSlot === 2) {
          if (Number(boardPositions[5]) > 0 && Number(boardPositions[6]) > 0) {
            alert(`Placement Parent GR${pId} already has 2 direct placement children filled! Please choose another placement parent.`);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Pre-validation notice:', e);
      }

      setStatusMessage(`Creating Sub-ID under Sponsor ID GR${manualSponsorId} and Placement ID #${pId}...`);
      
      let gasLimit: bigint;
      try {
        const estGas = await coreContract.createSubId.estimateGas(manualSponsorId, pId);
        gasLimit = (estGas * BigInt(115)) / BigInt(100);
        if (gasLimit < BigInt(320000)) {
          gasLimit = BigInt(320000);
        }
      } catch (e) {
        console.warn('Could not estimate single sub-id gas, using fallback limit:', e);
        gasLimit = BigInt(380000);
      }

      const createTx = await coreContract.createSubId(manualSponsorId, pId, { gasLimit, chainId: 97 });
      await createTx.wait(1);

      setStatusMessage('🎉 Sub-ID successfully registered!');
      alert('🎉 Sub-ID registered successfully!');

      setManualPlacementId('');
      await loadOwnedIds();
    } catch (err: any) {
      console.error('Single Sub-ID error:', err);
      let msg = err.reason;
      if (!msg) {
        if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
          msg = 'Transaction rejected by user in wallet.';
        } else if (err.message?.includes('insufficient funds')) {
          msg = 'Insufficient BNB balance for network gas fees!';
        } else if (err.shortMessage) {
          msg = err.shortMessage;
        } else {
          msg = 'Transaction execution reverted. Please check your wallet balance and placement details.';
        }
      }
      setStatusMessage(`❌ Error: ${msg}`);
      alert(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-sky-600 uppercase tracking-wider">Sub-ID Management Hub</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Sub-IDs Manager</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create Sub-IDs under your owned ID network. Level income generated by Sub-IDs is credited directly to your Main User account.
          </p>
        </div>

        <Link
          href="/sub-ids/my-sub-ids"
          className="px-4 py-2.5 bg-slate-900 hover:bg-purple-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
        >
          <span>🤖</span> View My Sub-IDs Directory
        </Link>
      </div>

      {/* Wallet Balance & Faucet Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest">Testnet Wallet USDT Balance</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {Number(usdtBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
            {account && <span className="text-xs text-slate-400 font-mono">({account.slice(0, 6)}...{account.slice(-4)})</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Creating Sub-IDs requires 100 Mock USDT per Sub-ID on BSC Testnet.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClaimFaucet}
          disabled={isClaimingFaucet}
          className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <span>🪙</span>
          <span>{isClaimingFaucet ? 'Minting 1,000 USDT...' : 'Claim 1,000 Mock USDT Faucet'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs font-bold text-sky-800 shadow-sm flex items-center gap-2">
          <span>ℹ️</span> {statusMessage}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md">
        <button
          onClick={() => setSelectedTab('manual')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedTab === 'manual'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          ✍️ Manual Create (Single)
        </button>
        <button
          onClick={() => setSelectedTab('auto')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedTab === 'auto'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          ⚡ Auto Create (Max 5 Batch)
        </button>
      </div>

      {/* Tab 1: Manual Single Sub-ID Creation */}
      {selectedTab === 'manual' && (
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Manual Sub-ID Creation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your Sponsor ID from all IDs created under your wallet address, then enter a Placement Parent ID.
            </p>
          </div>

          <form onSubmit={handleCreateManual} className="space-y-6">
            {/* Step 1: Sponsor ID Dropdown */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Sponsor ID (From Your Owned IDs) <span className="text-rose-500">*</span>
              </label>
              {ownedIds.length > 0 ? (
                <select
                  value={manualSponsorId}
                  onChange={(e) => setManualSponsorId(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
                >
                  {ownedIds.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.display}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-800">
                  ⚠️ Main ID registration required first on Dashboard to view permitted sponsor IDs.
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Sub-IDs inherit sponsor relationships exclusively from your owned network.
              </p>
            </div>

            {/* Step 2: Placement Parent ID (Compulsory) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  2. Placement Parent ID <span className="text-rose-500 font-bold">* COMPULSORY</span>
                </label>
                {placementStatus.isChecking ? (
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full animate-pulse border border-sky-200">
                    ⏳ Checking Eligibility...
                  </span>
                ) : manualPlacementId.trim() ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    placementStatus.isEligible 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300' 
                      : 'text-rose-700 bg-rose-50 border-rose-300'
                  }`}>
                    {placementStatus.isEligible ? '✓ Eligible' : '❌ Not Eligible for placement Id'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Required
                  </span>
                )}
              </div>
              <input
                type="number"
                required
                min={1}
                value={manualPlacementId}
                onChange={(e) => setManualPlacementId(e.target.value)}
                placeholder="Enter target Placement Parent ID (e.g. 1)..."
                className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all shadow-sm ${
                  manualPlacementId.trim()
                    ? placementStatus.isEligible
                      ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                      : 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:border-sky-500'
                }`}
              />
              {placementStatus.message ? (
                <div className={`mt-2 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  placementStatus.isEligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <span>{placementStatus.isEligible ? '✅' : '🚨'}</span>
                  <span>{placementStatus.message}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the numeric Placement ID where this Sub-ID will be placed in the 7-position board tree.
                </p>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Required Entry Fee:</span>
              <span className="font-mono font-black text-emerald-600 text-base">100 USDT</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || ownedIds.length === 0}
              className="w-full btn-primary-blue py-4 rounded-2xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? 'Registering Sub-ID...' : 'Register Sub-ID (100 USDT)'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Automatic Batch Creation (Max 5) */}
      {selectedTab === 'auto' && (
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Automatic Batch Sub-ID Creation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter the quantity of Sub-IDs to create (Max 5). Placements and sponsor tree are assigned automatically by smart contract logic.
            </p>
          </div>

          <form onSubmit={handleCreateBatch} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Enter Number of Sub-IDs (Max 5) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {batchCount} Sub-ID{batchCount > 1 ? 's' : ''}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={5}
                value={batchCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setBatchCount(Math.min(5, Math.max(1, val)));
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
              />
              <div className="flex gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBatchCount(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      batchCount === num
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} ID{num > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Cost Display Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Entry Fee Per Sub-ID</span>
                <span className="font-mono font-bold text-slate-200">100 USDT</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Batch Quantity</span>
                <span className="font-mono font-bold text-sky-400">{batchCount} Sub-ID{batchCount > 1 ? 's' : ''}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-300">Total Required Amount:</span>
                <span className="text-emerald-400 text-2xl font-mono font-black">${totalBatchCost} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary-emerald py-4 rounded-2xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? 'Processing Batch Creation...' : `Approve & Create ${batchCount} Sub-ID${batchCount > 1 ? 's' : ''} ($${totalBatchCost} USDT)`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
