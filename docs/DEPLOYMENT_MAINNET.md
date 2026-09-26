# MAINNET SAFETY GATES & DEPLOYMENT GUARDRAILS

Mainnet deployment is locked behind explicit safety gates as required by Section 70 of the GROW 50X Specification.

## Safety Gates & Mandatory Prerequisites
1. **Explicit Environment Flag**: `ENABLE_MAINNET_DEPLOYMENT=true` must be set in environment variables.
2. **Passed Audit Verification**: Zero unresolved critical, high, or medium security vulnerabilities.
3. **Multi-Sig Governance Setup**: Contract ownership transferred to a Gnosis Safe Multi-Sig wallet with Timelock.
4. **Mainnet USDT Verification**: Verified deployment against official BSC BEP-20 USDT token address (`0x55d398326f99059fF775485246999027B3197955`).

## Mainnet Launch Command
```bash
ENABLE_MAINNET_DEPLOYMENT=true hardhat run scripts/deploy-mainnet.ts --network bscMainnet
```
