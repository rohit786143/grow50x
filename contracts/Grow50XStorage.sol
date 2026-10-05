// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Grow50XStorage
 * @notice Central data types, structs, and storage layouts for GROW 50X protocol.
 */
contract Grow50XStorage {
    struct UserID {
        uint256 id;                 // Deterministic internal numeric ID (1-indexed)
        address wallet;             // Owner wallet address
        uint256 ownerMainUserId;    // Main ID owning this entity (self ID for Main IDs)
        uint256 sponsorId;          // Sponsor ID in Sponsor Tree
        uint256 placementParentId;  // Parent ID in Placement Tree
        uint8 currentBoard;         // Board level 1..5
        uint256 directCount;        // Direct referrals count on Sponsor Tree
        bool active;                // Registration status
        uint256 createdAt;          // Timestamp of creation
        bool isSubId;               // Flag indicating if this is a Sub-ID
    }

    struct BoardUnit {
        uint256 boardId;            // Unique board unit ID
        uint8 boardLevel;           // Level 1..5
        uint256 topId;              // Position 1 ID
        uint256[7] positions;       // Array of 7 position IDs [0..6] (0 = empty)
        uint8 filledCount;          // Count of filled positions (0..7)
        bool completed;             // Completion flag
        uint256 createdAt;          // Creation timestamp
    }

    struct IncomeRecord {
        uint256 directIncome;             // Direct sponsor earnings ($40 / entry)
        uint256 shareIncome;              // Earned from 10-day Share Pool
        uint256 levelIncome;              // Earned from 3%/2%/1% Sub-ID level rewards
        uint256 boardRewards;             // Board completion payouts ($40, $80, $160, $320, $640)
        uint256 lifetimeShareIncomeEarned; // Non-resetting cumulative share earnings
    }

    struct CycleRecord {
        uint256 cycleId;
        uint256 userId;
        address wallet;
        uint256 completedAt;
    }

    // Protocol Constants
    uint256 public constant ENTRY_FEE = 100 * 10**18; // 100 USDT (18 decimals)
    uint256 public constant SPONSOR_FEE = 40 * 10**18;
    uint256 public constant SHARE_POOL_FEE = 30 * 10**18;
    uint256 public constant ADMIN_FEE_EACH = 5 * 10**18;
    uint256 public constant RESERVE_FEE = 15 * 10**18;

    // Board Completion Rewards
    uint256 public constant REWARD_BOARD_1 = 40 * 10**18;
    uint256 public constant REWARD_BOARD_2 = 80 * 10**18;
    uint256 public constant REWARD_BOARD_3 = 160 * 10**18;
    uint256 public constant REWARD_BOARD_4 = 320 * 10**18;
    uint256 public constant REWARD_BOARD_5 = 640 * 10**18;

    // Cumulative Share-Income Caps
    uint256 public constant CAP_BOARD_1 = 200 * 10**18;
    uint256 public constant CAP_BOARD_2 = 400 * 10**18;
    uint256 public constant CAP_BOARD_3 = 1000 * 10**18;
    uint256 public constant CAP_BOARD_4 = 2000 * 10**18;
    uint256 public constant CAP_BOARD_5 = 5000 * 10**18;

    // Share Multipliers by Board Level
    uint256 public constant SHARES_BOARD_1 = 1;
    uint256 public constant SHARES_BOARD_2 = 2;
    uint256 public constant SHARES_BOARD_3 = 5;
    uint256 public constant SHARES_BOARD_4 = 10;
    uint256 public constant SHARES_BOARD_5 = 25;

    // Level Income Percentages (from Reserve)
    uint256 public constant LEVEL_1_INCOME = 3 * 10**18; // 3 USDT
    uint256 public constant LEVEL_2_INCOME = 2 * 10**18; // 2 USDT
    uint256 public constant LEVEL_3_INCOME = 1 * 10**18; // 1 USDT
}
