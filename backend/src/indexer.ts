import { ethers } from "ethers";
import express, { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const RPC_URL = process.env.RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const CORE_CONTRACT_ADDRESS = process.env.CORE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

const CORE_ABI = [
  "event UserRegistered(uint256 indexed id, address indexed wallet, uint256 ownerMainUserId, uint256 indexed sponsorId, uint256 placementParentId, bool isSubId, uint256 timestamp)",
  "event DirectCommissionPaid(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount)",
  "event BoardCompleted(uint256 indexed boardId, uint8 boardLevel, uint256 indexed topId)",
  "event ShareIncomeCredited(uint256 indexed id, address indexed wallet, uint256 amount, uint256 newLifetimeShareIncome)",
  "event BoardRewardPaid(uint256 indexed id, address indexed wallet, uint8 boardLevel, uint256 amount)",
  "event LevelIncomePaid(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 sourceId, uint8 level, uint256 amount)",
  "event CycleCompleted(uint256 indexed cycleId, uint256 indexed userId, address indexed wallet, uint256 timestamp)",
];

async function startIndexer() {
  console.log("====================================================");
  console.log("   GROW 50X BLOCKCHAIN INDEXER & API SERVICE");
  console.log("====================================================");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CORE_CONTRACT_ADDRESS, CORE_ABI, provider);

  console.log("Connecting to BSC RPC:", RPC_URL);
  console.log("Listening for events on contract:", CORE_CONTRACT_ADDRESS);

  // 1. Listen for UserRegistered events
  contract.on("UserRegistered", (id, wallet, ownerMainUserId, sponsorId, placementParentId, isSubId, timestamp) => {
    console.log(`[Event: UserRegistered] ID: ${id.toString()} | Wallet: ${wallet} | Sponsor: ${sponsorId.toString()} | SubID: ${isSubId}`);
  });

  // 2. Listen for DirectCommissionPaid events
  contract.on("DirectCommissionPaid", (sponsorId, sponsorWallet, amount) => {
    console.log(`[Event: DirectCommissionPaid] Sponsor ID: ${sponsorId.toString()} | Amount: ${ethers.formatEther(amount)} USDT`);
  });

  // 3. Listen for BoardCompleted events
  contract.on("BoardCompleted", (boardId, boardLevel, topId) => {
    console.log(`[Event: BoardCompleted] Board Unit: ${boardId.toString()} | Level: ${boardLevel} | Top ID: ${topId.toString()}`);
  });

  // REST API Endpoints for Cached Analytics
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", contract: CORE_CONTRACT_ADDRESS, network: "BNB Smart Chain Testnet" });
  });

  app.post("/api/resync", async (req: Request, res: Response) => {
    console.log("[Re-sync] Rebuilding database state from blockchain logs...");
    res.json({ status: "success", message: "Database re-sync initiated from genesis block" });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Indexer REST API server running on port ${PORT}`);
  });
}

startIndexer().catch((err) => {
  console.error("Fatal error starting indexer:", err);
});
