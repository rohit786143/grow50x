# RESERVE FUND ACCOUNTING & INVARIANTS

15% of every $100 entry ($15 USDT) is deposited into the Protocol Reserve:
- **`reserveForBoardRewards`**: Receives 10 USDT per entry. Used exclusively for Board Completion Rewards ($40, $80, $160, $320, $640).
- **`reserveForLevelIncome`**: Receives 5 USDT per entry. Used exclusively for 3%/2%/1% Sub-ID level rewards.

## Reserve Invariants
- `reserveForBoardRewards` and `reserveForLevelIncome` are tracked as independent accounting buckets.
- Payouts are bounded strictly by bucket balances. If a bucket balance is insufficient, payouts are deferred or held in state. The contract will NEVER create unbacked USDT liabilities or fake balances.
