import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../frontend/src/config/contracts";

async function main() {
  const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
  const coreContract = await ethers.getContractAt("Grow50XCore", coreAddress);

  const rootId = 363306;
  const uData = await coreContract.users(rootId);
  const activeBId = await coreContract.userActiveBoardUnit(rootId);

  console.log(`Root User GR${rootId}:`);
  console.log(`  currentBoard: ${uData.currentBoard}`);
  console.log(`  userActiveBoardUnit: #${activeBId}`);

  // Check Board Unit 2001 positions if exists
  try {
    const pos2001 = await coreContract.getBoardUnitPositions(2001);
    console.log(`\nBoard Unit #2001 (Level 2) Positions:`, pos2001.map((p: any) => `GR${p.toString()}`));
  } catch (e) {
    console.log("Board Unit #2001 does not exist yet.");
  }
}

main().catch((err) => console.error(err));
