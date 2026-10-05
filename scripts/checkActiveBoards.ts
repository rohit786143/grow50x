import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../frontend/src/config/contracts";

async function main() {
  const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
  const coreContract = await ethers.getContractAt("Grow50XCore", coreAddress);

  const totalBoards = await coreContract.boardIdCounter();
  console.log("Total Boards Counter:", totalBoards.toString());

  const userCount = await coreContract.totalUserCount();
  console.log("Total User Count:", userCount.toString());

  console.log("\n=== ALL BOARD UNITS & POSITIONS ===");
  for (let id = 1001; id <= 1005; id++) {
    try {
      const positions = await coreContract.getBoardUnitPositions(id);
      console.log(`\nBoard Unit #${id}:`);
      let filled = 0;
      for (let i = 0; i < positions.length; i++) {
        const uId = Number(positions[i]);
        if (uId > 0) filled++;
        if (uId > 0) {
          const u = await coreContract.users(uId);
          console.log(`  Pos ${i+1}: User GR${uId} | Wallet: ${u.wallet} | Directs: ${u.directCount} | Sponsor: GR${u.sponsorId}`);
        } else {
          console.log(`  Pos ${i+1}: EMPTY`);
        }
      }
      console.log(`  Total Filled: ${filled}/7 ${filled === 7 ? '(COMPLETED)' : '(ACTIVE)'}`);
    } catch (e: any) {
      console.log(`Board Unit #${id} does not exist or reverted.`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
