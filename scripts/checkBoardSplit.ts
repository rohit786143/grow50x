import { ethers } from "hardhat";

async function main() {
  const coreAddress = "0xdcA6195e0ec335c1F6e683a059E17bF701C0a741";
  const Core = await ethers.getContractFactory("Grow50XCore");
  const core = Core.attach(coreAddress) as any;

  const user2WalletChecksum = ethers.getAddress("0xb20f002ed5f46b46dd3a8e994fcebf6406f518c6");
  const user2MainId = await core.walletToMainUserId(user2WalletChecksum);

  console.log("Checksum Wallet Address:", user2WalletChecksum);
  console.log("User 2 Main ID:", user2MainId.toString());

  const u604776 = await core.users(604776);
  console.log("User 604776 Wallet:", u604776.wallet);
  console.log("User 604776 Active Board Unit:", (await core.userActiveBoardUnit(604776)).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
