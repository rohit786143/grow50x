import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("   GROW 50X DEPLOYMENT V1.1 - BNB SMART CHAIN TESTNET");
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // Re-use existing MockUSDT
  const usdtAddress = "0x5412e810258E7bFdB9CA77cb7854FFAc6AC9eF99";
  console.log(">>> Using MockUSDT at:", usdtAddress);

  // Define Official Admin Wallets
  const admin1 = process.env.ADMIN_WALLET_1 || "0x7D27949028D8c8532728c69fF2153Ee6Bb3bF82e";
  const admin2 = process.env.ADMIN_WALLET_2 || "0x7A3FC2c5610F0962Dd5927a4f7397aE060B79d68";
  const admin3 = process.env.ADMIN_WALLET_3 || "0x2B255ED42530Cb531CbDaB4C4Df23Eb408fB748B";

  console.log("Admin Wallet 1:", admin1);
  console.log("Admin Wallet 2:", admin2);
  console.log("Admin Wallet 3:", admin3);

  // Compute ABI Encoded Constructor Arguments
  const abiCoder = new ethers.AbiCoder();
  const encodedArgs = abiCoder.encode(
    ["address", "address", "address", "address"],
    [usdtAddress, admin1, admin2, admin3]
  );
  console.log("\n>>> ABI Encoded Constructor Arguments (for BSCScan Verification):");
  console.log(encodedArgs.slice(2)); // Strip 0x prefix for BSCScan

  // Deploy Grow50XCoreV1_1
  console.log("\n[2/3] Deploying Grow50XCoreV1_1 protocol contract...");
  const CoreFactory = await ethers.getContractFactory("contracts/Grow50XCoreV1_1.sol:Grow50XCoreV1_1");
  const core = await CoreFactory.deploy(usdtAddress, admin1, admin2, admin3);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log(">>> Grow50XCoreV1_1 deployed at:", coreAddress);

  // Save Deployment Artifacts
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
      Grow50XCoreV1_1: coreAddress,
      AdminWallet1: admin1,
      AdminWallet2: admin2,
      AdminWallet3: admin3,
    },
    verificationInfo: {
      contractName: "Grow50XCoreV1_1",
      compilerVersion: "v0.8.24+commit.e11b9ed9",
      optimizationEnabled: true,
      runs: 200,
      evmVersion: "paris",
      constructorArgumentsABI: encodedArgs.slice(2),
    }
  };

  const filePath = path.join(deploymentDir, "deployment-addresses-testnet.json");
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(">>> Saved deployment details to:", filePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
