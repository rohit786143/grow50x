'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, isAdminWallet, getAdminIndex } from '../../config/contracts';
import PlanPresentation from '../../components/PlanPresentation';
import { useWeb3 } from '../../context/Web3Context';


// Helper function to calculate exact next calendar cutoff date (9th, 19th, or 29th of the month)
function getNextSharePoolCutoff(fromDate: Date = new Date()): Date {
  const year = fromDate.getUTCFullYear();
  const month = fromDate.getUTCMonth(); // 0-indexed (0 = Jan, 1 = Feb, etc.)
  const day = fromDate.getUTCDate();

  if (day < 9) {
    return new Date(Date.UTC(year, month, 9, 0, 0, 0));
  } else if (day < 19) {
    return new Date(Date.UTC(year, month, 19, 0, 0, 0));
  } else if (day < 29) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    if (daysInMonth >= 29) {
      return new Date(Date.UTC(year, month, 29, 0, 0, 0));
    } else {
      return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
    }
  } else {
    return new Date(Date.UTC(year, month + 1, 9, 0, 0, 0));
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold">Loading Live Account Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectParam = searchParams?.get('inspect') || searchParams?.get('ghostId') || searchParams?.get('user') || searchParams?.get('id');
  const ghostTargetId = inspectParam ? Number(inspectParam) : 0;

  const { account, mainUserId, selectedUserId, isSubIdSelected, isRegistered } = useWeb3();
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

  // Unclaimed Income States for Direct Claim Buttons
  const [unclaimedDirect, setUnclaimedDirect] = useState<number>(0);
  const [unclaimedLevel, setUnclaimedLevel] = useState<number>(0);
  const [unclaimedBoardRewards, setUnclaimedBoardRewards] = useState<number>(0);
  const [unclaimedShareIncome, setUnclaimedShareIncome] = useState<number>(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState<number>(0);
  const [claimingCategory, setClaimingCategory] = useState<string>('');


  // 10-Day Calendar Share Pool & Live Timer States
  const [targetTimestamp, setTargetTimestamp] = useState<number>(0);
  const [nextCutoffDateStr, setNextCutoffDateStr] = useState<string>('');
  const [periodId, setPeriodId] = useState<number>(1);
  const [sharePoolBal, setSharePoolBal] = useState<number>(0);
  const [totalShares, setTotalShares] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; totalSec: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSec: 0,
  });

  // Action States
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const activeTargetId = ghostTargetId > 0 ? ghostTargetId : selectedUserId > 0 ? selectedUserId : mainUserId;

  useEffect(() => {
    if (isAdminWallet(account) && ghostTargetId === 0) {
      router.push('/admin');
    } else if (ghostTargetId > 0) {
      loadWeb3Data('0x0000000000000000000000000000000000000000', ghostTargetId);
    } else if (account && isRegistered && activeTargetId > 0) {
      loadWeb3Data(account, activeTargetId);
    }
  }, [account, isRegistered, mainUserId, selectedUserId, ghostTargetId]);


  // Live Timer Countdown Effect (Updates every 1s)
  useEffect(() => {
    const updateTimer = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const targetSec = targetTimestamp > 0 ? targetTimestamp : Math.floor(getNextSharePoolCutoff().getTime() / 1000);
      const diff = Math.max(0, targetSec - nowSec);

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = Math.floor(diff % 60);

      setTimeLeft({ days, hours, minutes, seconds, totalSec: diff });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  const formatDisplayId = (id: number) => {
    if (!id || id <= 0) return '';
    return `GR${id.toString().padStart(6, '0')}`;
  };

  const loadWeb3Data = async (userWallet: string, numericMainId: number) => {
    try {
      let provider: any = null;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
      } else {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
        provider = new ethers.JsonRpcProvider(rpcUrl);
      }
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

      setDisplayId(formatDisplayId(numericMainId));

      let uBoard = 1;
      let uDirects = 0;

      try {
        const userData = await coreContract.users(numericMainId);
        uBoard = Number(userData.currentBoard) || 1;
        uDirects = Number(userData.directCount) || 0;
        setCurrentBoard(uBoard);
        setDirectCount(uDirects);
      } catch (e) {
        console.warn('Could not read user data from contract:', e);
      }

      try {
        const subIdsList = await coreContract.getOwnerSubIds(numericMainId);
        setTotalOwnedIds(1 + subIdsList.length);
      } catch (e) {
        setTotalOwnedIds(1);
      }

      let rawDirect = 0;
      let rawShare = 0;
      let rawLevel = 0;
      let rawBoardRewards = 0;
      let rawLifetimeShare = 0;

      try {
        const incomeData = await coreContract.userIncomes(numericMainId);
        if (incomeData) {
          rawDirect = parseFloat(ethers.formatEther(incomeData.directIncome || incomeData[0] || BigInt(0)));
          rawShare = parseFloat(ethers.formatEther(incomeData.shareIncome || incomeData[1] || BigInt(0)));
          rawLevel = parseFloat(ethers.formatEther(incomeData.levelIncome || incomeData[2] || BigInt(0)));
          rawBoardRewards = parseFloat(ethers.formatEther(incomeData.boardRewards || incomeData[3] || BigInt(0)));
          rawLifetimeShare = parseFloat(ethers.formatEther(incomeData.lifetimeShareIncomeEarned || incomeData[4] || BigInt(0)));
        }
      } catch (e) {
        console.warn('Could not read userIncomes from contract:', e);
      }

      const computedDirect = uDirects * 40;
      const finalDirectIncome = Math.max(rawDirect, computedDirect);

      setDirectIncome(finalDirectIncome);
      setShareIncome(rawShare);
      setLevelIncome(rawLevel);
      setBoardRewards(rawBoardRewards);
      setLifetimeShareEarned(rawLifetimeShare);

      // Fetch Unclaimed Ledgers Summary
      try {
        const summary = await coreContract.getUserUnclaimedSummary(numericMainId);
        setUnclaimedDirect(parseFloat(ethers.formatEther(summary.unclaimedDirect || summary[0] || BigInt(0))));
        setUnclaimedLevel(parseFloat(ethers.formatEther(summary.unclaimedLevel || summary[1] || BigInt(0))));
        setUnclaimedBoardRewards(parseFloat(ethers.formatEther(summary.unclaimedBoardRewards || summary[2] || BigInt(0))));
        setUnclaimedShareIncome(parseFloat(ethers.formatEther(summary.unclaimedShareIncome || summary[3] || BigInt(0))));
        setTotalUnclaimed(parseFloat(ethers.formatEther(summary.totalUnclaimed || summary[4] || BigInt(0))));
      } catch (e) {
        console.warn('Could not fetch unclaimed summary:', e);
      }


      try {
        const cap = await coreContract.getBoardCap(uBoard);
        setCurrentBoardCap(parseFloat(ethers.formatEther(cap)));
      } catch (e) {
        setCurrentBoardCap(uBoard === 1 ? 200 : uBoard === 2 ? 500 : uBoard === 3 ? 1000 : uBoard === 4 ? 2500 : 5000);
      }

      // Fetch 10-Day Share Pool Calendar Cutoff telemetry
      try {
        let onChainTarget = 0;
        try {
          const t = await coreContract.nextPeriodTargetTimestamp();
          onChainTarget = Number(t);
        } catch (e) {
          console.warn('Could not read nextPeriodTargetTimestamp from contract:', e);
        }

        const calculatedCutoff = getNextSharePoolCutoff();
        const finalTargetTs = onChainTarget > 0 ? onChainTarget : Math.floor(calculatedCutoff.getTime() / 1000);

        setTargetTimestamp(finalTargetTs);

        const targetDateObj = new Date(finalTargetTs * 1000);
        setNextCutoffDateStr(targetDateObj.toUTCString().replace('GMT', 'UTC'));

        try {
          const pId = await coreContract.currentPeriodId();
          const poolBal = await coreContract.sharePoolBalance();
          const totShares = await coreContract.getTotalActiveShares();

          setPeriodId(Number(pId));
          setSharePoolBal(parseFloat(ethers.formatEther(poolBal)));
          setTotalShares(Number(totShares));
        } catch (e) {
          console.warn('Could not read periodId/poolBal:', e);
        }
      } catch (e) {
        console.warn('Could not read share pool data:', e);
      }
    } catch (err) {
      console.error('Error loading Web3 data:', err);
    }
  };

  const handleClaimBoardRewards = async () => {
    try {
      setClaimingCategory('board');
      setActionMsg({ text: '🏆 Step 1/2: Please click CONFIRM in MetaMask to claim Board Completion Rewards...', type: 'info' });
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.claimBoardRewards();
      setActionMsg({ text: '⏳ Finalizing Board Reward Claim on BSC Testnet...', type: 'info' });
      await tx.wait(1);

      setActionMsg({ text: '🎉 Board Completion Rewards claimed successfully into your wallet!', type: 'success' });
      alert('🎉 Board Completion Rewards claimed successfully into your wallet!');
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Board claim error:', err);
      setActionMsg({ text: err?.reason || err?.message || 'Board claim transaction failed.', type: 'error' });
    } finally {
      setClaimingCategory('');
    }
  };

  const handleClaimLevelIncome = async () => {
    try {
      setClaimingCategory('level');
      setActionMsg({ text: '⚡ Step 1/2: Please click CONFIRM in MetaMask to claim Sub-ID Level Income...', type: 'info' });
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.claimLevelIncome();
      setActionMsg({ text: '⏳ Finalizing Sub-ID Level Income Claim on BSC Testnet...', type: 'info' });
      await tx.wait(1);

      setActionMsg({ text: '🎉 Sub-ID Level Income claimed successfully into your wallet!', type: 'success' });
      alert('🎉 Sub-ID Level Income claimed successfully into your wallet!');
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Level claim error:', err);
      setActionMsg({ text: err?.reason || err?.message || 'Level claim transaction failed.', type: 'error' });
    } finally {
      setClaimingCategory('');
    }
  };

  const handleClaimDirectIncome = async () => {
    try {
      setClaimingCategory('direct');
      setActionMsg({ text: '💰 Step 1/2: Please click CONFIRM in MetaMask to claim Direct Sponsor Income...', type: 'info' });
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.claimDirectIncome();
      setActionMsg({ text: '⏳ Finalizing Direct Sponsor Income Claim on BSC Testnet...', type: 'info' });
      await tx.wait(1);

      setActionMsg({ text: '🎉 Direct Sponsor Income claimed successfully into your wallet!', type: 'success' });
      alert('🎉 Direct Sponsor Income claimed successfully into your wallet!');
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Direct claim error:', err);
      setActionMsg({ text: err?.reason || err?.message || 'Direct claim transaction failed.', type: 'error' });
    } finally {
      setClaimingCategory('');
    }
  };

  const handleClaimAllUserIncome = async () => {
    try {
      setClaimingCategory('all');
      setActionMsg({ text: '⚡ Step 1/2: Please click CONFIRM in MetaMask for 1-Click All Income Claim...', type: 'info' });
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.claimAllUserIncome();
      setActionMsg({ text: '⏳ Finalizing 1-Click All User Income Claim on BSC Testnet...', type: 'info' });
      await tx.wait(1);

      setActionMsg({ text: '🎉 All accumulated income successfully claimed into your wallet!', type: 'success' });
      alert('🎉 All accumulated income successfully claimed into your wallet!');
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Claim all error:', err);
      setActionMsg({ text: err?.reason || err?.message || '1-Click claim transaction failed.', type: 'error' });
    } finally {
      setClaimingCategory('');
    }
  };

  const handleClaimShareIncome = async () => {
    try {
      setIsClaiming(true);
      setActionMsg(null);
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.claimAllShareIncome();
      setActionMsg({ text: 'Claiming Share Pool Income... Waiting for block confirmation.', type: 'info' });
      await tx.wait();

      setActionMsg({ text: '🎉 Share Pool Income claimed successfully directly to your USDT wallet!', type: 'success' });
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      setActionMsg({ text: err?.reason || err?.message || 'Claim transaction failed.', type: 'error' });
    } finally {
      setIsClaiming(false);
    }
  };


  const handleFinalizePeriod = async () => {
    try {
      setIsFinalizing(true);
      setActionMsg(null);
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.finalizeSharePeriod();
      setActionMsg({ text: 'Finalizing Share Pool Period... Calculating share value for calendar cutoff.', type: 'info' });
      await tx.wait();

      setActionMsg({ text: '✅ Share Period Finalized! Pool funds credited to share accumulator. Users can now claim!', type: 'success' });
      if (activeTargetId > 0) {
        loadWeb3Data(account || '0x0000000000000000000000000000000000000000', activeTargetId);
      }
    } catch (err: any) {
      console.error('Finalize error:', err);
      setActionMsg({ text: err?.reason || err?.message || 'Finalization failed.', type: 'error' });
    } finally {
      setIsFinalizing(false);
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

  // If Wallet is Not Connected AND Not in Admin Ghost Mode:
  if ((!account || mainUserId === 0) && ghostTargetId === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sky-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <p>
              <strong className="font-bold">Dashboard Locked:</strong> {account ? `Wallet (${account.substring(0, 6)}...${account.substring(account.length - 4)}) is not registered yet.` : 'Wallet is not connected.'} Please register your Main ID to unlock live account telemetry.
            </p>
          </div>
        </div>
        <PlanPresentation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 👻 ADMIN GHOST MODE ALERT BANNER */}
      {ghostTargetId > 0 && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border-2 border-purple-500/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">👻</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-400/40 px-2.5 py-0.5 rounded-full">
                  ADMIN GHOST LOGIN ACTIVE
                </span>
                <span className="text-xs text-purple-300 font-bold">READ-ONLY TELEMETRY</span>
              </div>
              <p className="text-sm font-extrabold text-white mt-0.5">
                Inspecting Live Account Dashboard for User ID: <span className="font-mono text-purple-300 font-black text-base">{formatDisplayId(ghostTargetId)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin?tab=users')}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap hover:scale-105"
          >
            <span>⬅️</span> Exit Ghost Mode & Return to Admin
          </button>
        </div>
      )}

      {/* ⏳ TOP SINGLE-LINE CALENDAR SHARE POOL TIMER (9th, 19th, 29th) */}
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-xl -z-0 pointer-events-none" />

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
            Share Pool #{periodId} (9th, 19th, 29th)
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 font-medium">Next Cutoff:</span>
          <span className="text-emerald-400 font-bold">{nextCutoffDateStr || 'Calculating...'}</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs font-bold bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700/70 relative z-10 self-start md:self-auto">
          <span className="text-sky-400">{String(timeLeft.days).padStart(2, '0')}d</span>
          <span className="text-slate-600">:</span>
          <span className="text-sky-400">{String(timeLeft.hours).padStart(2, '0')}h</span>
          <span className="text-slate-600">:</span>
          <span className="text-sky-400">{String(timeLeft.minutes).padStart(2, '0')}m</span>
          <span className="text-slate-600">:</span>
          <span className="text-emerald-400 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-end md:self-auto">
          <div className="text-right text-[11px]">
            <span className="text-slate-400">Pool: </span>
            <strong className="text-emerald-400 font-bold">${sharePoolBal.toFixed(2)} USDT</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClaimShareIncome}
              disabled={isClaiming}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1"
            >
              {isClaiming ? 'Claiming...' : '💰 Claim Share'}
            </button>

            {timeLeft.totalSec === 0 && (
              <button
                onClick={handleFinalizePeriod}
                disabled={isFinalizing}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm"
              >
                {isFinalizing ? 'Finalizing...' : '⚡ Finalize'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMsg && (
        <div className={`p-2.5 rounded-xl text-xs font-semibold border ${
          actionMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' :
          actionMsg.type === 'error' ? 'bg-rose-950/80 border-rose-700 text-rose-200' :
          'bg-sky-950/80 border-sky-700 text-sky-200'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Top Banner - Compact (60% Height Reduction) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white py-2.5 px-4 sm:px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider leading-none">
            Live Account Telemetry ({ghostTargetId > 0 ? 'Admin Ghost Inspection' : isSubIdSelected ? 'Sub-ID Active' : 'Main ID Active'})
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Account ID: <span className="gradient-text-blue">{displayId}</span>
            </h1>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[220px] sm:max-w-[320px]">
              {account ? account : 'On-Chain Public Telemetry'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-center flex items-center gap-2 sm:block">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Owned IDs</span>
            <p className="text-sm font-black text-sky-600 leading-none">{totalOwnedIds}</p>
          </div>
          <div className="bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-center flex items-center gap-2 sm:block">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Board</span>
            <p className="text-sm font-black text-emerald-600 leading-none">Board {currentBoard}</p>
          </div>
        </div>
      </div>

      {/* 💎 TOTAL COMBINED INCOME CARD (Compact Height - Reduced 40%) */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white py-3.5 px-5 sm:px-6 rounded-2xl shadow-md shadow-sky-500/15 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100 leading-none block">Aggregated Earnings</span>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5 leading-tight">💎 Total Earned Income</h2>
          <p className="text-[11px] text-sky-100/80 mt-0.5">
            Combined sum of Direct Income + Board Completion Rewards + 10-Day Share Pool + Sub-ID Level Income
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block">Total Income Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 leading-tight">
            ${totalEarnedIncome.toFixed(2)} <span className="text-xs font-normal text-sky-200">USDT</span>
          </p>
        </div>
      </div>

      {/* Main Qualification & Cap Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Share Income vs Board Cap</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                ${lifetimeShareEarned.toFixed(2)} USDT Earned / ${currentBoardCap.toFixed(2)} USDT Max (Board {currentBoard})
              </p>
            </div>
            {remainingShareCap <= 0 ? (
              <span className="text-xs font-black text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-sm">
                🎉 ALL POOL INCOME RECEIVED (${currentBoardCap.toFixed(2)} MAX CAP COMPLETED)
              </span>
            ) : (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Remaining: ${remainingShareCap.toFixed(2)} USDT
              </span>
            )}
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

      {/* Income Stream Breakdown Cards with Direct Claim Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Income Accounting Breakdown</h2>
            <p className="text-xs text-slate-500">Real-time on-chain revenue accounting &amp; direct withdrawal controls</p>
          </div>

          {totalUnclaimed > 0 && (
            <button
              onClick={handleClaimAllUserIncome}
              disabled={Boolean(claimingCategory)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105 self-start sm:self-auto"
            >
              <span>⚡</span> {claimingCategory === 'all' ? 'Claiming All...' : `1-Click Claim All Income ($${totalUnclaimed.toFixed(2)} USDT)`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Direct Sponsor Income */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Direct Sponsor Income</span>
              <p className="text-xl sm:text-2xl font-black text-sky-600 mt-1">
                ${directIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </p>
            </div>
            {unclaimedDirect > 0 ? (
              <button
                onClick={handleClaimDirectIncome}
                disabled={Boolean(claimingCategory)}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <span>💰</span> {claimingCategory === 'direct' ? 'Claiming...' : `Claim $${unclaimedDirect.toFixed(2)} Direct`}
              </button>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-center inline-block">
                ⚡ Instant Transfer to Wallet
              </span>
            )}
          </div>

          {/* Card 2: 10-Day Share Pool */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">10-Day Share Pool</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                ${shareIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </p>
            </div>
            {unclaimedShareIncome > 0 ? (
              <button
                onClick={handleClaimShareIncome}
                disabled={Boolean(claimingCategory)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <span>🎁</span> {isClaiming ? 'Claiming...' : `Claim $${unclaimedShareIncome.toFixed(2)} Share`}
              </button>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-center inline-block">
                Accumulating Pool Dividends
              </span>
            )}
          </div>

          {/* Card 3: Sub-ID Level Income */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Sub-ID Level Income</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                ${levelIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </p>
            </div>
            {unclaimedLevel > 0 ? (
              <button
                onClick={handleClaimLevelIncome}
                disabled={Boolean(claimingCategory)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <span>⚡</span> {claimingCategory === 'level' ? 'Claiming...' : `Claim $${unclaimedLevel.toFixed(2)} Level`}
              </button>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-center inline-block">
                No Unclaimed Balance
              </span>
            )}
          </div>

          {/* Card 4: Board Completion Rewards */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Board Completion Rewards</span>
              <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
                ${boardRewards.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </p>
            </div>
            {unclaimedBoardRewards > 0 || (boardRewards > 0 && unclaimedBoardRewards === 0) ? (
              unclaimedBoardRewards > 0 ? (
                <button
                  onClick={handleClaimBoardRewards}
                  disabled={Boolean(claimingCategory)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 animate-pulse hover:animate-none"
                >
                  <span>🏆</span> {claimingCategory === 'board' ? 'Claiming...' : `Claim $${unclaimedBoardRewards.toFixed(2)} Reward`}
                </button>
              ) : (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-center inline-block">
                  ✓ Claimed / Paid to Wallet
                </span>
              )
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-center inline-block">
                Complete Board to Earn
              </span>
            )}
          </div>
        </div>
      </div>


      {/* 🔗 DYNAMIC BRIGHT REFERRAL LINK BOX (BELOW INCOME DETAILS - FOR EACH MAIN ID OR SUB-ID) */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-5 sm:p-6 rounded-3xl border-2 border-sky-200/80 shadow-sm text-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white text-sky-600 rounded-2xl border border-sky-200 shadow-sm text-xl">🔗</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Direct Referral Link ({displayId})
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isSubIdSelected
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : 'bg-sky-100 text-sky-700 border-sky-200'
                }`}>
                  {isSubIdSelected ? 'Sub-ID Sponsor Link' : 'Main ID Sponsor Link'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Share this unique link to sponsor direct members &amp; sub-ids directly under account <strong className="text-sky-700 font-extrabold">{displayId}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/register?sponsor=${displayId}` : `http://localhost:3000/register?sponsor=${displayId}`}
              className="w-full bg-white border border-sky-200 text-sky-700 font-mono text-xs font-bold px-4 py-3 rounded-2xl outline-none select-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/register?sponsor=${displayId}` : `http://localhost:3000/register?sponsor=${displayId}`;
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(link);
                  setActionMsg({ text: `✓ Referral link for ${displayId} copied to clipboard!`, type: 'success' });
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>📋</span>
              <span>Copy Referral Link</span>
            </button>

            <a
              href={`/register?sponsor=${displayId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold transition-all shadow-sm whitespace-nowrap flex items-center gap-1"
            >
              <span>↗️</span> Test Link
            </a>
          </div>
        </div>
      </div>

      {/* 📘 10-DAY SHARE POOL RULES EXPLANATION BOX */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-6 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-2">
          <span>📅</span> Fixed Calendar Dates Share Pool Distribution Rules (9th, 19th & 29th)
        </h3>
        <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside">
          <li><strong>Fixed Distribution Dates:</strong> Distribution DOES NOT start from user registration date. It takes place on fixed calendar dates: <strong>9th, 19th, and 29th</strong> of every month (or 1st of next month if a month like February has fewer than 29 days).</li>
          <li><strong>Accumulation:</strong> Every new $100 package registration or Sub-ID creation automatically adds <strong>$30 USDT</strong> to the Share Pool.</li>
          <li><strong>Proportional Shares:</strong> Distribution is divided based on your active Board Level share multiplier (Board 1 = 1x, Board 2 = 2x, Board 3 = 3x, Board 4 = 4x, Board 5 = 5x).</li>
          <li><strong>How to Claim:</strong> On the cutoff date (or anytime after finalization), click <strong>&quot;💰 Claim Share Income&quot;</strong> on your dashboard to receive your payouts directly into your connected Web3 USDT wallet.</li>
        </ul>
      </div>
    </div>
  );
}
