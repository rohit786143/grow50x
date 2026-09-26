# SYSTEM ARCHITECTURE & DATA LAYOUT

## 1. Modular Smart Contract Architecture
GROW 50X separates core protocol responsibilities into decoupled modules:
- `Grow50XStorage.sol`: Defines struct layouts, storage variables, and protocol constants.
- `Grow50XEvents.sol`: Defines event logs for external indexing and auditability.
- `Grow50XCore.sol`: Main logic contract inheriting OpenZeppelin security modules (`ReentrancyGuard`, `Ownable`, `SafeERC20`).

## 2. On-Chain Data Structures
```solidity
struct UserID {
    uint256 id;                 // Deterministic internal 1-indexed ID
    address wallet;             // Owner wallet
    uint256 ownerMainUserId;    // Main User ID bound to this entity
    uint256 sponsorId;          // Sponsor ID in Sponsor Tree
    uint256 placementParentId;  // Parent ID in Placement Tree
    uint8 currentBoard;         // Board level 1..5
    uint256 directCount;        // Direct referral count
    bool active;
    uint256 createdAt;
    bool isSubId;
}

struct BoardUnit {
    uint256 boardId;            // Unique Board Unit ID
    uint8 boardLevel;           // Board level (1..5)
    uint256 topId;              // Position 1 (Root)
    uint256[7] positions;       // Array of 7 position IDs
    uint8 filledCount;          // Positions filled (0..7)
    bool completed;             // Completion flag
    uint256 createdAt;
}
```

## 3. Indexer & Backend Decoupling
The backend acts exclusively as a read-only indexing and analytics layer. All state modifications originate on the BSC blockchain via wallet-signed transactions.
