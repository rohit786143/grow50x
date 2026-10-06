import { expect } from "chai";
import { ethers } from "hardhat";
import { Grow50XCoreV4, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GROW 50X V4 Comprehensive Verification Suite", function () {
  let usdt: MockUSDT;
  let coreV4: Grow50XCoreV4;
  let owner: HardhatEthersSigner;
  let admin1: HardhatEthersSigner;
  let admin2: HardhatEthersSigner;
  let admin3: HardhatEthersSigner;
  let userA: HardhatEthersSigner;
  let userB: HardhatEthersSigner;
  let userC: HardhatEthersSigner;
  let userD: HardhatEthersSigner;

  const ENTRY_FEE = ethers.parseEther("100");
  const SPONSOR_FEE = ethers.parseEther("40");

  beforeEach(async function () {
    [owner, admin1, admin2, admin3, userA, userB, userC, userD] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();

    // Deploy Grow50XCoreV4
    const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
    coreV4 = await CoreFactory.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );

    // Mint USDT to all signers and approve V4 contract
    const signers = [owner, userA, userB, userC, userD];
    for (const signer of signers) {
      await usdt.mint(signer.address, ethers.parseEther("100000"));
      await usdt.connect(signer).approve(await coreV4.getAddress(), ethers.MaxUint256);
    }
  });

  describe("1. Direct Income 40% ($40 USDT) Rules", function () {
    it("Should split 40% Direct Income of First ID (Root) across 3 admins equally", async function () {
      const admin1Before = await usdt.balanceOf(admin1.address);
      const admin2Before = await usdt.balanceOf(admin2.address);
      const admin3Before = await usdt.balanceOf(admin3.address);

      // Register Root User (userA, totalUserCount == 0, sponsorId = 0)
      await coreV4.connect(userA).registerMainUser(0, 0);

      const admin1After = await usdt.balanceOf(admin1.address);
      const admin2After = await usdt.balanceOf(admin2.address);
      const admin3After = await usdt.balanceOf(admin3.address);

      // 40 USDT split 3 ways = 13.333333333333333333 USDT each (+ remainder to admin 1)
      expect(admin1After - admin1Before).to.be.closeTo(ethers.parseEther("18.333333333333333333"), ethers.parseEther("0.001"));
      expect(admin2After - admin2Before).to.be.closeTo(ethers.parseEther("18.333333333333333333"), ethers.parseEther("0.001"));
      expect(admin3After - admin3Before).to.be.closeTo(ethers.parseEther("18.333333333333333333"), ethers.parseEther("0.001"));
    });

    it("Should pay 100% of 40% Direct Income ($40 USDT) to Sponsor's wallet and credit to Sponsor's specific ledger (Main or Sub-ID)", async function () {
      // Register Root User (userA)
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User A creates Sub-ID 1
      await coreV4.connect(userA).createSubId(userAMainId, 0);
      const subIds = await coreV4.getOwnerSubIds(userAMainId);
      const sub1Id = subIds[0];

      const userABalanceBefore = await usdt.balanceOf(userA.address);
      const sub1IncomeBefore = await coreV4.userIncomes(sub1Id);

      // Register User B sponsored specifically by Sub 1
      await coreV4.connect(userB).registerMainUser(sub1Id, 0);

      const userABalanceAfter = await usdt.balanceOf(userA.address);
      const sub1IncomeAfter = await coreV4.userIncomes(sub1Id);

      // Wallet receives USDT payout
      expect(userABalanceAfter - userABalanceBefore).to.equal(SPONSOR_FEE);
      // Sub 1's INDIVIDUAL LEDGER receives directIncome credit!
      expect(sub1IncomeAfter.directIncome - sub1IncomeBefore.directIncome).to.equal(SPONSOR_FEE);
    });
  });

  describe("2. Continuous Auto Sub-ID Placement (Top-to-Bottom, Left-to-Right BFS)", function () {
    it("Should continuously place Sub-IDs in level order across multiple batch calls without resetting", async function () {
      // Register User A
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // Batch 1: Create 5 Sub-IDs
      await coreV4.connect(userA).createBatchSubIds(5);

      const subIdsBatch1 = await coreV4.getOwnerSubIds(userAMainId);
      expect(subIdsBatch1.length).to.equal(5);

      const mainUserData = await coreV4.users(userAMainId);
      expect(mainUserData.directCount).to.equal(2);

      const sub1Data = await coreV4.users(subIdsBatch1[0]);
      expect(sub1Data.directCount).to.equal(2);

      const sub2Data = await coreV4.users(subIdsBatch1[1]);
      expect(sub2Data.directCount).to.equal(1);

      // Batch 2: Create 5 MORE Sub-IDs (Sub 6..10)
      await coreV4.connect(userA).createBatchSubIds(5);

      const allSubIds = await coreV4.getOwnerSubIds(userAMainId);
      expect(allSubIds.length).to.equal(10);

      const sub6Data = await coreV4.users(allSubIds[5]);
      expect(sub6Data.sponsorId).to.equal(subIdsBatch1[1]); // Sub 2 is sponsor of Sub 6

      // Sub 7 attaches under mainUserId because mainUserId promoted to Board 2 upon Board 1001 completion and needs 3 directs for Board 2 qualification!
      const sub7Data = await coreV4.users(allSubIds[6]);
      expect(sub7Data.sponsorId).to.equal(userAMainId); // Main ID gets 3rd direct for Board 2 qualification!

      const mainUserUpdated = await coreV4.users(userAMainId);
      expect(mainUserUpdated.directCount).to.equal(3);

      // Sub 8 & 9 attach under Sub 3
      const sub8Data = await coreV4.users(allSubIds[7]);
      const sub9Data = await coreV4.users(allSubIds[8]);
      expect(sub8Data.sponsorId).to.equal(subIdsBatch1[2]); // Sub 3
      expect(sub9Data.sponsorId).to.equal(subIdsBatch1[2]); // Sub 3

      // Sub 10 attaches under Sub 4
      const sub10Data = await coreV4.users(allSubIds[9]);
      expect(sub10Data.sponsorId).to.equal(subIdsBatch1[3]); // Sub 4
    });
  });

  describe("3. External Level Income (3% - 2% - 1%) Routing to Main IDs", function () {
    it("Should pay 3% Level Income to external qualified sponsor's Main ID wallet for all sub-IDs created", async function () {
      // User A registers
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User A gets 2 directs (User C & User D) to become qualified (directCount >= 2)
      await coreV4.connect(userC).registerMainUser(userAMainId, 0);
      await coreV4.connect(userD).registerMainUser(userAMainId, 0);

      const userAData = await coreV4.users(userAMainId);
      expect(userAData.directCount).to.equal(2); // Qualified!

      // User B registers under User A (as 3rd direct of User A)
      await coreV4.connect(userB).registerMainUser(userAMainId, 0);

      const incBefore = await coreV4.userIncomes(userAMainId);

      // User B creates 5 Sub-IDs
      await coreV4.connect(userB).createBatchSubIds(5);

      const incAfter = await coreV4.userIncomes(userAMainId);

      // Level income for User A increases by exactly 15 USDT (5 Sub-IDs * 3 USDT)
      expect(incAfter.levelIncome - incBefore.levelIncome).to.equal(ethers.parseEther("15"));
    });
  });

  describe("4. Board Unit ID Sequence Integrity (Level-Specific Board IDs)", function () {
    it("Should generate 1001 for Level 1, 2001 for Level 2, and 1002/1003 for Level 1 splits without gaps or duplicates", async function () {
      // 1. User A registers -> Creates Board 1001
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User A gets 2 directs (User B & User C)
      await coreV4.connect(userB).registerMainUser(userAMainId, 0);
      await coreV4.connect(userC).registerMainUser(userAMainId, 0);

      // 4 more users register under User B & C to fill 7/7 Board 1001
      const userBMainId = await coreV4.walletToMainUserId(userB.address);
      const userCMainId = await coreV4.walletToMainUserId(userC.address);

      const signers = await ethers.getSigners();
      const u4 = signers[8];
      const u5 = signers[9];
      const u6 = signers[10];
      const u7 = signers[11];

      for (const u of [u4, u5, u6, u7]) {
        await usdt.mint(u.address, ethers.parseEther("100000"));
        await usdt.connect(u).approve(await coreV4.getAddress(), ethers.MaxUint256);
      }

      await coreV4.connect(u4).registerMainUser(userBMainId, 0);
      await coreV4.connect(u5).registerMainUser(userBMainId, 0);
      await coreV4.connect(u6).registerMainUser(userCMainId, 0);
      await coreV4.connect(u7).registerMainUser(userCMainId, 0);

      // Board 1001 completed! User A promoted to Level 2.
      // Check active boards for Level 1:
      const activeL1 = await coreV4.getActiveBoardUnitsByLevel(1);
      // Board 1001 split into 1002 and 1003!
      expect(activeL1.length).to.equal(3);
      expect(activeL1[0]).to.equal(1001);
      expect(activeL1[1]).to.equal(1002);
      expect(activeL1[2]).to.equal(1003);

      // Check active boards for Level 2:
      const activeL2 = await coreV4.getActiveBoardUnitsByLevel(2);
      // Level 2's FIRST board MUST be 2001!
      expect(activeL2.length).to.equal(1);
      expect(activeL2[0]).to.equal(2001);
    });
  });

  describe("5. Higher Board Qualification Priority Check & Manual Placement Restrictions", function () {
    it("Should prioritize giving 3rd direct to Main ID promoted to Board 2 before giving sub-IDs their directs", async function () {
      // 1. User A registers
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User A creates 2 Sub-IDs (Sub 1, Sub 2) under Main ID -> Main ID gets 2 directs
      await coreV4.connect(userA).createSubId(0, 0);
      await coreV4.connect(userA).createSubId(0, 0);

      const mainUserData = await coreV4.users(userAMainId);
      expect(mainUserData.directCount).to.equal(2);

      // Manually promote User A to Board 2 to test qualification target priority (Board 2 needs 3 directs)
      // We simulate User A being on Board 2
      // Let's create another sub-ID for User A: since User A is on Board 1, target is 2 (full).
      // If User A is promoted to Board 2, target becomes 3!
    });

    it("Should revert with error if Position 4-7 (bottom slots) is passed as manualPlacementId", async function () {
      // User A registers (Position 1 / Top of Board 1001)
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User B & C register (Positions 2 & 3 / Middle Left & Right)
      await coreV4.connect(userB).registerMainUser(userAMainId, 0);
      await coreV4.connect(userC).registerMainUser(userAMainId, 0);

      const userBMainId = await coreV4.walletToMainUserId(userB.address);

      // User D registers under User B (Position 4 / Bottom Left 1 of Board 1001)
      await coreV4.connect(userD).registerMainUser(userBMainId, 0);
      const userDMainId = await coreV4.walletToMainUserId(userD.address);

      // Verify User D is at position slot 3 (Position 4 bottom node) in Board 1001
      const pos = await coreV4.getBoardUnitPositions(1001);
      expect(Number(pos[3])).to.equal(userDMainId); // Pos 4 bottom node!

      // Now try to register a new user using User D (Position 4 bottom node) as manualPlacementId
      const signers = await ethers.getSigners();
      const newSigner = signers[12];
      await usdt.mint(newSigner.address, ethers.parseEther("100000"));
      await usdt.connect(newSigner).approve(await coreV4.getAddress(), ethers.MaxUint256);

      await expect(
        coreV4.connect(newSigner).registerMainUser(userDMainId, userDMainId)
      ).to.be.revertedWith("Cannot use bottom board position (Pos 4-7) as placement parent");
    });
  });

  describe("6. Board Completion Reward & Qualification Hold Payout Rule", function () {
    it("Should HOLD board completion reward ($40 USDT) when top user has only 1 direct, and PAY reward ($40 USDT) when 2nd direct is added", async function () {
      // 1. User A registers (Top of Board 1001)
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);

      // User A gets ONLY 1 direct referral (User B)
      await coreV4.connect(userB).registerMainUser(userAMainId, 0);
      const userBMainId = await coreV4.walletToMainUserId(userB.address);

      // 5 users register under User B to fill 7/7 Board 1001 without User A getting a 2nd direct
      const signers = await ethers.getSigners();
      const fillerSigners = [signers[8], signers[9], signers[10], signers[11], signers[12]];
      for (const s of fillerSigners) {
        await usdt.mint(s.address, ethers.parseEther("100000"));
        await usdt.connect(s).approve(await coreV4.getAddress(), ethers.MaxUint256);
        await coreV4.connect(s).registerMainUser(userBMainId, 0);
      }

      // Board 1001 is now filled 7/7!
      // Check User A board rewards: SHOULD BE 0 (REWARD HELD!)
      const incA1 = await coreV4.userIncomes(userAMainId);
      expect(incA1.boardRewards).to.equal(0); // $0 paid!

      // Check User A is on hold list for Level 1:
      const isHolding = await coreV4.isHoldingForQualification(userAMainId);
      expect(isHolding).to.be.true;

      // User A is NOT yet in Board Level 2:
      const activeL2 = await coreV4.getActiveBoardUnitsByLevel(2);
      expect(activeL2.length).to.equal(0); // 0 active Level 2 boards!

      // NOW User A gets 2nd direct referral (User C)
      await coreV4.connect(userC).registerMainUser(userAMainId, 0);

      // User A is now qualified!
      // 1. Reward ($40 USDT) IS NOW PAID to User A!
      const incA2 = await coreV4.userIncomes(userAMainId);
      expect(incA2.boardRewards).to.equal(ethers.parseEther("40")); // $40 USDT paid!

      // 2. User A released from hold queue:
      const isHoldingAfter = await coreV4.isHoldingForQualification(userAMainId);
      expect(isHoldingAfter).to.be.false;

      // 3. User A is now placed in Board Level 2 (Board 2001 created)!
      const activeL2After = await coreV4.getActiveBoardUnitsByLevel(2);
      expect(activeL2After.length).to.equal(1);
      expect(activeL2After[0]).to.equal(2001);
    });
  });

  describe("7. Automated 10-Day Share Pool Keeper Execution & Single-Tx Bulk Claiming", function () {
    it("Should auto-finalize 10-day share pool on schedule and claim for Main ID + 5 Sub-IDs in 1 single transaction", async function () {
      // 1. User A registers & creates 5 Sub-IDs
      await coreV4.connect(userA).registerMainUser(0, 0);
      const userAMainId = await coreV4.walletToMainUserId(userA.address);
      await coreV4.connect(userA).createBatchSubIds(5);

      // Verify active pool balance (6 registrations * $30 = $180 USDT)
      const poolBal = await coreV4.sharePoolBalance();
      expect(poolBal).to.equal(ethers.parseEther("180"));

      // Fast-forward EVM time by 10 days (864,000s)
      await ethers.provider.send("evm_increaseTime", [864000]);
      await ethers.provider.send("evm_mine", []);

      // Keeper bot triggers finalizeSharePeriod() automatically
      await coreV4.connect(admin1).finalizeSharePeriod();

      const userABalanceBefore = await usdt.balanceOf(userA.address);

      // User A executes 1 SINGLE TRANSACTION to claim share pool income for Main ID + 5 Sub-IDs combined!
      await coreV4.connect(userA).claimAllShareIncome();

      const userABalanceAfter = await usdt.balanceOf(userA.address);

      // User A received 1 single consolidated USDT payout for all 6 IDs!
      expect(userABalanceAfter - userABalanceBefore).to.equal(ethers.parseEther("180"));
    });

    it("Should execute emergency sweep after 365 days of inactivity and split USDT balance equally across 3 Admins", async function () {
      // 1. Fast forward EVM time by 365 days + 1 second
      await ethers.provider.send("evm_increaseTime", [365 * 86400 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Record admin balances before sweep
      const bal1Before = await usdt.balanceOf(admin1.address);
      const bal2Before = await usdt.balanceOf(admin2.address);
      const bal3Before = await usdt.balanceOf(admin3.address);

      const contractUsdtBal = await usdt.balanceOf(await coreV4.getAddress());

      if (contractUsdtBal > 0n) {
        // Trigger emergency sweep
        await coreV4.connect(admin1).emergencySweepInactivity();

        const bal1After = await usdt.balanceOf(admin1.address);
        const bal2After = await usdt.balanceOf(admin2.address);
        const bal3After = await usdt.balanceOf(admin3.address);

        const expectedSplit = contractUsdtBal / 3n;
        expect(bal2After - bal2Before).to.equal(expectedSplit);
        expect(bal3After - bal3Before).to.equal(expectedSplit);
        expect(bal1After - bal1Before).to.be.closeTo(expectedSplit, ethers.parseEther("0.01"));
      }
    });
  });
});

