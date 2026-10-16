'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, BSC_EXPLORER_URL, isAdminWallet, getAdminIndex } from '../../config/contracts';
import PlanPresentation from '../../components/PlanPresentation';
import { useWeb3 } from '../../context/Web3Context';


// Helper function to calculate exact next calendar cutoff date (5th, 15th, or 25th of the month according to Dubai GST UTC+4)
function getNextSharePoolCutoff(fromDate: Date = new Date()): Date {
  const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;
  const nowMs = fromDate.getTime();
  const dubaiDate = new Date(nowMs + DUBAI_OFFSET_MS);

  const year = dubaiDate.getUTCFullYear();
  const month = dubaiDate.getUTCMonth(); // 0-indexed (0 = Jan, 1 = Feb, etc.)

  // Check 5th, 15th, 25th cutoffs at 23:59:59.999 Dubai time (GST)
  const cutoff5UtcMs = Date.UTC(year, month, 5, 23, 59, 59, 999) - DUBAI_OFFSET_MS;
  if (nowMs < cutoff5UtcMs) {
    return new Date(cutoff5UtcMs);
  }

  const cutoff15UtcMs = Date.UTC(year, month, 15, 23, 59, 59, 999) - DUBAI_OFFSET_MS;
  if (nowMs < cutoff15UtcMs) {
    return new Date(cutoff15UtcMs);
  }

  const cutoff25UtcMs = Date.UTC(year, month, 25, 23, 59, 59, 999) - DUBAI_OFFSET_MS;
  if (nowMs < cutoff25UtcMs) {
    return new Date(cutoff25UtcMs);
  }

  // After 25th, next cutoff is 5th of the following month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const cutoffNext5UtcMs = Date.UTC(nextYear, nextMonth, 5, 23, 59, 59, 999) - DUBAI_OFFSET_MS;
  return new Date(cutoffNext5UtcMs);
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
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  const handleCopyContract = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(CONTRACT_ADDRESSES.GROW50X_CORE);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
      setActionMsg({ text: '✓ Smart Contract address copied to clipboard!', type: 'success' });
    }
  };
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Telegram Channel Join State & Modal Popup
  const [showTelegramModal, setShowTelegramModal] = useState<boolean>(false);
  const [hasJoinedTelegram, setHasJoinedTelegram] = useState<boolean>(true); // default true to avoid flash

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const joined = localStorage.getItem('grow50x_telegram_joined') === 'true';
      setHasJoinedTelegram(joined);
      if (!joined) {
        // Small delay (800ms) for smooth entrance after dashboard loads
        const timer = setTimeout(() => {
          setShowTelegramModal(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleJoinTelegram = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('grow50x_telegram_joined', 'true');
      setHasJoinedTelegram(true);
      setShowTelegramModal(false);
    }
  };

  const handleMarkTelegramJoined = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('grow50x_telegram_joined', 'true');
      setHasJoinedTelegram(true);
      setShowTelegramModal(false);
    }
  };

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

  // Enforce immediate scroll-to-top whenever dashboard loads or ID changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [activeTargetId, ghostTargetId]);


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
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/';
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
      setActionMsg({ text: '⏳ Finalizing Board Reward Claim on BNB Smart Chain...', type: 'info' });
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
      setActionMsg({ text: '⏳ Finalizing Sub-ID Level Income Claim on BNB Smart Chain...', type: 'info' });
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
      setActionMsg({ text: '⏳ Finalizing Direct Sponsor Income Claim on BNB Smart Chain...', type: 'info' });
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
      setActionMsg({ text: '⏳ Finalizing 1-Click All User Income Claim on BNB Smart Chain...', type: 'info' });
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
    <div className="space-y-5 -mt-1 sm:-mt-2">
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

      {/* ⏳ TOP CONSOLIDATED TIMER & CLAIM BAR (FULLY MOBILE & DESKTOP RESPONSIVE) */}
      <div className="bg-slate-900 text-white p-3.5 sm:px-5 sm:py-3 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-xl -z-0 pointer-events-none" />

        {/* Left / Top Row: Next Cutoff + Live Countdown Timer */}
        <div className="flex items-center gap-2 relative z-10 min-w-0">
          <span className="animate-pulse flex h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 font-bold text-xs whitespace-nowrap">Next Cutoff:</span>

          {/* Live Countdown Timer Badge right next to Next Cutoff */}
          <div className="flex items-center gap-1 font-mono text-xs font-black bg-slate-800/95 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 shadow-inner shrink-0">
            <span className="text-sky-400">{String(timeLeft.days).padStart(2, '0')}d</span>
            <span className="text-slate-500">:</span>
            <span className="text-sky-400">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span className="text-slate-500">:</span>
            <span className="text-sky-400">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span className="text-slate-500">:</span>
            <span className="text-emerald-400 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>

        {/* Right / Bottom Row on Mobile: CLAIM ALL INCOME & Finalize Buttons */}
        <div className="flex items-center gap-2 relative z-10 w-full md:w-auto shrink-0 pt-1 md:pt-0 border-t border-slate-800/80 md:border-t-0">
          <button
            onClick={handleClaimAllUserIncome}
            disabled={isClaiming || (totalUnclaimed === 0 && claimingCategory !== 'all')}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white px-4 py-2.5 sm:py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95"
            title="Claim all pending Share, Direct, Level, and Board Income across Main ID and all Sub-IDs in 1 transaction"
          >
            <span>⚡</span>
            <span>{claimingCategory === 'all' ? 'Claiming All...' : `CLAIM ALL INCOME ${totalUnclaimed > 0 ? `($${totalUnclaimed.toFixed(2)})` : ''}`}</span>
          </button>

          {timeLeft.totalSec === 0 && (
            <button
              onClick={handleFinalizePeriod}
              disabled={isFinalizing}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-3.5 py-2.5 sm:py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm shrink-0"
            >
              {isFinalizing ? 'Finalizing...' : '⚡ Finalize'}
            </button>
          )}
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

      {/* Top Banner - Mobile & Desktop Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:px-5 sm:py-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider leading-none">
            Live Account Telemetry ({ghostTargetId > 0 ? 'Admin Ghost Inspection' : isSubIdSelected ? 'Sub-ID Active' : 'Main ID Active'})
          </span>
          <div className="mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Account ID: <span className="gradient-text-blue">{displayId}</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Owned IDs</span>
            <p className="text-sm font-black text-sky-600 mt-0.5">{totalOwnedIds}</p>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Board</span>
            <p className="text-sm font-black text-emerald-600 mt-0.5">Board {currentBoard}</p>
          </div>
        </div>
      </div>

      {/* 💎 TOTAL COMBINED INCOME CARD */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white p-4 sm:py-3.5 sm:px-6 rounded-2xl shadow-md shadow-sky-500/15 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Qualification</span>
            <span className="text-xs sm:text-sm font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
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

        {/* 🌟 Lifetime Share Income vs Board Cap - Fully Mobile Friendly */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Lifetime Share Income vs Board Cap
              </span>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                ${lifetimeShareEarned.toFixed(2)} <span className="text-xs font-semibold text-slate-500">Earned</span> / ${currentBoardCap.toFixed(2)} <span className="text-xs font-semibold text-slate-500">Max (Board {currentBoard})</span>
              </p>
            </div>
            {remainingShareCap <= 0 ? (
              <span className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs self-start sm:self-auto">
                🎉 ALL POOL INCOME RECEIVED (${currentBoardCap.toFixed(2)} MAX CAP)
              </span>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto shrink-0">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase">Remaining:</span>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-700">${remainingShareCap.toFixed(2)} USDT</span>
              </div>
            )}
          </div>

          <div className="w-full bg-slate-100 h-3 sm:h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${shareCapPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-end text-[11px] text-slate-400">
            <span className="font-bold text-slate-600">{shareCapPercentage.toFixed(1)}% Reached</span>
          </div>
        </div>
      </div>

      {/* Income Stream Breakdown Cards with Direct Claim Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Income Accounting Breakdown</h2>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Direct Sponsor Income</span>
            <p className="text-2xl font-black text-sky-600 mt-2">
              ${directIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          {/* Card 2: 10-Day Share Pool */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">10-Day Share Pool</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              ${shareIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          {/* Card 3: Sub-ID Level Income */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Sub-ID Level Income</span>
            <p className="text-2xl font-black text-indigo-600 mt-2">
              ${levelIncome.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>

          {/* Card 4: Board Completion Rewards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
            <span className="text-xs text-slate-500 uppercase font-semibold">Board Completion Rewards</span>
            <p className="text-2xl font-black text-purple-600 mt-2">
              ${boardRewards.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </p>
          </div>
        </div>
      </div>


      {/* 🔗 DYNAMIC BRIGHT REFERRAL LINK BOX (BELOW INCOME DETAILS - FOR EACH MAIN ID OR SUB-ID) */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-4 sm:p-6 rounded-3xl border-2 border-sky-200/80 shadow-sm text-slate-900 space-y-3">
        {/* Top Header Badge Row - Prominently Displayed on Mobile & Desktop */}
        <div className="flex items-center justify-between gap-2 border-b border-sky-200/60 pb-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs whitespace-nowrap ${
            isSubIdSelected
              ? 'bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-sky-100 text-sky-700 border-sky-200'
          }`}>
            <span>⭐</span> {isSubIdSelected ? 'Sub-ID Sponsor Link' : 'Main ID Sponsor Link'}
          </span>
          <span className="text-xs font-extrabold text-sky-800 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-sky-200/80 shadow-2xs">
            {displayId}
          </span>
        </div>

        <div className="flex items-center gap-2.5 pt-0.5">
          <span className="p-2 bg-white text-sky-600 rounded-xl border border-sky-200 shadow-sm text-lg shrink-0">🔗</span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            Direct Referral Link
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative w-full min-w-0">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/register?sponsor=${displayId}` : `http://localhost:3000/register?sponsor=${displayId}`}
              className="w-full bg-white border border-sky-200 text-sky-700 font-mono text-xs font-bold px-4 py-3 rounded-2xl outline-none select-all shadow-inner truncate"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/register?sponsor=${displayId}` : `http://localhost:3000/register?sponsor=${displayId}`;
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(link);
                  setActionMsg({ text: `✓ Referral link for ${displayId} copied to clipboard!`, type: 'success' });
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              <span>📋</span>
              <span>Copy Referral Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📘 10-DAY SHARE POOL RULES EXPLANATION BOX (JUSTIFIED PROFESSIONAL POINTS) */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-amber-200/70 pb-2.5">
          <span className="text-base">📅</span>
          <h3 className="text-xs sm:text-sm font-black text-amber-950">
            Fixed Calendar Dates Share Pool Distribution Rules (5th, 15th &amp; 25th - Dubai Time)
          </h3>
        </div>

        <div className="space-y-2.5 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 font-black text-sm leading-tight shrink-0">•</span>
            <p className="text-justify leading-relaxed flex-1">
              <strong className="text-amber-900 font-extrabold">Fixed Distribution Dates:</strong> Distribution DOES NOT start from user registration date. It takes place on fixed calendar dates: <strong className="text-amber-900 font-extrabold">5th, 15th, and 25th</strong> of every month at 23:59:59 GST (Dubai Time UTC+4).
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 font-black text-sm leading-tight shrink-0">•</span>
            <p className="text-justify leading-relaxed flex-1">
              <strong className="text-amber-900 font-extrabold">Accumulation:</strong> Every new $100 package registration or Sub-ID creation automatically adds <strong className="text-amber-900 font-extrabold">$30 USDT</strong> to the Share Pool.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 font-black text-sm leading-tight shrink-0">•</span>
            <p className="text-justify leading-relaxed flex-1">
              <strong className="text-amber-900 font-extrabold">Proportional Shares:</strong> Distribution is divided based on your active Board Level share multiplier (Board 1 = 1x, Board 2 = 2x, Board 3 = 3x, Board 4 = 4x, Board 5 = 5x).
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 font-black text-sm leading-tight shrink-0">•</span>
            <p className="text-justify leading-relaxed flex-1">
              <strong className="text-amber-900 font-extrabold">How to Claim:</strong> On the cutoff date (or anytime after finalization), click <strong className="text-amber-900 font-extrabold">&quot;💰 Claim Share Income&quot;</strong> on your dashboard to receive your payouts directly into your connected Web3 USDT wallet.
            </p>
          </div>
        </div>
      </div>

      {/* 📜 VERIFIED SMART CONTRACT ADDRESS CARD */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs sm:text-sm font-black text-slate-900">
            Verified Smart Contract Address
          </h4>
          <svg className="w-4 h-4 text-emerald-500 fill-current shrink-0" viewBox="0 0 20 20" aria-label="Verified Contract">
            <title>Verified Contract</title>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>

        {/* 1-Line Smart Contract Address Box */}
        <div className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold text-slate-800 select-all whitespace-nowrap overflow-x-auto">
          {CONTRACT_ADDRESSES.GROW50X_CORE}
        </div>

        {/* Copy Option Below Address */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleCopyContract}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 ${
              copiedContract
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>{copiedContract ? '✓' : '📋'}</span>
            <span>{copiedContract ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <a
            href={`${BSC_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.GROW50X_CORE}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center justify-center gap-1"
            title="View on BSCScan Explorer"
          >
            <span>🔗</span>
            <span>BSCScan</span>
          </a>
        </div>
      </div>

      {/* ✈️ OFFICIAL GROW 50X TELEGRAM CHANNEL BANNER (AT THE VERY BOTTOM - 100% MOBILE RESPONSIVE) */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg shadow-sky-600/20 border border-sky-400/30 overflow-hidden relative">
        {/* Subtle Ambient Background Watermark Icon */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 pointer-events-none text-white">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.37 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white filter drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.37 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Join Telegram Channel
                </h3>
                {hasJoinedTelegram ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                    ✓ Joined
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30 animate-pulse">
                    Official Community
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100/90 font-medium mt-0.5 leading-relaxed max-w-xl">
                Stay updated with real-time protocol news, board cycle notifications, and official announcements on our official channel.
              </p>
            </div>
          </div>

          <a
            href="https://t.me/grow50x"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleJoinTelegram}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.37 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span>{hasJoinedTelegram ? 'Open Telegram Channel' : 'Join Telegram Channel'}</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </div>

      {/* 🚀 TELEGRAM JOIN POPUP MODAL (SHOWN ON LOGIN IF NOT JOINED) */}
      {showTelegramModal && !hasJoinedTelegram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-sky-200 overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />

            {/* Close Button */}
            <button
              onClick={() => setShowTelegramModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all text-xs font-bold z-10"
              title="Close"
            >
              ✕
            </button>

            {/* Glowing Telegram Icon */}
            <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-sky-400/30 blur-lg animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-sky-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-sky-500 rounded-[14px] flex items-center justify-center text-white">
                  <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.37 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="text-center space-y-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-black uppercase tracking-wider">
                Official Protocol Channel
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Join GROW 50X Telegram
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                Connect with the official GROW 50X community. Get instant live announcements, board completions, and system updates!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href="https://t.me/grow50x"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleJoinTelegram}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.37 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span>Join Telegram Channel</span>
                <span className="text-xs">↗</span>
              </a>

              <button
                type="button"
                onClick={handleMarkTelegramJoined}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>I Have Already Joined</span>
              </button>
            </div>

            {/* Footer Trust Note */}
            <p className="text-[10px] text-center text-slate-400 mt-4">
              Official Link: <span className="font-mono text-sky-600 font-bold">https://t.me/grow50x</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
