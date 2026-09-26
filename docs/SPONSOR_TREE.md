# SPONSOR TREE SPECIFICATION

The Sponsor Tree governs:
- Direct sponsor income payouts ($40 USDT per entry).
- Direct qualification counts (`directCount`).
- Sub-ID sponsor inheritance restrictions.
- Sub-ID level income eligibility (2 direct sponsors required per sponsoring node).

## Key Rules
1. **Structural Independence**: Sponsor tree ties are completely decoupled from placement tree position.
2. **Direct Count Tracking**: `users[sponsorId].directCount` increments on-chain whenever a new Main ID or Sub-ID is registered naming `sponsorId`.
3. **Immutability**: Once assigned at registration, a user's `sponsorId` can NEVER be modified.
