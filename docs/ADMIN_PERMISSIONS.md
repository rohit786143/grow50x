# PROTOCOL ADMIN PERMISSIONS & PRIVILEGE BOUNDARIES

GROW 50X enforces strict decentralization and zero-trust principles.

## Admin Role Capabilities
- `updateAdminWallets(address _a1, address _a2, address _a3)`: Updates the 3 admin wallet addresses receiving 5% ($5 USDT) each per deposit. Protected by `onlyOwner`.

## FORBIDDEN ADMIN FUNCTIONS (DO NOT EXIST)
The protocol smart contracts explicitly DO NOT contain any of the following privileged functions:
- ❌ `adminSetUserBalance()`
- ❌ `adminMoveUser()`
- ❌ `adminChangeSponsor()`
- ❌ `adminChangePlacement()`
- ❌ `adminWithdrawUserFunds()`
- ❌ `adminResetShareCap()`

User balances, placements, sponsor relationships, and reserve funds are 100% governed by immutable smart contract logic.
