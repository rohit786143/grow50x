import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xb96D2426efDeE912C5FA7942b364a8c779F7FEa8";
  const usdtAddress = "0x18C75ceD75F8DfA03f41Dc7f412737147519d6B7";

  const Core = await ethers.getContractFactory("Grow50XCore");
  const core = Core.attach(coreAddress) as any;

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = MockUSDT.attach(usdtAddress) as any;

  const user2Wallet = "0xb20F002Ed5f46b46DD3a8e994FcEbf6406f518c6";
  const sponsorId = 363306;

  console.log("=== CHECKING ALL 5 REGISTRATION CONDITIONS FOR USER 2 ===");
  console.log("User 2 Address:", user2Wallet);

  // Condition 1: Is wallet already registered?
  const existingId = await core.walletToMainUserId(user2Wallet);
  console.log("Condition 1 - walletToMainUserId:", existingId.toString(), "(Must be 0)");

  // Condition 2: Is totalUserCount > 0?
  const totalUsers = await core.totalUserCount();
  console.log("Condition 2 - totalUserCount:", totalUsers.toString());

  // Condition 3: Is Sponsor ID 363306 active?
  const sponsor = await core.users(sponsorId);
  console.log("Condition 3 - Sponsor 363306 Active:", sponsor.active, "Wallet:", sponsor.wallet);

  // Condition 4: User 2 USDT Balance
  const usdtBal = await usdt.balanceOf(user2Wallet);
  console.log("Condition 4 - USDT Balance:", ethers.formatEther(usdtBal), "USDT (Must be >= 100)");

  // Condition 5: User 2 USDT Allowance on Core
  const allowance = await usdt.allowance(user2Wallet, coreAddress);
  console.log("Condition 5 - USDT Allowance:", allowance.toString(), `(${ethers.formatEther(allowance)} USDT) (Must be >= 100)`);

  // Condition 6: User 2 tBNB Balance
  const bnbBal = await ethers.provider.getBalance(user2Wallet);
  console.log("Condition 6 - tBNB Balance:", ethers.formatEther(bnbBal), "tBNB");

  console.log("\n=== TESTING SIMULATION OF registerMainUser ===");
  try {
    const data = core.interface.encodeFunctionData("registerMainUser", [sponsorId, 0]);
    const res = await ethers.provider.call({
      from: user2Wallet,
      to: coreAddress,
      data: data,
    });
    console.log("SIMULATION SUCCESS! Output:", res);
  } catch (err: any) {
    console.error("SIMULATION REVERTED!");
    console.error("Revert Error Message:", err.reason || err.message);
    if (err.data) {
      console.error("Revert Raw Data:", err.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
