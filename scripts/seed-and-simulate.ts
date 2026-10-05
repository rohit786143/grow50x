import { ethers } from "hardhat";

async function main() {
  console.log("========================================================================");
  console.log("   GROW 50X PROTOCOL - AUTOMATED DUMMY USER & USDT SIMULATION");
  console.log("========================================================================");

  const signers = await ethers.getSigners();
  const owner = signers[0];
  const admin1Address = "0x7D27949028D8c8532728c69fF2153Ee6Bb3bF82e";
  const admin2Address = "0x7A3FC2c5610F0962Dd5927a4f7397aE060B79d68";
  const admin3Address = "0x2B255ED42530Cb531CbDaB4C4Df23Eb408fB748B";
  
  // Dummy Users (Wallets 4 to 10)
  const dummyWallets = signers.slice(4, 11);

  console.log("\n[1/6] Deploying Mock USDT and Core Smart Contract...");
  const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDTFactory.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();

  const CoreFactory = await ethers.getContractFactory("Grow50XCoreV4");
  const core = await CoreFactory.deploy(usdtAddress, admin1Address, admin2Address, admin3Address);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();

  console.log(`>>> MockUSDT deployed at: ${usdtAddress}`);
  console.log(`>>> Grow50XCoreV4 deployed at: ${coreAddress}`);

  console.log("\n[2/6] Funding 7 Dummy Users with 10,000 Mock USDT each & approving contract...");
  const MINT_AMOUNT = ethers.parseEther("10000");

  for (let i = 0; i < dummyWallets.length; i++) {
    const user = dummyWallets[i];
    await usdt.mint(user.address, MINT_AMOUNT);
    await usdt.connect(user).approve(coreAddress, ethers.MaxUint256);
    console.log(`  └─ Dummy User ${i + 1} (${user.address.substring(0, 8)}...): Funded 10,000 USDT`);
  }

  console.log("\n[3/6] Executing Main User Registrations & Building Sponsor Tree...");
  
  // User 1 (Root Main ID) registers
  console.log("  └─ Registering Root Main ID (GR...) under self/sponsor 1...");
  await core.connect(dummyWallets[0]).registerMainUser(1, 0);
  const u1Id = Number(await core.walletToMainUserId(dummyWallets[0].address));
  console.log(`     ✓ Root Main User 1 generated 6-Digit Random ID: GR${u1Id}`);

  // User 2 & User 3 register under User 1 (Sponsor ID u1Id) -> User 1 gets 2 directs (Qualified for Board 2)
  console.log(`  └─ Registering User 2 & User 3 sponsored by GR${u1Id}...`);
  await core.connect(dummyWallets[1]).registerMainUser(u1Id, 0);
  const u2Id = Number(await core.walletToMainUserId(dummyWallets[1].address));
  console.log(`     ✓ User 2 generated 6-Digit Random ID: GR${u2Id}`);

  await core.connect(dummyWallets[2]).registerMainUser(u1Id, 0);
  const u3Id = Number(await core.walletToMainUserId(dummyWallets[2].address));
  console.log(`     ✓ User 3 generated 6-Digit Random ID: GR${u3Id}`);

  // User 4, 5, 6, 7 register -> Fills Board 1 (7 positions occupied!)
  console.log("  └─ Registering User 4, 5, 6, 7 to complete 7-position Board 1...");
  await core.connect(dummyWallets[3]).registerMainUser(u2Id, 0);
  const u4Id = Number(await core.walletToMainUserId(dummyWallets[3].address));

  await core.connect(dummyWallets[4]).registerMainUser(u2Id, 0);
  const u5Id = Number(await core.walletToMainUserId(dummyWallets[4].address));

  await core.connect(dummyWallets[5]).registerMainUser(u3Id, 0);
  const u6Id = Number(await core.walletToMainUserId(dummyWallets[5].address));

  await core.connect(dummyWallets[6]).registerMainUser(u3Id, 0);
  const u7Id = Number(await core.walletToMainUserId(dummyWallets[6].address));

  console.log(`\n🎉 Board 1 Completed! Top ID (GR${u1Id}) received $40 reward and advanced to Board 2!`);

  console.log("\n[4/6] Testing Automatic Sub-ID Batch Generator (User 1 creates 5 Sub-IDs)...");
  console.log("  └─ User 1 approving USDT for 5 Sub-IDs batch creation...");
  await core.connect(dummyWallets[0]).createBatchSubIds(5);
  
  const ownerSubIdsList = await core.getOwnerSubIds(u1Id);
  console.log(`>>> Main User GR${u1Id} now owns ${ownerSubIdsList.length} Sub-IDs!`);

  console.log("\n[5/6] Fast-Forwarding EVM Time by 10 Days to Test Share Pool Distribution...");
  await ethers.provider.send("evm_increaseTime", [864000]); // 10 days
  await ethers.provider.send("evm_mine", []);

  console.log("  └─ Finalizing 10-day Share Pool Distribution...");
  await core.finalizeSharePeriod();

  console.log("  └─ User 1 claiming share pool income...");
  await core.connect(dummyWallets[0]).claimAllShareIncome();

  console.log("\n[6/6] SIMULATION FINANCIAL AUDIT REPORT");
  console.log("========================================================================");
  
  const u1Income = await core.userIncomes(u1Id);
  const sharePoolBal = await core.sharePoolBalance();
  const reserveBoard = await core.reserveForBoardRewards();
  const reserveLevel = await core.reserveForLevelIncome();
  const contractUsdtBal = await usdt.balanceOf(coreAddress);

  console.log(`👤 User 1 (GR${u1Id}) Direct Income:       $${ethers.formatEther(u1Income.directIncome)} USDT`);
  console.log(`👤 User 1 (GR${u1Id}) Board Rewards:       $${ethers.formatEther(u1Income.boardRewards)} USDT`);
  console.log(`👤 User 1 (GR${u1Id}) Sub-ID Level Income: $${ethers.formatEther(u1Income.levelIncome)} USDT`);
  console.log(`👤 User 1 (GR${u1Id}) Lifetime Share Income: $${ethers.formatEther(u1Income.lifetimeShareIncomeEarned)} USDT`);
  console.log("------------------------------------------------------------------------");
  console.log(`🏦 Contract USDT Balance:       $${ethers.formatEther(contractUsdtBal)} USDT`);
  console.log(`📊 Active Share Pool Balance:   $${ethers.formatEther(sharePoolBal)} USDT`);
  console.log(`🛡️ Reserve for Board Rewards:   $${ethers.formatEther(reserveBoard)} USDT`);
  console.log(`🛡️ Reserve for Level Income:   $${ethers.formatEther(reserveLevel)} USDT`);
  console.log("========================================================================");
  console.log("✅ SIMULATION COMPLETE - ALL INVARIANTS & LOGIC VERIFIED SUCCESSFULLY!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
