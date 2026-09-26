# SECURITY INVARIANTS & AUDIT CHECKLIST

## Implemented Protection Patterns
1. **Reentrancy Protection**: All state-modifying functions utilize OpenZeppelin `ReentrancyGuard` (`nonReentrant`).
2. **Safe ERC20 Token Calls**: All USDT transfers use OpenZeppelin `SafeERC20` (`safeTransfer`, `safeTransferFrom`).
3. **Checks-Effects-Interactions**: Storage states are updated before external token transfers.
4. **Ownership Authorization**: Sub-ID creation verifies caller wallet ownership on-chain.
5. **Integer Precision Handling**: Share pool calculations use $10^{18}$ scaled integer precision to avoid floating-point errors.
6. **No Arbitrary Admin Overrides**: No admin function exists to modify balances, alter placement positions, change sponsors, or drain reserve funds.

## Independent Audit Requirement
Prior to mainnet deployment:
- Execute static analysis tools (Slither, Solhint).
- Run unit, integration, fuzz, and invariant test suites.
- Perform formal verification of financial invariants.
- Obtain an independent third-party smart contract audit.
