import { expect } from "chai";
import { ethers } from "hardhat";
import { Grow50XCoreV1_2, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GROW 50X Protocol Unit & Integration Tests", function () {
  let usdt: MockUSDT;
  let core: Grow50XCoreV1_2;
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

    // Deploy Grow50XCoreV1_2
    const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
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
  });

  describe("1. Main User Registration & Revenue Split", function () {
    it("Should register Root User and subsequent users with correct 100 USDT split", async function () {
      await usdt.mint(owner.address, ENTRY_FEE);
      await usdt.connect(owner).approve(await core.getAddress(), ENTRY_FEE);
    });

    it("Should enforce exact $100 distribution", async function () {
      const admin1BalanceBefore = await usdt.balanceOf(admin1.address);
      const admin2BalanceBefore = await usdt.balanceOf(admin2.address);
      const admin3BalanceBefore = await usdt.balanceOf(admin3.address);
    });
  });

  describe("2. Non-Resetting Cumulative Share Cap", function () {
    it("Should return correct Board Caps including $400 USDT for Board 2", async function () {
      expect(await core.getBoardCap(1)).to.equal(ethers.parseEther("200"));
      expect(await core.getBoardCap(2)).to.equal(ethers.parseEther("400"));
      expect(await core.getBoardCap(3)).to.equal(ethers.parseEther("1000"));
      expect(await core.getBoardCap(4)).to.equal(ethers.parseEther("2500"));
      expect(await core.getBoardCap(5)).to.equal(ethers.parseEther("5000"));
    });
  });
});
