export const BSC_TESTNET_CHAIN_ID = 97;

export const CONTRACT_ADDRESSES = {
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x5412e810258E7bFdB9CA77cb7854FFAc6AC9eF99",
  GROW50X_CORE: process.env.NEXT_PUBLIC_CORE_ADDRESS || "0xB899d207532bB2be34E2B385DBbAD37F71894Fd9",
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
  "function boardIdCounter() external view returns (uint256)",
  "function boardLevelCounter(uint8 level) external view returns (uint256)",
  "function totalActiveProtocolShares() external view returns (uint256)",
  "function getTotalActiveShares() external view returns (uint256)",
  "function getActiveBoardUnitsByLevel(uint8 level) external view returns (uint256[])",
  "function getHoldListByLevel(uint8 level) external view returns (uint256[])",
  "function isHoldingForQualification(uint256 userId) external view returns (bool)",
  "function holdingTargetLevel(uint256 userId) external view returns (uint8)",
  "function walletToMainUserId(address wallet) external view returns (uint256)",
  "function userActiveBoardUnit(uint256 userId) external view returns (uint256)",
  "function users(uint256 id) external view returns (uint256 id, address wallet, uint256 ownerMainUserId, uint256 sponsorId, uint256 placementParentId, uint8 currentBoard, uint256 directCount, bool active, uint256 createdAt, bool isSubId)",
  "function userIncomes(uint256 id) external view returns (uint256 directIncome, uint256 shareIncome, uint256 levelIncome, uint256 boardRewards, uint256 lifetimeShareIncomeEarned)",
  "function userUnclaimedDirectIncome(uint256 id) external view returns (uint256)",
  "function userUnclaimedLevelIncome(uint256 id) external view returns (uint256)",
  "function userUnclaimedBoardRewards(uint256 id) external view returns (uint256)",
  "function ownerSubIds(uint256 mainUserId, uint256 index) external view returns (uint256)",
  "function getOwnerSubIds(uint256 mainUserId) external view returns (uint256[])",
  "function getBoardUnitPositions(uint256 boardId) external view returns (uint256[7])",
  "function registerMainUser(uint256 sponsorId, uint256 manualPlacementId) external",
  "function createSubId(uint256 sponsorId, uint256 manualPlacementId) external",
  "function createBatchSubIds(uint256 count) external",
  "function withdrawAdminFees() external",
  "function claimDirectIncome() external",
  "function claimLevelIncome() external",
  "function claimBoardRewards() external",
  "function claimAllShareIncome() external",
  "function claimAllUserIncome() external",
  "function finalizeSharePeriod() external",
  "function sharePoolBalance() external view returns (uint256)",
  "function reserveForBoardRewards() external view returns (uint256)",
  "function reserveForLevelIncome() external view returns (uint256)",
  "function adminWallet1() external view returns (address)",
  "function adminWallet2() external view returns (address)",
  "function adminWallet3() external view returns (address)",
  "function admin1UnclaimedFees() external view returns (uint256)",
  "function admin2UnclaimedFees() external view returns (uint256)",
  "function admin3UnclaimedFees() external view returns (uint256)",
  "function getAdminTelemetry(uint8 adminIndex) external view returns (address adminWallet, uint256 unclaimedFees, uint256 totalEarned, uint256 totalWithdrawn)",
  "function getUserUnclaimedSummary(uint256 mainUserId) external view returns (uint256 unclaimedDirect, uint256 unclaimedLevel, uint256 unclaimedBoardRewards, uint256 unclaimedShareIncome, uint256 totalUnclaimed)",
  "function getBoardCap(uint8 boardLevel) external pure returns (uint256)",
  "function getShareMultiplier(uint8 boardLevel) external pure returns (uint256)",
  "function currentPeriodStart() external view returns (uint256)",
  "function currentPeriodId() external view returns (uint256)",
  "function nextPeriodTargetTimestamp() external view returns (uint256)",
  "event UserRegistered(uint256 indexed id, address indexed wallet, uint256 ownerMainUserId, uint256 indexed sponsorId, uint256 placementParentId, bool isSubId, uint256 timestamp)",
  "event BoardPositionFilled(uint256 indexed boardId, uint8 boardLevel, uint256 indexed id, uint8 positionIndex)",
  "event BoardCompleted(uint256 indexed boardId, uint8 boardLevel, uint256 indexed topId)",
  "event AdminFeeAccrued(uint8 indexed adminIndex, address indexed adminWallet, uint256 amount, uint256 indexed fromUserId, uint256 timestamp)",
  "event AdminFeesWithdrawn(uint8 indexed adminIndex, address indexed adminWallet, uint256 amount, uint256 timestamp)",
  "event AllUserIncomeClaimed(uint256 indexed mainUserId, address indexed wallet, uint256 directAmount, uint256 shareAmount, uint256 levelAmount, uint256 boardRewardAmount, uint256 totalClaimed, uint256 timestamp)"
] as const;

export const ADMIN_WALLETS = [
  "0x7d27949028d8c8532728c69ff2153ee6bb3bf82e",
  "0x7a3fc2c5610f0962dd5927a4f7397ae060b79d68",
  "0x2b255ed42530cb531cbdab4c4df23eb408fb748b"
];

export function getAdminIndex(address: string | null | undefined): number {
  if (!address) return 0;
  const lower = address.toLowerCase();
  if (lower === ADMIN_WALLETS[0]) return 1;
  if (lower === ADMIN_WALLETS[1]) return 2;
  if (lower === ADMIN_WALLETS[2]) return 3;
  return 0;
}

export function isAdminWallet(address: string | null | undefined): boolean {
  return getAdminIndex(address) > 0;
}

