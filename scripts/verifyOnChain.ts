import { ethers } from "hardhat";

async function main() {
  const deploymentAddresses = require("../deployments/deployment-addresses-mainnet.json");
  const coreAddress = deploymentAddresses.contracts.Grow50XCoreV1_2;

  const core = await ethers.getContractAt("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2", coreAddress);

  console.log("================================================================================");
  console.log("             GROW 50X V1.2 LIVE ON-CHAIN CONTRACT VERIFICATION");
  console.log("================================================================================");
  console.log("Deployed Contract Address:", coreAddress);
  console.log("Contract Owner:           ", await core.owner());
  console.log("USDT Token Address:       ", await core.usdtToken());
  console.log("--------------------------------------------------------------------------------");
  console.log("Main Admin Wallet (9c2):  ", await core.mainAdminWallet());
  console.log("Reward Vault Wallet (e99):", await core.rewardVaultWallet());
  console.log("Maintenance Wallet (c61): ", await core.serverMaintenanceWallet());
  console.log("--------------------------------------------------------------------------------");
  
  const currentPeriodId = await core.currentPeriodId();
  const nextTargetTimestamp = Number(await core.nextPeriodTargetTimestamp());
  const dateUtc = new Date(nextTargetTimestamp * 1000);
  const dateDubai = new Date(dateUtc.getTime() + (4 * 60 * 60 * 1000));
  const dateIst = new Date(dateUtc.getTime() + (5.5 * 60 * 60 * 1000));

  console.log("SHARE POOL CLOSING & CUTOFF SCHEDULE (5th, 15th, 25th DUBAI TIME):");
  console.log(`Current Period ID:        ${currentPeriodId}`);
  console.log(`Next Target Unix Time:    ${nextTargetTimestamp}`);
  console.log(`Next Closing (Dubai GST): ${dateDubai.toISOString().replace("T", " ").replace(".000Z", "")} GST (UTC+4) [Day ${dateDubai.getUTCDate()}]`);
  console.log(`Next Closing (UTC):       ${dateUtc.toISOString().replace("T", " ").replace(".000Z", "")} UTC`);
  console.log(`Next Closing (IST):       ${dateIst.toISOString().replace("T", " ").replace(".000Z", "")} IST (UTC+5:30)`);
  console.log("--------------------------------------------------------------------------------");
  console.log("Share Pool Balance:       ", ethers.formatEther(await core.sharePoolBalance()), "USDT");
  console.log("Total Protocol Shares:    ", (await core.totalActiveProtocolShares()).toString());
  console.log("Reserve Balance:          ", ethers.formatEther(await core.protocolReserveBalance()), "USDT");
  console.log("Total Registered Users:   ", (await core.totalUserCount()).toString());
  console.log("================================================================================");
}

main().catch(console.error);
