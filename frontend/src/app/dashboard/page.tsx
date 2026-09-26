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
  const [directIncome, setDirectIncome] = useState<string>('0.00');
  const [shareIncome, setShareIncome] = useState<string>('0.00');
  const [levelIncome, setLevelIncome] = useState<string>('0.00');
  const [boardRewards, setBoardRewards] = useState<string>('0.00');
  const [lifetimeShareEarned, setLifetimeShareEarned] = useState<string>('0.00');
  const [currentBoardCap, setCurrentBoardCap] = useState<string>('200.00');

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

      // Read Main User ID for wallet
      const mId = await coreContract.walletToMainUserId(userWallet);
      const numericMainId = Number(mId);
      setMainUserId(numericMainId);

      if (numericMainId === 0) {
        // Not registered yet -> 0 state
        setDisplayId('Not Registered');
        setCurrentBoard(1);
        setDirectCount(0);
        setTotalOwnedIds(0);
        setDirectIncome('0.00');
        setShareIncome('0.00');
        setLevelIncome('0.00');
        setBoardRewards('0.00');
        setLifetimeShareEarned('0.00');
        setCurrentBoardCap('200.00');
      } else {
        // Registered User -> Fetch real contract data
        setDisplayId(`GR${numericMainId.toString().padStart(5, '0')}`);

        const userData = await coreContract.users(numericMainId);
        setCurrentBoard(Number(userData.currentBoard));
        setDirectCount(Number(userData.directCount));

        const subIdsList = await coreContract.ownerSubIds(numericMainId);
        setTotalOwnedIds(1 + subIdsList.length);

        const incomeData = await coreContract.userIncomes(numericMainId);
        setDirectIncome(parseFloat(ethers.formatEther(incomeData.directIncome)).toFixed(2));
        setShareIncome(parseFloat(ethers.formatEther(incomeData.shareIncome)).toFixed(2));
        setLevelIncome(parseFloat(ethers.formatEther(incomeData.levelIncome)).toFixed(2));
        setBoardRewards(parseFloat(ethers.formatEther(incomeData.boardRewards)).toFixed(2));
        setLifetimeShareEarned(parseFloat(ethers.formatEther(incomeData.lifetimeShareIncomeEarned)).toFixed(2));

        const cap = await coreContract.getBoardCap(userData.currentBoard);
        setCurrentBoardCap(parseFloat(ethers.formatEther(cap)).toFixed(2));
      }
    } catch (err) {
      console.error('Error loading Web3 contract data:', err);
    }
  };

  const getRequiredDirects = (board: number) => {
    if (board === 1) return 2;
    if (board === 2) return 3;
    if (board === 3) return 4;
    return 5;
  };

  const requiredDirects = getRequiredDirects(currentBoard);
  const remainingShareCap = Math.max(0, parseFloat(currentBoardCap) - parseFloat(lifetimeShareEarned));
  const shareCapPercentage = Math.min(100, (parseFloat(lifetimeShareEarned) / (parseFloat(currentBoardCap) || 1)) * 100);

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

      // 1. Check Allowance
      const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Approving USDT transfer (Step 1/2)...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        console.log('Approve TX:', approveTx.hash);
        await approveTx.wait();
        setStatusMessage('USDT approval confirmed! Registering Main ID...');
      }

      // 2. Execute Registration
      const sponsorIdNum = parseInt(sponsorInput) || 1;
      const placementIdNum = parseInt(manualPlacementInput) || 0;

      setStatusMessage('Submitting Registration to BSC Testnet (Step 2/2)...');
      const regTx = await coreContract.registerMainUser(sponsorIdNum, placementIdNum);
      console.log('Register TX:', regTx.hash);
      await regTx.wait();

      setStatusMessage('🎉 Registration confirmed on BNB Smart Chain!');
      alert('🎉 Success! Main User ID registered on BSC Testnet!');

      await loadWeb3Data();
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      setStatusMessage(`❌ Registration Error: ${msg}`);
      alert(`Registration Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Live Blockchain State</span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">
            Main ID: <span className="gradient-text">{displayId}</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {account ? account : 'Wallet Not Connected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Owned IDs</span>
            <p className="text-xl font-black text-cyan-400">{totalOwnedIds}</p>
          </div>
          <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Board</span>
            <p className="text-xl font-black text-emerald-400">Board {currentBoard}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Direct Qualification Progress */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Direct Qualification</span>
            <span className="text-xs font-bold text-cyan-400">
              {directCount} / {requiredDirects} Directs
            </span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (directCount / (requiredDirects || 1)) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {directCount >= requiredDirects
              ? `✓ Fully qualified for Board ${currentBoard + 1} advancement`
              : `Requires ${requiredDirects - directCount} more direct sponsors for board advancement.`}
          </p>
        </div>

        {/* Lifetime Share Income Cap Progress */}
        <div className="glass-card p-6 rounded-3xl space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Share Income vs Board Cap</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                ${lifetimeShareEarned} USDT Earned / ${currentBoardCap} USDT Max (Board {currentBoard})
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
              Remaining: ${remainingShareCap.toFixed(2)} USDT
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${shareCapPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Note: Cumulative share income cap DOES NOT reset when advancing boards.
          </p>
        </div>
      </div>

      {/* Income Category Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200">Income Accounting Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Direct Sponsor Income</span>
            <p className="text-2xl font-black text-cyan-400 mt-2">
              ${directIncome} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">10-Day Share Pool</span>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              ${shareIncome} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Sub-ID Level Income</span>
            <p className="text-2xl font-black text-indigo-400 mt-2">
              ${levelIncome} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Board Completion Rewards</span>
            <p className="text-2xl font-black text-purple-400 mt-2">
              ${boardRewards} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Form for New Main ID */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 max-w-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100">Register New Main ID</h2>
          {mainUserId > 0 ? (
            <span className="text-xs bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800/50 font-semibold">
              ✓ Registered (Main ID #{mainUserId})
            </span>
          ) : (
            <span className="text-xs bg-amber-950 text-amber-400 px-3 py-1 rounded-full border border-amber-800/50 font-semibold">
              Ready for 1st User Registration
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Entry Fee: <strong className="text-cyan-400 font-semibold">100 USDT</strong>. Requires approving USDT transfer to smart contract.
        </p>

        {statusMessage && (
          <div className="p-3 bg-slate-900 rounded-xl border border-cyan-800/50 text-xs font-semibold text-cyan-300">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleRegisterMainUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sponsor ID (Numeric ID, Default: 1 for 1st User)
            </label>
            <input
              type="number"
              value={sponsorInput}
              onChange={(e) => setSponsorInput(e.target.value)}
              placeholder="e.g. 1"
              required
              min={1}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Manual Placement ID (Optional - Leave 0 for Auto Placement)
            </label>
            <input
              type="number"
              value={manualPlacementInput}
              onChange={(e) => setManualPlacementInput(e.target.value)}
              placeholder="0 (Auto Placement)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-btn py-3.5 rounded-xl font-bold text-slate-950 text-sm shadow-md transition-transform"
          >
            {isSubmitting ? 'Processing Transaction on BSC Testnet...' : 'Register Main ID (100 USDT)'}
          </button>
        </form>
      </div>
    </div>
  );
}
