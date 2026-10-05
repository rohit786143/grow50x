# GROW 50X — Full Web3 DApp / Smart Contract / Frontend / Backend Specification

**GROW 50X** is a decentralized Web3 financial matrix protocol built for **BNB Smart Chain (BSC)** using **USDT (BEP-20)**.

---

## 🚀 Architectural Principles
1. **Blockchain Source of Truth**: User IDs, Sponsor relationships, Placement trees, 7-position Board states, direct counts, qualification checks, Share Pool accounting, Sub-ID structures, and USDT balances are **100% stored on-chain**.
2. **Dual-Tree Architecture**: 
   - **Sponsor Tree**: Controls direct sponsor commission ($40), direct qualification counts (`directCount`), Sub-ID sponsor inheritance, and level-income eligibility.
   - **Placement Tree**: Controls 7-position board unit position filling (`TOP -> BOTTOM, LEFT -> RIGHT`), board completion, board split, and auto-placement.
3. **Zero Arbitrary Admin Privileges**: The contract contains NO functions to arbitrarily modify user balances, adjust placements, alter sponsor ties, or drain funds.

---

## 🛠 Tech Stack
- **Smart Contracts**: Solidity `0.8.24`, OpenZeppelin Contracts, Hardhat, Ethers.js v6, TypeChain.
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Glassmorphism design system.
- **Backend / Indexer**: Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, Ethers event listener.

---

## 📁 Repository Structure
```
├── contracts/             # Solidity smart contracts (Grow50XCore, MockUSDT, Storage, Events)
├── scripts/               # BSC Testnet deployment and setup scripts
├── test/                  # Comprehensive Hardhat unit & invariant test suite
├── frontend/              # Next.js Web3 application
├── backend/               # Blockchain event indexer & REST API service
├── docs/                  # Protocol documentation & mathematical specifications
├── hardhat.config.ts      # Hardhat configuration (optimizer enabled, solc 0.8.24)
└── package.json           # Root npm scripts and dependencies
```

---

## ⚡ Quick Start & Setup

### 1. Install Dependencies & Compile Smart Contracts
```bash
npm install
npm run compile
```

### 2. Run Hardhat Unit & Invariant Tests
```bash
npm run test
```

### 3. Deploy to BNB Smart Chain Testnet
```bash
npm run deploy:testnet
```

### 4. Launch Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 Comprehensive Documentation
- [`PROTOCOL_SPEC.md`](docs/PROTOCOL_SPEC.md): Core mathematical & deterministic specification.
- [`UNRESOLVED_RULES.md`](docs/UNRESOLVED_RULES.md): Board split placeholders & ambiguity registry.
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md): Smart contract module boundaries & storage layout.
- [`TOKEN_FLOW.md`](docs/TOKEN_FLOW.md): 100 USDT allocation flow.
- [`SPONSOR_TREE.md`](docs/SPONSOR_TREE.md): Sponsor tree mechanics & direct counts.
- [`PLACEMENT_TREE.md`](docs/PLACEMENT_TREE.md): Board placement algorithms.
- [`BOARD_RULES.md`](docs/BOARD_RULES.md): 5-board progression & completion rewards.
- [`SUBID_RULES.md`](docs/SUBID_RULES.md): Manual & 20-batch Sub-ID rules.
- [`SHARE_POOL.md`](docs/SHARE_POOL.md): 10-day share pool math & non-resetting caps.
- [`RESERVE_RULES.md`](docs/RESERVE_RULES.md): Reserve fund split & exhaustion invariants.
- [`SECURITY.md`](docs/SECURITY.md): Security invariants & audit checklist.
- [`TESTING.md`](docs/TESTING.md): Hardhat testing strategy.
- [`DEPLOYMENT_TESTNET.md`](docs/DEPLOYMENT_TESTNET.md): BSC Testnet deployment guide.
- [`DEPLOYMENT_MAINNET.md`](docs/DEPLOYMENT_MAINNET.md): Mainnet safety gates & guardrails.
- [`ADMIN_PERMISSIONS.md`](docs/ADMIN_PERMISSIONS.md): Admin role constraints & governance disclosure.
