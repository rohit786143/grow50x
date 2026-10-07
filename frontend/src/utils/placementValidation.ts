import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../config/contracts';

export interface PlacementValidationResult {
  isEligible: boolean;
  message: string;
  pIdNumber: number;
}

/**
 * Real-time verification of Placement Parent ID eligibility on BSC Testnet smart contract.
 * Checks:
 * 1. User existence & active status
 * 2. Active board unit existence
 * 3. Board Level 1 restriction
 * 4. Placement position (Must be top row 0 or middle row 1, 2)
 * 5. Available children slots (Must have < 2 direct placement children)
 */
export async function validatePlacementEligibility(
  placementInput: string | number,
  providerOrSigner?: ethers.Provider | ethers.Signer | null
): Promise<PlacementValidationResult> {
  const cleanStr = placementInput.toString().replace(/^GR/i, '').trim();

  if (!cleanStr || cleanStr === '0') {
    return {
      isEligible: true,
      message: 'Auto Placement (Protocol will auto-select next available position)',
      pIdNumber: 0,
    };
  }

  const pId = parseInt(cleanStr, 10);
  if (isNaN(pId) || pId <= 0) {
    return {
      isEligible: false,
      message: 'Not Eligible for placement Id',
      pIdNumber: 0,
    };
  }

  try {
    let provider: ethers.Provider;
    if (providerOrSigner && 'getNetwork' in providerOrSigner) {
      provider = providerOrSigner as ethers.Provider;
    } else if (typeof window !== 'undefined' && (window as any).ethereum) {
      provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/');
    }

    const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

    // 1. Check user active status
    let pUserData: any;
    try {
      pUserData = await coreContract.users(pId);
    } catch (e) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} does not exist)`,
        pIdNumber: pId,
      };
    }

    const isActive = Boolean(pUserData.active || (pUserData[7] !== undefined && pUserData[7]));
    if (!isActive) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} is inactive)`,
        pIdNumber: pId,
      };
    }

    // 2. Check active board unit
    const pActiveBoardId = Number(await coreContract.userActiveBoardUnit(pId));
    if (pActiveBoardId === 0) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} has no active board unit)`,
        pIdNumber: pId,
      };
    }

    // 3. Board Level must be Board Level 1
    const boardPositionsRaw = await coreContract.getBoardUnitPositions(pActiveBoardId);
    const boardPositions = Array.from(boardPositionsRaw).map((n) => Number(n));
    const boardLevel = pActiveBoardId >= 1000 ? Math.floor(pActiveBoardId / 1000) : 1;

    if (boardLevel > 1) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} is in Board Level ${boardLevel}. Manual placement only allowed in Board 1)`,
        pIdNumber: pId,
      };
    }

    // 4. Position in board unit (Must be slot 0, 1, or 2)
    let parentSlot = -1;
    for (let i = 0; i < 7; i++) {
      if (boardPositions[i] === pId) {
        parentSlot = i;
        break;
      }
    }

    if (parentSlot < 0 || parentSlot >= 3) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} is in bottom row Pos 4-7)`,
        pIdNumber: pId,
      };
    }

    // 5. Must have available children slots (< 2 children)
    let filledChildren = 0;
    if (parentSlot === 0) {
      if (boardPositions[1] > 0) filledChildren++;
      if (boardPositions[2] > 0) filledChildren++;
    } else if (parentSlot === 1) {
      if (boardPositions[3] > 0) filledChildren++;
      if (boardPositions[4] > 0) filledChildren++;
    } else if (parentSlot === 2) {
      if (boardPositions[5] > 0) filledChildren++;
      if (boardPositions[6] > 0) filledChildren++;
    }

    if (filledChildren >= 2) {
      return {
        isEligible: false,
        message: `Not Eligible for placement Id (GR${pId} already has 2 placement children filled)`,
        pIdNumber: pId,
      };
    }

    return {
      isEligible: true,
      message: `✓ Eligible for placement Id (GR${pId})`,
      pIdNumber: pId,
    };
  } catch (err: any) {
    console.error('Placement validation error:', err);
    return {
      isEligible: false,
      message: 'Not Eligible for placement Id',
      pIdNumber: pId,
    };
  }
}
