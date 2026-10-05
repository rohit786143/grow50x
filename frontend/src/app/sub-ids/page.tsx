'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI } from '../../config/contracts';

export default function SubIdsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [ownedIds, setOwnedIds] = useState<{ id: number; display: string }[]>([]);
  const [selectedTab, setSelectedTab] = useState<'manual' | 'auto'>('manual');
  
  // Auto Batch State (Max 5)
  const [batchCount, setBatchCount] = useState<number>(1);
  
  // Manual State
  const [manualSponsorId, setManualSponsorId] = useState<number>(0);
  const [manualPlacementId, setManualPlacementId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

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
    setStatusMessage(`Approving ${totalBatchCost} USDT for ${batchCount} Sub-IDs...`);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const totalCostWei = ethers.parseEther(totalBatchCost.toString());

      // 1. Check Allowance
      let allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < totalCostWei) {
        setStatusMessage('Approving USDT transfer (Step 1/2)...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        await approveTx.wait(2);
        allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
        if (allowance < totalCostWei) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        setStatusMessage('USDT approval confirmed! Creating Sub-ID batch...');
      }

      // 2. Execute Batch Sub-ID Creation
      setStatusMessage(`Creating ${batchCount} Sub-IDs automatically (Step 2/2)...`);
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

      const batchTx = await coreContract.createBatchSubIds(batchCount, { gasLimit });
      await batchTx.wait();


      setStatusMessage(`🎉 Successfully created ${batchCount} Sub-IDs!`);
      alert(`🎉 Success! ${batchCount} Sub-IDs created automatically!`);

      await loadOwnedIds();
    } catch (err: any) {
      console.error('Batch creation error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
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

    setIsSubmitting(true);
    setStatusMessage('Approving 100 USDT...');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      let allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Approving 100 USDT transfer...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        await approveTx.wait(2);
        allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
        if (allowance < entryFeeWei) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
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


      const createTx = await coreContract.createSubId(manualSponsorId, pId, { gasLimit });
      await createTx.wait();

      setStatusMessage('🎉 Sub-ID successfully registered!');
      alert('🎉 Sub-ID registered successfully!');

      setManualPlacementId('');
      await loadOwnedIds();
    } catch (err: any) {
      console.error('Single Sub-ID error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
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
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Required
                </span>
              </div>
              <input
                type="number"
                required
                min={1}
                value={manualPlacementId}
                onChange={(e) => setManualPlacementId(e.target.value)}
                placeholder="Enter target Placement Parent ID (e.g. 1)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter the numeric Placement ID where this Sub-ID will be placed in the 7-position board tree.
              </p>
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
