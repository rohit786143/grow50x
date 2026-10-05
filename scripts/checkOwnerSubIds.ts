import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../frontend/src/config/contracts";

async function main() {
  const coreAddress = CONTRACT_ADDRESSES.GROW50X_CORE;
  const coreContract = await ethers.getContractAt("Grow50XCore", coreAddress);

  const positions1001 = await coreContract.getBoardUnitPositions(1001);
  console.log("Board 1001 raw positions:", positions1001.map((p: any) => p.toString()));

  for (let i = 0; i < positions1001.length; i++) {
    const uId = Number(positions1001[i]);
    if (uId > 0) {
      const u = await coreContract.users(uId);
      const subIds = await coreContract.getOwnerSubIds(uId);
      console.log(`User ID GR${uId}: wallet=${u.wallet} | isSubId=${u.isSubId} | ownerMainUserId=GR${u.ownerMainUserId} | sponsorId=GR${u.sponsorId} | subIdsCount=${subIds.length} | subIds=[${subIds.map((s:any)=>`GR${s}`).join(', ')}]`);
    }
  }
}

main().catch((err) => console.error(err));
