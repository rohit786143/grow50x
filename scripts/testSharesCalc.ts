import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../frontend/src/config/contracts";

async function main() {
  const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
  const coreContract = await ethers.getContractAt("Grow50XCore", coreAddress);

  const totalBoards = Number(await coreContract.boardIdCounter());
  console.log("Total Boards Counter:", totalBoards);

  const uniqueUserIds = new Set<number>();
  for (let id = 1001; id <= 1001 + totalBoards + 5; id++) {
    try {
      const positions = await coreContract.getBoardUnitPositions(id);
      positions.forEach((pIdBig: any) => {
        const pId = Number(pIdBig);
        if (pId > 0) uniqueUserIds.add(pId);
      });
    } catch (e) {}
  }

  console.log(`Discovered ${uniqueUserIds.size} unique users on-chain:`, Array.from(uniqueUserIds));

  let totalShares = 0;
  let subCount = 0;
  const shareWeights = [0, 1, 2, 5, 10, 25];

  for (const uId of uniqueUserIds) {
    const u = await coreContract.users(uId);
    const bLvl = Number(u.currentBoard) || 1;
    const weight = shareWeights[bLvl] || 1;
    if (u.active) {
      totalShares += weight;
    }
    if (u.isSubId) subCount++;
    console.log(`  User ID GR${uId}: Active=${u.active} | Board=${bLvl} | ShareWeight=${weight} | isSubId=${u.isSubId}`);
  }

  console.log(`\nTOTAL CALCULATED SHARES: ${totalShares} Shares`);
  console.log(`TOTAL SUB-IDS COUNT: ${subCount}`);
}

main().catch((err) => console.error(err));
