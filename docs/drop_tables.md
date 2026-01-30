# Supplier Drop Tables

This document captures the current supplier drop tables and bonus channels used by the in‑game generators.

## Supplier Config (charges + cooldown)

| Supplier | Level | Charges | Cooldown (ms) |
| --- | --- | --- | --- |
| Baron Depot | 1 | 6 | 45000 |
| Baron Depot | 2 | 8 | 42000 |
| Baron Depot | 3 | 10 | 40000 |
| Open Workshop | 1 | 3 | 60000 |
| Open Workshop | 2 | 4 | 56000 |
| Open Workshop | 3 | 5 | 52000 |
| Open Workshop | 4 | 6 | 48000 |
| Open Workshop | 5 | 7 | 44000 |
| Salvage Corner | 1 | 4 | 75000 |
| Salvage Corner | 2 | 5 | 68000 |
| Salvage Corner | 3 | 6 | 62000 |

Note: Workbench speed upgrades reduce cooldowns globally.

## Baron Supply Depot (Locked)

### Level 1 (Crate distribution)
- T1: 61.7284%
- T2: 30.8642%
- T3: 6.1728%
- T4: 1.2346%
- Bonus channel: 10% chance to drop Waste T1

### Level 2 (Nice Crate distribution)
- T1: 52.6316%
- T2: 26.3158%
- T3: 12.6316%
- T4: 5.2632%
- T5: 3.1579%
- Bonus channel: 12% chance to drop Waste T1

### Level 3 (Masterpiece distribution, shifted)
- T2: 27.2727%
- T3: 27.2727%
- T4: 27.2727%
- T5: 9.0909%
- T6: 6.8182%
- T7: 2.2727%
- Bonus channel: 14% chance to drop Waste T1

## Open Workshop (Open)

### Level 1
- T1: 76%
- T2: 19%
- T3: 5%
- Bonus channel: 6% Upgrade Material, 2% Compatibility Component

### Level 2 (Nice Crate distribution)
- T1: 52.6316%
- T2: 26.3158%
- T3: 12.6316%
- T4: 5.2632%
- T5: 3.1579%
- Bonus channel: 7% Upgrade Material, 3% Compatibility Component

### Level 3 (Masterpiece distribution, shifted)
- T2: 27.2727%
- T3: 27.2727%
- T4: 27.2727%
- T5: 9.0909%
- T6: 6.8182%
- T7: 2.2727%
- Bonus channel: 8% Upgrade Material, 3% Compatibility Component

### Level 4 (Masterpiece distribution, shifted)
- T3: 27.2727%
- T4: 27.2727%
- T5: 27.2727%
- T6: 9.0909%
- T7: 6.8182%
- T8: 2.2727%
- Bonus channel: 9% Upgrade Material, 4% Compatibility Component

### Level 5 (Masterpiece distribution, shifted)
- T5: 27.2727%
- T6: 27.2727%
- T7: 27.2727%
- T8: 9.0909%
- T9: 6.8182%
- T10: 2.2727%
- Bonus channel: 10% Upgrade Material, 5% Compatibility Component

## Salvage Corner (nested table)

Top‑level roll:
- 70% Refurb drop (Open parts)
- 20% Scrap drop (Waste)
- 10% Upgrade Material

Refurb subtable (Level 1):
- T1: 61.7284%
- T2: 30.8642%
- T3: 6.1728%
- T4: 1.2346%

Refurb subtable (Level 2):
- T1: 52.6316%
- T2: 26.3158%
- T3: 12.6316%
- T4: 5.2632%
- T5: 3.1579%

Refurb subtable (Level 3):
- T2: 27.2727%
- T3: 27.2727%
- T4: 27.2727%
- T5: 9.0909%
- T6: 6.8182%
- T7: 2.2727%

## Bonus Effects

- Baron deals apply a time‑limited chance to spawn an extra locked part.
- Merge Momentum can force the next supplier drop to a minimum tier.
- Workbench Quality upgrades have a chance to bump supplier drops by +1 tier.
- Open Standardization II adds a +1 tier chance to Open supplier drops.
