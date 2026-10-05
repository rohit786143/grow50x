import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xb96D2426efDeE912C5FA7942b364a8c779F7FEa8";
  const usdtAddress = "0x18C75ceD75F8DfA03f41Dc7f412737147519d6B7";

  const Core = await ethers.getContractFactory("Grow50XCore");
  const core = Core.attach(coreAddress) as any;

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = MockUSDT.attach(usdtAddress) as any;

  // Let's create a wallet instance for User 2 using a test private key or provider
  // Or check deployer registering user 2
  const user2Wallet = "0xb20F002Ed5f46b46DD3a8e994FcEbf6406f518c6";
  const allowance = await usdt.allowance(user2Wallet, coreAddress);
  const usdtBal = await usdt.balanceOf(user2Wallet);
  const bnbBal = await ethers.provider.getBalance(user2Wallet);

  console.log("=== User 2 Status ===");
  console.log("Address:", user2Wallet);
  console.log("tBNB Balance:", ethers.formatEther(bnbBal), "tBNB");
  console.log("USDT Balance:", ethers.formatEther(usdtBal), "USDT");
  console.log("USDT Allowance on Core:", ethers.formatEther(allowance), "USDT");

  // Check sponsor 363306 on core
  const sponsor = await core.users(363306);
  console.log("Sponsor 363306 Active:", sponsor.active);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
