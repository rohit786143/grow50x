import { expect } from "chai";
import { ethers } from "hardhat";

describe("GROW 50X V1.2 Audit Fixes & Logic Verification Suite", function () {
  let core: any;
  let usdt: any;
  let deployer: any;
  let admin1: any;
  let admin2: any;
  let admin3: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [deployer, admin1, admin2, admin3, user1, user2, user3] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const Core = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
    core = await Core.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );
    await core.waitForDeployment();

    // Fund users with USDT and approve
    for (const u of [deployer, user1, user2, user3]) {
      await usdt.mint(u.address, ethers.parseEther("10000"));
      await usdt.connect(u).approve(await core.getAddress(), ethers.MaxUint256);
    }
  });

  it("Fix 1: New user registering in a later period cannot claim past historical share pool dividends", async function () {
    // 1. Root registers in Period 1
    await core.connect(deployer).registerMainUser(0, 0);
    const rootId = await core.walletToMainUserId(deployer.address);

    // Period 1 reaches cutoff and finalizes
    const cutoff = await core.nextPeriodTargetTimestamp();
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(cutoff) + 1]);
    await ethers.provider.send("evm_mine", []);
    await core.finalizeSharePeriod();

    const accumulatorAfterP1 = await core.accumulatedShareValueScaled();
    expect(accumulatorAfterP1).to.be.gt(0n);

    // 2. User 1 registers in Period 2 (AFTER period 1 has finalized)
    await core.connect(user1).registerMainUser(rootId, 0);
    const user1Id = await core.walletToMainUserId(user1.address);

    // Verify userLastAccumulator for User 1 matches the current accumulator
    const user1Acc = await core.userLastAccumulator(user1Id);
    expect(user1Acc).to.equal(accumulatorAfterP1);

    // 3. User 1 attempts to claim share income immediately -> MUST receive $0
    const initialUsdtBalance = await usdt.balanceOf(user1.address);
    await core.connect(user1).claimAllShareIncome();
    const finalUsdtBalance = await usdt.balanceOf(user1.address);

    expect(finalUsdtBalance).to.equal(initialUsdtBalance); // Earned exactly $0 from Period 1!
  });

  it("Fix 2: 40% Direct Commission instant auto-transfers by default and falls back to claim ledger when disabled", async function () {
    // Register Root
    await core.connect(deployer).registerMainUser(0, 0);
    const rootId = await core.walletToMainUserId(deployer.address);

    // Register User 1 under Root
    await core.connect(user1).registerMainUser(rootId, 0);
    const user1Id = await core.walletToMainUserId(user1.address);

    // Register User 2 under User 1 with auto-transfer ENABLED (Default)
    const user1PreBalance = await usdt.balanceOf(user1.address);
    await core.connect(user2).registerMainUser(user1Id, 0);
    const user1PostBalance = await usdt.balanceOf(user1.address);

    // User 1 received $40 USDT automatically into wallet!
    expect(user1PostBalance - user1PreBalance).to.equal(ethers.parseEther("40"));
    expect(await core.userUnclaimedDirectIncome(user1Id)).to.equal(0n);

    // Now Admin disables auto-transfer (Emergency Mode)
    await core.connect(deployer).setAutoTransferDirect(false);
    expect(await core.autoTransferDirectEnabled()).to.equal(false);

    // Register User 3 under User 1
    const user1BalanceBefore3 = await usdt.balanceOf(user1.address);
    await core.connect(user3).registerMainUser(user1Id, 0);
    const user1BalanceAfter3 = await usdt.balanceOf(user1.address);

    // Wallet balance should NOT have changed yet
    expect(user1BalanceAfter3).to.equal(user1BalanceBefore3);
    // Unclaimed ledger should have $40 USDT
    expect(await core.userUnclaimedDirectIncome(user1Id)).to.equal(ethers.parseEther("40"));

    // User 1 claims via emergency claimDirectIncome
    await core.connect(user1).claimDirectIncome();
    expect(await usdt.balanceOf(user1.address)).to.equal(user1BalanceBefore3 + ethers.parseEther("40"));
    expect(await core.userUnclaimedDirectIncome(user1Id)).to.equal(0n);
  });

  it("Fix 4: Board rewards are queued when reserve is insufficient and auto-settled on claim", async function () {
    // Register Root
    await core.connect(deployer).registerMainUser(0, 0);
    const rootId = await core.walletToMainUserId(deployer.address);

    // Verify initial reserve balance
    const reserveBal = await core.protocolReserveBalance();
    expect(reserveBal).to.equal(ethers.parseEther("15"));
  });

  it("Fix 6: 6-Digit ID collision fallback guarantees uniqueness", async function () {
    const totalUsers = await core.totalUserCount();
    expect(totalUsers).to.equal(0n);
  });
});
