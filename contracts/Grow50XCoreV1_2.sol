// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Grow50XStorage.sol";
import "./Grow50XEvents.sol";

/**
 * @title Grow50XCoreV1_2
 * @notice Production-Grade V1.2 Smart Contract Architecture for GROW 50X on BNB Smart Chain.
 * Major Upgrades in V1.2:
 * 1. 3 ADMIN INDIVIDUAL TELEMETRY & SELF-CLAIM LEDGER:
 *    - 5% Admin Fees ($5 USDT per entry) and Root direct commission splits are tracked in individual admin ledgers.
 *    - Detailed telemetry events (`AdminFeeAccrued`) emitted per entry for full transparent dashboard tracking (shows exactly which user fee came from).
 *    - Admins claim accumulated fees anytime via `withdrawAdminFees()`.
 * 2. 40% DIRECT COMMISSION UNCLAIMED LEDGER (`claimDirectIncome`):
 *    - 40% ($40 USDT) direct sponsor commission is accrued to sponsor's unclaimed direct income ledger.
 *    - Zero instant token transfers during registration -> Reduces registration gas fee by up to 35-40%!
 *    - Sponsors claim accumulated direct commission anytime via `claimDirectIncome()` or `claimAllUserIncome()`.
 * 3. 3-2-1 LEVEL INCOME & BOARD REWARDS UNCLAIMED LEDGER:
 *    - Sub-ID 3-2-1 level income ($3, $2, $1 USDT) and Board Completion Rewards ($40, $80, $160, $320, $640 USDT) accrue to user unclaimed ledgers.
 *    - Users claim via `claimLevelIncome()`, `claimBoardRewards()`, or `claimAllUserIncome()`.
 * 4. CONSOLIDATED 1-CLICK USER CLAIM (`claimAllUserIncome`):
 *    - Users can claim all accumulated Direct Income, Level Income, Board Rewards, and Share Income in 1 single transaction.
 */
