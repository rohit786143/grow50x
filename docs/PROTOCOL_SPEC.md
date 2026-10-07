# GROW 50X - PROTOCOL SPECIFICATION

## 1. System Overview & Core Principles

**GROW 50X** is a fully decentralized Web3 protocol operating on the BNB Smart Chain (BSC) using USDT (BEP-20) as the underlying currency token. 

### Core Architectural Axioms
1. **On-Chain Truth**: The smart contracts are the sole, ultimate source of truth for all user identities, sponsor relationships, placement trees, board states, share accounting, caps, level income eligibility, and USDT accounting.
2. **Dual-Tree System**: The protocol maintains two completely separate structural graphs:
   - **Sponsor Tree**: Controls direct sponsor income ($40 / 40%), direct qualification counters (`directCount`), Sub-ID sponsor inheritance, and level-income eligibility.
   - **Placement Tree**: Controls 7-position board placement, position filling, board unit completion, board progression, and automatic placement fallback.
   - *Rule*: Sponsor Tree and Placement Tree MUST NEVER be mixed or confused. A user's sponsor ID is structurally independent from their placement parent ID.
3. **No Unrestricted Admin**: No admin function exists to modify user balances, adjust placements, alter sponsor ties, change direct counts, or withdraw user funds.
4. **Reserve Exhaustion & Anti-Deficit**: The protocol enforces strict invariant bounds. Payments are capped by actual received USDT balances and designated reserve buckets. No synthetic debt or unbacked liabilities can be generated on-chain.

---

## 2. Entry & Revenue Allocation Mathematical Model

Every Main ID registration or Sub-ID creation requires an exact entry fee:
$$\text{Entry Fee} = 100\text{ USDT}$$

### Allocation Matrix ($100 USDT)
For every valid 100 USDT deposit:
- **Direct Sponsor Income**: 40% ($40.00 USDT) $\rightarrow$ Paid directly to Sponsor ID.
- **Share Pool**: 30% ($30.00 USDT) $\rightarrow$ Accumulated into active 10-day Share Pool balance.
- **Admin Wallet 1**: 5% ($5.00 USDT) $\rightarrow$ Pushed to Admin Wallet 1 address.
- **Admin Wallet 2**: 5% ($5.00 USDT) $\rightarrow$ Pushed to Admin Wallet 2 address.
- **Admin Wallet 3**: 5% ($5.00 USDT) $\rightarrow$ Pushed to Admin Wallet 3 address.
- **Reserve Fund**: 15% ($15.00 USDT) $\rightarrow$ Accumulated into Single Unified Protocol Reserve Fund (`protocolReserveBalance`).
  - Distributes **both** Board Completion Rewards ($40, $80, $160, $320, $640 USDT) and 3-Level Sub-ID Income ($3, $2, $1 USDT).

$$\sum \text{Allocations} = 40 + 30 + 5 + 5 + 5 + 15 = 100\text{ USDT}$$

---

## 3. ID Generation & Display Format

- Each Main ID and Sub-ID is assigned a 1-indexed, monotonically increasing deterministic internal numeric ID (`uint256`).
- Display Format: `GR` followed by a 5-digit zero-padded integer representation (e.g., `1` $\rightarrow$ `GR00001`, `123` $\rightarrow$ `GR000123`).
- Raw internal numeric IDs remain authoritative in smart contract state storage.

---

## 4. Five-Board System & Placement Algorithm

There are 5 progressive Board Levels:
- Board 1
- Board 2
- Board 3
- Board 4
- Board 5

### Board Structure
- Each Board Unit consists of **7 positions**:
  - Position 1: Top (Root of Board Unit)
  - Positions 2 & 3: Left and Right children of Position 1
  - Positions 4 & 5: Children of Position 2
  - Positions 6 & 7: Children of Position 3
- Filling Order across all boards is strictly deterministic:
  $$\text{TOP} \rightarrow \text{BOTTOM} \quad \text{then} \quad \text{LEFT} \rightarrow \text{RIGHT}$$

### Board 1 Placement Rules
1. **Manual Placement**:
   - User can specify an explicit target Placement ID.
   - Validation: Must exist, must be currently active in Board 1, target position must be open, and tree invariants must hold.
