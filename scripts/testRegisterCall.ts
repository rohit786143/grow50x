import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xb96D2426efDeE912C5FA7942b364a8c779F7FEa8";
  const usdtAddress = "0x18C75ceD75F8DfA03f41Dc7f412737147519d6B7";

  const Core = await ethers.getContractFactory("Grow50XCore");
  const core = Core.attach(coreAddress) as any;

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = MockUSDT.attach(usdtAddress) as any;

  // Create a new random wallet for testing registration
  const testWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const [deployer] = await ethers.getSigners();

  console.log("Created test wallet:", testWallet.address);

  // Send 0.005 tBNB gas to test wallet
  const sendGas = await deployer.sendTransaction({
    to: testWallet.address,
    value: ethers.parseEther("0.005"),
  });
  await sendGas.wait();
  console.log("Funded test wallet with 0.005 tBNB");

  // Mint 1,000 USDT to test wallet
  const mintTx = await usdt.mint(testWallet.address, ethers.parseEther("1000"));
  await mintTx.wait();
  console.log("Minted 1,000 USDT to test wallet");

  // Connect contracts to test wallet
  const usdtAsTest = usdt.connect(testWallet) as any;
  const coreAsTest = core.connect(testWallet) as any;

  console.log("\nAttempting 1: registerMainUser BEFORE approve...");
  try {
    await coreAsTest.registerMainUser.staticCall(363306, 0);
    console.log("staticCall BEFORE approve: SUCCESS");
  } catch (err: any) {
    console.log("staticCall BEFORE approve: REVERTED WITH REASON:", err.reason || err.message);
  }

  console.log("\nApproving USDT now...");
  const approveTx = await usdtAsTest.approve(coreAddress, ethers.MaxUint256);
  await approveTx.wait();
  console.log("USDT Approved successfully!");

  console.log("\nAttempting 2: registerMainUser AFTER approve...");
  try {
    const res = await coreAsTest.registerMainUser.staticCall(363306, 0);
    console.log("staticCall AFTER approve: SUCCESS!", res);

    const estGas = await coreAsTest.registerMainUser.estimateGas(363306, 0);
    console.log("Estimated Gas:", estGas.toString());
  } catch (err: any) {
    console.error("staticCall AFTER approve: REVERTED WITH REASON:", err.reason || err.message);
    console.error("Full Error:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
