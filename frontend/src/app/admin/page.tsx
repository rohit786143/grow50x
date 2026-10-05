'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, GROW50X_CORE_ABI, getAdminIndex } from '../../config/contracts';
import { useWeb3 } from '../../context/Web3Context';


export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold">Loading Admin Telemetry...</div>}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}

interface UserRecord {
  id: number;
  wallet: string;
  ownerMainUserId: number;
  sponsorId: number;
  placementParentId: number;
  currentBoard: number;
  directCount: number;
  active: boolean;
  createdAt: number;
  isSubId: boolean;
}

interface MatrixPosition {
  pos: number;
  label: string;
  id: string | null;
  rawId: number;
  wallet: string | null;
  fullWallet?: string;
  sponsor: string | null;
  directs: number;
  downline?: number;
  isSubId: boolean;
  status: 'Occupied' | 'Available';
}

function AdminAnalyticsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { account } = useWeb3();

  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'users' | 'boards' | 'contracts'>('overview');

  // Admin Specific State
  const [adminIdx, setAdminIdx] = useState<number>(0);
  const [adminUnclaimedFees, setAdminUnclaimedFees] = useState<string>('0.00');
  const [adminTotalEarned, setAdminTotalEarned] = useState<string>('0.00');
  const [adminTotalWithdrawn, setAdminTotalWithdrawn] = useState<string>('0.00');
  const [isClaimingAdmin, setIsClaimingAdmin] = useState<boolean>(false);
  const [claimAdminStatus, setClaimAdminStatus] = useState<string>('');

  useEffect(() => {
    const idx = getAdminIndex(account);
    setAdminIdx(idx);
    if (idx > 0) {
      fetchProtocolState();
    }
  }, [account]);


  // Sync tab state with URL parameter
  useEffect(() => {
    if (tabParam === 'funds') setActiveTab('funds');
    else if (tabParam === 'users') setActiveTab('users');
    else if (tabParam === 'boards') setActiveTab('boards');
    else if (tabParam === 'contracts') setActiveTab('contracts');
    else setActiveTab('overview');
  }, [tabParam]);

  // Telemetry & On-Chain State
  const [loading, setLoading] = useState<boolean>(true);
  const [rpcConnected, setRpcConnected] = useState<boolean>(false);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [activeSubIdsCount, setActiveSubIdsCount] = useState<number>(0);
  const [contractUsdtBalance, setContractUsdtBalance] = useState<string>('0.00');
  const [contractBnbBalance, setContractBnbBalance] = useState<string>('0.0000');
  const [sharePoolBalance, setSharePoolBalance] = useState<string>('0.00');
  const [reserveBoardRewards, setReserveBoardRewards] = useState<string>('0.00');
  const [reserveLevelIncome, setReserveLevelIncome] = useState<string>('0.00');
  const [totalActiveShares, setTotalActiveShares] = useState<number>(0);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);

  // User Search & Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'all' | 'main' | 'sub'>('all');

  // Board details state
  const [selectedBoardLevel, setSelectedBoardLevel] = useState<number>(1);
  const [targetBoardUnitId, setTargetBoardUnitId] = useState<number | null>(null);
  const [activeBoardsQueue, setActiveBoardsQueue] = useState<any[]>([]);
  const [boardViewMode, setBoardViewMode] = useState<'active' | 'hold'>('active');
  const [holdUsersQueue, setHoldUsersQueue] = useState<any[]>([]);
  const [boardDetailsLoading, setBoardDetailsLoading] = useState<boolean>(false);
  const [inspectedBoardUnit, setInspectedBoardUnit] = useState<any>({
    boardId: 1001,
    boardLevel: 1,
    filledCount: 0,
    positions: Array(7).fill({ pos: 0, label: '', id: null, rawId: 0, wallet: null, status: 'Available', sponsor: null, directs: 0, isSubId: false }),
  });

  useEffect(() => {
    fetchProtocolState();
  }, []);

  useEffect(() => {
    if (activeTab === 'boards') {
      discoverAndLoadBoardUnits(selectedBoardLevel, targetBoardUnitId);
    }
  }, [activeTab, selectedBoardLevel]);

  const formatDisplayId = (id: number) => {
    if (!id || id <= 0) return '';
    return `GR${id.toString().padStart(6, '0')}`;
  };

  const fetchProtocolState = async () => {
    setLoading(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const network = await provider.getNetwork();
      if (network) setRpcConnected(true);

      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      const usdtAddress = CONTRACT_ADDRESSES.USDT;

      const isDeployed = coreAddress && coreAddress !== '0x0000000000000000000000000000000000000000';

      if (isDeployed) {
        const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);
        const usdtContract = new ethers.Contract(usdtAddress, MOCK_USDT_ABI, provider);

        const bnbRaw = await provider.getBalance(coreAddress);
        setContractBnbBalance(parseFloat(ethers.formatEther(bnbRaw)).toFixed(4));

        try {
          const usdtRaw = await usdtContract.balanceOf(coreAddress);
          const decimals = await usdtContract.decimals();
          setContractUsdtBalance(parseFloat(ethers.formatUnits(usdtRaw, decimals)).toFixed(2));
        } catch (e) {}

        try {
          const sharePoolRaw = await coreContract.sharePoolBalance();
          setSharePoolBalance(parseFloat(ethers.formatUnits(sharePoolRaw, 18)).toFixed(2));
        } catch (e) {}

        try {
          const boardRewardsRaw = await coreContract.reserveForBoardRewards();
          setReserveBoardRewards(parseFloat(ethers.formatUnits(boardRewardsRaw, 18)).toFixed(2));
        } catch (e) {}

        try {
          const levelIncomeRaw = await coreContract.reserveForLevelIncome();
          setReserveLevelIncome(parseFloat(ethers.formatUnits(levelIncomeRaw, 18)).toFixed(2));
        } catch (e) {}

        // Fetch Admin specific 5% telemetry if connected wallet is Admin 1, 2, or 3
        const currAdminIdx = adminIdx > 0 ? adminIdx : getAdminIndex(account);
        if (currAdminIdx > 0) {
          try {
            const telemetry = await coreContract.getAdminTelemetry(currAdminIdx);
            setAdminUnclaimedFees(parseFloat(ethers.formatUnits(telemetry.unclaimedFees, 18)).toFixed(2));
            setAdminTotalEarned(parseFloat(ethers.formatUnits(telemetry.totalEarned, 18)).toFixed(2));
            setAdminTotalWithdrawn(parseFloat(ethers.formatUnits(telemetry.totalWithdrawn, 18)).toFixed(2));
          } catch (e) {
            console.warn('Could not fetch admin telemetry:', e);
          }
        }


        try {
          const countRaw = await coreContract.totalUserCount();
          const count = Number(countRaw);
          setTotalUserCount(count);

          const totalBoardsRaw = await coreContract.boardIdCounter();
          const totalBoards = Number(totalBoardsRaw);

          // Discover all unique user IDs on-chain from board unit positions
          const uniqueUserIds = new Set<number>();
          for (let bId = 1001; bId <= 1001 + totalBoards + 5; bId++) {
            try {
              const positionsRaw = await coreContract.getBoardUnitPositions(bId);
              positionsRaw.forEach((pIdBig: any) => {
                const pId = Number(pIdBig);
                if (pId > 0) uniqueUserIds.add(pId);
              });
            } catch (e) {}
          }

          const fetchedUsers: UserRecord[] = [];
          let subCount = 0;
          let calculatedShares = 0;
          const shareWeights = [0, 1, 2, 5, 10, 25];

          for (const uId of uniqueUserIds) {
            try {
              const u = await coreContract.users(uId);
              const bLvl = Number(u.currentBoard) || 1;
              const userObj: UserRecord = {
                id: Number(u.id),
                wallet: u.wallet,
                ownerMainUserId: Number(u.ownerMainUserId),
                sponsorId: Number(u.sponsorId),
                placementParentId: Number(u.placementParentId),
                currentBoard: bLvl,
                directCount: Number(u.directCount),
                active: u.active,
                createdAt: Number(u.createdAt),
                isSubId: u.isSubId,
              };
              if (u.isSubId) subCount++;
              if (u.active) {
                calculatedShares += (shareWeights[bLvl] || 1);
              }
              fetchedUsers.push(userObj);
            } catch (err) {}
          }

          setUsersList(fetchedUsers);
          setActiveSubIdsCount(subCount);
          setTotalActiveShares(calculatedShares);
        } catch (e) {}
      }
    } catch (err) {
      console.error('RPC / Contract read error in admin telemetry:', err);
      setRpcConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAdminFees = async () => {

    if (!account || adminIdx <= 0) {
      alert('Please connect your official Admin Wallet (Admin 1, Admin 2, or Admin 3) in MetaMask!');
      return;
    }

    setIsClaimingAdmin(true);
    setClaimAdminStatus('🚀 Step 1/2: Please click CONFIRM in your MetaMask popup window to withdraw Admin Share...');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const tx = await coreContract.withdrawAdminFees();
      setClaimAdminStatus('⏳ Step 2/2: Finalizing Admin Share withdrawal on BSC Testnet blockchain...');
      console.log('Withdraw Admin Fees TX:', tx.hash);
      await tx.wait(1);

      alert(`🎉 Success! Withdrawn $${adminUnclaimedFees} USDT Admin Share into ${account}`);
      setClaimAdminStatus('🎉 Admin Share successfully claimed!');
      await fetchProtocolState();
    } catch (err: any) {
      console.error('Admin fee withdrawal error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      alert(`Withdrawal Error: ${msg}`);
      setClaimAdminStatus(`❌ Withdrawal Error: ${msg}`);
    } finally {
      setIsClaimingAdmin(false);
    }
  };

  const handleViewUserBoard = (boardLevel: number, userId: number) => {
    setSelectedBoardLevel(boardLevel);
    setBoardViewMode('active');
    setActiveTab('boards');
    discoverAndLoadBoardUnits(boardLevel, null, userId);
  };

  const discoverAndLoadBoardUnits = async (boardLevel: number, preferredUnitId?: number | null, targetUserId?: number | null) => {
    setBoardDetailsLoading(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      if (!coreAddress || coreAddress === '0x0000000000000000000000000000000000000000') return;

      const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);

      // Discover hold users for boardLevel
      try {
        const holdListRaw = await coreContract.getHoldListByLevel(boardLevel);
        const holdIds = holdListRaw.map((x: any) => Number(x));

        const holdUserRecords = await Promise.all(
          holdIds.map(async (uId: number) => {
            let uData = { wallet: '0x0000...0000', isSubId: false, currentBoard: boardLevel, directCount: 0 };
            let targetLvl = boardLevel + 1;
            try {
              uData = await coreContract.users(uId);
              const tRaw = await coreContract.holdingTargetLevel(uId);
              targetLvl = Number(tRaw) || (boardLevel + 1);
            } catch (e) {}

            const reqDirects = boardLevel === 1 ? 2 : boardLevel === 2 ? 3 : boardLevel === 3 ? 4 : 5;
            const dCount = Number(uData.directCount || 0);
            const needed = Math.max(0, reqDirects - dCount);

            return {
              userId: uId,
              wallet: uData.wallet,
              isSubId: uData.isSubId,
              currentBoard: Number(uData.currentBoard) || boardLevel,
              directCount: dCount,
              requiredDirects: reqDirects,
              neededDirects: needed,
              targetLevel: targetLvl,
            };
          })
        );

        setHoldUsersQueue(holdUserRecords);
      } catch (e) {
        console.error('Error discovering hold list for level', boardLevel, e);
      }

      const totalBoardsCountRaw = await coreContract.boardIdCounter();
      const totalBoards = Number(totalBoardsCountRaw);
      const discoveredQueue: any[] = [];
      let matchedUnitId: number | null = null;

      const base = boardLevel * 1000 + 1;
      for (let i = 0; i <= totalBoards + 5; i++) {
        const checkId = base + i;
        try {
          const positionsRaw = await coreContract.getBoardUnitPositions(checkId);
          let filled = 0;
          positionsRaw.forEach((pId: any) => {
            const numericPid = Number(pId);
            if (numericPid > 0) {
              filled++;
              if (targetUserId && numericPid === targetUserId) {
                matchedUnitId = checkId;
              }
            }
          });

          if (filled > 0) {
            discoveredQueue.push({
              id: checkId,
              filledCount: filled,
              label: `Unit #${checkId} (${filled}/7 Filled)${filled === 7 ? ' 🏁 Completed' : ' ⚡ Active'}`,
            });
          }
        } catch (e) {
          if (i > 10) break;
        }
      }

      // Strictly filter out completed units (filledCount === 7)
      const activeUnits = discoveredQueue.filter((b) => b.filledCount < 7);

      setActiveBoardsQueue(activeUnits);

      let bId = preferredUnitId || matchedUnitId;
      if (!bId || !activeUnits.some((b) => b.id === bId)) {
        bId = activeUnits.length > 0 ? activeUnits[0].id : boardLevel * 1000 + 1;
      }

      setTargetBoardUnitId(bId);
      await loadBoardUnitDetails(coreContract, bId, boardLevel);
    } catch (err) {
      console.error('Error discovering board units:', err);
    } finally {
      setBoardDetailsLoading(false);
    }
  };

  const loadBoardUnitDetails = async (coreContract: any, unitId: number, level: number) => {
    try {
      let positionsRaw = [0, 0, 0, 0, 0, 0, 0];
      try {
        positionsRaw = await coreContract.getBoardUnitPositions(unitId);
      } catch (e) {}

      const labels = [
        'TOP (Position 1)',
        'Middle Left (Position 2)',
        'Middle Right (Position 3)',
        'Bottom Left 1 (Position 4)',
        'Bottom Left 2 (Position 5)',
        'Bottom Right 1 (Position 6)',
        'Bottom Right 2 (Position 7)',
      ];

      let filled = 0;
      const parsedPositions: MatrixPosition[] = await Promise.all(
        positionsRaw.map(async (posIdBig: any, idx: number) => {
          const pId = Number(posIdBig);
          if (pId > 0) {
            filled++;
            let uData = { wallet: '0x0000...0000', sponsorId: 0, directCount: 0, isSubId: false };
            try {
              uData = await coreContract.users(pId);
            } catch (e) {}

            return {
              pos: idx + 1,
              label: labels[idx],
              id: formatDisplayId(pId),
              rawId: pId,
              wallet: uData.wallet ? `${uData.wallet.substring(0, 6)}...${uData.wallet.substring(uData.wallet.length - 4)}` : '0x00...00',
              fullWallet: uData.wallet,
              sponsor: Number(uData.sponsorId) > 0 ? formatDisplayId(Number(uData.sponsorId)) : 'Root',
              directs: Number(uData.directCount || 0),
              isSubId: uData.isSubId || false,
              status: 'Occupied',
            };
          }
          return {
            pos: idx + 1,
            label: labels[idx],
            id: null,
            rawId: 0,
            wallet: null,
            sponsor: null,
            directs: 0,
            isSubId: false,
            status: 'Available',
          };
        })
      );


      setInspectedBoardUnit({
        boardId: unitId,
        boardLevel: level,
        filledCount: filled,
        positions: parsedPositions,
      });
    } catch (e) {
      console.error('Error loading board unit details:', e);
    }
  };

  const handleSelectUnit = async (unitId: number) => {
    setTargetBoardUnitId(unitId);
    setBoardDetailsLoading(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      if (coreAddress && coreAddress !== '0x0000000000000000000000000000000000000000') {
        const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);
        await loadBoardUnitDetails(coreContract, unitId, selectedBoardLevel);
      }
    } catch (err) {
      console.error('Error switching unit:', err);
    } finally {
      setBoardDetailsLoading(false);
    }
  };

  // Filtered Users List calculation
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.id.toString().includes(searchTerm) ||
      user.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sponsorId.toString().includes(searchTerm);

    if (!matchesSearch) return false;
    if (userFilter === 'main') return !user.isSubId;
    if (userFilter === 'sub') return user.isSubId;
    return true;
  });

  const boardConfigs = [
    { level: 1, name: 'Board 1 - Starter', fee: '100 USDT', reward: '40 USDT', shareMult: '1x', cap: '200 USDT' },
    { level: 2, name: 'Board 2 - Bronze', fee: '100 USDT', reward: '80 USDT', shareMult: '2x', cap: '400 USDT' },
    { level: 3, name: 'Board 3 - Silver', fee: '100 USDT', reward: '160 USDT', shareMult: '5x', cap: '1,000 USDT' },
    { level: 4, name: 'Board 4 - Gold', fee: '100 USDT', reward: '320 USDT', shareMult: '10x', cap: '2,000 USDT' },
    { level: 5, name: 'Board 5 - Diamond', fee: '100 USDT', reward: '640 USDT', shareMult: '25x', cap: '5,000 USDT' },
  ];

  return (
    <div className="space-y-8">
      {/* Admin Top Header Banner - Bright Blue/Green Gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 text-white p-6 sm:p-7 rounded-3xl shadow-lg shadow-sky-500/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              Protocol Telemetry & Admin Console
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${rpcConnected ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40' : 'bg-amber-500/30 text-amber-100 border border-amber-400/40'}`}>
              {rpcConnected ? '● Live RPC Connected' : '○ RPC Syncing...'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-white">GROW 50X Smart Contract Control Panel</h1>
          <p className="text-xs text-sky-100/90 mt-1 font-medium">
            Real-time live read-only financial accounting, board matrix queue, user directory, and reserve balances.
          </p>
        </div>

        <button
          onClick={fetchProtocolState}
          className="self-start md:self-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-xs font-black rounded-2xl transition-all flex items-center gap-2 text-white shadow-sm whitespace-nowrap hover:scale-105"
        >
          <span>🔄</span> {loading ? 'Syncing...' : 'Refresh Live Telemetry'}
        </button>
      </div>

      {/* 👑 OFFICIAL 3-ADMIN REVENUE & TELEMETRY CONTROL CENTER */}
      {adminIdx > 0 ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center text-2xl font-bold shadow-inner">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-400 uppercase tracking-widest">Official Admin Wallet Connected</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Admin #{adminIdx}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 mt-0.5">{account}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Role:</span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Protocol Owner (Admin #{adminIdx})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Unclaimed 5% Admin Share</span>
              <p className="text-3xl font-black text-emerald-400 font-mono">${adminUnclaimedFees} <span className="text-xs font-normal text-slate-400">USDT</span></p>
              <p className="text-[11px] text-slate-400 pt-1">Accumulated from 5% entry splits</p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Lifetime Fees Earned</span>
              <p className="text-3xl font-black text-sky-400 font-mono">${adminTotalEarned} <span className="text-xs font-normal text-slate-400">USDT</span></p>
              <p className="text-[11px] text-slate-400 pt-1">Total 5% generated on smart contract</p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Withdrawn To Date</span>
              <p className="text-3xl font-black text-indigo-400 font-mono">${adminTotalWithdrawn} <span className="text-xs font-normal text-slate-400">USDT</span></p>
              <p className="text-[11px] text-slate-400 pt-1">Claimed directly into your wallet</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs text-slate-300 font-medium">
                Clicking withdraw will execute <span className="font-mono text-sky-300 font-bold">withdrawAdminFees()</span> on-chain to claim ${adminUnclaimedFees} USDT directly into your connected wallet.
              </p>
              {claimAdminStatus && (
                <p className="text-xs font-bold text-sky-400 mt-1 animate-pulse">{claimAdminStatus}</p>
              )}
            </div>

            <button
              onClick={handleWithdrawAdminFees}
              disabled={isClaimingAdmin || parseFloat(adminUnclaimedFees) <= 0}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 whitespace-nowrap ${
                parseFloat(adminUnclaimedFees) > 0 && !isClaimingAdmin
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white hover:scale-105 shadow-emerald-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>💳</span> {isClaimingAdmin ? 'Processing Withdrawal...' : `Withdraw Admin Share ($${adminUnclaimedFees} USDT)`}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">ℹ️</span>
            <span>Connect one of the official Admin Wallets (Admin 1, Admin 2, or Admin 3) in MetaMask to access the 5% Admin Share Withdrawal button & individual telemetry.</span>
          </div>
        </div>
      )}

      {/* Admin Quick Navigation Tabs - Bright Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          📊 Protocol Overview
        </button>
        <button
          onClick={() => setActiveTab('funds')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
            activeTab === 'funds'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          💰 All Funds & Accounting
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          👥 All Users Directory
        </button>
        <button
          onClick={() => setActiveTab('boards')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
            activeTab === 'boards'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          🧩 All Boards Details
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          📄 Smart Contracts & Audit
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TOP TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all border-l-4 border-l-sky-500">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Registered Users</span>
              <p className="text-3xl font-black text-sky-600 mt-2">{totalUserCount}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Live smart contract index</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all border-l-4 border-l-blue-500">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Sub-IDs</span>
              <p className="text-3xl font-black text-blue-600 mt-2">{activeSubIdsCount}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Generated system sub-IDs</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Smart Contract USDT</span>
              <p className="text-3xl font-black text-emerald-600 mt-2">${contractUsdtBalance}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Held in core contract vault</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all border-l-4 border-l-indigo-500">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Contract BNB Balance</span>
              <p className="text-3xl font-black text-indigo-600 mt-2">{contractBnbBalance} BNB</p>
              <p className="text-xs font-medium text-slate-500 mt-1">For protocol gas maintenance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab('funds')}
              className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white text-slate-900 p-6 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform shadow-md border-2 border-emerald-200 hover:border-emerald-400 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="p-3 bg-white text-emerald-600 rounded-2xl border border-emerald-200 shadow-sm text-2xl">💰</span>
                <span className="text-xs font-black text-white bg-emerald-600 px-3.5 py-1.5 rounded-xl shadow-sm">
                  Full Funds View →
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">All Funds & Accounting</h3>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  Inspect the 30% Share Pool, 10% Board Rewards, 5% Level Pool, 40% Direct Sponsor, and 15% Admin splits.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-200/80 flex justify-between text-xs text-slate-700">
                <span className="font-bold">30% Share Pool:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">${sharePoolBalance} USDT</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('users')}
              className="bg-gradient-to-br from-sky-50 via-blue-50 to-white text-slate-900 p-6 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform shadow-md border-2 border-sky-200 hover:border-sky-400 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="p-3 bg-white text-sky-600 rounded-2xl border border-sky-200 shadow-sm text-2xl">👥</span>
                <span className="text-xs font-black text-white bg-sky-600 px-3.5 py-1.5 rounded-xl shadow-sm">
                  Users Directory →
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">All Users & Sub-IDs</h3>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  Search, inspect, and analyze all registered Main IDs, Sub-IDs, wallets, and sponsor downlines.
                </p>
              </div>
              <div className="pt-3 border-t border-sky-200/80 flex justify-between text-xs text-slate-700">
                <span className="font-bold">Total On-Chain Users:</span>
                <span className="font-mono font-black text-sky-700 text-sm">{totalUserCount} Members</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('boards')}
              className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-slate-900 p-6 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform shadow-md border-2 border-blue-200 hover:border-blue-400 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="p-3 bg-white text-indigo-600 rounded-2xl border border-indigo-200 shadow-sm text-2xl">🧩</span>
                <span className="text-xs font-black text-white bg-blue-600 px-3.5 py-1.5 rounded-xl shadow-sm">
                  Boards Monitor →
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">All Boards Details</h3>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  Monitor Board 1 to Board 5 matrix queues, fill states, rewards, and active unit positions.
                </p>
              </div>
              <div className="pt-3 border-t border-blue-200/80 flex justify-between text-xs text-slate-700">
                <span className="font-bold">Active Boards:</span>
                <span className="font-mono font-black text-indigo-700 text-sm">Board 1 to 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL FUNDS DETAILS */}
      {activeTab === 'funds' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">All Funds & Accounting Buckets</h2>
            <p className="text-xs text-slate-500 mt-1">
              Live breakdown of protocol smart contract balance reserves and automated distribution accounting buckets ($100 USDT Entry Deposit).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-300 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contract Vault USDT</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">On-Chain</span>
              </div>
              <p className="text-3xl font-black text-emerald-600 font-mono">${contractUsdtBalance} USDT</p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">Total USDT held in GROW50X Core Contract</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-cyan-300 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">10-Day Share Pool Reserve (30%)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-100 text-cyan-700 rounded-full border border-cyan-200">$30 / Entry</span>
              </div>
              <p className="text-3xl font-black text-cyan-600 font-mono">${sharePoolBalance} USDT</p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">Accumulated for 10-day global share payout</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-300 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Protocol Shares</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">Active Shares</span>
              </div>
              <p className="text-3xl font-black text-indigo-600 font-mono">{totalActiveShares} Shares</p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">Sum of active user shares across all board levels</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">All Users & Sub-IDs Directory</h2>
            <p className="text-xs text-slate-500 mt-1">
              Search and analyze all registered protocol user accounts, main IDs, generated sub-IDs, and downline data directly from smart contract storage.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-full md:w-96 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by User ID (e.g. 363306), Wallet Address, or Sponsor ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Accounts ({usersList.length})
              </button>
              <button
                onClick={() => setUserFilter('main')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userFilter === 'main' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Main IDs Only ({usersList.filter((u) => !u.isSubId).length})
              </button>
              <button
                onClick={() => setUserFilter('sub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userFilter === 'sub' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sub-IDs Only ({usersList.filter((u) => u.isSubId).length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <th className="p-3 font-bold">User ID</th>
                      <th className="p-3 font-bold">Wallet Address</th>
                      <th className="p-3 font-bold">Owner Main ID</th>
                      <th className="p-3 font-bold">Sponsor ID</th>
                      <th className="p-3 font-bold">Current Board</th>
                      <th className="p-3 font-bold">Directs</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-center">Actions & Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 font-mono text-xs">{formatDisplayId(u.id)}</div>
                          <div className="mt-0.5">
                            {u.isSubId ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200 inline-block">
                                Sub-ID
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-block">
                                Main ID
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          <a
                            href={`https://testnet.bscscan.com/address/${u.wallet}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-sky-600 hover:underline"
                          >
                            {u.wallet ? `${u.wallet.substring(0, 6)}...${u.wallet.substring(u.wallet.length - 4)}` : 'N/A'}
                          </a>
                        </td>
                        <td className="p-3 font-mono">
                          {u.ownerMainUserId > 0 ? formatDisplayId(u.ownerMainUserId) : '-'}
                        </td>
                        <td className="p-3 font-mono">
                          {u.sponsorId > 0 ? formatDisplayId(u.sponsorId) : 'Root'}
                        </td>
                        <td className="p-3 font-bold text-indigo-600">Board {u.currentBoard}</td>
                        <td className="p-3 font-bold">{u.directCount}</td>
                        <td className="p-3">
                          {u.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Inactive</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/dashboard?inspect=${u.id}`}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white transition-all shadow-md flex items-center gap-1 whitespace-nowrap hover:scale-105"
                              title={`Ghost Login: Inspect live telemetry dashboard for User ${formatDisplayId(u.id)}`}
                            >
                              <span>👻</span> Ghost Login
                            </Link>

                            <button
                              onClick={() => handleViewUserBoard(u.currentBoard, u.id)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white transition-all shadow-sm flex items-center gap-1 whitespace-nowrap hover:scale-105"
                            >
                              <span>🧩</span> View Board
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <span className="text-4xl">👥</span>
                <h4 className="text-base font-bold text-slate-800">No On-Chain Users Found</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ALL BOARDS DETAILS */}
      {activeTab === 'boards' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">All Boards Details & Matrix Monitor</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select a Board Level from the dropdown below to list all active & completed board units in the left sidebar, then click any unit to inspect its 7-position user tree.
              </p>
            </div>

            {/* Board Tier Selector Dropdown */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Select Board Level:</span>
              <select
                value={selectedBoardLevel}
                onChange={(e) => setSelectedBoardLevel(Number(e.target.value))}
                className="bg-slate-50 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {boardConfigs.map((b) => (
                  <option key={b.level} value={b.level}>
                    Level {b.level}: {b.name.split('-')[1].trim()} (Reward: {b.reward} | {b.shareMult} Share)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Board Level Summary Banner - Bright Gradient */}
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white p-5 sm:p-6 rounded-3xl shadow-md shadow-sky-500/15 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-sky-200 uppercase tracking-widest">Active Tier Summary</span>
              <h3 className="text-lg sm:text-xl font-black mt-0.5 text-white">
                {boardConfigs.find((b) => b.level === selectedBoardLevel)?.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Entry: {boardConfigs.find((b) => b.level === selectedBoardLevel)?.fee}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Reward: {boardConfigs.find((b) => b.level === selectedBoardLevel)?.reward}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Share Weight: {boardConfigs.find((b) => b.level === selectedBoardLevel)?.shareMult}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Lifetime Cap: {boardConfigs.find((b) => b.level === selectedBoardLevel)?.cap}
              </span>
            </div>
          </div>

          {/* Sub-Navigation Toggle: Active Board Units vs Hold Queue */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setBoardViewMode('active')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                boardViewMode === 'active'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>⚡</span> Active Board Units Queue ({activeBoardsQueue.length})
            </button>
            <button
              onClick={() => setBoardViewMode('hold')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                boardViewMode === 'hold'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>⏳</span> Hold / Pending Users Queue ({holdUsersQueue.length})
            </button>
          </div>

          {boardViewMode === 'hold' ? (
            /* HOLD / PENDING QUEUE MONITOR TABLE */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      Qualification Queue
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Level {selectedBoardLevel} Board
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Hold & Pending Users Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Users who completed Level {selectedBoardLevel} board but are waiting for direct referral qualification before advancing to Level {selectedBoardLevel + 1}.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center min-w-[120px]">
                  <span className="text-2xl font-black text-amber-700 block">{holdUsersQueue.length}</span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Users On Hold</span>
                </div>
              </div>

              {holdUsersQueue.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                        <th className="p-3 font-bold">User ID</th>
                        <th className="p-3 font-bold">Account Type</th>
                        <th className="p-3 font-bold">Wallet Address</th>
                        <th className="p-3 font-bold">Direct Referrals</th>
                        <th className="p-3 font-bold">Directs Needed</th>
                        <th className="p-3 font-bold">Target Board</th>
                        <th className="p-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {holdUsersQueue.map((u) => (
                        <tr key={u.userId} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3 font-bold text-slate-900 font-mono">
                            {formatDisplayId(u.userId)}
                          </td>
                          <td className="p-3">
                            {u.isSubId ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">Sub-ID</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">Main ID</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {u.wallet ? `${u.wallet.substring(0, 6)}...${u.wallet.substring(u.wallet.length - 4)}` : 'N/A'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {u.directCount} / {u.requiredDirects} Directs
                          </td>
                          <td className="p-3 font-bold text-amber-600">
                            {u.neededDirects > 0 ? `Needs ${u.neededDirects} More` : 'Qualified'}
                          </td>
                          <td className="p-3 font-bold text-indigo-600">
                            Level {u.targetLevel} Board
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              ⏳ On Hold (Awaiting Directs)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <span className="text-4xl">✅</span>
                  <h4 className="text-base font-bold text-slate-800">No Users Currently On Hold in Level {selectedBoardLevel}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All users who completed Level {selectedBoardLevel} board have satisfied direct referral requirements and advanced to Level {selectedBoardLevel + 1}!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* 2-Column Split: Left Side List of Active Units + Right Side Matrix Canvas */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Side: Active Board Units List */}
              <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Active Boards</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                    Level {selectedBoardLevel}
                  </span>
                </div>

                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {activeBoardsQueue.length > 0 ? (
                    activeBoardsQueue.map((b) => {
                      const isSelected = targetBoardUnitId === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleSelectUnit(b.id)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-black font-mono block">Unit #{b.id}</span>
                            <span className={`text-[10px] font-semibold ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                              {b.filledCount}/7 Filled {b.filledCount === 7 ? '🏁' : '⚡'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-emerald-100 text-emerald-700'}`}>
                            Select →
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs font-semibold text-slate-400">
                      No active units found for Level {selectedBoardLevel}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Matrix Visualizer Canvas */}
              <div className="lg:col-span-3 bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Currently Inspecting Unit</span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      Board Unit #{inspectedBoardUnit.boardId} (Level {selectedBoardLevel})
                    </h3>
                  </div>
                  {inspectedBoardUnit.filledCount === 7 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-300">
                      Completed 🏁
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      Active ({inspectedBoardUnit.filledCount}/7 Filled) ⚡
                    </span>
                  )}
                </div>

                {boardDetailsLoading ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs">
                    <span>🔄</span> Loading Board Matrix Positions...
                  </div>
                ) : (
                  /* Pyramidal 7-Position Matrix Tree Canvas */
                  <div className="flex flex-col items-center w-full max-w-4xl space-y-6 mx-auto pt-2">
                    {/* Level 1: Position 1 (Top Root Node) */}
                    <div className="flex flex-col items-center w-full max-w-xs">
                      <AdminMatrixNode item={inspectedBoardUnit.positions[0]} isTop />
                      <div className="w-0.5 h-6 bg-slate-300" />
                    </div>

                    {/* Level 2: Positions 2 & 3 */}
                    <div className="flex flex-col items-center w-full max-w-2xl">
                      <div className="w-1/2 h-0.5 bg-slate-300" />
                      <div className="grid grid-cols-2 gap-6 md:gap-12 w-full pt-2">
                        <div className="flex flex-col items-center">
                          <AdminMatrixNode item={inspectedBoardUnit.positions[1]} />
                          <div className="w-0.5 h-6 bg-slate-300" />
                        </div>
                        <div className="flex flex-col items-center">
                          <AdminMatrixNode item={inspectedBoardUnit.positions[2]} />
                          <div className="w-0.5 h-6 bg-slate-300" />
                        </div>
                      </div>
                    </div>

                    {/* Level 3: Positions 4, 5, 6, 7 */}
                    <div className="w-full">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <AdminMatrixNode item={inspectedBoardUnit.positions[3]} />
                        <AdminMatrixNode item={inspectedBoardUnit.positions[4]} />
                        <AdminMatrixNode item={inspectedBoardUnit.positions[5]} />
                        <AdminMatrixNode item={inspectedBoardUnit.positions[6]} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SMART CONTRACTS & VERIFICATION */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Smart Contracts & On-Chain Audit Invariants</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify deployed contract addresses on BNB Smart Chain Testnet and inspect immutable security invariants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">GROW 50X Core Contract</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Core Logic</span>
              </div>
              <p className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl break-all border border-slate-200">
                {CONTRACT_ADDRESSES.GROW50X_CORE}
              </p>
              <a
                href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.GROW50X_CORE}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:underline"
              >
                <span>🔗</span> View Verified Contract on BSCScan Explorer →
              </a>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">USDT Token Contract</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-100 text-cyan-700 rounded-full">BEP-20 Payment</span>
              </div>
              <p className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl break-all border border-slate-200">
                {CONTRACT_ADDRESSES.USDT}
              </p>
              <a
                href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.USDT}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:underline"
              >
                <span>🔗</span> View USDT Token on BSCScan Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMatrixNode({ item, isTop = false }: { item: any; isTop?: boolean }) {
  if (!item) return null;
  const isOccupied = item.status === 'Occupied';

  return (
    <div
      className={`p-4 rounded-2xl border text-center transition-all duration-300 w-full relative ${
        isTop
          ? 'border-sky-500 bg-gradient-to-b from-sky-50 to-white shadow-md shadow-sky-500/10 ring-2 ring-sky-400/20'
          : isOccupied
          ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/80 to-white shadow-sm'
          : 'border-slate-200 bg-slate-50/60 opacity-70'
      }`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
        {item.label}
      </span>
      {isOccupied ? (
        <>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-base font-black text-slate-900 font-mono">{item.id}</span>
            {item.isSubId ? (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-purple-100 text-purple-700 rounded-full">Sub</span>
            ) : (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-sky-100 text-sky-700 rounded-full">Main</span>
            )}
          </div>
          <p className="text-[11px] font-mono text-sky-600 mt-0.5">{item.wallet}</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full">
              Occupied
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
              {item.directs} Directs
            </span>
            {item.downline !== undefined && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full">
                {item.downline} Downline
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-400 italic mt-1">Empty Slot</p>
          <span className="inline-block px-2.5 py-0.5 mt-2 text-[10px] font-bold bg-slate-200 text-slate-500 rounded-full">
            Available
          </span>
        </>
      )}
    </div>
  );
}
