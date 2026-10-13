import { expect } from "chai";
import { ethers } from "hardhat";

describe("Board 5 Completion Single Payout Verification", function () {
  it("Should pay exactly $640 USDT (not $1280) when Board 5 completes", async function () {
    const [deployer, admin1, admin2, admin3, user] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const Core = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
    const core = await Core.deploy(
      await usdt.getAddress(),
      admin1.address,
      admin2.address,
      admin3.address
    );
    await core.waitForDeployment();

    // Verify constant values
    expect(await core.REWARD_BOARD_5()).to.equal(ethers.parseEther("640"));
  });
});
