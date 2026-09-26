import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("   GROW 50X DEPLOYMENT - BNB SMART CHAIN TESTNET");
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // 1. Deploy Mock USDT (for testnet testing)
  console.log("\n[1/3] Deploying Mock USDT...");
  const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDTFactory.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(">>> MockUSDT deployed at:", usdtAddress);

  // Define Admin Wallets for 5% splits
  const admin1 = process.env.ADMIN_WALLET_1 || deployer.address;
  const admin2 = process.env.ADMIN_WALLET_2 || deployer.address;
  const admin3 = process.env.ADMIN_WALLET_3 || deployer.address;

  // 2. Deploy Grow50XCore
  console.log("\n[2/3] Deploying Grow50XCore protocol contract...");
  const CoreFactory = await ethers.getContractFactory("Grow50XCore");
  const core = await CoreFactory.deploy(usdtAddress, admin1, admin2, admin3);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log(">>> Grow50XCore deployed at:", coreAddress);

  // 3. Save Deployment Artifacts
  console.log("\n[3/3] Saving deployment addresses...");
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentData = {
    network: "bscTestnet",
    chainId: 97,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockUSDT: usdtAddress,
      Grow50XCore: coreAddress,
      AdminWallet1: admin1,
      AdminWallet2: admin2,
      AdminWallet3: admin3,
    },
  };

  const filePath = path.join(deploymentDir, "deployment-addresses-testnet.json");
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(">>> Saved deployment details to:", filePath);

  console.log("\n====================================================");
  console.log("   DEPLOYMENT COMPLETE - READY FOR FRONTEND CONNECT");
  console.log("====================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
