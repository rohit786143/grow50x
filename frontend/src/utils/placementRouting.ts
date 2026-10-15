import { ethers } from 'ethers';

export interface SmartPlacementResult {
  boardId: number;
  placementParentId: number;
  slotIndex: number;
  slotName: string;
  reason: 'sponsor_priority' | 'oldest_board_spillover' | 'none';
  message: string;
}

/**
 * Returns the parent ID for the first empty slot in a 7-position board.
 * Positions array: [0..6] (Index 0 = Pos 1, Index 1 = Pos 2, ..., Index 6 = Pos 7)
 * 
 * Hierarchy:
 * Slot 1 (Pos 2): Child of Pos 1 (index 0) - Middle Left
 * Slot 2 (Pos 3): Child of Pos 1 (index 0) - Middle Right
 * Slot 3 (Pos 4): Child of Pos 2 (index 1) - Bottom Left 1
 * Slot 4 (Pos 5): Child of Pos 2 (index 1) - Bottom Left 2
 * Slot 5 (Pos 6): Child of Pos 3 (index 2) - Bottom Right 1
 * Slot 6 (Pos 7): Child of Pos 3 (index 2) - Bottom Right 2
 */
export function getEligiblePlacementParentFromPositions(positions: (bigint | number | string)[]): {
  parentId: number;
  slotIndex: number;
  slotName: string;
} {
  const p = positions.map((x) => Number(x));

  if (p[1] === 0) return { parentId: p[0], slotIndex: 1, slotName: 'Position 2 (Middle Left)' };
  if (p[2] === 0) return { parentId: p[0], slotIndex: 2, slotName: 'Position 3 (Middle Right)' };
  if (p[3] === 0) return { parentId: p[1], slotIndex: 3, slotName: 'Position 4 (Bottom Left 1)' };
  if (p[4] === 0) return { parentId: p[1], slotIndex: 4, slotName: 'Position 5 (Bottom Left 2)' };
  if (p[5] === 0) return { parentId: p[2], slotIndex: 5, slotName: 'Position 6 (Bottom Right 1)' };
  if (p[6] === 0) return { parentId: p[2], slotIndex: 6, slotName: 'Position 7 (Bottom Right 2)' };

  return { parentId: 0, slotIndex: -1, slotName: 'Board Full' };
}

/**
 * Frontend Smart Routing for Auto Placement in Board Level 1
 * 
 * Rules:
 * 1. FIRST PREFERENCE - Sponsor's Active Board:
 *    - If sponsorId > 0, check if sponsor has an active Board Unit in Board Level 1.
 *    - If sponsor's board is found, boardLevel === 1, !completed, and filledCount < 7:
 *      Find the next eligible placement parent in Sponsor's board (Top-to-Bottom, Left-to-Right).
 * 
 * 2. SECOND PREFERENCE (Global Spillover) - Oldest Active Board in Board Level 1:
 *    - If sponsor is not in Board 1 (e.g. Root user in Board 2), or sponsor board is full:
 *      Fetch all active board IDs in Board Level 1 (`getActiveBoardUnitsByLevel(1)`).
 *      Sort them to find the OLDEST active board (Smallest boardId, e.g. 1002 < 1003).
 *      Find the next eligible placement parent in that oldest board (Top-to-Bottom, Left-to-Right).
 */
export async function findSmartPlacementParentId(
  coreContract: ethers.Contract,
  sponsorId: number
): Promise<SmartPlacementResult> {
  // Step 1: Sponsor Active Board 1 Priority
  if (sponsorId > 0) {
    try {
      const spActiveBoardIdRaw = await coreContract.userActiveBoardUnit(sponsorId);
      const spActiveBoardId = Number(spActiveBoardIdRaw);

      if (spActiveBoardId > 0) {
        const boardPositions = await coreContract.getBoardUnitPositions(spActiveBoardId);
        const boardLevel = spActiveBoardId >= 1000 ? Math.floor(spActiveBoardId / 1000) : 1;

        if (boardLevel === 1) {
          const slotInfo = getEligiblePlacementParentFromPositions(boardPositions);
          if (slotInfo.parentId > 0) {
            return {
              boardId: spActiveBoardId,
              placementParentId: slotInfo.parentId,
              slotIndex: slotInfo.slotIndex,
              slotName: slotInfo.slotName,
              reason: 'sponsor_priority',
              message: `1st Preference: Placed in Sponsor's active Board #${spActiveBoardId} under GR${slotInfo.parentId} (${slotInfo.slotName})`
            };
          }
        }
      }
    } catch (err) {
      console.warn('Error checking sponsor active board in smart routing:', err);
    }
  }

  // Step 2: Global Spillover (Oldest Active Board in Level 1)
  try {
    const activeBoardIdsRaw: bigint[] = await coreContract.getActiveBoardUnitsByLevel(1);
    const activeBoardIds = activeBoardIdsRaw.map((x) => Number(x)).sort((a, b) => a - b); // Lowest board ID = oldest!

    for (const bId of activeBoardIds) {
      const positions = await coreContract.getBoardUnitPositions(bId);
      const slotInfo = getEligiblePlacementParentFromPositions(positions);

      if (slotInfo.parentId > 0) {
        return {
          boardId: bId,
          placementParentId: slotInfo.parentId,
          slotIndex: slotInfo.slotIndex,
          slotName: slotInfo.slotName,
          reason: 'oldest_board_spillover',
          message: `Global Spillover: Placed in Oldest active Board #${bId} under GR${slotInfo.parentId} (${slotInfo.slotName})`
        };
      }
    }
  } catch (err) {
    console.warn('Error finding oldest active board in smart routing:', err);
  }

  return {
    boardId: 0,
    placementParentId: 0,
    slotIndex: -1,
    slotName: '',
    reason: 'none',
    message: 'No open placement slot found'
  };
}
