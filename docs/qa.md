# QA Edge-Case Harness

Use this lightweight checklist to validate core friction fixes and first-session sequencing.

## Board Full → Backpack / Recycle
- Fill the board to 1–2 empty slots.
- Drag a low-tier part into Backpack. Verify:
  - Slot highlights are valid.
  - Backpack accepts the item.
  - Item is removable back to the board.
- Drag a low-tier part into Recycle. Verify:
  - Part disappears.
  - Toast shows rewards (cash + research if Open).
  - No locked parts are generated.

## Order Highlight + Missing Items
- Select an active order with missing parts.
- Verify:
  - Matching parts on board pulse.
  - Matching parts in Backpack pulse.
  - Ghost slots show correct tier letters for missing parts.
- Fulfill the order:
  - Highlight clears immediately.
  - Ghosts disappear.

## First-Session Lockout Suppression
- During the first-session track, take the Baron offer and perform locked merges.
- Verify:
  - Dependency can rise but does not trigger lockout (caps at 99).
  - No lockout modal appears before first-session completion.

## Second Baron Offer Trigger
- In first-session:
  - If you accept the first Baron offer, complete two orders.
  - OR perform your first locked merge (whichever comes first).
- Verify:
  - Second Baron offer appears once.
  - Story beat “baron_offer_return” appears.

