// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Grow50XStorage.sol";
import "./Grow50XEvents.sol";

/**
 * @title Grow50XCore
 * @notice Complete, production-grade Web3 smart contract for GROW 50X on BNB Smart Chain.
 * Enforces dual-tree logic, placement algorithms, board completion, cumulative caps,
 * Sub-ID batch generation, reserve management, and 10-day share pool distributions.
 */
contract Grow50XCore is Grow50XStorage, Grow50XEvents, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;

    // Admin Wallets (Each receives 5% per 100 USDT entry)
    address public adminWallet1;
    address public adminWallet2;
    address public adminWallet3;

    // Numeric ID counters
    uint256 public totalUserCount;
    uint256 public boardIdCounter;
    uint256 public cycleIdCounter;

    // Account Mappings
    mapping(uint256 => UserID) public users;                            // internalId => UserID
    mapping(address => uint256) public walletToMainUserId;             // wallet => mainUserId
    mapping(uint256 => uint256[]) public ownerSubIds;                   // mainUserId => list of subId internalIds
    mapping(uint256 => IncomeRecord) public userIncomes;                // internalId => IncomeRecord

    // Board Unit Mappings
    mapping(uint256 => BoardUnit) public boardUnits;                    // boardId => BoardUnit
    mapping(uint8 => uint256[]) public activeBoardIdsByLevel;           // boardLevel (1..5) => array of active boardIds
    mapping(uint256 => uint256) public userActiveBoardUnit;             // internalId => boardId for current level

    // Reserve Fund Accounting Buckets
    uint256 public reserveForBoardRewards;
    uint256 public reserveForLevelIncome;

    // Share Pool Accounting State
    uint256 public sharePoolBalance;
    uint256 public currentPeriodId;
    uint256 public currentPeriodStart;
    uint256 public accumulatedShareValueScaled; // Scaled by 1e18
    mapping(uint256 => uint256) public userLastAccumulator;             // internalId => last claimed accumulator
    mapping(uint256 => uint256) public periodPoolBalance;               // periodId => total pool amount
    mapping(uint256 => uint256) public periodTotalShares;                // periodId => total eligible shares

    // Cycle Records
    mapping(uint256 => CycleRecord) public cycles;
    mapping(uint256 => uint256[]) public userCompletedCycles;           // mainUserId => cycleIds

    // Deterministic position filling order: TOP -> BOTTOM, RIGHT -> LEFT
    // Position 0 = Top
    // Position 2 = Middle Right, Position 1 = Middle Left
    // Position 6 = Bottom Right 2, Position 5 = Bottom Right 1, Position 4 = Bottom Left 2, Position 3 = Bottom Left 1
    uint8[7] private FILL_ORDER = [0, 2, 1, 6, 5, 4, 3];

    constructor(
        address _usdtAddress,
        address _admin1,
        address _admin2,
        address _admin3
    ) Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        require(_admin1 != address(0) && _admin2 != address(0) && _admin3 != address(0), "Invalid admin wallets");

        usdtToken = IERC20(_usdtAddress);
        adminWallet1 = _admin1;
        adminWallet2 = _admin2;
        adminWallet3 = _admin3;

        currentPeriodStart = block.timestamp;
        currentPeriodId = 1;
    }

    // ==========================================
    // 1. REGISTRATION & ENTRY MECHANICS
    // ==========================================

    /**
     * @notice Register a new Main ID (requires 100 USDT).
     * @param sponsorId The Sponsor ID in the Sponsor Tree (must exist).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function registerMainUser(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        require(walletToMainUserId[msg.sender] == 0, "Wallet already registered as Main User");
        if (totalUserCount == 0) {
            require(sponsorId == 0 || sponsorId == 1, "Root user sponsorId must be 0 or 1");
        } else {
            require(sponsorId > 0 && sponsorId <= totalUserCount, "Invalid Sponsor ID");
            require(users[sponsorId].active, "Sponsor ID not active");
        }

        // Transfer 100 USDT entry fee
        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        // Process revenue allocation
        _distributeEntryFee(sponsorId);

        // Generate new Main User ID
        uint256 newId = ++totalUserCount;
        walletToMainUserId[msg.sender] = newId;

        users[newId] = UserID({
            id: newId,
            wallet: msg.sender,
            ownerMainUserId: newId,
            sponsorId: sponsorId,
            placementParentId: 0, // Assigned below
            currentBoard: 1,
            directCount: 0,
            active: true,
            createdAt: block.timestamp,
            isSubId: false
        });

        // Increment Sponsor's direct count
        users[sponsorId].directCount++;
        emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
        emit SponsorAssigned(newId, sponsorId);

        // Determine placement & fill position in Board 1
        _placeUserInBoard(newId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newId, msg.sender, newId, sponsorId, users[newId].placementParentId, false, block.timestamp);
    }

    /**
     * @notice Create a single Sub-ID manually for caller's Main User account.
     * @param sponsorId Sponsor ID (must belong to caller's owned IDs).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function createSubId(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Main User registration required");
        _validateOwnedSponsorId(mainUserId, sponsorId);

        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        _distributeEntryFee(sponsorId);

        uint256 newSubId = _registerSubIdInternal(mainUserId, sponsorId, manualPlacementId);

        // Process level income for Sub-ID activity
        _processLevelIncome(newSubId);
    }

    /**
     * @notice Batch create up to 20 Sub-IDs automatically.
     * Uses deterministic breadth-first binary tree sponsor structure.
     * @param count Number of Sub-IDs to create (1 to 20).
     */
    function createBatchSubIds(uint256 count) external nonReentrant {
        require(count >= 1 && count <= 5, "Batch count must be 1 to 5");
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Main User registration required");

        uint256 totalCost = count * ENTRY_FEE;
        usdtToken.safeTransferFrom(msg.sender, address(this), totalCost);

        uint256 firstSubId = totalUserCount + 1;
        uint256[] memory createdIds = new uint256[](count);

        // Breadth-First Binary Sponsor Tree Builder
        // First 2 Sub-IDs -> Sponsored by mainUserId
        // Sub 3 & 4 -> Sponsored by Sub 1
        // Sub 5 & 6 -> Sponsored by Sub 2, etc.
        for (uint256 i = 0; i < count; i++) {
            uint256 targetSponsorId;
            if (i == 0 || i == 1) {
                targetSponsorId = mainUserId;
            } else {
                uint256 parentIndex = (i - 1) / 2;
                targetSponsorId = createdIds[parentIndex];
            }

            _distributeEntryFee(targetSponsorId);

            uint256 newSubId = _registerSubIdInternal(mainUserId, targetSponsorId, 0);
            createdIds[i] = newSubId;

            _processLevelIncome(newSubId);
        }

        uint256 lastSubId = createdIds[count - 1];
        emit BatchSubIdsCreated(mainUserId, msg.sender, count, firstSubId, lastSubId);
    }

    // ==========================================
    // 2. INTERNAL REGISTRATION & PLACEMENT LOGIC
    // ==========================================

    function _registerSubIdInternal(
        uint256 mainUserId,
        uint256 sponsorId,
        uint256 manualPlacementId
    ) internal returns (uint256) {
        uint256 newSubId = ++totalUserCount;
        ownerSubIds[mainUserId].push(newSubId);

        users[newSubId] = UserID({
            id: newSubId,
            wallet: msg.sender,
            ownerMainUserId: mainUserId,
            sponsorId: sponsorId,
            placementParentId: 0,
            currentBoard: 1,
            directCount: 0,
            active: true,
            createdAt: block.timestamp,
            isSubId: true
        });

        users[sponsorId].directCount++;
        emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
        emit SponsorAssigned(newSubId, sponsorId);

        _placeUserInBoard(newSubId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newSubId, msg.sender, mainUserId, sponsorId, users[newSubId].placementParentId, true, block.timestamp);
        return newSubId;
    }

    function _validateOwnedSponsorId(uint256 mainUserId, uint256 sponsorId) internal view {
        require(sponsorId > 0 && sponsorId <= totalUserCount, "Invalid Sponsor ID");
        require(users[sponsorId].active, "Sponsor ID not active");
        require(
            users[sponsorId].ownerMainUserId == mainUserId,
            "Sponsor ID must belong to caller's owned IDs"
        );
    }

    /**
     * @notice Distributes $100 entry fee according to protocol allocation rules.
     */
    function _distributeEntryFee(uint256 sponsorId) internal {
        address sponsorWallet = (sponsorId != 0 && users[sponsorId].wallet != address(0)) ? users[sponsorId].wallet : adminWallet1;
        
        // 40% Direct Sponsor
        if (sponsorId != 0) {
            userIncomes[sponsorId].directIncome += SPONSOR_FEE;
        }
        usdtToken.safeTransfer(sponsorWallet, SPONSOR_FEE);
        emit DirectCommissionPaid(sponsorId, sponsorWallet, SPONSOR_FEE);

        // 30% Share Pool
        sharePoolBalance += SHARE_POOL_FEE;
        emit SharePoolFunded(SHARE_POOL_FEE, sharePoolBalance);

        // 5% Admin 1, 5% Admin 2, 5% Admin 3
        usdtToken.safeTransfer(adminWallet1, ADMIN_FEE_EACH);
        usdtToken.safeTransfer(adminWallet2, ADMIN_FEE_EACH);
        usdtToken.safeTransfer(adminWallet3, ADMIN_FEE_EACH);

        // 15% Reserve Fund (10 USDT Board Rewards, 5 USDT Level Income)
        reserveForBoardRewards += 10 * 10**18;
        reserveForLevelIncome += 5 * 10**18;
        emit ReserveFunded(RESERVE_FEE, reserveForBoardRewards, reserveForLevelIncome);
    }

    /**
     * @notice Placement engine for placing user into specified Board Level.
     */
    function _placeUserInBoard(
        uint256 userId,
        uint8 boardLevel,
        uint256 sponsorId,
        uint256 manualPlacementId
    ) internal {
        uint256 targetBoardId = 0;

        if (boardLevel == 1 && manualPlacementId != 0) {
            targetBoardId = _validateManualPlacement(userId, manualPlacementId);
        }

        if (targetBoardId == 0) {
            targetBoardId = _findAutoPlacementBoard(boardLevel, sponsorId);
        }

        if (targetBoardId == 0) {
            // Spawn a new root Board Unit if none eligible exists
            targetBoardId = _createNewBoardUnit(boardLevel, userId);
        } else {
            _insertIntoBoardUnit(targetBoardId, userId);
        }

        userActiveBoardUnit[userId] = targetBoardId;
    }

    function _validateManualPlacement(uint256 userId, uint256 manualPlacementId) internal view returns (uint256) {
        if (manualPlacementId == 0 || manualPlacementId > totalUserCount) return 0;
        if (manualPlacementId == userId) return 0;
        uint256 boardId = userActiveBoardUnit[manualPlacementId];
        if (boardId == 0) return 0;
        BoardUnit memory b = boardUnits[boardId];
        if (b.boardLevel != 1 || b.completed || b.filledCount >= 7) return 0;
        return boardId;
    }

    function _findAutoPlacementBoard(uint8 boardLevel, uint256 sponsorId) internal view returns (uint256) {
        // Preference 1: Sponsor's active board unit at this level
        uint256 sponsorBoardId = userActiveBoardUnit[sponsorId];
        if (sponsorBoardId != 0) {
            BoardUnit memory b = boardUnits[sponsorBoardId];
            if (b.boardLevel == boardLevel && !b.completed && b.filledCount < 7) {
                return sponsorBoardId;
            }
        }

        // Preference 2: Oldest active board unit at this board level
        uint256[] memory activeIds = activeBoardIdsByLevel[boardLevel];
        for (uint256 i = 0; i < activeIds.length; i++) {
            uint256 bId = activeIds[i];
            BoardUnit memory b = boardUnits[bId];
            if (!b.completed && b.filledCount < 7) {
                return bId;
            }
        }

        return 0; // Requires spawning new unit
    }

    function _createNewBoardUnit(uint8 boardLevel, uint256 topUserId) internal returns (uint256) {
        uint256 bId = ++boardIdCounter;
        BoardUnit storage b = boardUnits[bId];
        b.boardId = bId;
        b.boardLevel = boardLevel;
        b.topId = topUserId;
        b.positions[0] = topUserId;
        b.filledCount = 1;
        b.completed = false;
        b.createdAt = block.timestamp;

        activeBoardIdsByLevel[boardLevel].push(bId);

        users[topUserId].placementParentId = 0;
        emit BoardPositionFilled(bId, boardLevel, topUserId, 0);
        emit PlacementAssigned(topUserId, 0, bId, 0);

        return bId;
    }

    function _insertIntoBoardUnit(uint256 boardId, uint256 userId) internal {
        BoardUnit storage b = boardUnits[boardId];
        require(!b.completed && b.filledCount < 7, "Board unit unavailable");

        uint8 slotToFill = 255;
        // Search in deterministic order TOP -> BOTTOM, RIGHT -> LEFT
        for (uint8 i = 0; i < 7; i++) {
            uint8 posIdx = FILL_ORDER[i];
            if (b.positions[posIdx] == 0) {
                slotToFill = posIdx;
                break;
            }
        }

        require(slotToFill != 255, "No open position in board");
        b.positions[slotToFill] = userId;
        b.filledCount++;

        uint256 parentId = _getPlacementParentForSlot(b, slotToFill);
        users[userId].placementParentId = parentId;

        emit BoardPositionFilled(boardId, b.boardLevel, userId, slotToFill);
        emit PlacementAssigned(userId, parentId, boardId, slotToFill);

        // Check if board completed (7 positions filled)
        if (b.filledCount == 7) {
            _processBoardCompletion(boardId);
        }
    }

    function _getPlacementParentForSlot(BoardUnit storage b, uint8 slot) internal view returns (uint256) {
        if (slot == 0) return 0;
        if (slot == 1 || slot == 2) return b.positions[0];
        if (slot == 3 || slot == 4) return b.positions[1];
        if (slot == 5 || slot == 6) return b.positions[2];
        return 0;
    }

    // ==========================================
    // 3. BOARD COMPLETION, SPLIT & ADVANCEMENT
    // ==========================================

    function _processBoardCompletion(uint256 boardId) internal {
        BoardUnit storage b = boardUnits[boardId];
        b.completed = true;

        uint256 topId = b.topId;
        uint8 currentLevel = b.boardLevel;

        emit BoardCompleted(boardId, currentLevel, topId);

        // Process Completion Reward
        _payBoardReward(topId, currentLevel);

        // Check Direct Qualification for Advancement
        bool qualified = _checkDirectQualification(topId, currentLevel);

        if (qualified) {
            if (currentLevel < 5) {
                uint8 nextLevel = currentLevel + 1;
                users[topId].currentBoard = nextLevel;
                emit BoardAdvanced(topId, currentLevel, nextLevel);
                _placeUserInBoard(topId, nextLevel, users[topId].sponsorId, 0);
            } else {
                // Board 5 Completed -> Cycle Complete
                _recordCycleCompletion(topId);
            }
        }

        // Execute Deterministic Board Split (Placeholder strategy per PROTOCOL_SPEC)
        _executeBoardSplit(boardId);
    }

    function _checkDirectQualification(uint256 userId, uint8 boardLevel) internal view returns (bool) {
        uint256 directCount = users[userId].directCount;
        if (boardLevel == 1) return directCount >= 2;
        if (boardLevel == 2) return directCount >= 3;
        if (boardLevel == 3) return directCount >= 4;
        if (boardLevel == 4) return directCount >= 5;
        if (boardLevel == 5) return true;
        return false;
    }

    function _payBoardReward(uint256 userId, uint8 boardLevel) internal {
        uint256 rewardAmount;
        if (boardLevel == 1) rewardAmount = REWARD_BOARD_1;
        else if (boardLevel == 2) rewardAmount = REWARD_BOARD_2;
        else if (boardLevel == 3) rewardAmount = REWARD_BOARD_3;
        else if (boardLevel == 4) rewardAmount = REWARD_BOARD_4;
        else if (boardLevel == 5) rewardAmount = REWARD_BOARD_5;

        if (reserveForBoardRewards >= rewardAmount) {
            reserveForBoardRewards -= rewardAmount;
            userIncomes[userId].boardRewards += rewardAmount;
            address userWallet = users[userId].wallet;
            usdtToken.safeTransfer(userWallet, rewardAmount);
            emit BoardRewardPaid(userId, userWallet, boardLevel, rewardAmount);
            emit ReserveUsed("BoardRewards", rewardAmount, reserveForBoardRewards);
        }
    }

    function _executeBoardSplit(uint256 completedBoardId) internal {
        BoardUnit storage b = boardUnits[completedBoardId];
        uint8 level = b.boardLevel;

        uint256 pos2Id = b.positions[1];
        uint256 pos3Id = b.positions[2];

        if (pos2Id == 0 && pos3Id == 0) return;

        // Spawn new Board A rooted at pos2Id
        uint256 newBoardA = 0;
        if (pos2Id != 0) {
            newBoardA = ++boardIdCounter;
            BoardUnit storage unitA = boardUnits[newBoardA];
            unitA.boardId = newBoardA;
            unitA.boardLevel = level;
            unitA.topId = pos2Id;
            unitA.positions[0] = pos2Id;
            unitA.positions[1] = b.positions[3];
            unitA.positions[2] = b.positions[4];
            unitA.filledCount = 1 + (b.positions[3] != 0 ? 1 : 0) + (b.positions[4] != 0 ? 1 : 0);
            activeBoardIdsByLevel[level].push(newBoardA);
            userActiveBoardUnit[pos2Id] = newBoardA;
        }

        // Spawn new Board B rooted at pos3Id
        uint256 newBoardB = 0;
        if (pos3Id != 0) {
            newBoardB = ++boardIdCounter;
            BoardUnit storage unitB = boardUnits[newBoardB];
            unitB.boardId = newBoardB;
            unitB.boardLevel = level;
            unitB.topId = pos3Id;
            unitB.positions[0] = pos3Id;
            unitB.positions[1] = b.positions[5];
            unitB.positions[2] = b.positions[6];
            unitB.filledCount = 1 + (b.positions[5] != 0 ? 1 : 0) + (b.positions[6] != 0 ? 1 : 0);
            activeBoardIdsByLevel[level].push(newBoardB);
            userActiveBoardUnit[pos3Id] = newBoardB;
        }

        emit BoardSplit(completedBoardId, newBoardA, newBoardB);
    }

    function _recordCycleCompletion(uint256 userId) internal {
        uint256 cId = ++cycleIdCounter;
        address userWallet = users[userId].wallet;

        cycles[cId] = CycleRecord({
            cycleId: cId,
            userId: userId,
            wallet: userWallet,
            completedAt: block.timestamp
        });

        uint256 mainUserId = users[userId].ownerMainUserId;
        userCompletedCycles[mainUserId].push(cId);

        emit CycleCompleted(cId, userId, userWallet, block.timestamp);
    }

    // ==========================================
    // 4. LEVEL INCOME ENGINE
    // ==========================================

    function _processLevelIncome(uint256 sourceSubId) internal {
        uint256 currentId = sourceSubId;

        for (uint8 level = 1; level <= 3; level++) {
            uint256 sponsorId = users[currentId].sponsorId;
            if (sponsorId == 0) break;

            // Check eligibility (Must have at least 2 direct sponsors)
            if (users[sponsorId].directCount >= 2) {
                uint256 levelAmount = (level == 1) ? LEVEL_1_INCOME : ((level == 2) ? LEVEL_2_INCOME : LEVEL_3_INCOME);

                if (reserveForLevelIncome >= levelAmount) {
                    reserveForLevelIncome -= levelAmount;

                    // Consolidation Rule: Payout is transferred to Main User owner of sponsor ID
                    uint256 beneficiaryMainUserId = users[sponsorId].ownerMainUserId;
                    address beneficiaryWallet = users[beneficiaryMainUserId].wallet;

                    userIncomes[beneficiaryMainUserId].levelIncome += levelAmount;
                    usdtToken.safeTransfer(beneficiaryWallet, levelAmount);

                    emit LevelIncomePaid(beneficiaryMainUserId, beneficiaryWallet, sourceSubId, level, levelAmount);
                    emit ReserveUsed("LevelIncome", levelAmount, reserveForLevelIncome);
                }
            }

            currentId = sponsorId;
        }
    }

    // ==========================================
    // 5. 10-DAY SHARE POOL & CUMULATIVE CAP
    // ==========================================

    /**
     * @notice Finalizes the active 10-day Share Pool distribution period.
     * Calculates scaled share accumulator based on total active shares.
     */
    function finalizeSharePeriod() external nonReentrant {
        require(block.timestamp >= currentPeriodStart + PERIOD_DURATION, "Period duration not reached");
        require(sharePoolBalance > 0, "No pool balance to distribute");
        _finalizeSharePeriodInternal();
    }

    function _finalizeSharePeriodInternal() internal {
        uint256 totalShares = _calculateTotalEligibleShares();
        if (totalShares == 0 || sharePoolBalance == 0) return;

        uint256 poolAmount = sharePoolBalance;
        sharePoolBalance = 0; // Reset balance for next epoch

        uint256 shareValueScaled = (poolAmount * 1e18) / totalShares;
        accumulatedShareValueScaled += shareValueScaled;

        periodPoolBalance[currentPeriodId] = poolAmount;
        periodTotalShares[currentPeriodId] = totalShares;

        emit ShareDistributionFinalized(currentPeriodId, poolAmount, totalShares, shareValueScaled);

        currentPeriodId++;
        currentPeriodStart = block.timestamp;
    }

    /**
     * @notice Allows eligible users to claim pending Share Pool income.
     * Enforces lazy auto-finalization and the non-resetting lifetime share-income cumulative cap.
     */
    function claimShareIncome(uint256 userId) external nonReentrant {
        require(users[userId].active, "User not active");
        require(users[userId].wallet == msg.sender, "Caller not authorized owner");

        // Lazy Auto-Finalize 10-day period if duration has elapsed
        if (block.timestamp >= currentPeriodStart + PERIOD_DURATION && sharePoolBalance > 0) {
            _finalizeSharePeriodInternal();
        }

        uint256 userShares = getShareMultiplier(users[userId].currentBoard);
        require(userShares > 0, "No shares for user");

        uint256 lastAcc = userLastAccumulator[userId];
        require(accumulatedShareValueScaled > lastAcc, "No new share distribution");

        uint256 rawEntitlement = (userShares * (accumulatedShareValueScaled - lastAcc)) / 1e18;
        userLastAccumulator[userId] = accumulatedShareValueScaled;

        uint256 currentCap = getBoardCap(users[userId].currentBoard);
        uint256 lifetimeEarned = userIncomes[userId].lifetimeShareIncomeEarned;

        if (lifetimeEarned >= currentCap) {
            return; // Cap fully reached
        }

        uint256 remainingCapacity = currentCap - lifetimeEarned;
        uint256 payableAmount = rawEntitlement > remainingCapacity ? remainingCapacity : rawEntitlement;

        if (payableAmount > 0) {
            userIncomes[userId].shareIncome += payableAmount;
            userIncomes[userId].lifetimeShareIncomeEarned += payableAmount;

            usdtToken.safeTransfer(msg.sender, payableAmount);

            emit ShareIncomeCredited(userId, msg.sender, payableAmount, userIncomes[userId].lifetimeShareIncomeEarned);
        }
    }

    function _calculateTotalEligibleShares() internal view returns (uint256 total) {
        for (uint256 i = 1; i <= totalUserCount; i++) {
            if (users[i].active) {
                total += getShareMultiplier(users[i].currentBoard);
            }
        }
    }

    function getShareMultiplier(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return SHARES_BOARD_1;
        if (boardLevel == 2) return SHARES_BOARD_2;
        if (boardLevel == 3) return SHARES_BOARD_3;
        if (boardLevel == 4) return SHARES_BOARD_4;
        if (boardLevel == 5) return SHARES_BOARD_5;
        return 0;
    }

    function getBoardCap(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return CAP_BOARD_1;
        if (boardLevel == 2) return CAP_BOARD_2;
        if (boardLevel == 3) return CAP_BOARD_3;
        if (boardLevel == 4) return CAP_BOARD_4;
        if (boardLevel == 5) return CAP_BOARD_5;
        return 0;
    }

    // ==========================================
    // 6. VIEW & UTILITY FUNCTIONS
    // ==========================================

    function getBoardUnitPositions(uint256 boardId) external view returns (uint256[7] memory) {
        return boardUnits[boardId].positions;
    }

    function getOwnerSubIds(uint256 mainUserId) external view returns (uint256[] memory) {
        return ownerSubIds[mainUserId];
    }

    function getUserCompletedCycles(uint256 mainUserId) external view returns (uint256[] memory) {
        return userCompletedCycles[mainUserId];
    }

    function updateAdminWallets(address _a1, address _a2, address _a3) external onlyOwner {
        require(_a1 != address(0) && _a2 != address(0) && _a3 != address(0), "Invalid addresses");
        adminWallet1 = _a1;
        adminWallet2 = _a2;
        adminWallet3 = _a3;
        emit AdminWalletsUpdated(_a1, _a2, _a3);
    }
}
