import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xB899d207532bB2be34E2B385DBbAD37F71894Fd9";

  const core = await ethers.getContractAt("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2", coreAddress);

  console.log("====================================================");
  console.log("   Grow50XCoreV1_1 ON-CHAIN LIVE VERIFICATION");
  console.log("====================================================");
  console.log("Deployed Contract Address:", coreAddress);
  console.log("Owner Address:", await core.owner());
  console.log("----------------------------------------------------");
  console.log("Board 1 Cap:", ethers.formatEther(await core.getBoardCap(1)), "USDT");
  console.log("Board 2 Cap:", ethers.formatEther(await core.getBoardCap(2)), "USDT");
  console.log("Board 3 Cap:", ethers.formatEther(await core.getBoardCap(3)), "USDT");
  console.log("Board 4 Cap:", ethers.formatEther(await core.getBoardCap(4)), "USDT");
  console.log("Board 5 Cap:", ethers.formatEther(await core.getBoardCap(5)), "USDT");
  console.log("====================================================");
}

main().catch(console.error);