2. **Auto Placement**:
   - **Preference 1 (Sponsor's Active Board)**: Check if the Sponsor's active Board 1 unit has an open position. If yes, place into that board unit using `TOP -> BOTTOM -> LEFT -> RIGHT`.
   - **Preference 2 (Oldest Eligible Board)**: If Sponsor's Board 1 is full or unavailable, find the oldest active Board 1 unit (`boardId` ascending) that has an open position, and place using `TOP -> BOTTOM -> LEFT -> RIGHT`.

### Boards 2–5 Placement Rules
- Manual placement is **disabled** for Boards 2, 3, 4, and 5.
- All placements in Boards 2–5 use the automatic placement algorithm (Sponsor's active board unit if available, otherwise oldest active board unit at that level).

---

## 5. Direct Qualification & Board Advancement

Advancement from Board $N$ to Board $N+1$ requires meeting a Direct Sponsor count threshold (`directCount` on the Sponsor Tree):

| Current Board | Target Board | Required Total Direct Sponsors (`directCount`) | Completion Reward |
| :--- | :--- | :--- | :--- |
| Board 1 | Board 2 | 2 Directs | $40 USDT |
| Board 2 | Board 3 | 3 Directs | $80 USDT |
| Board 3 | Board 4 | 4 Directs | $160 USDT |
| Board 4 | Board 5 | 5 Directs | $320 USDT |
| Board 5 | Cycle End | N/A | $640 USDT |

- `directCount` is strictly updated whenever a new ID (Main or Sub-ID) specifies this ID as its `sponsorId`.
- Placement relationships do NOT increment `directCount`.
- Board Completion Rewards are paid out of `reserveForBoardRewards`.

---

## 6. Share Pool & Cumulative Cap Mathematical Model

### Share Allocations by Board Level
Active IDs in each board level hold a specific share multiplier for the 10-day Share Pool distribution:
- Board 1: **1 Share**
- Board 2: **2 Shares**
- Board 3: **5 Shares**
- Board 4: **10 Shares**
- Board 5: **25 Shares**

### 10-Day Period Accumulation & Scaled Precision Math
- 30% of every $100 entry is deposited into `poolBalance`.
- Distribution occurs every 10 days ($864,000$ seconds).
- Scaled Integer Accumulator Formula:
  $$\Delta \text{Accumulator} = \frac{\text{Eligible Pool Amount} \times 10^{18}}{\text{Total Eligible Shares}}$$
  $$\text{Accumulator}_{\text{new}} = \text{Accumulator}_{\text{old}} + \Delta \text{Accumulator}$$

- User Share Entitlement:
  $$\text{Entitlement} = \frac{\text{User Shares} \times (\text{Accumulator}_{\text{current}} - \text{Accumulator}_{\text{lastClaimed}})}{10^{18}}$$

### Non-Resetting Cumulative Share-Income Cap Rule
The lifetime cumulative share income cap is defined per Board Level:
- Board 1 Cap: **$200 USDT**
- Board 2 Cap: **$400 USDT**
- Board 3 Cap: **$1,000 USDT**
- Board 4 Cap: **$2,000 USDT**
- Board 5 Cap: **$5,000 USDT**

#### Key Invariant
`lifetimeShareIncomeEarned` MUST NEVER reset when transitioning between boards.

$$\text{Remaining Capacity} = \max\left(0, \text{CumulativeCap}(\text{CurrentBoard}) - \text{lifetimeShareIncomeEarned}\right)$$

$$\text{Payable Share Income} = \min\left(\text{Entitlement}, \text{Remaining Capacity}\right)$$

Direct income, level income, and board completion rewards are tracked in separate storage variables and NEVER count against `lifetimeShareIncomeEarned`.

---

## 7. Sub-ID System & Automatic 20-ID Batch Engine

### Sub-ID Rules
- Created only by the wallet owning the Main User ID (`ownerMainUserId`).
- A Sub-ID cannot select an external/unrelated wallet or external ID as its sponsor.

### Sub-ID Permitted Sponsor Selection
- **Manual Creation**: The sponsor dropdown for creating Sub-ID $N$ is strictly restricted to:
  $$\text{Permitted Sponsors} = \{\text{Main ID}, \text{Sub-ID}_1, \text{Sub-ID}_2, \dots, \text{Sub-ID}_{N-1}\}$$

- **Automatic Batch Creation (Up to 20 Sub-IDs)**:
  - User specifies batch quantity $K \le 20$.
  - Required Payment = $K \times 100$ USDT.
  - **Deterministic Breadth-First Binary Sponsor Tree Generation**:
    - Sub 1 & Sub 2 $\rightarrow$ Sponsored by Main ID
    - Sub 3 & Sub 4 $\rightarrow$ Sponsored by Sub 1
    - Sub 5 & Sub 6 $\rightarrow$ Sponsored by Sub 2
    - Sub 7 & Sub 8 $\rightarrow$ Sponsored by Sub 3 ... and so on.
  - **Placement**: Each created Sub-ID determines its placement independently: prefer sponsor's active Board 1 unit if available, otherwise fallback to the oldest active Board 1 unit (`TOP -> BOTTOM -> RIGHT -> LEFT`).

---

## 8. Level Income Engine

Sub-IDs generating qualifying activity distribute level income to preceding sponsors in the Sponsor Tree:
- **Level 1**: 3% ($3 USDT)
- **Level 2**: 2% ($2 USDT)
- **Level 3**: 1% ($1 USDT)
- Total: 6% ($6 USDT funded from `reserveForLevelIncome`).

### Eligibility Requirement
For Level $L \in \{1, 2, 3\}$, the sponsoring ID at that depth must have $\ge 2$ direct sponsors (`directCount >= 2`). If `directCount < 2`, Level $L$ payout is skipped and retained in the reserve.

### Beneficiary Consolidation Rule
The actual USDT payout for any level income earned by a Sub-ID in a sponsor hierarchy is credited directly to the **Main User wallet** associated with that sponsoring ID.

---

## 9. Accounting Invariants & State Checks

1. $\text{Total USDT Distributed} \le \text{Total USDT Received}$.
2. $\text{Board Rewards Paid} \le \text{reserveForBoardRewards}$.
3. $\text{Level Income Paid} \le \text{reserveForLevelIncome}$.
4. $\text{Share Income Distributed} \le \text{poolBalance}$.
5. $\text{User Share Earnings} + \text{lifetimeShareIncomeEarned} \le \text{CumulativeCap}(\text{CurrentBoard})$.
6. Direct Count increments exclusively on valid Sponsor Tree additions.
