# RESERVE FUND ACCOUNTING & INVARIANTS

15% of every $100 entry deposit ($15 USDT) is credited into a **Single Unified Protocol Reserve Fund**:

- **Total Reserve Allocation**: **$15.00 USDT** per entry (15%).
- **Payout Sources**: Both **Board Completion Rewards** ($40, $80, $160, $320, $640 USDT) and **3-Level Sub-ID Income** (Level 1: $3, Level 2: $2, Level 3: $1 USDT) are distributed directly from this single unified 15% Reserve Pool.

## Reserve Invariants & Anti-Deficit Guarantee
- The 15% Reserve Pool operates as a unified liquidity reserve for all board and level payouts.
- All payouts are strictly bounded by the total accumulated Reserve balance.
- If reserve balance is ever temporarily lower than a pending reward (e.g. before sufficient pool depth), payouts are queued in `pendingBoardRewards` state without generating unbacked liabilities or synthetic debt.

