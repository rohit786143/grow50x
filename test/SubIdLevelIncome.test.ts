import { expect } from "chai";
import { ethers } from "hardhat";
import { Grow50XCoreV1_2, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Sub-ID 3-2-1 External Eligible Level Income Rule Tests", function () {
  let usdt: MockUSDT;
  let core: Grow50XCoreV1_2;
  let owner: HardhatEthersSigner;
  let admin1: HardhatEthersSigner;
  let admin2: HardhatEthersSigner;
  let admin3: HardhatEthersSigner;
  let userA: HardhatEthersSigner; // Main ID A
  let userB: HardhatEthersSigner; // Main ID B
  let userC: HardhatEthersSigner; // Main ID C
  let userD: HardhatEthersSigner; // Main ID D

  const ENTRY_FEE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, admin1, admin2, admin3, userA, userB, userC, userD] = await ethers.getSigners();

    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();

    const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
    core = await CoreFactory.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );

    const signers = [owner, userA, userB, userC, userD];
    for (const signer of signers) {
      await usdt.mint(signer.address, ethers.parseEther("10000"));
      await usdt.connect(signer).approve(await core.getAddress(), ethers.MaxUint256);
    }
  });

  it("Should pay 3% ($3) to 1st external qualified Main ID, 2% ($2) to 2nd, and 1% ($1) to 3rd", async function () {
    // 1. Root Registration (owner)
    await core.connect(owner).registerMainUser(0, 0);
    const rootId = Number(await core.walletToMainUserId(owner.address));

    // 2. Register userA under Root
    await core.connect(userA).registerMainUser(rootId, 0);
    const idA = Number(await core.walletToMainUserId(userA.address));

    // 3. Register userB under userA
    await core.connect(userB).registerMainUser(idA, 0);
    const idB = Number(await core.walletToMainUserId(userB.address));

    // 4. Register userC under userB
    await core.connect(userC).registerMainUser(idB, 0);
    const idC = Number(await core.walletToMainUserId(userC.address));

    // 5. Register userD under userC
    await core.connect(userD).registerMainUser(idC, 0);
    const idD = Number(await core.walletToMainUserId(userD.address));

    // Give 2 directs to userC, userB, userA so they satisfy directCount >= 2 qualification
    // Give userC 2 directs
    const dummySigner1 = (await ethers.getSigners())[8];
    const dummySigner2 = (await ethers.getSigners())[9];
    await usdt.mint(dummySigner1.address, ENTRY_FEE * 2n);
    await usdt.mint(dummySigner2.address, ENTRY_FEE * 2n);
    await usdt.connect(dummySigner1).approve(await core.getAddress(), ethers.MaxUint256);
    await usdt.connect(dummySigner2).approve(await core.getAddress(), ethers.MaxUint256);

    await core.connect(dummySigner1).registerMainUser(idC, 0);
    await core.connect(dummySigner2).registerMainUser(idB, 0);

    // Verify Direct Counts:
    // userC has idD + dummy1 = 2 directs (Qualified)
    // userB has idC + dummy2 = 2 directs (Qualified)
    // userA has idB + (needs 1 more direct) -> let's give userA 1 more direct
    const dummySigner3 = (await ethers.getSigners())[10];
    await usdt.mint(dummySigner3.address, ENTRY_FEE);
    await usdt.connect(dummySigner3).approve(await core.getAddress(), ethers.MaxUint256);
    await core.connect(dummySigner3).registerMainUser(idA, 0);
    // userA has idB + dummy3 = 2 directs (Qualified)

    // Check unclaimed level income before Sub-ID creation
    const lvlIncC_before = await core.userUnclaimedLevelIncome(idC);
    const lvlIncB_before = await core.userUnclaimedLevelIncome(idB);
    const lvlIncA_before = await core.userUnclaimedLevelIncome(idA);

    // Now userD creates 1 Sub-ID
    await core.connect(userD).createSubId(0, 0);

    const lvlIncC_after = await core.userUnclaimedLevelIncome(idC);
    const lvlIncB_after = await core.userUnclaimedLevelIncome(idB);
    const lvlIncA_after = await core.userUnclaimedLevelIncome(idA);

    // 1st External Qualified Upline (userC) MUST get $3 USDT (Level 1 = 3%)
    expect(lvlIncC_after - lvlIncC_before).to.equal(ethers.parseEther("3"));

    // 2nd External Qualified Upline (userB) MUST get $2 USDT (Level 2 = 2%)
    expect(lvlIncB_after - lvlIncB_before).to.equal(ethers.parseEther("2"));

    // 3rd External Qualified Upline (userA) MUST get $1 USDT (Level 3 = 1%)
    expect(lvlIncA_after - lvlIncA_before).to.equal(ethers.parseEther("1"));
  });
});
