# TESTING STRATEGY & SUITE GUIDELINES

The protocol test suite is built using **Hardhat, Chai, and Ethers.js v6**.

## Test Execution Commands
```bash
# Run unit & integration test suite
npm run test

# Run contract test coverage
npm run test:coverage
```

## Test Coverage Matrix
- **Registration**: Valid registration, invalid sponsor ID, zero address, double registration, insufficient USDT allowance.
- **Sponsor Tree**: `directCount` increment verification, qualification check per board level.
- **Placement Tree**: Manual Board 1 placement, auto Board 1 placement (sponsor board preference + oldest board fallback), deterministic `TOP -> BOTTOM, LEFT -> RIGHT` filling.
- **Board Advancement**: 7-position board completion, reward payments ($40, $80, $160, $320, $640), board split execution.
- **Sub-ID System**: Single Sub-ID creation, batch creation up to 20 Sub-IDs, rejection of batch size 21, manual sponsor restriction enforcement.
- **Share Pool**: 10-day period accumulation, total shares multiplier calculation, non-resetting lifetime cumulative cap enforcement across board upgrades.
- **Reserve Invariants**: Contract USDT balance equality with sum of internal pool and reserve buckets.
