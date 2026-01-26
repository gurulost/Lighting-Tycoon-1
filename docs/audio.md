# Audio / SFX Map

Source: `client/audio/sounds.ts`

## SFX List + Triggers
- `spawn` — Workbench tap
- `merge_1..5` — Merge by tier
- `order_complete` — Order fulfilled
- `upgrade` — Upgrade purchase
- `error` — Invalid action (blocked move, backpack full)
- `baron_offer` — Offer appears
- `baron_accept` — Offer accepted
- `baron_decline` — Offer declined
- `lockout` — Lockout event begins
- `recycle` — Recycle part
- `backpack` — Move part to/from backpack
- `rd_unlock` — R&D unlocked
- `rd_craft` — Freedom Controller crafted

## Mix Principles
- Avoid dense stacking: global throttle limits to 6 plays per 220ms.
- Each SFX has its own cooldown to prevent chatter.
- Use light pitch variance for repeated actions (`rateRange`).
- Prioritize “merge” and “order complete” as the loudest confirmation.

## QA Checklist
- Merges never clip or overlap badly.
- Workbench tap never silent when enabled.
- Lockout SFX only triggers once per event.

