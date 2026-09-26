# UNRESOLVED & AMBIGUOUS PROTOCOL RULES

As mandated by Section 76 & 77 of the GROW 50X Specification, all structural ambiguities or unresolved protocol edge cases must be explicitly recorded in this document prior to final production smart contract deployment.

---

## 1. CRITICAL: Board Split & Recycling Algorithm (Section 12 & 77)

### Ambiguity
When a 7-position board unit completes (Positions 1 through 7 filled):
- Position 1 is marked as completing the board unit and receives the Board Completion Reward (if qualified).
- Position 1 advances to the next board level (e.g. Board 1 $\rightarrow$ Board 2) if direct qualification requirements are met.
- **Unresolved Question**: How are the remaining 6 members (Positions 2 through 7) partitioned into new board units? 
  - Standard split matrix options:
    - *Option A*: Position 2 becomes TOP of a new Board Unit $A$ with Positions 4 & 5 as its left/right children. Position 3 becomes TOP of a new Board Unit $B$ with Positions 6 & 7 as its left/right children.
    - *Option B*: Positions 2–7 remain in their existing board structure, and only Position 1 detaches and moves up, while new entrants fill under Positions 4–7.
    - *Option C*: Board units do not split physically; instead, completing Position 1 leaves the unit, and the unit converts to a closed status while children form new board roots dynamically.

### Interim Placeholder Specification
For initial contract development and test suite validation:
- Position 1 completes the board unit, triggers the reward calculation, advances to the next board level via auto-placement if eligible, and marks the board unit as `COMPLETED`.
- Positions 2 and 3 automatically spawn as the TOP positions of two brand new active Board Units (`boardId_A` and `boardId_B`) at the same board level.
- Positions 4 & 5 are assigned to child slots under Position 2 in `boardId_A`.
- Positions 6 & 7 are assigned to child slots under Position 3 in `boardId_B`.
- *Note*: This placeholder split module will be encapsulated behind an isolated, testable `IBoardSplitStrategy` interface to enable seamless replacement once explicit client confirmation is received.

---

## 2. Gas Limit Chunking for Automatic Sub-ID Batches (Section 41)

### Ambiguity
Creating up to 20 Sub-IDs in a single transaction involves 20 registrations, 20 sponsor tree links, 20 placement checks, and up to 20 potential board completion payouts. On BSC, executing 20 full placements in a single block transaction could approach or exceed block gas limits under heavy board traversal.

### Interim Resolution
- Smart contract accepts batch registrations up to `MAX_BATCH_SIZE = 20`.
- If execution gas exceeds safe threshold, frontend provides chunked multi-transaction execution (e.g., 2 batches of 10 Sub-IDs) while maintaining strict deterministic parent-child sequential order.

---

## 3. Share Pool Distribution Integer Rounding Remainder (Section 18)

### Ambiguity
When dividing total 10-day share pool funds by `totalEligibleShares`, minor integer division remainders (e.g. a few wei of USDT) may remain undistributed.

### Resolution
Any remainder from `poolBalance` division remains in `poolBalance` and rolls over automatically into the next 10-day distribution period.

---

## 4. Unqualified Board Completion Rewards Handling (Section 14 & 13)

### Ambiguity
If a user fills a 7-position board unit but has NOT yet met the `directCount` requirement for that board level, what happens to their Board Completion Reward?

### Resolution
- The reward is held in a `pendingBoardRewards` state until the user meets the required `directCount`.
- Once `directCount` is reached, the user can claim the reward from `reserveForBoardRewards`.
