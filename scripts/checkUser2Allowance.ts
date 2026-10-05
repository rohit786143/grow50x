import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xb96D2426efDeE912C5FA7942b364a8c779F7FEa8";
  const usdtAddress = "0x18C75ceD75F8DfA03f41Dc7f412737147519d6B7";

  const Core = await ethers.getContractFactory("Grow50XCore");
  const core = Core.attach(coreAddress) as any;

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = MockUSDT.attach(usdtAddress) as any;

  const user2Wallet = "0xb20F002Ed5f46b46DD3a8e994FcEbf6406f518c6";

  const allowance = await usdt.allowance(user2Wallet, coreAddress);
  const usdtBal = await usdt.balanceOf(user2Wallet);
  const bnbBal = await ethers.provider.getBalance(user2Wallet);

  console.log("=== User 2 Direct BSC Testnet Query ===");
  console.log("Wallet Address:", user2Wallet);
  console.log("tBNB Balance:", ethers.formatEther(bnbBal), "tBNB");
  console.log("USDT Balance:", ethers.formatEther(usdtBal), "USDT");
  console.log("USDT Allowance on Core:", allowance.toString(), `(${ethers.formatEther(allowance)} USDT)`);

  if (allowance < ethers.parseEther("100")) {
    console.log("CRITICAL FINDING: USDT ALLOWANCE IS STILL 0 ON-CHAIN FOR USER 2!");
  } else {
    console.log("ALLOWANCE IS APPROVED ON-CHAIN!");
    console.log("Testing staticCall of registerMainUser(363306, 0)...");
    try {
      // simulate registerMainUser with eth_call
      const data = core.interface.encodeFunctionData("registerMainUser", [363306, 0]);
      const callRes = await ethers.provider.call({
        from: user2Wallet,
        to: coreAddress,
        data: data,
      });
      console.log("eth_call result:", callRes);
    } catch (err: any) {
      console.error("eth_call REVERTED:", err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
