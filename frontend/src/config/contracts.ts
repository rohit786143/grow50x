export const BSC_TESTNET_CHAIN_ID = 97;

export const CONTRACT_ADDRESSES = {
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // BSC Testnet USDT Mock or Deployed
  GROW50X_CORE: process.env.NEXT_PUBLIC_CORE_ADDRESS || "0x0000000000000000000000000000000000000000",
};

export const MOCK_USDT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function faucet() external",
  "function decimals() external view returns (uint8)"
] as const;

export const GROW50X_CORE_ABI = [
  "function totalUserCount() external view returns (uint256)",
  "function walletToMainUserId(address wallet) external view returns (uint256)",
  "function users(uint256 id) external view returns (uint256 id, address wallet, uint256 ownerMainUserId, uint256 sponsorId, uint256 placementParentId, uint8 currentBoard, uint256 directCount, bool active, uint256 createdAt, bool isSubId)",
  "function userIncomes(uint256 id) external view returns (uint256 directIncome, uint256 shareIncome, uint256 levelIncome, uint256 boardRewards, uint256 lifetimeShareIncomeEarned)",
  "function ownerSubIds(uint256 mainUserId) external view returns (uint256[])",
  "function getBoardUnitPositions(uint256 boardId) external view returns (uint256[7])",
  "function registerMainUser(uint256 sponsorId, uint256 manualPlacementId) external",
  "function createSubId(uint256 sponsorId, uint256 manualPlacementId) external",
  "function createBatchSubIds(uint256 count) external",
  "function claimShareIncome(uint256 userId) external",
  "function sharePoolBalance() external view returns (uint256)",
  "function reserveForBoardRewards() external view returns (uint256)",
  "function reserveForLevelIncome() external view returns (uint256)",
  "function getBoardCap(uint8 boardLevel) external pure returns (uint256)",
  "function getShareMultiplier(uint8 boardLevel) external pure returns (uint256)"
] as const;
