# 100 USDT REVENUE & TOKEN FLOW

Every $100 USDT entry deposit is routed on-chain upon transaction execution:

```
                  ┌────────────────────────┐
                  │   100 USDT Deposit     │
                  └───────────┬────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
│ Direct 40%  │        │ Share Pool  │        │ Reserve 15% │
│ ($40 USDT)  │        │    30%      │        │ ($15 USDT)  │
│ Paid to     │        │ ($30 USDT)  │        └──────┬──────┘
│ Sponsor     │        └─────────────┘               │
└─────────────┘                               ┌──────┴──────┐
                                              │             │
                                       ┌──────▼──────┐┌─────▼──────┐
                                       │Board Rewards││Level Income│
                                       │ 10 USDT     ││ 5 USDT     │
                                       └─────────────┘└────────────┘
       ┌─────────────────────────────────────────────┐
       │ Admin Wallets 15% (3 x $5 USDT = $15 USDT)  │
       └─────────────────────────────────────────────┘
```

## Security Invariants
- Allocations cannot exceed actual received USDT (`ENTRY_FEE = 100 * 10**18`).
- Safe ERC20 `transfer` and `transferFrom` methods prevent silent token transfer failures.
