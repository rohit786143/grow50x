'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../config/contracts';
import { useWeb3 } from '../../context/Web3Context';


export default function BoardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Board Matrix...</div>}>
      <BoardsContent />
    </Suspense>
  );
}

function BoardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramUserId = searchParams.get('userId') || searchParams.get('user') || searchParams.get('id');
  const paramUnitId = searchParams.get('unitId') || searchParams.get('unit');

  const { account, mainUserId, selectedUserId, setSelectedUserId } = useWeb3();
  const [selectedBoardLevel, setSelectedBoardLevel] = useState<number>(0);
  const [targetBoardId, setTargetBoardId] = useState<number | null>(null);
  const [ownedAccountsList, setOwnedAccountsList] = useState<{ id: number; label: string; isMain: boolean }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [userCurrentBoard, setUserCurrentBoard] = useState<number>(1);
  const [userActiveBoardId, setUserActiveBoardId] = useState<number>(0);
  const [inspectedUserId, setInspectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUserOnHold, setIsUserOnHold] = useState<boolean>(false);
  const [holdDetails, setHoldDetails] = useState<{
    targetLevel: number;
    holdLevel: number;
    requiredDirects: number;
    currentDirects: number;
    neededDirects: number;
  } | null>(null);
  const [showCompletedTreeAnyway, setShowCompletedTreeAnyway] = useState<boolean>(false);
  const [isTopNodeOnHold, setIsTopNodeOnHold] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(1.3, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.6, Number((prev - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoomLevel(1);

  const [boardUnit, setBoardUnit] = useState<any>({
    boardId: 1001,
    boardLevel: 1,
    filledCount: 0,
    positions: Array(7).fill({ pos: 0, label: '', id: null, wallet: null, status: 'Available', sponsor: null, directs: 0, isSubId: false }),
  });

  useEffect(() => {
    loadUserBoardState();
  }, [account, mainUserId, selectedUserId, selectedBoardLevel, targetBoardId, selectedAccountId, paramUserId, paramUnitId]);

  const formatDisplayId = (id: number) => {
    if (!id || id <= 0) return '';
    return `GR${id.toString().padStart(6, '0')}`;
  };

  const loadUserBoardState = async () => {
    setIsLoading(true);
    try {
      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      if (!coreAddress || coreAddress === '0x0000000000000000000000000000000000000000') {
        setIsLoading(false);
        return;
      }

      // Fast read-only RPC provider: direct HTTP connection avoids mobile in-app wallet JS bridge lag
      let provider: ethers.Provider;
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/';
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
      } catch {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
          setIsLoading(false);
          return;
        }
      }

      const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);

      // Resolve mainUserId from connected wallet if not set in context
      let resolvedMainUserId = mainUserId;
      let userAddr = account;
      if (!userAddr && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const browserProv = new ethers.BrowserProvider((window as any).ethereum);
          const accs = await browserProv.send('eth_accounts', []);
          if (accs.length > 0) userAddr = accs[0];
        } catch (e) {}
      }

      if (resolvedMainUserId === 0 && userAddr) {
        try {
          const checksumAddr = ethers.getAddress(userAddr);
          const mIdRaw = await coreContract.walletToMainUserId(checksumAddr);
          resolvedMainUserId = Number(mIdRaw);
        } catch (e) {
          console.error('Error fetching walletToMainUserId:', e);
        }
      }

      // Determine active target user ID to display (Selected Sub-ID > Selected Account > Main ID)
      let activeTargetUserId = paramUserId
        ? parseInt(paramUserId.replace(/[^0-9]/g, ''))
        : selectedAccountId > 0
        ? selectedAccountId
        : selectedUserId > 0
        ? selectedUserId
        : resolvedMainUserId;

      if (paramUserId) {
        const parsedParam = parseInt(paramUserId.replace(/[^0-9]/g, ''));
        if (parsedParam > 0) {
          setInspectedUserId(parsedParam);
          activeTargetUserId = parsedParam;
        }
      } else {
        setInspectedUserId(null);
      }

      // Step 1: Query user profile, active board unit, hold status & sub-IDs in 1 PARALLEL roundtrip
      const [uData, activeBIdRaw, holdingRaw, holdingTargetRaw, subIdsRaw] = await Promise.all([
        activeTargetUserId > 0 ? coreContract.users(activeTargetUserId).catch(() => null) : null,
        activeTargetUserId > 0 ? coreContract.userActiveBoardUnit(activeTargetUserId).catch(() => 0) : 0,
        activeTargetUserId > 0 ? coreContract.isHoldingForQualification(activeTargetUserId).catch(() => false) : false,
        activeTargetUserId > 0 ? coreContract.holdingTargetLevel(activeTargetUserId).catch(() => 0) : 0,
        resolvedMainUserId > 0 ? coreContract.ownerSubIds(resolvedMainUserId).catch(() => []) : [],
      ]);

      const userLvl = Number(uData?.currentBoard) || 1;
      setUserCurrentBoard(userLvl);

      const activeBoardId = Number(activeBIdRaw) || 0;
      setUserActiveBoardId(activeBoardId);

      // Populate Sub-IDs list
      if (resolvedMainUserId > 0 && Array.isArray(subIdsRaw)) {
        const accList: { id: number; label: string; isMain: boolean }[] = [
          {
            id: resolvedMainUserId,
            label: `${formatDisplayId(resolvedMainUserId)} (Main ID ⭐)`,
            isMain: true,
          },
        ];

        subIdsRaw.forEach((subIdBig: any, idx: number) => {
          const sId = Number(subIdBig);
          if (sId > 0) {
            accList.push({
              id: sId,
              label: `${formatDisplayId(sId)} (Sub-ID #${idx + 1})`,
              isMain: false,
            });
          }
        });

        setOwnedAccountsList(accList);
      }

      // Check hold/pending status
      const isOnHold = Boolean(holdingRaw);
      let hDetails: any = null;
      if (isOnHold) {
        const targetLvl = Number(holdingTargetRaw) || (userLvl + 1);
        const holdLevel = targetLvl > 1 ? targetLvl - 1 : userLvl;
        const requiredDirects = holdLevel === 1 ? 2 : holdLevel === 2 ? 3 : holdLevel === 3 ? 4 : 5;
        const currentDirects = Number(uData?.directCount || 0);
        const neededDirects = Math.max(0, requiredDirects - currentDirects);

        hDetails = {
          targetLevel: targetLvl,
          holdLevel,
          requiredDirects,
          currentDirects,
          neededDirects,
        };
      }

      setIsUserOnHold(isOnHold);
      setHoldDetails(hDetails);

      const effectiveLvl = selectedBoardLevel > 0 ? selectedBoardLevel : userLvl;

      // Step 2: Determine Target Board ID
      let bId = targetBoardId;
      if (!bId) {
        if (paramUnitId) {
          bId = parseInt(paramUnitId);
        } else if (effectiveLvl === userLvl && activeBoardId > 0) {
          // By default, view user's active board directly
          bId = activeBoardId;
        } else {
          // If a different level was selected (e.g. past completed board):
          // Find the board unit for this level that contains the target user
          let foundUnit = 0;
          try {
            const totalBoardsRaw = await coreContract.boardIdCounter();
            const total = Number(totalBoardsRaw);
            const base = effectiveLvl * 1000 + 1;
            for (let checkId = base + total; checkId >= base; checkId--) {
              try {
                const pos = await coreContract.getBoardUnitPositions(checkId);
                for (let p of pos) {
                  if (Number(p) === activeTargetUserId) {
                    foundUnit = checkId;
                    break;
                  }
                }
                if (foundUnit > 0) break;
              } catch (e) {}
            }
          } catch (e) {}

          if (foundUnit > 0) {
            bId = foundUnit;
          } else {
            // Fallback to active board of this level
            try {
              const activeIds = await coreContract.getActiveBoardUnitsByLevel(effectiveLvl);
              if (activeIds && activeIds.length > 0) {
                bId = Number(activeIds[activeIds.length - 1]);
              }
            } catch (e) {}

            if (!bId) {
              bId = effectiveLvl * 1000 + 1;
            }
          }
        }
      }

      // Step 3: Fetch Board Unit Positions in 1 call
      let positionsRaw = [0, 0, 0, 0, 0, 0, 0];
      try {
        positionsRaw = await coreContract.getBoardUnitPositions(bId);
      } catch (e) {
        console.error('Error fetching board positions for unit', bId, e);
        positionsRaw = [0, 0, 0, 0, 0, 0, 0];
      }

      const topUserIdRaw = Number(positionsRaw[0]);

      // Step 4: Parallel fetch for top node qualification and all 7 positions profiles
      const [topOnHold, ...usersProfiles] = await Promise.all([
        topUserIdRaw > 0 ? coreContract.isHoldingForQualification(topUserIdRaw).catch(() => false) : false,
        ...positionsRaw.map((posIdBig: any) => {
          const pId = Number(posIdBig);
          if (pId > 0) {
            return coreContract.users(pId).catch(() => null);
          }
          return Promise.resolve(null);
        }),
      ]);

      setIsTopNodeOnHold(Boolean(topOnHold));

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
      const parsedPositions = positionsRaw.map((posIdBig: any, idx: number) => {
        const pId = Number(posIdBig);
        const uProfile = usersProfiles[idx];

        if (pId > 0) {
          filled++;
          const walletAddr = uProfile?.wallet || '0x0000000000000000000000000000000000000000';
          const shortWallet = walletAddr.length > 10
            ? `${walletAddr.substring(0, 6)}...${walletAddr.substring(walletAddr.length - 4)}`
            : '0x00...00';
          const sponsorIdNum = Number(uProfile?.sponsorId || 0);

          return {
            pos: idx + 1,
            label: labels[idx],
            id: formatDisplayId(pId),
            wallet: shortWallet,
            fullWallet: walletAddr,
            sponsor: sponsorIdNum > 0 ? formatDisplayId(sponsorIdNum) : 'Root',
            directs: Number(uProfile?.directCount || 0),
            isSubId: Boolean(uProfile?.isSubId),
            status: 'Occupied',
          };
        }

        return {
          pos: idx + 1,
          label: labels[idx],
          id: null,
          wallet: null,
          sponsor: null,
          directs: 0,
          isSubId: false,
          status: 'Available',
        };
      });

      const computedBoardLevel = bId >= 1000 ? Math.floor(bId / 1000) : effectiveLvl;

      setBoardUnit({
        boardId: bId,
        boardLevel: computedBoardLevel,
        filledCount: filled,
        positions: parsedPositions,
      });
    } catch (err) {
      console.error('Error loading user board matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = async (targetId: number) => {
    setSelectedAccountId(targetId);
    setSelectedUserId(targetId);
    setSelectedBoardLevel(0); // Reset to auto so it loads that ID's active board
    setTargetBoardId(null);
    setShowCompletedTreeAnyway(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const boardNames = [
    'Board 1 (Starter - $40 Reward)',
    'Board 2 (Bronze - $80 Reward)',
    'Board 3 (Silver - $160 Reward)',
    'Board 4 (Gold - $320 Reward)',
    'Board 5 (Diamond - $640 Reward)',
  ];

  const activeUserIdForRender = selectedAccountId || selectedUserId || mainUserId;

  // Enforce immediate scroll-to-top whenever account ID or board level changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [activeUserIdForRender, selectedBoardLevel]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Inspected User Notification Banner */}
      {inspectedUserId && inspectedUserId !== mainUserId && (
        <div className="bg-purple-900 text-white p-4 rounded-2xl border border-purple-700 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧩</span>
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Inspecting Referral Board</p>
              <p className="text-sm font-extrabold text-white">
                Viewing Active Matrix for User ID: <span className="font-mono text-purple-200">{formatDisplayId(inspectedUserId)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setInspectedUserId(null);
              setTargetBoardId(null);
              setSelectedAccountId(mainUserId);
              setShowCompletedTreeAnyway(false);
              router.push('/boards');
            }}
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 border border-purple-600 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap"
          >
            ⬅️ Return to My Main ID Board
          </button>
        </div>
      )}
      {/* 👤 Owned Account Selector (Main ID vs Sub-IDs) */}
      {ownedAccountsList.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👤</span>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Matrix Account Switcher
              </span>
              <span className="text-xs font-black text-slate-800">
                Viewing Tree for: <span className="font-mono text-amber-600 font-extrabold">{formatDisplayId(activeUserIdForRender)}</span>
              </span>
            </div>
          </div>
          <select
            value={selectedAccountId || mainUserId}
            onChange={(e) => handleAccountChange(Number(e.target.value))}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {ownedAccountsList.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 📊 5-Board Level Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3, 4, 5].map((lvl) => {
          const isUserActiveLevel = lvl === userCurrentBoard;
          const isCompleted = lvl < userCurrentBoard;
          const isCurrentSelected = (selectedBoardLevel === 0 && isUserActiveLevel) || selectedBoardLevel === lvl;
          const isLocked = lvl > userCurrentBoard;

          const levelIcons = ['⭐', '🥉', '🥈', '🥇', '💎'];

          return (
            <button
              key={lvl}
              disabled={isLocked}
              onClick={() => {
                setSelectedBoardLevel(lvl);
                setTargetBoardId(null);
                setShowCompletedTreeAnyway(false);
              }}
              className={`px-3.5 sm:px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-1.5 border shadow-2xs ${
                isCurrentSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                  : isLocked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span>{levelIcons[lvl - 1]}</span>
              <span>Board {lvl}</span>
              {isUserActiveLevel && (
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-slate-950 text-amber-300 ml-1">
                  Active
                </span>
              )}
              {isCompleted && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 ml-1">
                  Done ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 🧩 DIRECT USER BOARD MATRIX visualizer OR HOLD STATUS CARD */}
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[480px]">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-xs">
            <span>🔄</span> Loading Board Matrix...
          </div>
        ) : isUserOnHold && holdDetails && !showCompletedTreeAnyway ? (
          /* ⏳ ON HOLD / QUALIFICATION PENDING CARD */
          <div className="w-full max-w-2xl bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-900 border-2 border-amber-500/60 p-8 rounded-3xl text-white shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner animate-pulse">
              ⏳
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 inline-block">
                BOARD ON HOLD • DIRECT QUALIFICATION REQUIRED
              </span>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                User {formatDisplayId(activeUserIdForRender)} is on Hold in Level {holdDetails.holdLevel} Board
              </h2>
              <p className="text-sm font-semibold text-amber-200/90 max-w-lg mx-auto">
                Current Directs: <span className="font-extrabold text-white">{holdDetails.currentDirects}/{holdDetails.requiredDirects}</span>.{' '}
                <span className="font-extrabold text-amber-300 uppercase underline decoration-2">
                  Needs {holdDetails.neededDirects} more direct referral{holdDetails.neededDirects > 1 ? 's' : ''}
                </span>{' '}
                to qualify for Level {holdDetails.targetLevel} Board!
              </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-400">Direct Referrals Progress:</span>
                <span className="text-amber-400 font-mono">
                  {holdDetails.currentDirects} / {holdDetails.requiredDirects} Directs ({Math.round((holdDetails.currentDirects / holdDetails.requiredDirects) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/50"
                  style={{ width: `${Math.min(100, (holdDetails.currentDirects / holdDetails.requiredDirects) * 100)}%` }}
                />
              </div>
            </div>

            {/* Action Callout & Instructions */}
            <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-200 space-y-2 text-left">
              <p className="font-bold flex items-center gap-2 text-amber-300">
                <span>💡</span> How to unlock Level {holdDetails.targetLevel} Board & collect completion reward:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-medium pl-1">
                <li>Share your referral link to register {holdDetails.neededDirects} new Main User account{holdDetails.neededDirects > 1 ? 's' : ''}.</li>
                <li>OR create {holdDetails.neededDirects} Sub-ID{holdDetails.neededDirects > 1 ? 's' : ''} under this account from the Sub-IDs Manager.</li>
                <li>Once completed, the smart contract will automatically release this ID from hold, pay your Board {holdDetails.holdLevel} reward, and advance you to Level {holdDetails.targetLevel} Board!</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/sub-ids')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all"
              >
                🚀 Create Sub-ID Now
              </button>
              <button
                onClick={() => setShowCompletedTreeAnyway(true)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
              >
                👁️ View Last Completed Board Tree
              </button>
            </div>
          </div>
        ) : (
          /* MATRIX TREE VISUALIZER */
          <>
            {isUserOnHold && showCompletedTreeAnyway && (
              <div className="w-full mb-6 bg-amber-900/90 text-amber-100 p-4 rounded-2xl border border-amber-700 shadow-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>⏳</span>
                  <span>
                    Viewing completed matrix tree history for <strong className="text-white">{formatDisplayId(activeUserIdForRender)}</strong>. Note: This ID is currently on HOLD awaiting direct qualification.
                  </span>
                </div>
                <button
                  onClick={() => setShowCompletedTreeAnyway(false)}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 rounded-xl text-xs font-bold text-white border border-amber-600 whitespace-nowrap"
                >
                  Return to Hold Card
                </button>
              </div>
            )}

            {isTopNodeOnHold && !isUserOnHold && (
              <div className="w-full mb-6 bg-amber-50 text-amber-900 p-4 rounded-2xl border border-amber-300 flex items-center gap-3 text-xs font-bold">
                <span>⚠️</span>
                <span>
                  Top User ({boardUnit.positions[0]?.id}) in this board completed matrix requirements but is currently <strong className="underline">ON HOLD</strong> awaiting direct referral qualification.
                </span>
              </div>
            )}

            {/* Header Badges & Title (Mobile & Desktop Optimized) */}
            <div className="text-center mb-5 sm:mb-6 space-y-2.5 w-full">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 uppercase tracking-wider font-mono shadow-2xs whitespace-nowrap">
                  Unit #{boardUnit.boardId}
                </span>
                {boardUnit.boardId === userActiveBoardId && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap flex items-center gap-1">
                    <span>⭐</span> My Active Board
                  </span>
                )}
                {boardUnit.filledCount === 7 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-300 shadow-2xs whitespace-nowrap">
                    Completed (7/7) 🏁
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap flex items-center gap-1">
                    <span>⚡</span> Active ({boardUnit.filledCount}/7 Filled)
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight px-2 leading-tight">
                {boardNames[boardUnit.boardLevel - 1]} Matrix
              </h1>
            </div>

            {/* 🔍 Interactive Zoom & Slide Controls Toolbar */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 p-2.5 sm:px-4 sm:py-2 rounded-2xl border border-slate-200 mb-5 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] sm:text-xs">
                <span className="text-sky-600 font-bold text-sm">↔️</span>
                <span>Slide left/right to explore all tree branches</span>
              </div>

              {/* Zoom Buttons Controls Group */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.6}
                  title="Zoom Out Matrix View"
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-all text-xs active:scale-95"
                >
                  ➖
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  title="Reset Zoom to 100%"
                  className="px-2 h-7 sm:h-8 flex items-center justify-center font-mono font-black text-[11px] text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 1.3}
                  title="Zoom In Matrix View"
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-all text-xs active:scale-95"
                >
                  ➕
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => (prev <= 0.7 ? 1 : 0.65))}
                  title="Toggle Mobile Fit to Screen View"
                  className="px-2.5 h-7 sm:h-8 flex items-center justify-center font-bold text-[10px] sm:text-[11px] text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all whitespace-nowrap ml-0.5"
                >
                  {zoomLevel <= 0.7 ? '100% View' : '📱 Fit Screen'}
                </button>
              </div>
            </div>

            {/* 🌳 Pyramidal 7-Position Matrix Tree Viewport (Horizontal Slideable & Zoomable) */}
            <div className="w-full overflow-x-auto overflow-y-visible pb-6 pt-2 px-1 scrollbar-thin scrollbar-thumb-slate-300 touch-pan-x cursor-grab active:cursor-grabbing border-b border-slate-100">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '680px',
                  marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * 380)}px` : '0px',
                }}
                className="flex flex-col items-center mx-auto"
              >
                {/* Level 1: Position 1 (Top Root Node) */}
                <div className="flex flex-col items-center w-full max-w-xs">
                  <MatrixNode item={boardUnit.positions[0]} isTop />
                  <div className="w-0.5 h-6 bg-slate-300" />
                </div>

                {/* Level 2: Positions 2 & 3 */}
                <div className="flex flex-col items-center w-full max-w-xl">
                  <div className="w-1/2 h-0.5 bg-slate-300" />
                  <div className="grid grid-cols-2 gap-8 w-full pt-2">
                    <div className="flex flex-col items-center">
                      <MatrixNode item={boardUnit.positions[1]} />
                      <div className="w-0.5 h-6 bg-slate-300" />
                    </div>
                    <div className="flex flex-col items-center">
                      <MatrixNode item={boardUnit.positions[2]} />
                      <div className="w-0.5 h-6 bg-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Level 3: Positions 4, 5, 6, 7 (True 4-Column Tree Hierarchy) */}
                <div className="w-full max-w-4xl">
                  <div className="grid grid-cols-4 gap-3 w-full">
                    <MatrixNode item={boardUnit.positions[3]} />
                    <MatrixNode item={boardUnit.positions[4]} />
                    <MatrixNode item={boardUnit.positions[5]} />
                    <MatrixNode item={boardUnit.positions[6]} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MatrixNode({ item, isTop = false }: { item: any; isTop?: boolean }) {
  if (!item) return null;
  const isOccupied = item.status === 'Occupied';

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border text-center transition-all duration-300 w-full relative min-w-[140px] ${
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
          <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full whitespace-nowrap">
              Occupied
            </span>
            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 rounded-full whitespace-nowrap">
              {item.directs} Directs
            </span>
            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full whitespace-nowrap">
              Ref: {item.sponsor || 'Root'}
            </span>
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