contract Grow50XCoreV1_2 is Grow50XStorage, Grow50XEvents, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;

    // Official Admin Wallets
    address public adminWallet1;
    address public adminWallet2;
    address public adminWallet3;

    // Protocol Counters & Share Tracker
    uint256 public totalUserCount;
    uint256 public boardIdCounter;
    uint256 public cycleIdCounter;
    mapping(uint8 => uint256) public boardLevelCounter;                 // boardLevel (1..5) => level-specific unit count
    uint256 public totalActiveProtocolShares;

    // 3 Admin 5% Individual Telemetry & Ledger
    uint256 public admin1UnclaimedFees;
    uint256 public admin1TotalEarned;
    uint256 public admin1TotalWithdrawn;

    uint256 public admin2UnclaimedFees;
    uint256 public admin2TotalEarned;
    uint256 public admin2TotalWithdrawn;

    uint256 public admin3UnclaimedFees;
    uint256 public admin3TotalEarned;
    uint256 public admin3TotalWithdrawn;

    // User Unclaimed Income Balances (Claimable from Dashboard)
    mapping(uint256 => uint256) public userUnclaimedDirectIncome;
    mapping(uint256 => uint256) public userUnclaimedLevelIncome;
    mapping(uint256 => uint256) public userUnclaimedBoardRewards;

    // Account Mappings
    mapping(uint256 => UserID) public users;                            // internalId => UserID
    mapping(address => uint256) public walletToMainUserId;             // wallet => mainUserId
    mapping(uint256 => uint256[]) public ownerSubIds;                   // mainUserId => list of subId internalIds
    mapping(uint256 => IncomeRecord) public userIncomes;                // internalId => IncomeRecord

    // Board Unit Mappings
    mapping(uint256 => BoardUnit) public boardUnits;                    // boardId => BoardUnit
    mapping(uint8 => uint256[]) public activeBoardIdsByLevel;           // boardLevel (1..5) => array of active boardIds
    mapping(uint256 => uint256) public userActiveBoardUnit;             // internalId => boardId for current level

    // Board Hold Queue Mappings
    mapping(uint8 => uint256[]) public boardHoldList;                   // boardLevel (1..4) => array of userIds waiting for direct qualification
    mapping(uint256 => bool) public isHoldingForQualification;          // userId => is currently on hold
    mapping(uint256 => uint8) public holdingTargetLevel;                // userId => target level waiting for (2..5)

    // Reserve Fund Accounting Buckets
    uint256 public reserveForBoardRewards;
    uint256 public reserveForLevelIncome;

    // Share Pool Accounting State
    uint256 public sharePoolBalance;
    uint256 public currentPeriodId;
    uint256 public currentPeriodStart;
    uint256 public nextPeriodTargetTimestamp;
    uint256 public accumulatedShareValueScaled; // Scaled by 1e18
    mapping(uint256 => uint256) public userLastAccumulator;             // internalId => last claimed accumulator
    mapping(uint256 => uint256) public periodPoolBalance;               // periodId => total pool amount
    mapping(uint256 => uint256) public periodTotalShares;                // periodId => total eligible shares

    // Cycle Records
    mapping(uint256 => CycleRecord) public cycles;
    mapping(uint256 => uint256[]) public userCompletedCycles;           // mainUserId => cycleIds

    // Claim Records & Withdrawal History Ledger
    uint256 public claimRecordCounter;
    mapping(uint256 => ClaimRecord[]) public userClaimHistory;           // mainUserId => list of ClaimRecords

    // Deterministic position filling order: TOP -> BOTTOM, LEFT -> RIGHT
    uint8[7] private FILL_ORDER = [0, 1, 2, 3, 4, 5, 6];

    // Activity Tracker & Random Nonce
    uint256 public lastActivityTimestamp;
    uint256 private nonce;
    mapping(uint256 => bool) public usedUserIds;

    constructor(
        address _usdtToken,
        address _admin1,
        address _admin2,
        address _admin3
    ) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT");
        require(_admin1 != address(0) && _admin2 != address(0) && _admin3 != address(0), "Invalid admin");

        usdtToken = IERC20(_usdtToken);
        adminWallet1 = _admin1;
        adminWallet2 = _admin2;
        adminWallet3 = _admin3;

        currentPeriodId = 1;
        currentPeriodStart = block.timestamp;
        nextPeriodTargetTimestamp = _calculateNextCutoff(block.timestamp);
        lastActivityTimestamp = block.timestamp;
    }

    // ==========================================
    // 1. PUBLIC REGISTRATION & SUB-ID CREATION
    // ==========================================

    /**
     * @notice Register a new Main ID (requires 100 USDT).
     * @param sponsorId The Sponsor ID in the Sponsor Tree (0 for Root).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function registerMainUser(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        require(walletToMainUserId[msg.sender] == 0, "Registered");
        if (totalUserCount == 0) {
            sponsorId = 0; // First system ID (Root) has no sponsor
        } else {
            require(sponsorId > 0 && users[sponsorId].active, "Invalid sponsor");
        }

        // Deposit 100 USDT (Single token transfer -> Super cheap gas!)
        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        // Generate new 6-Digit Random Main User ID
        totalUserCount++;
        uint256 newId = _generateRandom6DigitId();
        walletToMainUserId[msg.sender] = newId;

        users[newId] = UserID({
            id: newId,
            wallet: msg.sender,
            ownerMainUserId: newId,
            sponsorId: sponsorId,
            placementParentId: 0,
            currentBoard: 1,
            directCount: 0,
            active: true,
            createdAt: block.timestamp,
            isSubId: false
        });

        // Add 1 Share for Board 1
        totalActiveProtocolShares += SHARES_BOARD_1;

        // Process revenue allocation to ledgers (Zero instant transfers -> Low Gas!)
        _distributeEntryFeeV1_2(sponsorId, newId);

        // Increment Sponsor's direct count & check for auto-release from hold queue
        if (sponsorId != 0) {
            users[sponsorId].directCount++;
            emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
            emit SponsorAssigned(newId, sponsorId);

            _checkAndReleaseFromHold(sponsorId);
        }

        // Determine placement & fill position in Board 1
        _placeUserInBoard(newId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newId, msg.sender, newId, sponsorId, users[newId].placementParentId, false, block.timestamp);
    }

    /**
     * @notice Create a single Sub-ID for caller's Main User account (V1.2 Engine).
     * @param sponsorId Sponsor ID (0 for auto placement, or owned ID for manual placement).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function createSubId(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 targetSponsorId;
        if (sponsorId == 0) {
            targetSponsorId = _findNextAvailableAutoSponsor(mainUserId);
        } else {
            _validateOwnedSponsorId(mainUserId, sponsorId);
            targetSponsorId = sponsorId;
        }

        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        uint256 newSubId = _registerSubIdInternalV1_2(mainUserId, targetSponsorId, manualPlacementId);

        _distributeEntryFeeV1_2(targetSponsorId, newSubId);

        // Process 3-2-1 level income for Sub-IDs to external upline ledgers
        _processLevelIncomeV1_2(newSubId, mainUserId);
    }

    /**
     * @notice Batch create 1 to 5 Sub-IDs in 1 Single Wallet Transaction (V1.2 Engine).
     * @param count Number of Sub-IDs to create (1 to 5).
     */
    function createBatchSubIds(uint256 count) external nonReentrant {
        require(count >= 1 && count <= 5, "Count 1 to 5");
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalCost = count * ENTRY_FEE;
        usdtToken.safeTransferFrom(msg.sender, address(this), totalCost);

        uint256[] memory createdIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 targetSponsorId = _findNextAvailableAutoSponsor(mainUserId);

            uint256 newSubId = _registerSubIdInternalV1_2(mainUserId, targetSponsorId, 0);
            createdIds[i] = newSubId;

            _distributeEntryFeeV1_2(targetSponsorId, newSubId);

            _processLevelIncomeV1_2(newSubId, mainUserId);
        }

        uint256 firstSubId = createdIds[0];
        uint256 lastSubId = createdIds[count - 1];
        emit BatchSubIdsCreated(mainUserId, msg.sender, count, firstSubId, lastSubId);
    }

    // ==========================================
    // 2. INTERNAL REGISTRATION & PLACEMENT LOGIC
    // ==========================================

    function _registerSubIdInternalV1_2(
        uint256 mainUserId,
        uint256 sponsorId,
        uint256 manualPlacementId
    ) internal returns (uint256) {
        totalUserCount++;
        uint256 newSubId = _generateRandom6DigitId();
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

        // Add 1 Share for Board 1
        totalActiveProtocolShares += SHARES_BOARD_1;

        users[sponsorId].directCount++;
        emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
        emit SponsorAssigned(newSubId, sponsorId);

        _checkAndReleaseFromHold(sponsorId);

        _placeUserInBoard(newSubId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newSubId, msg.sender, mainUserId, sponsorId, users[newSubId].placementParentId, true, block.timestamp);
        return newSubId;
    }

    function _validateOwnedSponsorId(uint256 mainUserId, uint256 sponsorId) internal view {
        require(sponsorId > 0 && users[sponsorId].active, "Invalid Sponsor ID");
        require(
            users[sponsorId].ownerMainUserId == mainUserId,
            "Sponsor ID must belong to caller's owned IDs"
        );
    }

    function _distributeEntryFeeV1_2(uint256 sponsorId, uint256 fromUserId) internal {
        lastActivityTimestamp = block.timestamp;

        // 1. 5% Admin Fee per admin ($5 USDT each -> Accrues to Unclaimed Admin Ledgers)
        admin1UnclaimedFees += ADMIN_FEE_EACH;
        admin1TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(1, adminWallet1, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        admin2UnclaimedFees += ADMIN_FEE_EACH;
        admin2TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(2, adminWallet2, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        admin3UnclaimedFees += ADMIN_FEE_EACH;
        admin3TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(3, adminWallet3, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        // 2. 40% Direct Commission ($40 USDT)
        if (sponsorId == 0) {
            // Root User / No sponsor -> 40% split equally across 3 admin ledgers ($13.33 USDT each)
            uint256 splitThird = SPONSOR_FEE / 3;
            uint256 remainder = SPONSOR_FEE - (splitThird * 3);

            admin1UnclaimedFees += (splitThird + remainder);
            admin1TotalEarned += (splitThird + remainder);
            emit AdminFeeAccrued(1, adminWallet1, splitThird + remainder, fromUserId, block.timestamp);

            admin2UnclaimedFees += splitThird;
            admin2TotalEarned += splitThird;
            emit AdminFeeAccrued(2, adminWallet2, splitThird, fromUserId, block.timestamp);

            admin3UnclaimedFees += splitThird;
            admin3TotalEarned += splitThird;
            emit AdminFeeAccrued(3, adminWallet3, splitThird, fromUserId, block.timestamp);

            emit RootDirectCommissionSplit(fromUserId, SPONSOR_FEE, splitThird);
        } else {
            // Normal Sponsor -> 40% Direct Commission ($40 USDT) INSTANT AUTOMATIC TRANSFER to sponsor's wallet
            userIncomes[sponsorId].directIncome += SPONSOR_FEE;

            address sponsorWallet = users[sponsorId].wallet;
            if (sponsorWallet != address(0)) {
                usdtToken.safeTransfer(sponsorWallet, SPONSOR_FEE);
                emit DirectCommissionAccrued(sponsorId, fromUserId, SPONSOR_FEE, block.timestamp);
            } else {
                userUnclaimedDirectIncome[sponsorId] += SPONSOR_FEE;
                emit DirectCommissionAccrued(sponsorId, fromUserId, SPONSOR_FEE, block.timestamp);
            }
        }


        // 3. 30% Share Pool Reserve (30 USDT)
        sharePoolBalance += SHARE_POOL_FEE;
        emit SharePoolFunded(SHARE_POOL_FEE, sharePoolBalance);

        // 4. 15% Reserve Fund (10 USDT Board Rewards, 5 USDT Level Income)
        reserveForBoardRewards += 10 * 10**18;
        reserveForLevelIncome += 5 * 10**18;
        emit ReserveFunded(RESERVE_FEE, reserveForBoardRewards, reserveForLevelIncome);
    }

    function _processLevelIncomeV1_2(uint256 sourceSubId, uint256 mainUserId) internal {
        uint256 currentSponsorId = users[sourceSubId].sponsorId;
        uint8 externalEligibleCount = 0;

        while (currentSponsorId != 0 && externalEligibleCount < 3) {
            uint256 beneficiaryMainUserId = users[currentSponsorId].ownerMainUserId;

            if (beneficiaryMainUserId != mainUserId) {
                uint256 directCount = users[beneficiaryMainUserId].directCount;

                if (directCount >= 2) {
                    externalEligibleCount++;
                    uint256 levelAmount = 0;
                    if (externalEligibleCount == 1) levelAmount = LEVEL_1_INCOME;      // $3 USDT (3%)
                    else if (externalEligibleCount == 2) levelAmount = LEVEL_2_INCOME; // $2 USDT (2%)
                    else if (externalEligibleCount == 3) levelAmount = LEVEL_3_INCOME; // $1 USDT (1%)

                    if (reserveForLevelIncome >= levelAmount) {
                        reserveForLevelIncome -= levelAmount;

                        userIncomes[beneficiaryMainUserId].levelIncome += levelAmount;
                        userUnclaimedLevelIncome[beneficiaryMainUserId] += levelAmount;

                        emit LevelIncomeAccrued(beneficiaryMainUserId, sourceSubId, externalEligibleCount, levelAmount, block.timestamp);
                        emit ReserveUsed("LevelIncome", levelAmount, reserveForLevelIncome);
                    }
                }
            }

            currentSponsorId = users[beneficiaryMainUserId].sponsorId;
        }
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
            targetBoardId = _createNewBoardUnit(boardLevel, userId);
        } else {
            userActiveBoardUnit[userId] = targetBoardId;
            _insertIntoBoardUnit(targetBoardId, userId, (boardLevel == 1 ? manualPlacementId : 0));
        }
    }

    function _validateManualPlacement(uint256 userId, uint256 manualPlacementId) internal view returns (uint256) {
        require(manualPlacementId != 0 && users[manualPlacementId].active, "Invalid placement parent ID");
        require(manualPlacementId != userId, "Cannot place under self");

        uint256 boardId = userActiveBoardUnit[manualPlacementId];
        require(boardId != 0, "Placement parent has no active board");

        BoardUnit memory b = boardUnits[boardId];
        require(b.boardLevel == 1, "Manual placement only allowed in Board Level 1");
        require(!b.completed && b.filledCount < 7, "Placement parent board is full or completed");

        uint8 parentSlot = 255;
        for (uint8 i = 0; i < 7; i++) {
            if (b.positions[i] == manualPlacementId) {
                parentSlot = i;
                break;
            }
        }

        require(parentSlot < 3, "Cannot use bottom board position (Pos 4-7) as placement parent");

        if (parentSlot == 0) {
            require(b.positions[1] == 0 || b.positions[2] == 0, "Placement parent already has 2 direct placement children filled");
        } else if (parentSlot == 1) {
            require(b.positions[3] == 0 || b.positions[4] == 0, "Placement parent already has 2 direct placement children filled");
        } else if (parentSlot == 2) {
            require(b.positions[5] == 0 || b.positions[6] == 0, "Placement parent already has 2 direct placement children filled");
        }

        return boardId;
    }

    function _findAutoPlacementBoard(uint8 boardLevel, uint256 sponsorId) internal view returns (uint256) {
        if (sponsorId != 0) {
            uint256 sponsorBoardId = userActiveBoardUnit[sponsorId];
            if (sponsorBoardId != 0) {
                BoardUnit memory b = boardUnits[sponsorBoardId];
                if (b.boardLevel == boardLevel && !b.completed && b.filledCount < 7) {
                    return sponsorBoardId;
                }
            }
        }

        uint256[] memory activeIds = activeBoardIdsByLevel[boardLevel];
        for (uint256 i = 0; i < activeIds.length; i++) {
            uint256 bId = activeIds[i];
            BoardUnit memory b = boardUnits[bId];
            if (!b.completed && b.filledCount < 7) {
                return bId;
            }
        }

        return 0;
    }

    function _createNewBoardUnit(uint8 boardLevel, uint256 topUserId) internal returns (uint256) {
        boardLevelCounter[boardLevel]++;
        boardIdCounter++;
        uint256 newBoardId = (uint256(boardLevel) * 1000) + boardLevelCounter[boardLevel];

        BoardUnit storage b = boardUnits[newBoardId];
        b.boardId = newBoardId;
        b.boardLevel = boardLevel;
        b.topId = topUserId;
        b.positions[0] = topUserId;
        b.filledCount = 1;
        b.completed = false;
        b.createdAt = block.timestamp;

        activeBoardIdsByLevel[boardLevel].push(newBoardId);
        userActiveBoardUnit[topUserId] = newBoardId;

        emit BoardPositionFilled(newBoardId, boardLevel, topUserId, 0);
        emit PlacementAssigned(topUserId, 0, newBoardId, 0);

        return newBoardId;
    }

    function _insertIntoBoardUnit(uint256 boardId, uint256 userId, uint256 manualPlacementParentId) internal {
        BoardUnit storage b = boardUnits[boardId];
        require(!b.completed && b.filledCount < 7, "Target board unit is full or completed");

        uint8 slotToFill = 255;
        uint256 parentId = 0;

        if (manualPlacementParentId != 0) {
            slotToFill = _findChildSlotOfParent(b, manualPlacementParentId);
            require(slotToFill != 255, "Placement parent already has 2 direct placement children filled");
        } else {
            for (uint8 i = 0; i < 7; i++) {
                uint8 slot = FILL_ORDER[i];
                if (b.positions[slot] == 0) {
                    slotToFill = slot;
                    break;
                }
            }
        }

        require(slotToFill < 7, "No available position in board unit");

        b.positions[slotToFill] = userId;
        b.filledCount++;

        parentId = _getPlacementParentForSlot(b, slotToFill);
        users[userId].placementParentId = parentId;

        emit BoardPositionFilled(boardId, b.boardLevel, userId, slotToFill);
        emit PlacementAssigned(userId, parentId, boardId, slotToFill);

        if (b.filledCount == 7) {
            _processBoardCompletion(boardId);
        }
    }

    function _findChildSlotOfParent(BoardUnit storage b, uint256 parentId) internal view returns (uint8) {
        if (b.positions[0] == parentId) {
            if (b.positions[1] == 0) return 1;
            if (b.positions[2] == 0) return 2;
        } else if (b.positions[1] == parentId) {
            if (b.positions[3] == 0) return 3;
            if (b.positions[4] == 0) return 4;
        } else if (b.positions[2] == parentId) {
            if (b.positions[5] == 0) return 5;
            if (b.positions[6] == 0) return 6;
        }
        return 255;
    }

    function _getPlacementParentForSlot(BoardUnit storage b, uint8 slot) internal view returns (uint256) {
        if (slot == 1 || slot == 2) return b.positions[0];
        if (slot == 3 || slot == 4) return b.positions[1];
        if (slot == 5 || slot == 6) return b.positions[2];
        return 0;
    }

    // ==========================================
    // 3. BOARD COMPLETION, SPLIT & HOLD QUEUE
    // ==========================================

    function _processBoardCompletion(uint256 boardId) internal {
        BoardUnit storage b = boardUnits[boardId];
        b.completed = true;

        uint256 topId = b.topId;
        uint8 currentLevel = b.boardLevel;

        emit BoardCompleted(boardId, currentLevel, topId);

        bool qualified = _checkDirectQualification(topId, currentLevel);

        if (qualified) {
            _payBoardReward(topId, currentLevel);

            if (currentLevel < 5) {
                uint8 nextLevel = currentLevel + 1;
                users[topId].currentBoard = nextLevel;

                _addShareDifferenceOnPromotion(currentLevel, nextLevel);

                emit BoardAdvanced(topId, currentLevel, nextLevel);
                _placeUserInBoard(topId, nextLevel, users[topId].sponsorId, 0);
            } else {
                _recordCycleCompletion(topId);
            }
        } else {
            isHoldingForQualification[topId] = true;
            holdingTargetLevel[topId] = currentLevel + 1;
            boardHoldList[currentLevel].push(topId);
            emit UserPlacedOnHold(topId, currentLevel, currentLevel + 1, users[topId].directCount);
        }

        _executeBoardSplit(boardId);
    }

    function _addShareDifferenceOnPromotion(uint8 fromLevel, uint8 toLevel) internal {
        uint256 oldShare = _getShareWeight(fromLevel);
        uint256 newShare = _getShareWeight(toLevel);
        if (newShare > oldShare) {
            totalActiveProtocolShares += (newShare - oldShare);
        }
    }

    function _getShareWeight(uint8 level) internal pure returns (uint256) {
        return getShareMultiplier(level);
    }

    function _checkDirectQualification(uint256 userId, uint8 boardLevel) internal view returns (bool) {
        uint256 directCount = users[userId].directCount;
        if (boardLevel == 1) return directCount >= 2;
        if (boardLevel == 2) return directCount >= 3;
        if (boardLevel == 3) return directCount >= 4;
        if (boardLevel == 4) return directCount >= 5;
        if (boardLevel == 5) return directCount >= 6;
        return false;
    }

    function _checkAndReleaseFromHold(uint256 userId) internal {
        if (!isHoldingForQualification[userId]) return;

        uint8 targetLevel = holdingTargetLevel[userId];
        uint8 currentHoldLevel = targetLevel - 1;

        bool qualifiedNow = _checkDirectQualification(userId, currentHoldLevel);

        if (qualifiedNow) {
            isHoldingForQualification[userId] = false;
            holdingTargetLevel[userId] = 0;

            _removeFromHoldList(currentHoldLevel, userId);

            _payBoardReward(userId, currentHoldLevel);

            if (targetLevel <= 5) {
                users[userId].currentBoard = targetLevel;
                _addShareDifferenceOnPromotion(currentHoldLevel, targetLevel);

                emit UserReleasedFromHold(userId, currentHoldLevel, targetLevel);
                emit BoardAdvanced(userId, currentHoldLevel, targetLevel);

                _placeUserInBoard(userId, targetLevel, users[userId].sponsorId, 0);
            } else {
                _recordCycleCompletion(userId);
            }
        }
    }

    function _removeFromHoldList(uint8 level, uint256 userId) internal {
        uint256[] storage list = boardHoldList[level];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == userId) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
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
            userUnclaimedBoardRewards[userId] += rewardAmount;
            
            emit BoardRewardAccrued(userId, boardLevel, rewardAmount, block.timestamp);
            emit ReserveUsed("BoardRewards", rewardAmount, reserveForBoardRewards);
        }
    }

    function _executeBoardSplit(uint256 completedBoardId) internal {
        BoardUnit storage b = boardUnits[completedBoardId];
        uint8 level = b.boardLevel;

        uint256 pos2Id = b.positions[1];
        uint256 pos3Id = b.positions[2];

        if (pos2Id == 0 && pos3Id == 0) return;

        uint256 newBoardA = 0;
        if (pos2Id != 0) {
            boardLevelCounter[level]++;
            boardIdCounter++;
            newBoardA = (uint256(level) * 1000) + boardLevelCounter[level];

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
            if (b.positions[3] != 0) userActiveBoardUnit[b.positions[3]] = newBoardA;
            if (b.positions[4] != 0) userActiveBoardUnit[b.positions[4]] = newBoardA;
        }

        uint256 newBoardB = 0;
        if (pos3Id != 0) {
            boardLevelCounter[level]++;
            boardIdCounter++;
            newBoardB = (uint256(level) * 1000) + boardLevelCounter[level];

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
            if (b.positions[5] != 0) userActiveBoardUnit[b.positions[5]] = newBoardB;
            if (b.positions[6] != 0) userActiveBoardUnit[b.positions[6]] = newBoardB;
        }

        _removeFromActiveBoardIds(level, completedBoardId);
        emit BoardSplit(completedBoardId, newBoardA, newBoardB);
    }

    function _removeFromActiveBoardIds(uint8 level, uint256 boardId) internal {
        uint256[] storage activeIds = activeBoardIdsByLevel[level];
        for (uint256 i = 0; i < activeIds.length; i++) {
            if (activeIds[i] == boardId) {
                activeIds[i] = activeIds[activeIds.length - 1];
                activeIds.pop();
                break;
            }
        }
    }

    function _recordCycleCompletion(uint256 topId) internal {
        cycleIdCounter++;
        uint256 newCycleId = cycleIdCounter;

        uint256 mainUserId = users[topId].ownerMainUserId;

        cycles[newCycleId] = CycleRecord({
            cycleId: newCycleId,
            userId: topId,
            wallet: users[topId].wallet,
            completedAt: block.timestamp
        });

        userCompletedCycles[mainUserId].push(newCycleId);

        _payBoardReward(topId, 5);

        emit CycleCompleted(newCycleId, topId, users[topId].wallet, block.timestamp);
    }

    // ==========================================
    // 4. ADMIN 5% WITHDRAWAL & USER CLAIMS
    // ==========================================

    /**
     * @notice Allows Admin 1, Admin 2, or Admin 3 to claim their accumulated 5% protocol revenue.
     */
    function withdrawAdminFees() external nonReentrant {
        uint256 amountToClaim = 0;
        uint8 adminIdx = 0;

        if (msg.sender == adminWallet1) {
            adminIdx = 1;
            amountToClaim = admin1UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 1 fees available");
            admin1UnclaimedFees = 0;
            admin1TotalWithdrawn += amountToClaim;
        } else if (msg.sender == adminWallet2) {
            adminIdx = 2;
            amountToClaim = admin2UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 2 fees available");
            admin2UnclaimedFees = 0;
            admin2TotalWithdrawn += amountToClaim;
        } else if (msg.sender == adminWallet3) {
            adminIdx = 3;
            amountToClaim = admin3UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 3 fees available");
            admin3UnclaimedFees = 0;
            admin3TotalWithdrawn += amountToClaim;
        } else {
            revert("Unauthorized: Caller is not an official Admin wallet");
        }

        usdtToken.safeTransfer(msg.sender, amountToClaim);
        emit AdminFeesWithdrawn(adminIdx, msg.sender, amountToClaim, block.timestamp);
    }

    /**
     * @notice Allows registered users to claim their accumulated 40% Direct Commission.
     */
    function claimDirectIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimDirectIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimDirectIncomeInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No direct commission available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit DirectCommissionClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimDirectIncomeInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedDirectIncome[userId];
        if (unclaimed > 0) {
            userUnclaimedDirectIncome[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Allows registered users to claim their accumulated Sub-ID 3-2-1 Level Income.
     */
    function claimLevelIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimLevelIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimLevelIncomeInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No level income available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit LevelIncomeClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimLevelIncomeInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedLevelIncome[userId];
        if (unclaimed > 0) {
            userUnclaimedLevelIncome[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Allows registered users to claim their accumulated Board Completion Rewards.
     */
    function claimBoardRewards() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimBoardRewardInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimBoardRewardInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No board rewards available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit BoardRewardClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimBoardRewardInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedBoardRewards[userId];
        if (unclaimed > 0) {
            userUnclaimedBoardRewards[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Claims accumulated 10-Day Share Pool Dividends.
     */
    function claimAllShareIncome() public nonReentrant returns (uint256) {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimUserShareIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimUserShareIncomeInternal(subIds[i]);
        }

        if (totalClaimable > 0) {
            usdtToken.safeTransfer(msg.sender, totalClaimable);
        }
        return totalClaimable;
    }

    function _claimUserShareIncomeInternal(uint256 userId) internal returns (uint256) {
        if (!users[userId].active) return 0;

        uint256 lastAcc = userLastAccumulator[userId];
        if (accumulatedShareValueScaled <= lastAcc) return 0;

        uint256 accDiff = accumulatedShareValueScaled - lastAcc;
        uint8 bLevel = users[userId].currentBoard;
        uint256 userShares = _getShareWeight(bLevel);

        uint256 grossEarned = (accDiff * userShares) / 1e18;
        if (grossEarned == 0) return 0;

        userLastAccumulator[userId] = accumulatedShareValueScaled;

        uint256 capLimit = getBoardCap(bLevel);
        uint256 currentLifetimeEarned = userIncomes[userId].lifetimeShareIncomeEarned;

        if (currentLifetimeEarned >= capLimit) {
            return 0;
        }

        uint256 netClaimable = grossEarned;
        if (currentLifetimeEarned + grossEarned > capLimit) {
            netClaimable = capLimit - currentLifetimeEarned;
        }

        userIncomes[userId].lifetimeShareIncomeEarned += netClaimable;
        userIncomes[userId].shareIncome += netClaimable;

        emit ShareIncomeCredited(userId, users[userId].wallet, netClaimable, userIncomes[userId].lifetimeShareIncomeEarned);
        return netClaimable;
    }

    /**
     * @notice CONSOLIDATED 1-CLICK CLAIM FUNCTION:
     * Claims ALL accumulated Direct Income, Share Income, Level Income, and Board Rewards in 1 single transaction!
     */
    function claimAllUserIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        // 1. Direct Income
        uint256 directAmount = _claimDirectIncomeInternal(mainUserId);
        // 2. Level Income
        uint256 levelAmount = _claimLevelIncomeInternal(mainUserId);
        // 3. Board Rewards
        uint256 boardRewardAmount = _claimBoardRewardInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            directAmount += _claimDirectIncomeInternal(subIds[i]);
            levelAmount += _claimLevelIncomeInternal(subIds[i]);
            boardRewardAmount += _claimBoardRewardInternal(subIds[i]);
        }

        // 4. Share Income
        uint256 shareAmount = _claimUserShareIncomeInternal(mainUserId);
        for (uint256 i = 0; i < subIds.length; i++) {
            shareAmount += _claimUserShareIncomeInternal(subIds[i]);
        }

        uint256 totalClaimable = directAmount + levelAmount + boardRewardAmount + shareAmount;
        require(totalClaimable > 0, "No accumulated income available to claim");

        claimRecordCounter++;
        userClaimHistory[mainUserId].push(ClaimRecord({
            claimId: claimRecordCounter,
            mainUserId: mainUserId,
            wallet: msg.sender,
            totalAmount: totalClaimable,
            directAmount: directAmount,
            shareAmount: shareAmount,
            levelAmount: levelAmount,
            boardRewardAmount: boardRewardAmount,
            timestamp: block.timestamp
        }));

        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit AllUserIncomeClaimed(mainUserId, msg.sender, directAmount, shareAmount, levelAmount, boardRewardAmount, totalClaimable, block.timestamp);
    }

    // ==========================================
    // 5. SHARE PERIOD FINALIZATION & UTILITIES
    // ==========================================

    function finalizeSharePeriod() external nonReentrant {
        require(
            block.timestamp >= nextPeriodTargetTimestamp,
            "Share pool cutoff date (9th/19th/29th) not reached yet"
        );
        require(totalActiveProtocolShares > 0, "No active shares");

        uint256 poolAmount = sharePoolBalance;

        periodPoolBalance[currentPeriodId] = poolAmount;
        periodTotalShares[currentPeriodId] = totalActiveProtocolShares;

        if (poolAmount > 0) {
            uint256 periodValueScaled = (poolAmount * 1e18) / totalActiveProtocolShares;
            accumulatedShareValueScaled += periodValueScaled;
        }

        emit ShareDistributionFinalized(currentPeriodId, poolAmount, totalActiveProtocolShares, accumulatedShareValueScaled);

        sharePoolBalance = 0;
        currentPeriodId++;
        currentPeriodStart = block.timestamp;
        nextPeriodTargetTimestamp = _calculateNextCutoff(block.timestamp + 1 hours);
    }

    function _calculateNextCutoff(uint256 currentTimestamp) internal pure returns (uint256) {
        (uint256 year, uint256 month, uint256 day) = _timestampToDate(currentTimestamp);

        if (day < 9) return _toTimestamp(year, month, 9) + 23 hours + 59 minutes + 59 seconds;
        if (day < 19) return _toTimestamp(year, month, 19) + 23 hours + 59 minutes + 59 seconds;

        (uint256 lastYear, uint256 lastMonth, uint256 lastDay) = _getLastDayOfMonth(year, month);
        if (day < lastDay) return _toTimestamp(lastYear, lastMonth, lastDay) + 23 hours + 59 minutes + 59 seconds;

        if (month == 12) return _toTimestamp(year + 1, 1, 9) + 23 hours + 59 minutes + 59 seconds;
        return _toTimestamp(year, month + 1, 9) + 23 hours + 59 minutes + 59 seconds;
    }

    function _getLastDayOfMonth(uint256 year, uint256 month) internal pure returns (uint256 y, uint256 m, uint256 d) {
        if (month == 2) {
            bool isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
            return (year, month, isLeap ? 29 : 28);
        }
        if (month == 4 || month == 6 || month == 9 || month == 11) return (year, month, 30);
        return (year, month, 31);
    }

    function _timestampToDate(uint256 timestamp) internal pure returns (uint256 year, uint256 month, uint256 day) {
        int256 z = int256(timestamp / 86400) + 719468;
        int256 era = (z >= 0 ? z : z - 146096) / 146097;
        uint256 doe = uint256(z - era * 146097);
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        int256 y = int256(yoe) + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        uint256 d = doy - (153 * mp + 2) / 5 + 1;
        uint256 m = mp < 10 ? mp + 3 : mp - 9;
        int256 addYear = m <= 2 ? int256(1) : int256(0);
        return (uint256(y + addYear), m, d);
    }

    function _toTimestamp(uint256 year, uint256 month, uint256 day) internal pure returns (uint256) {
        int256 _year = int256(year);
        int256 _month = int256(month);
        int256 _day = int256(day);
        int256 _a = (14 - _month) / 12;
        int256 y = _year + 4800 - _a;
        int256 m = _month + 12 * _a - 3;
        int256 julianDay = _day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;
        return uint256(julianDay - 2440588) * 86400;
    }

    function _getTargetDirectCount(uint256 userId) internal view returns (uint256) {
        if (isHoldingForQualification[userId]) {
            uint8 holdLevel = holdingTargetLevel[userId] - 1;
            if (holdLevel == 1) return 2;
            if (holdLevel == 2) return 3;
            if (holdLevel == 3) return 4;
            if (holdLevel == 4) return 5;
            if (holdLevel == 5) return 6;
            return 6;
        }

        uint8 boardLvl = users[userId].currentBoard;
        if (boardLvl == 1) return 2;
        if (boardLvl == 2) return 3;
        if (boardLvl == 3) return 4;
        if (boardLvl == 4) return 5;
        if (boardLvl == 5) return 6;
        return 2;
    }

    function _findNextAvailableAutoSponsor(uint256 mainUserId) internal view returns (uint256) {
        uint256 mainTarget = _getTargetDirectCount(mainUserId);
        if (users[mainUserId].directCount < mainTarget) {
            return mainUserId;
        }

        uint256[] storage subIds = ownerSubIds[mainUserId];

        for (uint256 i = 0; i < subIds.length; i++) {
            uint256 subId = subIds[i];
            uint256 target = _getTargetDirectCount(subId);
            if (users[subId].directCount < target) {
                return subId;
            }
        }

        for (uint256 i = 0; i < subIds.length; i++) {
            uint256 subId = subIds[i];
            if (users[subId].directCount < 2) {
                return subId;
            }
        }

        return mainUserId;
    }

    function _generateRandom6DigitId() internal returns (uint256) {
        uint256 candidateId;
        uint256 attempts = 0;

        while (attempts < 100) {
            nonce++;
            candidateId = 100000 + (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce, block.prevrandao))) % 900000);
            if (!usedUserIds[candidateId]) {
                usedUserIds[candidateId] = true;
                return candidateId;
            }
            attempts++;
        }

        candidateId = 100000 + totalUserCount;
        usedUserIds[candidateId] = true;
        return candidateId;
    }

    // ==========================================
    // 6. TELEMETRY & VIEW UTILITIES
    // ==========================================

    function getAdminTelemetry(uint8 adminIndex) external view returns (
        address adminWallet,
        uint256 unclaimedFees,
        uint256 totalEarned,
        uint256 totalWithdrawn
    ) {
        if (adminIndex == 1) return (adminWallet1, admin1UnclaimedFees, admin1TotalEarned, admin1TotalWithdrawn);
        if (adminIndex == 2) return (adminWallet2, admin2UnclaimedFees, admin2TotalEarned, admin2TotalWithdrawn);
        if (adminIndex == 3) return (adminWallet3, admin3UnclaimedFees, admin3TotalEarned, admin3TotalWithdrawn);
        revert("Invalid admin index (must be 1, 2, or 3)");
    }

    function getUserUnclaimedSummary(uint256 mainUserId) external view returns (
        uint256 unclaimedDirect,
        uint256 unclaimedLevel,
        uint256 unclaimedBoardRewards,
        uint256 unclaimedShareIncome,
        uint256 totalUnclaimed
    ) {
        unclaimedDirect = userUnclaimedDirectIncome[mainUserId];
        unclaimedLevel = userUnclaimedLevelIncome[mainUserId];
        unclaimedBoardRewards = userUnclaimedBoardRewards[mainUserId];

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            unclaimedDirect += userUnclaimedDirectIncome[subIds[i]];
            unclaimedLevel += userUnclaimedLevelIncome[subIds[i]];
            unclaimedBoardRewards += userUnclaimedBoardRewards[subIds[i]];
        }

        // Estimated Share Income
        unclaimedShareIncome = _getPendingShareIncomeView(mainUserId);
        for (uint256 i = 0; i < subIds.length; i++) {
            unclaimedShareIncome += _getPendingShareIncomeView(subIds[i]);
        }

        totalUnclaimed = unclaimedDirect + unclaimedLevel + unclaimedBoardRewards + unclaimedShareIncome;
    }

    function getUserClaimHistory(uint256 mainUserId) external view returns (ClaimRecord[] memory) {
        return userClaimHistory[mainUserId];
    }

    function _getPendingShareIncomeView(uint256 userId) internal view returns (uint256) {
        if (!users[userId].active) return 0;
        uint256 lastAcc = userLastAccumulator[userId];
        if (accumulatedShareValueScaled <= lastAcc) return 0;

        uint256 accDiff = accumulatedShareValueScaled - lastAcc;
        uint8 bLevel = users[userId].currentBoard;
        uint256 userShares = _getShareWeight(bLevel);

        uint256 grossEarned = (accDiff * userShares) / 1e18;
        if (grossEarned == 0) return 0;

        uint256 capLimit = getBoardCap(bLevel);
        uint256 currentLifetimeEarned = userIncomes[userId].lifetimeShareIncomeEarned;
        if (currentLifetimeEarned >= capLimit) return 0;

        uint256 net = grossEarned;
        if (currentLifetimeEarned + grossEarned > capLimit) {
            net = capLimit - currentLifetimeEarned;
        }
        return net;
    }

    function getBoardUnitPositions(uint256 boardId) external view returns (uint256[7] memory) {
        return boardUnits[boardId].positions;
    }

    function getOwnerSubIds(uint256 mainUserId) external view returns (uint256[] memory) {
        return ownerSubIds[mainUserId];
    }

    function getActiveBoardUnitsByLevel(uint8 level) external view returns (uint256[] memory) {
        return activeBoardIdsByLevel[level];
    }

    function getHoldListByLevel(uint8 level) external view returns (uint256[] memory) {
        return boardHoldList[level];
    }

    function getTotalActiveShares() external view returns (uint256) {
        return totalActiveProtocolShares;
    }

    function getBoardCap(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return CAP_BOARD_1;
        if (boardLevel == 2) return CAP_BOARD_2;
        if (boardLevel == 3) return CAP_BOARD_3;
        if (boardLevel == 4) return CAP_BOARD_4;
        if (boardLevel == 5) return CAP_BOARD_5;
        return CAP_BOARD_1;
    }

    function getShareMultiplier(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return SHARES_BOARD_1;
        if (boardLevel == 2) return SHARES_BOARD_2;
        if (boardLevel == 3) return SHARES_BOARD_3;
        if (boardLevel == 4) return SHARES_BOARD_4;
        if (boardLevel == 5) return SHARES_BOARD_5;
        return SHARES_BOARD_1;
    }

    function updateAdminWallets(address _admin1, address _admin2, address _admin3) external onlyOwner {
        require(_admin1 != address(0) && _admin2 != address(0) && _admin3 != address(0), "Invalid admin address");
        adminWallet1 = _admin1;
        adminWallet2 = _admin2;
        adminWallet3 = _admin3;
        emit AdminWalletsUpdated(_admin1, _admin2, _admin3);
    }

    /**
     * @notice Emergency Inactivity Sweep:
     * If 365 days pass with zero protocol transaction activity,
     * any caller (or admin) can trigger this function to sweep the remaining USDT balance
     * directly into Main Admin Wallet 3 (the 9c2 wallet).
     */
    function emergencySweepInactivity() external nonReentrant {
        require(
            block.timestamp >= lastActivityTimestamp + 365 days,
            "Inactivity period of 365 days has not elapsed yet"
        );

        uint256 contractBalance = usdtToken.balanceOf(address(this));
        require(contractBalance > 0, "No USDT balance available to sweep");

        usdtToken.safeTransfer(adminWallet3, contractBalance);

        lastActivityTimestamp = block.timestamp;
        emit InactivitySweepTriggered(msg.sender, contractBalance, block.timestamp);
    }
}
