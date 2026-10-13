# SHARE POOL & NON-RESETTING CUMULATIVE CAP

## 10-Day Periodic Accumulation & Fixed Closing Schedule
- 30% of every $100 entry fee ($30 USDT) is accumulated into `sharePoolBalance`.
- **Closing Dates**: Distribution closes on the **5th, 15th, and 25th** of every month at **23:59:59 GST (Dubai Time, UTC+4)**.
- **Timezone Note**: Closing strictly follows Dubai Time (GST = UTC+4), NOT Indian Standard Time (IST = UTC+5:30). When Dubai reaches 23:59:59, Indian time is 01:29:59 AM next morning.

## Scaled Integer Distribution Formula
$$\Delta \text{Accumulator} = \frac{\text{Pool Balance} \times 10^{18}}{\sum \text{Eligible Active Shares}}$$

$$\text{User Raw Entitlement} = \frac{\text{User Board Shares} \times (\text{Accumulator}_{\text{current}} - \text{Accumulator}_{\text{lastClaimed}})}{10^{18}}$$

## Non-Resetting Lifetime Cumulative Cap
The lifetime share income cap is enforced per board level:
- Board 1: $200 USDT
- Board 2: $400 USDT
- Board 3: $1,000 USDT
- Board 4: $2,000 USDT
- Board 5: $5,000 USDT

### Critical Rule
`lifetimeShareIncomeEarned` MUST NEVER reset when transitioning between board levels. Previous board earnings count toward higher board caps.

$$\text{Remaining Capacity} = \max\left(0, \text{CumulativeCap}(\text{CurrentBoard}) - \text{lifetimeShareIncomeEarned}\right)$$

$$\text{Payable Share Income} = \min\left(\text{Raw Entitlement}, \text{Remaining Capacity}\right)$$
