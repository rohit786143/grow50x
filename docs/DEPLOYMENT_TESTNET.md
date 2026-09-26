# BNB SMART CHAIN TESTNET DEPLOYMENT GUIDE

## Prerequisites
- BNB Smart Chain Testnet BNB gas tokens (from BSC Faucet).
- Mock USDT BEP-20 deployed contract.

## Deployment Steps
1. Set environment variables in `.env`:
```env
PRIVATE_KEY="<YOUR_TESTNET_PRIVATE_KEY>"
NEXT_PUBLIC_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
ADMIN_WALLET_1="0x..."
ADMIN_WALLET_2="0x..."
ADMIN_WALLET_3="0x..."
```

2. Execute deployment script:
```bash
npm run deploy:testnet
```

3. Output artifacts will be saved automatically to:
`deployments/deployment-addresses-testnet.json`

4. Verify contracts on BscScan Testnet explorer.
