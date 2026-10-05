// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Grow50XEvents
 * @notice Central event log interface for GROW 50X protocol.
 */
contract Grow50XEvents {
    event UserRegistered(
        uint256 indexed id,
        address indexed wallet,
        uint256 ownerMainUserId,
        uint256 indexed sponsorId,
        uint256 placementParentId,
        bool isSubId,
        uint256 timestamp
    );

    event SponsorAssigned(uint256 indexed id, uint256 indexed sponsorId);
    event PlacementAssigned(uint256 indexed id, uint256 indexed placementParentId, uint256 boardId, uint8 positionIndex);
    event BoardPositionFilled(uint256 indexed boardId, uint8 boardLevel, uint256 indexed id, uint8 positionIndex);
    event BoardCompleted(uint256 indexed boardId, uint8 boardLevel, uint256 indexed topId);
    event BoardSplit(uint256 indexed completedBoardId, uint256 newBoardIdA, uint256 newBoardIdB);
    event BoardAdvanced(uint256 indexed id, uint8 fromBoard, uint8 toBoard);
    event DirectCountUpdated(uint256 indexed id, uint256 newDirectCount);
    
    event DirectCommissionAccrued(uint256 indexed sponsorId, uint256 indexed fromUserId, uint256 amount, uint256 timestamp);
    event DirectCommissionPaid(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount);
    event DirectCommissionClaimed(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount);

    event SharePoolFunded(uint256 amount, uint256 newTotalPoolBalance);
    event ShareDistributionFinalized(uint256 indexed periodId, uint256 poolAmount, uint256 totalShares, uint256 shareValueScaled);
    event ShareIncomeCredited(uint256 indexed id, address indexed wallet, uint256 amount, uint256 newLifetimeShareIncome);
    
    event BoardRewardAccrued(uint256 indexed id, uint8 boardLevel, uint256 amount, uint256 timestamp);
    event BoardRewardPaid(uint256 indexed id, address indexed wallet, uint8 boardLevel, uint256 amount);
    event BoardRewardClaimed(uint256 indexed id, address indexed wallet, uint256 amount);

    event LevelIncomeAccrued(uint256 indexed beneficiaryMainUserId, uint256 indexed sourceId, uint8 level, uint256 amount, uint256 timestamp);
    event LevelIncomePaid(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 sourceId, uint8 level, uint256 amount);
    event LevelIncomeClaimed(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 amount);
    
    event AllUserIncomeClaimed(
        uint256 indexed mainUserId,
        address indexed wallet,
        uint256 directAmount,
        uint256 shareAmount,
        uint256 levelAmount,
        uint256 boardRewardAmount,
        uint256 totalClaimed,
        uint256 timestamp
    );

    event AdminFeeAccrued(
        uint8 indexed adminIndex,
        address indexed adminWallet,
        uint256 amount,
        uint256 indexed fromUserId,
        uint256 timestamp
    );
    event AdminFeesWithdrawn(
        uint8 indexed adminIndex,
        address indexed adminWallet,
        uint256 amount,
        uint256 timestamp
    );

    event CycleCompleted(uint256 indexed cycleId, uint256 indexed userId, address indexed wallet, uint256 timestamp);
    event ReserveFunded(uint256 totalFunded, uint256 boardRewardsBucket, uint256 levelIncomeBucket);
    event ReserveUsed(string category, uint256 amount, uint256 remainingBucketBalance);
    
    event BatchSubIdsCreated(uint256 indexed ownerMainUserId, address indexed wallet, uint256 count, uint256 firstSubId, uint256 lastSubId);
    event AdminWalletsUpdated(address admin1, address admin2, address admin3);
    event UserPlacedOnHold(uint256 indexed userId, uint8 fromLevel, uint8 targetLevel, uint256 directCount);
    event UserReleasedFromHold(uint256 indexed userId, uint8 fromLevel, uint8 targetLevel);
    event RootDirectCommissionSplit(uint256 indexed fromUserId, uint256 totalAmount, uint256 amountPerAdmin);
    event InactivitySweepTriggered(address indexed caller, uint256 totalAmount, uint256 timestamp);
}
