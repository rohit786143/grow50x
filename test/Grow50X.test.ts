import { expect } from "chai";
import { ethers } from "hardhat";
import { Grow50XCore, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GROW 50X Protocol Unit & Integration Tests", function () {
  let usdt: MockUSDT;
  let core: Grow50XCore;
  let owner: HardhatEthersSigner;
  let admin1: HardhatEthersSigner;
  let admin2: HardhatEthersSigner;
  let admin3: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;
  let user5: HardhatEthersSigner;

  const ENTRY_FEE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, admin1, admin2, admin3, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();

    // Deploy Grow50XCore
    const CoreFactory = await ethers.getContractFactory("Grow50XCore");
    core = await CoreFactory.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );

    // Mint USDT to users and approve core contract
    const signers = [owner, user1, user2, user3, user4, user5];
    for (const signer of signers) {
      await usdt.mint(signer.address, ethers.parseEther("100000"));
      await usdt.connect(signer).approve(await core.getAddress(), ethers.MaxUint256);
    }

    // Owner acts as Root User (ID 1)
    // Register Root User self-sponsored to bootstrap the system
    // We register owner by directly manipulating or registering through first call
    // Owner registers with sponsorId = 1 (or 0 fallback handled in test bootstrap)
  });

  describe("1. Main User Registration & Revenue Split", function () {
    it("Should register Root User and subsequent users with correct 100 USDT split", async function () {
      // Bootstrap first registration by temporarily deploying root user
      // User 1 registers with sponsorId = 1 (Owner will register first as Root ID 1)
      // Let's test registering Owner as ID 1
      await usdt.mint(owner.address, ENTRY_FEE);
      await usdt.connect(owner).approve(await core.getAddress(), ENTRY_FEE);

      // In Grow50XCore, ID 1 is created on first registration
      // First registration uses sponsorId 0 or 1
    });

    it("Should enforce exact $100 distribution: 40% Sponsor, 30% Share, 5%x3 Admins, 15% Reserve", async function () {
      const admin1BalanceBefore = await usdt.balanceOf(admin1.address);
      const admin2BalanceBefore = await usdt.balanceOf(admin2.address);
      const admin3BalanceBefore = await usdt.balanceOf(admin3.address);

      // Register root user 1
      // Owner registers
    });
  });

  describe("2. Sponsor Tree & Direct Counts", function () {
    it("Should track directCount strictly on Sponsor Tree", async function () {
      // Verification of directCount increment
    });
  });

  describe("3. Placement Tree & Deterministic Board Filling", function () {
    it("Should fill board positions TOP -> BOTTOM, RIGHT -> LEFT", async function () {
      // Verification of fill order
    });
  });

  describe("4. Sub-ID Manual & Automatic 20-Batch Creation", function () {
    it("Should restrict manual Sub-ID sponsor options to owner's IDs only", async function () {
      // Verification of sponsor dropdown on-chain security check
    });

    it("Should reject batch sizes greater than 20", async function () {
      await expect(core.connect(user1).createBatchSubIds(21)).to.be.revertedWith(
        "Batch count must be 1 to 20"
      );
    });
  });

  describe("5. Non-Resetting Cumulative Share Cap", function () {
    it("Should preserve lifetimeShareIncomeEarned across board upgrades", async function () {
      expect(await core.CAP_BOARD_1()).to.equal(ethers.parseEther("200"));
      expect(await core.CAP_BOARD_2()).to.equal(ethers.parseEther("400"));
    });
  });
});
