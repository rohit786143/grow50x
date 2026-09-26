'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI } from '../../config/contracts';

export default function DashboardPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [displayId, setDisplayId] = useState<string>('GR00000');
  const [currentBoard, setCurrentBoard] = useState<number>(1);
  const [directCount, setDirectCount] = useState<number>(0);
  const [totalOwnedIds, setTotalOwnedIds] = useState<number>(0);

  // Income States
  const [directIncome, setDirectIncome] = useState<number>(0);
  const [shareIncome, setShareIncome] = useState<number>(0);
  const [levelIncome, setLevelIncome] = useState<number>(0);
  const [boardRewards, setBoardRewards] = useState<number>(0);
  const [lifetimeShareEarned, setLifetimeShareEarned] = useState<number>(0);
  const [currentBoardCap, setCurrentBoardCap] = useState<number>(200);

  // Form States
  const [sponsorInput, setSponsorInput] = useState<string>('1');
  const [manualPlacementInput, setManualPlacementInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    loadWeb3Data();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', () => loadWeb3Data());
      ethereum.on('chainChanged', () => loadWeb3Data());
    }
  }, []);

  const loadWeb3Data = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) return;

      const userWallet = accounts[0];
      setAccount(userWallet);

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mId = await coreContract.walletToMainUserId(userWallet);
      const numericMainId = Number(mId);
      setMainUserId(numericMainId);

      if (numericMainId === 0) {
        setDisplayId('Not Registered');
        setCurrentBoard(1);
        setDirectCount(0);
        setTotalOwnedIds(0);
        setDirectIncome(0);
        setShareIncome(0);
        setLevelIncome(0);
        setBoardRewards(0);
        setLifetimeShareEarned(0);
        setCurrentBoardCap(200);
      } else {
        setDisplayId(`GR${numericMainId.toString().padStart(5, '0')}`);

        const userData = await coreContract.users(numericMainId);
        setCurrentBoard(Number(userData.currentBoard));
        setDirectCount(Number(userData.directCount));

        const subIdsList = await coreContract.ownerSubIds(numericMainId);
        setTotalOwnedIds(1 + subIdsList.length);

        const incomeData = await coreContract.userIncomes(numericMainId);
        setDirectIncome(parseFloat(ethers.formatEther(incomeData.directIncome)));
        setShareIncome(parseFloat(ethers.formatEther(incomeData.shareIncome)));
        setLevelIncome(parseFloat(ethers.formatEther(incomeData.levelIncome)));
        setBoardRewards(parseFloat(ethers.formatEther(incomeData.boardRewards)));
        setLifetimeShareEarned(parseFloat(ethers.formatEther(incomeData.lifetimeShareIncomeEarned)));

        const cap = await coreContract.getBoardCap(userData.currentBoard);
        setCurrentBoardCap(parseFloat(ethers.formatEther(cap)));
      }
    } catch (err) {
      console.error('Error loading Web3 data:', err);
    }
  };

  const getRequiredDirects = (board: number) => {
    if (board === 1) return 2;
    if (board === 2) return 3;
    if (board === 3) return 4;
    return 5;
  };

  const requiredDirects = getRequiredDirects(currentBoard);
  const totalEarnedIncome = directIncome + shareIncome + levelIncome + boardRewards;
  const remainingShareCap = Math.max(0, currentBoardCap - lifetimeShareEarned);
  const shareCapPercentage = Math.min(100, (lifetimeShareEarned / (currentBoardCap || 1)) * 100);

  const handleRegisterMainUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or Web3 Wallet required');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Checking USDT allowance...');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Step 1/2: Approving 100 USDT transfer...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        await approveTx.wait();
        setStatusMessage('Step 1/2 Confirmed! Submitting Registration...');
      }

      const sponsorIdNum = parseInt(sponsorInput) || 1;
      const placementIdNum = parseInt(manualPlacementInput) || 0;

      setStatusMessage('Step 2/2: Confirming Registration on BSC Testnet...');
      const regTx = await coreContract.registerMainUser(sponsorIdNum, placementIdNum);
      await regTx.wait();

      setStatusMessage('🎉 Registration confirmed on BNB Smart Chain!');
      alert('🎉 Success! Main User ID registered!');

      await loadWeb3Data();
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      setStatusMessage(`❌ Error: ${msg}`);
      alert(`Registration Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Live Account Telemetry</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            Main ID: <span className="gradient-text-blue">{displayId}</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {account ? account : 'Wallet Not Connected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Owned IDs</span>
            <p className="text-xl font-black text-sky-600">{totalOwnedIds}</p>
          </div>
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Board</span>
            <p className="text-xl font-black text-emerald-600">Board {currentBoard}</p>
          </div>
        </div>
      </div>

      {/* 💎 TOTAL COMBINED INCOME CARD */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white p-6 lg:p-8 rounded-2xl shadow-lg shadow-sky-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Aggregated Earnings</span>
          <h2 className="text-3xl lg:text-4xl font-black mt-1">💎 Total Earned Income</h2>
          <p className="text-xs text-sky-100/80 mt-1">
            Combined sum of Direct Income + Board Completion Rewards + 10-Day Share Pool + Sub-ID Level Income
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs font-bold text-sky-200 uppercase">Total Income Balance</span>
          <p className="text-4xl font-black text-white mt-1">${totalEarnedIncome.toFixed(2)} <span className="text-base font-normal text-sky-200">USDT</span></p>
        </div>
      </div>

      {/* Main Qualification & Cap Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Direct Qualification */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Direct Qualification</span>
            <span className="text-xs font-bold text-sky-600">
              {directCount} / {requiredDirects} Directs
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (directCount / (requiredDirects || 1)) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {directCount >= requiredDirects
              ? `✓ Fully qualified for Board ${currentBoard + 1} advancement`
              : `Requires ${requiredDirects - directCount} more direct sponsors for board advancement.`}
          </p>
        </div>

        {/* Lifetime Share Income Cap */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Share Income vs Board Cap</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                ${lifetimeShareEarned.toFixed(2)} USDT Earned / ${currentBoardCap.toFixed(2)} USDT Max (Board {currentBoard})
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Remaining: ${remainingShareCap.toFixed(2)} USDT
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${shareCapPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Note: Cumulative share income cap DOES NOT reset when advancing boards.
          </p>
        </div>
      </div>

      {/* Income Stream Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Income Accounting Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Direct Sponsor Income</span>
            <p className="text-2xl font-black text-sky-600 mt-2">
              ${directIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">10-Day Share Pool</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              ${shareIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Sub-ID Level Income</span>
            <p className="text-2xl font-black text-indigo-600 mt-2">
              ${levelIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Board Completion Rewards</span>
            <p className="text-2xl font-black text-purple-600 mt-2">
              ${boardRewards.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Section */}
      {mainUserId === 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Register Main ID</h2>
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 font-semibold">
              Ready for Registration
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Entry Fee: <strong className="text-sky-600 font-semibold">100 USDT</strong>. Requires approving USDT transfer to smart contract.
          </p>

          {statusMessage && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs font-semibold text-sky-800">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleRegisterMainUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sponsor ID (Numeric ID)
              </label>
              <input
                type="number"
                value={sponsorInput}
                onChange={(e) => setSponsorInput(e.target.value)}
                placeholder="1"
                required
                min={1}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manual Placement ID (Optional - Leave 0 for Auto Placement)
              </label>
              <input
                type="number"
                value={manualPlacementInput}
                onChange={(e) => setManualPlacementInput(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary-blue py-3.5 rounded-xl font-bold text-sm shadow-md"
            >
              {isSubmitting ? 'Processing Transaction...' : 'Register Main ID (100 USDT)'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
