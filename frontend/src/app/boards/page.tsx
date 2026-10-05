'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../config/contracts';
import { useWeb3 } from '../../context/Web3Context';

// Helper function to discover all unique on-chain user IDs
async function discoverAllUserIds(coreContract: any): Promise<number[]> {
  const uniqueUserIds = new Set<number>();

  // 1. Query UserRegistered events from smart contract
  try {
    const filter = coreContract.filters.UserRegistered();
    const events = await coreContract.queryFilter(filter, 0, 'latest');
    for (const ev of events) {
      const uId = Number((ev as any).args?.id ?? (ev as any).args?.[0] ?? 0);
      const sponsorId = Number((ev as any).args?.sponsorId ?? (ev as any).args?.[3] ?? 0);
      if (uId > 0) uniqueUserIds.add(uId);
      if (sponsorId > 0) uniqueUserIds.add(sponsorId);
    }
  } catch (e) {}

  // 2. Scan active board units by level 1..5
  try {
    for (let level = 1; level <= 5; level++) {
      try {
        const boardIds = await coreContract.getActiveBoardUnitsByLevel(level);
        for (const bIdBig of boardIds) {
          const bId = Number(bIdBig);
          if (bId > 0) {
            try {
              const positions = await coreContract.getBoardUnitPositions(bId);
              positions.forEach((pIdBig: any) => {
                const pId = Number(pIdBig);
                if (pId > 0) uniqueUserIds.add(pId);
              });
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  // 3. Scan boards sequentially by counter
  try {
    const totalBoardsRaw = await coreContract.boardIdCounter();
    const totalBoards = Number(totalBoardsRaw || 0);
    for (let bLvl = 1; bLvl <= 5; bLvl++) {
      const base = bLvl * 1000 + 1;
      for (let bId = base; bId < base + totalBoards + 10; bId++) {
        try {
          const positionsRaw = await coreContract.getBoardUnitPositions(bId);
          positionsRaw.forEach((pIdBig: any) => {
            const pId = Number(pIdBig);
            if (pId > 0) uniqueUserIds.add(pId);
          });
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 4. For all discovered main IDs, discover owned sub-IDs
  const existingIds = Array.from(uniqueUserIds);
  for (const mId of existingIds) {
    try {
      const subIdsRaw = await coreContract.getOwnerSubIds(mId);
      subIdsRaw.forEach((sIdBig: any) => {
        const sId = Number(sIdBig);
        if (sId > 0) uniqueUserIds.add(sId);
      });
    } catch (e) {}
  }

  return Array.from(uniqueUserIds);
}

async function buildDownlineCountsMap(coreContract: any): Promise<Map<number, number>> {
  const downlineCounts = new Map<number, number>();
  try {
    const userIds = await discoverAllUserIds(coreContract);
    const sponsorMap = new Map<number, number[]>();

    for (const uId of userIds) {
      try {
        const u = await coreContract.users(uId);
        const sponsor = Number(u[3] !== undefined ? u[3] : (u.sponsorId || 0));
        if (sponsor > 0) {
          if (!sponsorMap.has(sponsor)) sponsorMap.set(sponsor, []);
          sponsorMap.get(sponsor)!.push(uId);
        }
      } catch (e) {}
    }

    for (const uId of userIds) {
      let count = 0;
      const queue: number[] = [uId];
      const visited = new Set<number>();
      visited.add(uId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const children = sponsorMap.get(curr) || [];
        for (const child of children) {
          if (!visited.has(child)) {
            visited.add(child);
            count++;
            queue.push(child);
          }
        }
      }

      downlineCounts.set(uId, count);
    }
  } catch (e) {
    console.warn('Error building downline counts map:', e);
  }

  return downlineCounts;
}

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
  const [selectedBoardLevel, setSelectedBoardLevel] = useState<number>(1);
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
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
      if (!coreAddress || coreAddress === '0x0000000000000000000000000000000000000000') {
        setIsLoading(false);
        return;
      }

      const coreContract = new ethers.Contract(coreAddress, GROW50X_CORE_ABI, provider);

      // Resolve mainUserId from connected wallet if not set in context
      let resolvedMainUserId = mainUserId;
      let userAddr = account;
      if (!userAddr) {
        try {
          const accs = await provider.send('eth_accounts', []);
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

      // Query user's current board level and active board unit ID from smart contract
      let userLvl = 1;
      let activeBoardId = 0;

      if (activeTargetUserId > 0) {
        try {
          const uData = await coreContract.users(activeTargetUserId);
          userLvl = Number(uData.currentBoard) || 1;
          setUserCurrentBoard(userLvl);

          const activeBIdRaw = await coreContract.userActiveBoardUnit(activeTargetUserId);
          activeBoardId = Number(activeBIdRaw);
          setUserActiveBoardId(activeBoardId);
        } catch (e) {
          console.error('Error fetching user board data:', e);
        }
      }

      if (resolvedMainUserId > 0) {
        try {
          // Fetch user's owned Sub-IDs from smart contract
          const subIdsRaw = await coreContract.ownerSubIds(resolvedMainUserId);
          const accList: { id: number; label: string; isMain: boolean }[] = [
            {
              id: resolvedMainUserId,
              label: `${formatDisplayId(resolvedMainUserId)} (Main ID ⭐)`,
              isMain: true,
            },
          ];

          subIdsRaw.forEach((subIdBig: any, idx: number) => {
            const sId = Number(subIdBig);
            accList.push({
              id: sId,
              label: `${formatDisplayId(sId)} (Sub-ID #${idx + 1})`,
              isMain: false,
            });
          });

          setOwnedAccountsList(accList);
        } catch (e) {
          console.error('Error fetching user accounts state:', e);
        }
      }

      // Handle query param for inspecting a specific user or board unit
      let inspectedBId = 0;
      let parsedParamUserId = paramUserId ? parseInt(paramUserId.replace(/[^0-9]/g, '')) : 0;
      if (parsedParamUserId > 0) {
        setInspectedUserId(parsedParamUserId);
        activeTargetUserId = parsedParamUserId;
      } else {
        setInspectedUserId(null);
      }

      // Check hold/pending status for activeTargetUserId
      let isOnHold = false;
      let hDetails: any = null;
      if (activeTargetUserId > 0) {
        try {
          const holding = await coreContract.isHoldingForQualification(activeTargetUserId);
          if (holding) {
            isOnHold = true;
            let targetLvl = 2;
            try {
              const targetRaw = await coreContract.holdingTargetLevel(activeTargetUserId);
              targetLvl = Number(targetRaw) || 2;
            } catch (e) {}

            let uData = { directCount: 0, currentBoard: 1 };
            try {
              uData = await coreContract.users(activeTargetUserId);
            } catch (e) {}

            const holdLevel = targetLvl > 1 ? targetLvl - 1 : (Number(uData.currentBoard) || 1);
            const requiredDirects = holdLevel === 1 ? 2 : holdLevel === 2 ? 3 : holdLevel === 3 ? 4 : 5;
            const currentDirects = Number(uData.directCount || 0);
            const neededDirects = Math.max(0, requiredDirects - currentDirects);

            hDetails = {
              targetLevel: targetLvl,
              holdLevel,
              requiredDirects,
              currentDirects,
              neededDirects,
            };
          }
        } catch (e) {
          console.error('Error checking hold status:', e);
        }
      }

      setIsUserOnHold(isOnHold);
      setHoldDetails(hDetails);

      const activeLvl = selectedBoardLevel || userLvl;

      // Query active open board unit (filled < 7) for target user ID
      if (activeTargetUserId > 0) {
        try {
          const totalBoardsCountRaw = await coreContract.boardIdCounter();
          const totalBoards = Number(totalBoardsCountRaw);
          const base = activeLvl * 1000 + 1;
          let foundActiveUnit = 0;

          // Scan active board units backwards to find open board (filled < 7) containing the user
          for (let checkId = base + totalBoards + 5; checkId >= base; checkId--) {
            try {
              const pos = await coreContract.getBoardUnitPositions(checkId);
              let filled = 0;
              let userInUnit = false;
              for (let pIdx = 0; pIdx < pos.length; pIdx++) {
                const pId = Number(pos[pIdx]);
                if (pId > 0) filled++;
                if (pId === activeTargetUserId) userInUnit = true;
              }
              if (userInUnit && filled < 7) {
                foundActiveUnit = checkId;
                break;
              }
            } catch (e) {}
          }

          if (foundActiveUnit > 0) {
            inspectedBId = foundActiveUnit;
          } else {
            const targetActiveBId = await coreContract.userActiveBoardUnit(activeTargetUserId);
            const rawBId = Number(targetActiveBId);
            if (rawBId > 0) {
              try {
                const pos = await coreContract.getBoardUnitPositions(rawBId);
                let filled = 0;
                pos.forEach((pId: any) => { if (Number(pId) > 0) filled++; });
                if (filled < 7) {
                  inspectedBId = rawBId;
                }
              } catch (e) {
                inspectedBId = rawBId;
              }
            }
          }
        } catch (e) {}
      }

      if (paramUnitId) {
        inspectedBId = parseInt(paramUnitId);
      }

      // Select target board: Manual board override > Target User Active Open Board > Fallback Open Board
      let bId = targetBoardId;
      if (!bId) {
        if (inspectedBId > 0) {
          bId = inspectedBId;
        } else if (activeBoardId > 0) {
          bId = activeBoardId;
        } else {
          bId = activeLvl * 1000 + 1;
        }
      }

      let positionsRaw = [0, 0, 0, 0, 0, 0, 0];
      try {
        const res = await coreContract.getBoardUnitPositions(bId);
        positionsRaw = res;
      } catch (e) {
        positionsRaw = [0, 0, 0, 0, 0, 0, 0];
      }

      const topUserIdRaw = Number(positionsRaw[0]);
      let topOnHold = false;
      if (topUserIdRaw > 0) {
        try {
          topOnHold = await coreContract.isHoldingForQualification(topUserIdRaw);
        } catch (e) {}
      }
      setIsTopNodeOnHold(topOnHold);

      const labels = [
        'TOP (Position 1)',
        'Middle Left (Position 2)',
        'Middle Right (Position 3)',
        'Bottom Left 1 (Position 4)',
        'Bottom Left 2 (Position 5)',
        'Bottom Right 1 (Position 6)',
        'Bottom Right 2 (Position 7)',
      ];

      const downlineMap = await buildDownlineCountsMap(coreContract);

      let filled = 0;
      const parsedPositions = await Promise.all(
        positionsRaw.map(async (posIdBig: any, idx: number) => {
          const pId = Number(posIdBig);
          if (pId > 0) {
            filled++;
            let uData = { wallet: '0x0000...0000', sponsorId: 0, directCount: 0, isSubId: false };
            try {
              uData = await coreContract.users(pId);
            } catch (e) {}

            const dlCount = downlineMap.get(pId) || 0;

            return {
              pos: idx + 1,
              label: labels[idx],
              id: formatDisplayId(pId),
              wallet: uData.wallet ? `${uData.wallet.substring(0, 6)}...${uData.wallet.substring(uData.wallet.length - 4)}` : '0x00...00',
              fullWallet: uData.wallet,
              sponsor: Number(uData.sponsorId) > 0 ? formatDisplayId(Number(uData.sponsorId)) : 'Root',
              directs: Number(uData.directCount || 0),
              downline: dlCount,
              isSubId: uData.isSubId || false,
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
            downline: 0,
            isSubId: false,
            status: 'Available',
          };
        })
      );


      // Compute board level dynamically from unit ID (e.g., 2001 => Level 2, 1001 => Level 1)
      const computedBoardLevel = bId >= 1000 ? Math.floor(bId / 1000) : activeLvl;

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
    setTargetBoardId(null); // Reset manual board override so loadUserBoardState queries active open board unit of targetId
    setShowCompletedTreeAnyway(false);
  };

  const boardNames = [
    'Board 1 (Starter - $40 Reward)',
    'Board 2 (Bronze - $80 Reward)',
    'Board 3 (Silver - $160 Reward)',
    'Board 4 (Gold - $320 Reward)',
    'Board 5 (Diamond - $640 Reward)',
  ];

  const activeUserIdForRender = selectedAccountId || selectedUserId || mainUserId;

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

            {/* Header Badge & Title */}
            <div className="text-center mb-8 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-black text-sky-600 uppercase tracking-widest font-mono">
                  BOARD UNIT #{boardUnit.boardId}
                </span>
                {boardUnit.boardId === userActiveBoardId && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-sky-700 border border-sky-300">
                    ⭐ MY ACTIVE BOARD
                  </span>
                )}
                {boardUnit.filledCount === 7 ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-300">
                    Completed 🏁
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300">
                    Active ({boardUnit.filledCount}/7 Filled) ⚡
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {boardNames[boardUnit.boardLevel - 1]} Matrix
              </h1>
            </div>

            {/* Pyramidal 7-Position Matrix Tree */}
            <div className="flex flex-col items-center w-full max-w-4xl space-y-6">
              {/* Level 1: Position 1 (Top Root Node) */}
              <div className="flex flex-col items-center w-full max-w-xs">
                <MatrixNode item={boardUnit.positions[0]} isTop />
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Level 2: Positions 2 & 3 */}
              <div className="flex flex-col items-center w-full max-w-2xl">
                <div className="w-1/2 h-0.5 bg-slate-300" />
                <div className="grid grid-cols-2 gap-6 md:gap-12 w-full pt-2">
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

              {/* Level 3: Positions 4, 5, 6, 7 */}
              <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <MatrixNode item={boardUnit.positions[3]} />
                  <MatrixNode item={boardUnit.positions[4]} />
                  <MatrixNode item={boardUnit.positions[5]} />
                  <MatrixNode item={boardUnit.positions[6]} />
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
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full">
              {item.downline || 0} Downline
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
