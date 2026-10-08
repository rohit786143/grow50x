export const BSC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 56;
export const BSC_TESTNET_CHAIN_ID = 97;
export const BSC_MAINNET_CHAIN_ID = 56;

export const CONTRACT_ADDRESSES = {
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955",
  GROW50X_CORE: process.env.NEXT_PUBLIC_CORE_ADDRESS || "0x56F8a8c96390ee210F20C5B01B25e8E521EB9Fc0",
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
  "function mainAdminWallet() external view returns (address)",
  "function rewardVaultWallet() external view returns (address)",
  "function serverMaintenanceWallet() external view returns (address)",
  "function mainAdminUnclaimedFees() external view returns (uint256)",
  "function rewardVaultUnclaimedFees() external view returns (uint256)",
  "function serverMaintenanceUnclaimedFees() external view returns (uint256)",
  "function getAdminTelemetry(uint8 adminIndex) external view returns (address adminWallet, uint256 unclaimedFees, uint256 totalEarned, uint256 totalWithdrawn)",
  "function getUserUnclaimedSummary(uint256 mainUserId) external view returns (uint256 unclaimedDirect, uint256 unclaimedLevel, uint256 unclaimedBoardRewards, uint256 unclaimedShareIncome, uint256 totalUnclaimed)",
  "function getUserClaimHistory(uint256 mainUserId) external view returns (tuple(uint256 claimId, uint256 mainUserId, address wallet, uint256 totalAmount, uint256 directAmount, uint256 shareAmount, uint256 levelAmount, uint256 boardRewardAmount, uint256 timestamp)[])",
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
  (process.env.NEXT_PUBLIC_ADMIN_WALLET_1 || "0x1c3Fe2bD2a2F0D2Ce35E45762B2Ae60A2c83D9c2").toLowerCase(),
  (process.env.NEXT_PUBLIC_ADMIN_WALLET_2 || "0xAF39c1D4759071FcB63a710A54cAEC87aB0EEe99").toLowerCase(),
  (process.env.NEXT_PUBLIC_ADMIN_WALLET_3 || "0x173d429E5690dD6CD40d526Cb7D4138D3B930c61").toLowerCase()
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

export async function ensureBscTestnetChain(ethereumProvider?: any): Promise<boolean> {
  return ensureBscChain(ethereumProvider);
}

export async function ensureBscChain(ethereumProvider?: any): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const ethereum = ethereumProvider || (window as any).trustwallet || (window as any).ethereum;
  if (!ethereum) return false;

  const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 56;
  const isMainnet = targetChainId === 56;
  const targetHexChainId = isMainnet ? '0x38' : '0x61';

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetHexChainId }],
    });
    return true;
  } catch (switchError: any) {
    try {
      if (isMainnet) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x38',
              chainName: 'BNB Smart Chain Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: [
                process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/',
                'https://bsc-dataseed1.binance.org/',
                'https://bsc-mainnet.publicnode.com'
              ],
              blockExplorerUrls: ['https://bscscan.com/'],
            },
          ],
        });
      } else {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x61',
              chainName: 'BNB Smart Chain Testnet',
              nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
              rpcUrls: [
                process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com',
                'https://data-seed-prebsc-1-s1.binance.org:8545/'
              ],
              blockExplorerUrls: ['https://testnet.bscscan.com/'],
            },
          ],
        });
      }
      return true;
    } catch (addError) {
      console.warn('Network switch/add notice:', addError);
    }
  }

  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId) === targetChainId;
  } catch (e) {
    return false;
  }
}



