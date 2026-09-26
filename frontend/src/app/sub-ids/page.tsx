'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI } from '../../config/contracts';

export default function SubIdsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [ownedIds, setOwnedIds] = useState<{ id: number; display: string }[]>([]);
  const [selectedTab, setSelectedTab] = useState<'manual' | 'auto'>('auto');
  const [batchCount, setBatchCount] = useState<number>(20);
  const [manualSponsorId, setManualSponsorId] = useState<number>(1);
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

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mIdRaw = await coreContract.walletToMainUserId(userWallet);
      const mId = Number(mIdRaw);
      setMainUserId(mId);

      if (mId > 0) {
        setManualSponsorId(mId);
        const subIdsRaw = await coreContract.ownerSubIds(mId);
        const list = [{ id: mId, display: `GR${mId.toString().padStart(5, '0')} (Main ID)` }];
        subIdsRaw.forEach((subIdBig: any, idx: number) => {
          const sId = Number(subIdBig);
          list.push({ id: sId, display: `GR${sId.toString().padStart(5, '0')} (Sub-ID ${idx + 1})` });
        });
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
      const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < totalCostWei) {
        setStatusMessage('Approving USDT transfer (Step 1/2)...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        await approveTx.wait();
        setStatusMessage('USDT approval confirmed! Creating Sub-ID batch...');
      }

      // 2. Execute Batch Sub-ID Creation
      setStatusMessage(`Creating ${batchCount} Sub-IDs on BSC Testnet (Step 2/2)...`);
      const batchTx = await coreContract.createBatchSubIds(batchCount);
      console.log('Batch TX:', batchTx.hash);
      await batchTx.wait();

      setStatusMessage(`🎉 Successfully created ${batchCount} Sub-IDs on BSC Testnet!`);
      alert(`🎉 Success! ${batchCount} Sub-IDs created!`);

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

    setIsSubmitting(true);
    setStatusMessage('Approving 100 USDT...');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Approving USDT transfer...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        await approveTx.wait();
      }

      setStatusMessage('Creating Sub-ID on BSC Testnet...');
      const createTx = await coreContract.createSubId(manualSponsorId, 0);
      await createTx.wait();

      setStatusMessage('🎉 Sub-ID successfully created!');
      alert('🎉 Sub-ID created!');

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
      <div>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Sub-ID Management Hub</span>
        <h1 className="text-3xl font-black text-slate-100 mt-1">Create Sub-IDs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sub-IDs inherit sponsor relationships exclusively from your owned ID network. Level income generated by Sub-IDs is aggregated to your Main User account.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-slate-900 rounded-xl border border-cyan-800/50 text-xs font-semibold text-cyan-300">
          {statusMessage}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setSelectedTab('auto')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            selectedTab === 'auto'
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Auto Create (1–20 Batch)
        </button>
        <button
          onClick={() => setSelectedTab('manual')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            selectedTab === 'manual'
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Manual Create (Single)
        </button>
      </div>

      {/* Tab Content: Automatic Batch Creation */}
      {selectedTab === 'auto' && (
        <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Automatic 2-by-2 Binary Batch System</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Generates a deterministic breadth-first binary sponsor tree. Sub 1 & 2 sponsored by Main ID; Sub 3 & 4 sponsored by Sub 1; Sub 5 & 6 sponsored by Sub 2, and so forth.
            </p>
          </div>

          <form onSubmit={handleCreateBatch} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-200">Select Batch Quantity (Max 20)</label>
                <span className="text-sm font-bold text-cyan-400">{batchCount} Sub-IDs</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
              </div>
            </div>

            {/* Cost Preview Card */}
            <div className="glass-card p-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Entry Fee Per Sub-ID</span>
                <span className="font-semibold text-slate-200">100 USDT</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Selected Quantity</span>
                <span className="font-semibold text-slate-200">{batchCount} Sub-IDs</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold">
                <span className="text-slate-200">Total Required USDT</span>
                <span className="text-emerald-400 text-lg">${totalBatchCost} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-btn py-3.5 rounded-xl font-bold text-slate-950 text-sm shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? 'Processing Batch Sub-IDs on BSC...' : `Approve & Create ${batchCount} Sub-IDs ($${totalBatchCost} USDT)`}
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Manual Single Creation */}
      {selectedTab === 'manual' && (
        <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Manual Single Sub-ID Creation</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a specific sponsor from your owned IDs list. Unrelated external IDs are strictly prohibited by protocol smart contracts.
            </p>
          </div>

          <form onSubmit={handleCreateManual} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Permitted Sponsor ID</label>
              {ownedIds.length > 0 ? (
                <select
                  value={manualSponsorId}
                  onChange={(e) => setManualSponsorId(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {ownedIds.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.display}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400">Main ID registration required first to view permitted sponsors.</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                🔒 On-chain check enforces `users[sponsorId].ownerMainUserId == msg.sender`
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || ownedIds.length === 0}
              className="w-full gradient-btn py-3.5 rounded-xl font-bold text-slate-950 text-sm shadow-md"
            >
              {isSubmitting ? 'Creating Sub-ID...' : 'Create Sub-ID (100 USDT)'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
