import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../config/contracts';

export interface ProtocolUser {
  rawId: number;
  id: string; // e.g. "GR748891"
  wallet: string;
  ownerMainUserId: number;
  sponsorId: number;
  sponsorDisplayId: string;
  placementParentId: number;
  currentBoard: number;
  directCount: number;
  active: boolean;
  createdAt: number;
  dateStr: string;
  isSubId: boolean;
  subIds: number[];
}

export interface SubIdLevelIncomeRecord {
  id: string;
  sourceSubId: number;
  sourceSubDisplayId: string;
  sourceCreatorId: number;
  sourceCreatorDisplayId: string;
  level: 1 | 2 | 3;
  percent: 3 | 2 | 1;
  amount: number; // 3.0, 2.0, or 1.0 USDT
  timestamp: number;
  dateStr: string;
  status: 'Credited';
}

export interface LevelIncomeSummary {
  records: SubIdLevelIncomeRecord[];
  level1Count: number;
  level1Total: number;
  level2Count: number;
  level2Total: number;
  level3Count: number;
  level3Total: number;
  totalRecords: number;
  grandTotal: number;
}

export function formatDisplayId(id: number): string {
  if (!id || id <= 0) return 'GR000000';
  return `GR${id.toString().padStart(6, '0')}`;
}

