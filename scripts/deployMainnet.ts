import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("   GROW 50X DEPLOYMENT V1.2 - BNB SMART CHAIN MAINNET");
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const expectedDeployer = "0xC1431c273EFAd8235e872c3860C68c48af319d40";
  if (deployer.address.toLowerCase() !== expectedDeployer.toLowerCase()) {
    console.warn(`\n⚠️ WARNING: Active deployer (${deployer.address}) does not match expected address (${expectedDeployer}).`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  if (balance === 0n) {
    throw new Error("❌ Error: Deployer account has 0 BNB balance. Please top up BNB for gas fees before deploying.");
  }

  // Official BEP-20 USDT Token Address on BSC Mainnet
  const usdtAddress = process.env.MAINNET_USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
  console.log(">>> Official Mainnet USDT Address:", usdtAddress);

  // Official Protocol Admin & Vault Wallets
  const mainAdmin = process.env.ADMIN_WALLET_1 || "0x1c3Fe2bD2a2F0D2Ce35E45762B2Ae60A2c83D9c2";        // Main Admin (9c2)
  const rewardVault = process.env.ADMIN_WALLET_2 || "0xAF39c1D4759071FcB63a710A54cAEC87aB0EEe99";      // Reward Vault (e99)
  const serverMaintenance = process.env.ADMIN_WALLET_3 || "0x173d429E5690dD6CD40d526Cb7D4138D3B930c61";// Server & Maintenance (c61)

  console.log("Main Admin Wallet (9c2):", mainAdmin);
  console.log("Reward Vault Wallet (e99):", rewardVault);
  console.log("Server Maintenance Wallet (c61):", serverMaintenance);

  // Compute ABI Encoded Constructor Arguments
  const abiCoder = new ethers.AbiCoder();
  const encodedArgs = abiCoder.encode(
    ["address", "address", "address", "address"],
    [usdtAddress, mainAdmin, rewardVault, serverMaintenance]
  );
  console.log("\n>>> ABI Encoded Constructor Arguments (for BscScan Verification):");
  console.log(encodedArgs.slice(2));

  // Deploy Grow50XCoreV1_2
  console.log("\n🚀 Deploying Grow50XCoreV1_2 protocol contract to BSC Mainnet...");
  const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_2.sol:Grow50XCoreV1_2");
  const core = await CoreFactory.deploy(usdtAddress, mainAdmin, rewardVault, serverMaintenance);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("🎉 SUCCESS! Grow50XCoreV1_2 deployed to Mainnet at:", coreAddress);

  // Save Deployment Artifacts
  console.log("\n💾 Saving deployment addresses...");
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentData = {
    network: "bscMainnet",
    chainId: 56,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      USDT: usdtAddress,
      Grow50XCoreV1_2: coreAddress,
      MainAdminWallet_9c2: mainAdmin,
      RewardVault_e99: rewardVault,
      ServerMaintenance_c61: serverMaintenance,
    },
    verificationInfo: {
      contractName: "Grow50XCoreV1_2",
      compilerVersion: "v0.8.24+commit.e11b9ed9",
      optimizationEnabled: true,
      runs: 200,
      evmVersion: "paris",
      constructorArgumentsABI: encodedArgs.slice(2),
    }
  };

  const filePath = path.join(deploymentDir, "deployment-addresses-mainnet.json");
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(">>> Saved deployment details to:", filePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
