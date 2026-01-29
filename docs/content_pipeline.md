# Content Pipeline

This document explains how orders are authored, combined, and gated. Use it when
adding or tuning content.

## Source of Truth
- `client/constants/orderContentPack.ts`

## Content Layers

### 1) Base Recipes (`BASE_RECIPES`)
Defines the core item requirements and the minimum neighborhood.
- Keep these general and reusable.
- Use tags for broad grouping (intro/basic/mid/high/premium).

### 2) Modifiers (`ORDER_MODIFIERS`)
Modifiers add constraints without new parts.

**How modifiers combine (order of application):**
1. Start with base requirements and default type.
2. Apply **style match**: sets type `style_match` and locks requirements to Open/Locked.
3. Apply **rush**: sets `rushDeadline`.
4. Apply **certified**: sets type `locked_required` and locks requirements to Locked.
5. Apply **client preference**: sets `familyPreference` + `penaltyIfWrongFamily`.
6. Apply **eco audit**: sets `ecoAuditBonusResearch`.
7. Apply **no substitutions**: sets `noSubstitutions`.

**Reward calculation**
- Base reward is computed from tiers.
- Archetype reward bias is applied.
- Modifier reward multipliers are applied.
- Neighborhood multipliers are applied last.

### 3) Archetypes (`ARCHETYPES`)
Archetypes add flavor and reward bias.
- `flavorLines`: short one-liners for variety.
- `rewardBias`: small skew to cash/rep/research.

### 4) Overrides (`ORDER_OVERRIDES`)
This is where most content lives. Each override specifies:
- base recipe
- archetype
- optional modifier list
- neighborhood
- optional title/flavor override
- weight

### 5) Order Library (`ORDER_LIBRARY`)
Generated automatically from overrides + lab templates.

---

## Neighborhood Gating Logic
Orders are gated by **both**:
1. `minNeighborhoodId` on the template.
2. `allowedOrderTypes` in `neighborhoods.ts`.

Additional gating:
- `baron_certified` requires Dependency >= 40.
- `locked_required` requires Dependency >= 60 **and** R&D unlocked.
- `lab_request` requires R&D unlocked.
- Only one rush order at a time.
- Only one locked_required order at a time.
- Dependency starts at 100 and decreases; certified/locked orders naturally fade as freedom grows.

---

## Adding a New Order (Checklist)
1. Pick or create a base recipe.
2. Select archetype (or add a new archetype).
3. Add modifiers only when they add distinct gameplay.
4. Add override entry.
5. Confirm neighborhood gating.
6. Run a quick in-game sanity check.

---

## Content Quality Rules
- Do not add new tiers to create variety; use modifiers instead.
- Keep flavor lines 1 sentence max.
- Avoid stacking multiple modifiers on early neighborhoods.
- Keep rush orders rare.