// In-memory cache to make page transitions between Directs, Downline, and Income instant
let cachedUsers: ProtocolUser[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds TTL
let activeFetchPromise: Promise<ProtocolUser[]> | null = null;

export async function fetchProtocolUsers(
  customProvider?: any,
  forceRefresh = false
): Promise<ProtocolUser[]> {
  const now = Date.now();
  if (!forceRefresh && cachedUsers && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedUsers;
  }

  if (activeFetchPromise && !forceRefresh) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      let provider = customProvider;
      if (!provider) {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/';
        provider = new ethers.JsonRpcProvider(rpcUrl);
      }

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

      // 1. Get total boards counter to accurately discover all active and completed boards
      let totalBoards = 10;
      try {
        const boardsCountRaw = await coreContract.boardIdCounter();
        totalBoards = Math.max(1, Number(boardsCountRaw));
      } catch (e) {
        console.warn('Could not read boardIdCounter:', e);
      }

      // 2. Fetch board positions in parallel
      const boardPromises: Promise<any>[] = [];
      const baseBoardId = 1001;
      const endBoardId = baseBoardId + totalBoards + 5;

      for (let bId = baseBoardId; bId <= endBoardId; bId++) {
        boardPromises.push(
          coreContract.getBoardUnitPositions(bId).catch(() => [])
        );
      }

      const allPositions = await Promise.all(boardPromises);
      const uniqueUserIds = new Set<number>();

      for (const posArr of allPositions) {
        if (Array.isArray(posArr)) {
          for (const p of posArr) {
            const num = Number(p);
            if (num > 0) uniqueUserIds.add(num);
          }
        }
      }

      // Also query active board units by level 1..5 as backup in parallel
      try {
        const levelBoardPromises = [1, 2, 3, 4, 5].map((lvl) =>
          coreContract.getActiveBoardUnitsByLevel(lvl).catch(() => [])
        );
        const levelBoardResults = await Promise.all(levelBoardPromises);
        const extraBoardIds: number[] = [];
        for (const bIds of levelBoardResults) {
          if (Array.isArray(bIds)) {
            for (const bIdBig of bIds) {
              const bId = Number(bIdBig);
              if (bId > 0 && (bId < baseBoardId || bId > endBoardId) && !extraBoardIds.includes(bId)) {
                extraBoardIds.push(bId);
              }
            }
          }
        }

        if (extraBoardIds.length > 0) {
          const extraPositions = await Promise.all(
            extraBoardIds.map((bId) => coreContract.getBoardUnitPositions(bId).catch(() => []))
          );
          for (const posArr of extraPositions) {
            if (Array.isArray(posArr)) {
              for (const p of posArr) {
                const num = Number(p);
                if (num > 0) uniqueUserIds.add(num);
              }
            }
          }
        }
      } catch {}

      // 3. Parallel fetch user info and sub-ids
      const idArray = Array.from(uniqueUserIds);
      const userPromises = idArray.map(async (uId) => {
        try {
          const [uData, subIdsRaw] = await Promise.all([
            coreContract.users(uId),
            coreContract.getOwnerSubIds(uId).catch(() => [])
          ]);

          const rawId = Number(uData.id ?? uData[0] ?? uId);
          const wallet = String(uData.wallet ?? uData[1] ?? '0x0000...0000');
          const ownerMainUserId = Number(uData.ownerMainUserId ?? uData[2] ?? rawId);
          const sponsorId = Number(uData.sponsorId ?? uData[3] ?? 0);
          const placementParentId = Number(uData.placementParentId ?? uData[4] ?? 0);
          const currentBoard = Number(uData.currentBoard ?? uData[5] ?? 1);
          const directCount = Number(uData.directCount ?? uData[6] ?? 0);
          const active = Boolean(uData.active ?? uData[7] ?? true);
          const createdAt = Number(uData.createdAt ?? uData[8] ?? Math.floor(Date.now() / 1000));
          const isSubId = Boolean(uData.isSubId ?? uData[9] ?? false);

          const subIds = Array.isArray(subIdsRaw) ? subIdsRaw.map((s: any) => Number(s)).filter((s: number) => s > 0) : [];

          const userObj: ProtocolUser = {
            rawId,
            id: formatDisplayId(rawId),
            wallet,
            ownerMainUserId,
            sponsorId,
            sponsorDisplayId: sponsorId > 0 ? formatDisplayId(sponsorId) : 'Root Sponsor',
            placementParentId,
            currentBoard,
            directCount,
            active,
            createdAt,
            dateStr: new Date(createdAt * 1000).toLocaleDateString(),
            isSubId,
            subIds,
          };

          return userObj;
        } catch (err) {
          console.warn(`Could not fetch details for user ${uId}:`, err);
          return null;
        }
      });

      const fetchedUsers = (await Promise.all(userPromises)).filter(
        (u): u is ProtocolUser => u !== null && u.rawId > 0
      );

      // 4. Guarantee any subIds reported in getOwnerSubIds are included
      const existingUserIds = new Set(fetchedUsers.map((u) => u.rawId));
      const missingSubIds: number[] = [];
      for (const u of fetchedUsers) {
        for (const sId of u.subIds) {
          if (!existingUserIds.has(sId) && !missingSubIds.includes(sId)) {
            missingSubIds.push(sId);
          }
        }
      }

      if (missingSubIds.length > 0) {
        const extraSubPromises = missingSubIds.map(async (sId) => {
          try {
            const uData = await coreContract.users(sId);
            const rawId = Number(uData.id ?? uData[0] ?? sId);
            const wallet = String(uData.wallet ?? uData[1] ?? '0x0000...0000');
            const ownerMainUserId = Number(uData.ownerMainUserId ?? uData[2] ?? rawId);
            const sponsorId = Number(uData.sponsorId ?? uData[3] ?? 0);
            const placementParentId = Number(uData.placementParentId ?? uData[4] ?? 0);
            const currentBoard = Number(uData.currentBoard ?? uData[5] ?? 1);
            const directCount = Number(uData.directCount ?? uData[6] ?? 0);
            const active = Boolean(uData.active ?? uData[7] ?? true);
            const createdAt = Number(uData.createdAt ?? uData[8] ?? Math.floor(Date.now() / 1000));
            const isSubId = Boolean(uData.isSubId ?? uData[9] ?? true);

            return {
              rawId,
              id: formatDisplayId(rawId),
              wallet,
              ownerMainUserId,
              sponsorId,
              sponsorDisplayId: sponsorId > 0 ? formatDisplayId(sponsorId) : 'Root Sponsor',
              placementParentId,
              currentBoard,
              directCount,
              active,
              createdAt,
              dateStr: new Date(createdAt * 1000).toLocaleDateString(),
              isSubId,
              subIds: [],
            } as ProtocolUser;
          } catch {
            return null;
          }
        });

        const extraSubUsers = (await Promise.all(extraSubPromises)).filter(
          (u): u is ProtocolUser => u !== null && u.rawId > 0
        );
        fetchedUsers.push(...extraSubUsers);
      }

      cachedUsers = fetchedUsers;
      lastCacheTime = Date.now();
      return fetchedUsers;
    } catch (err) {
      console.error('Error fetching protocol users:', err);
      return cachedUsers || [];
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

/**
 * Filter users directly sponsored by targetUserId (Main IDs and Sub-IDs)
 */
export function getDirectReferrals(targetUserId: number, allUsers: ProtocolUser[]): ProtocolUser[] {
  if (!targetUserId || targetUserId <= 0) return [];
  return allUsers.filter((u) => u.sponsorId === targetUserId);
}

/**
 * Recursively builds downline network tree from targetUserId
 */
export interface DownlineMemberItem {
  rawId: number;
  id: string;
  wallet: string;
  board: number;
  directs: number;
  isSubId: boolean;
  date: string;
  sponsorId: number;
  sponsorDisplayId: string;
  level: number;
}

export function getDownlineMembers(targetUserId: number, allUsers: ProtocolUser[]): DownlineMemberItem[] {
  if (!targetUserId || targetUserId <= 0) return [];

  const sponsorToChildren = new Map<number, ProtocolUser[]>();
  for (const u of allUsers) {
    const sId = u.sponsorId;
    if (!sponsorToChildren.has(sId)) {
      sponsorToChildren.set(sId, []);
    }
    sponsorToChildren.get(sId)!.push(u);
  }

  const result: DownlineMemberItem[] = [];
  const visited = new Set<number>();
  visited.add(targetUserId);

  let currentLevelParents = [targetUserId];
  let currentLevel = 1;

  while (currentLevelParents.length > 0 && currentLevel <= 20) {
    const nextLevelParents: number[] = [];

    for (const parentId of currentLevelParents) {
      const children = sponsorToChildren.get(parentId) || [];
      for (const child of children) {
        if (!visited.has(child.rawId)) {
          visited.add(child.rawId);
          result.push({
            rawId: child.rawId,
            id: child.id,
            wallet: child.wallet,
            board: child.currentBoard,
            directs: child.directCount,
            isSubId: child.isSubId,
            date: child.dateStr,
            sponsorId: child.sponsorId,
            sponsorDisplayId: formatDisplayId(child.sponsorId),
            level: currentLevel,
          });
          nextLevelParents.push(child.rawId);
        }
      }
    }

    currentLevelParents = nextLevelParents;
    currentLevel++;
  }

  return result;
}

/**
 * Calculates ID-wise Sub-ID Level Income:
 * Shows which Sub-ID yielded 3% (Level 1), 2% (Level 2), and 1% (Level 3)
 */
export function calculateSubIdLevelIncomeBreakdown(
  targetMainUserId: number,
  allUsers: ProtocolUser[]
): LevelIncomeSummary {
  const records: SubIdLevelIncomeRecord[] = [];
  if (!targetMainUserId || targetMainUserId <= 0) {
    return {
      records: [],
      level1Count: 0,
      level1Total: 0,
      level2Count: 0,
      level2Total: 0,
      level3Count: 0,
      level3Total: 0,
      totalRecords: 0,
      grandTotal: 0,
    };
  }

  const userMap = new Map<number, ProtocolUser>(allUsers.map((u) => [u.rawId, u]));

  for (const u of allUsers) {
    if (!u.isSubId) continue;

    const sourceSubId = u.rawId;
    const creatorMainUserId = u.ownerMainUserId;
    let currentSponsorId = u.sponsorId;

    // Smart contract logic: skip self-owned sponsor IDs
    while (
      currentSponsorId !== 0 &&
      userMap.get(currentSponsorId)?.ownerMainUserId === creatorMainUserId
    ) {
      currentSponsorId = userMap.get(currentSponsorId)?.sponsorId || 0;
    }

    for (let level = 1; level <= 3; level++) {
      if (!currentSponsorId || currentSponsorId === 0) break;
      const sponsorUser = userMap.get(currentSponsorId);
      if (!sponsorUser) break;

      const beneficiaryId = sponsorUser.ownerMainUserId;
      const beneficiary = userMap.get(beneficiaryId);

      // Requires >= 2 direct sponsors for level income qualification
      if (beneficiary && beneficiary.directCount >= 2) {
        if (beneficiaryId === targetMainUserId) {
          const percent = (level === 1 ? 3 : level === 2 ? 2 : 1) as 1 | 2 | 3;
          const amount = level === 1 ? 3.0 : level === 2 ? 2.0 : 1.0;

          records.push({
            id: `LVL-${level}-SUB${sourceSubId}`,
            sourceSubId,
            sourceSubDisplayId: formatDisplayId(sourceSubId),
            sourceCreatorId: creatorMainUserId,
            sourceCreatorDisplayId: formatDisplayId(creatorMainUserId),
            level: level as 1 | 2 | 3,
            percent,
            amount,
            timestamp: u.createdAt,
            dateStr: new Date(u.createdAt * 1000).toLocaleString(),
            status: 'Credited',
          });
        }
      }

      currentSponsorId = beneficiary ? beneficiary.sponsorId : 0;
    }
  }

  // Sort newest first
  records.sort((a, b) => b.timestamp - a.timestamp);

  const level1Records = records.filter((r) => r.level === 1);
  const level2Records = records.filter((r) => r.level === 2);
  const level3Records = records.filter((r) => r.level === 3);

  const level1Total = level1Records.reduce((sum, r) => sum + r.amount, 0);
  const level2Total = level2Records.reduce((sum, r) => sum + r.amount, 0);
  const level3Total = level3Records.reduce((sum, r) => sum + r.amount, 0);
  const grandTotal = level1Total + level2Total + level3Total;

  return {
    records,
    level1Count: level1Records.length,
    level1Total,
    level2Count: level2Records.length,
    level2Total,
    level3Count: level3Records.length,
    level3Total,
    totalRecords: records.length,
    grandTotal,
  };
}
