import { expect } from "chai";
import { ethers } from "hardhat";

describe("Share Pool Cutoff Dates (5th, 15th, 25th Dubai Time GST UTC+4)", function () {
  let core: any;
  let usdt: any;
  let deployer: any;
  let admin1: any;
  let admin2: any;
  let admin3: any;

  beforeEach(async function () {
    [deployer, admin1, admin2, admin3] = await ethers.getSigners();

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
  });

  it("Should correctly target 5th, 15th, or 25th of the month at 23:59:59 GST (19:59:59 UTC)", async function () {
    const nextCutoff = await core.nextPeriodTargetTimestamp();
    const cutoffDate = new Date(Number(nextCutoff) * 1000);
    
    // In Dubai Time (UTC+4):
    const dubaiDate = new Date(cutoffDate.getTime() + (4 * 60 * 60 * 1000));
    const day = dubaiDate.getUTCDate();
    const hours = dubaiDate.getUTCHours();
    const minutes = dubaiDate.getUTCMinutes();
    const seconds = dubaiDate.getUTCSeconds();

    expect([5, 15, 25]).to.include(day);
    expect(hours).to.equal(23);
    expect(minutes).to.equal(59);
    expect(seconds).to.equal(59);
  });

  it("Should calculate next cutoff correctly when finalized on 5th", async function () {
    // Register user to have active shares
    await usdt.mint(deployer.address, ethers.parseEther("100"));
    await usdt.approve(await core.getAddress(), ethers.parseEther("100"));
    await core.registerMainUser(0, 0);

    // Jump to the current cutoff
    const currentCutoff = await core.nextPeriodTargetTimestamp();
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(currentCutoff) + 1]);
    await ethers.provider.send("evm_mine", []);

    await core.finalizeSharePeriod();

    const nextCutoff = await core.nextPeriodTargetTimestamp();
    const cutoffDate = new Date(Number(nextCutoff) * 1000);
    const dubaiDate = new Date(cutoffDate.getTime() + (4 * 60 * 60 * 1000));

    expect([5, 15, 25]).to.include(dubaiDate.getUTCDate());
    expect(dubaiDate.getUTCHours()).to.equal(23);
    expect(dubaiDate.getUTCMinutes()).to.equal(59);
    expect(dubaiDate.getUTCSeconds()).to.equal(59);
  });
});
