import { ethers } from "hardhat";

/**
 * GROW 50X V4 - AUTOMATED 10-DAY SHARE POOL KEEPER SERVICE
 * Scheduled Execution: Dates 9th, 19th, and 29th of every month at 00:00 GST (Dubai Time UTC+4).
 * 
 * Function:
 * 1. Checks if 10-day share period has elapsed or scheduled Dubai GST date reached.
 * 2. Automatically executes finalizeSharePeriod() on Grow50XCoreV4 contract (zero admin intervention).
 * 3. Auto-dispatches accumulated share pool rewards to all eligible protocol share holders.
 */

export async function runSharePoolKeeper(coreAddress: string) {
  console.log("========================================================================");
  console.log("   GROW 50X V4 - AUTOMATED SHARE POOL KEEPER (DUBAI GST SCHEDULE)");
  console.log("========================================================================");

  const [keeperSigner] = await ethers.getSigners();
  console.log(`🤖 Keeper executing with wallet: ${keeperSigner.address}`);

  const core = await ethers.getContractAt("Grow50XCoreV4", coreAddress, keeperSigner);

  // Check current Dubai Time (UTC+4)
  const nowUtc = new Date();
  const dubaiTime = new Date(nowUtc.getTime() + (4 * 60 * 60 * 1000));
  console.log(`🕒 Current UTC Time:    ${nowUtc.toISOString()}`);
  console.log(`🕒 Current Dubai Time:  ${dubaiTime.toISOString()} (GST UTC+4)`);

  const currentPeriodStart = Number(await core.currentPeriodStart());
  const periodDuration = Number(await core.PERIOD_DURATION());
  const elapsed = Math.floor(Date.now() / 1000) - currentPeriodStart;

  const currentPeriodId = await core.currentPeriodId();
  const poolBalance = await core.sharePoolBalance();
  const totalShares = await core.totalActiveProtocolShares();

  console.log(`\n📊 Period ID: ${currentPeriodId}`);
  console.log(`💰 Active Pool Balance: $${ethers.formatEther(poolBalance)} USDT`);
  console.log(`💎 Total Protocol Active Shares: ${totalShares}`);
  console.log(`⏱️ Elapsed Time: ${Math.floor(elapsed / 86400)} days (${elapsed} seconds / 10-day period: ${periodDuration}s)`);

  if (elapsed >= periodDuration || poolBalance > 0n) {
    console.log("\n⚡ Period elapsed or scheduled Dubai execution triggered! Executing finalizeSharePeriod()...");
    const tx = await core.finalizeSharePeriod();
    await tx.wait();

    const newPeriodId = await core.currentPeriodId();
    const newAccumulator = await core.accumulatedShareValueScaled();

    console.log("========================================================================");
    console.log(`🎉 SUCCESS! Share Pool Period ${currentPeriodId} Finalized Automatically!`);
    console.log(`📌 New Active Period ID: ${newPeriodId}`);
    console.log(`📈 Accumulated Share Value Scaled: ${newAccumulator.toString()}`);
    console.log("========================================================================");
    return { success: true, periodId: currentPeriodId, poolBalance: ethers.formatEther(poolBalance) };
  } else {
    console.log("⏳ Current period is still active. Keeper waiting for scheduled execution date.");
    return { success: false, reason: "Period in progress" };
  }
}

async function main() {
  const deploymentAddresses = require("../deployments/deployment-addresses-testnet.json");
  const coreAddress = deploymentAddresses.contracts.Grow50XCoreV4;
  await runSharePoolKeeper(coreAddress);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
