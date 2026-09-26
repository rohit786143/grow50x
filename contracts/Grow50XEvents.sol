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
    
    event DirectCommissionPaid(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount);
    event SharePoolFunded(uint256 amount, uint256 newTotalPoolBalance);
    event ShareDistributionFinalized(uint256 indexed periodId, uint256 poolAmount, uint256 totalShares, uint256 shareValueScaled);
    event ShareIncomeCredited(uint256 indexed id, address indexed wallet, uint256 amount, uint256 newLifetimeShareIncome);
    event BoardRewardPaid(uint256 indexed id, address indexed wallet, uint8 boardLevel, uint256 amount);
    event LevelIncomePaid(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 sourceId, uint8 level, uint256 amount);
    
    event CycleCompleted(uint256 indexed cycleId, uint256 indexed userId, address indexed wallet, uint256 timestamp);
    event ReserveFunded(uint256 totalFunded, uint256 boardRewardsBucket, uint256 levelIncomeBucket);
    event ReserveUsed(string category, uint256 amount, uint256 remainingBucketBalance);
    
    event BatchSubIdsCreated(uint256 indexed ownerMainUserId, address indexed wallet, uint256 count, uint256 firstSubId, uint256 lastSubId);
    event AdminWalletsUpdated(address admin1, address admin2, address admin3);
}
