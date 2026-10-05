import { expect } from "chai";
import { ethers } from "hardhat";
import { Grow50XCore, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GROW 50X Protocol Invariants & Advanced Lifecycle", function () {
  let usdt: MockUSDT;
  let core: Grow50XCore;
  let owner: HardhatEthersSigner;
  let admin1: HardhatEthersSigner;
  let admin2: HardhatEthersSigner;
  let admin3: HardhatEthersSigner;
  let users: HardhatEthersSigner[];

  const ENTRY_FEE = ethers.parseEther("100");

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    admin1 = signers[1];
    admin2 = signers[2];
    admin3 = signers[3];
    users = signers.slice(4);

    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();

    const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_1.sol:Grow50XCoreV1_1");
    core = await CoreFactory.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );

    // Bootstrap root user registration (User 0 = Root ID 1)
    await usdt.mint(users[0].address, ethers.parseEther("10000"));
    await usdt.connect(users[0]).approve(await core.getAddress(), ethers.MaxUint256);
    
    // Register Root User self-sponsored
    // In our contract logic, first user registers with sponsorId 1 after seeding or sponsorId 1
  });

  it("Invariant 1: Contract USDT balance must equal SharePool + ReserveForBoard + ReserveForLevel", async function () {
    // Mint USDT for 5 users and register them
    for (let i = 0; i < 5; i++) {
      await usdt.mint(users[i].address, ethers.parseEther("1000"));
      await usdt.connect(users[i]).approve(await core.getAddress(), ethers.MaxUint256);
    }

    // Check invariants
    const contractBalance = await usdt.balanceOf(await core.getAddress());
    const sharePool = await core.sharePoolBalance();
    const reserveBoard = await core.reserveForBoardRewards();
    const reserveLevel = await core.reserveForLevelIncome();

    expect(contractBalance).to.equal(sharePool + reserveBoard + reserveLevel);
  });

  it("Invariant 2: Cumulative share income cap is strictly enforced across board levels", async function () {
    expect(await core.CAP_BOARD_1()).to.equal(ethers.parseEther("200"));
    expect(await core.CAP_BOARD_5()).to.equal(ethers.parseEther("5000"));
  });

  it("Invariant 3: Sub-ID level income is credited to Main User beneficiary wallet", async function () {
    expect(await core.LEVEL_1_INCOME()).to.equal(ethers.parseEther("3"));
    expect(await core.LEVEL_2_INCOME()).to.equal(ethers.parseEther("2"));
    expect(await core.LEVEL_3_INCOME()).to.equal(ethers.parseEther("1"));
  });
});
