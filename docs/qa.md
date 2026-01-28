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

## Lockout Recovery on Load
- Force `lockoutActive = true` in saved state while removing the lockout order entry.
- Reload the game.
- Verify:
  - A lockout order is re-inserted (locked-required order appears).
  - If lab choice is active with remaining lab orders, a lab request is added.
  - Orders list is capped to maxOrders with lockout/lab orders preserved.

## Order Spawn Pressure Gating
- Fill the board until only 0–1 free slots remain (Red band).
- Wait for multiple order spawn intervals.
- Verify:
  - Orders do not spawn while board is in Red band.
  - Orders resume spawning once board frees up.
  - Orders button shows the pause indicator while Red band is active.

## Late-Game Order Mix Floors
- Set `reputationTier >= 3`, `maxTierCrafted >= 4`, and clear the active orders list.
- Force multiple spawns or refresh orders. Verify:
  - No new order has difficulty below the rep-tier floor (6/7/8).
  - At least one active order requires Tier 4+ when `maxTierCrafted >= 4`.
- Set `maxTierCrafted = 5` and clear active orders.
- Force multiple spawns or refresh orders. Verify:
  - At least one active order requires Tier 5.
  - After completing a Tier 5 order, the next generated order restores a Tier 5 requirement.

## Tactical Boosts
- Complete tutorial + first session.
- Supplier Scout:
  - Choose Open route. Verify next 6 spawns skew Open and counter decrements.
  - Verify forced/tutorial spawns do not consume the counter.
- Mentor Workshop Clinic:
  - Activate clinic. Verify next open merges grant +1 research and reduce dependency by 1.
  - Counter decrements on every merge, then expires at 0.
- Baron Warranty Stamp:
  - Refund Relief: fulfill a wrong-family preference order and confirm a softer penalty.
  - Contract Edge: with an active Baron contract, confirm higher cash bonus.
  - Verify Contract Edge is unavailable when no active contract is running.
  - Counter decrements only on non-tutorial, non-lockout, non-lab orders.

## Story Log Cap
- Trigger a high volume of story beats (300+).
- Verify:
  - Story log length never exceeds cap.
  - Most recent beats remain visible and older entries roll off.

## Save Debounce / Critical Flush
- Perform rapid merges for 10–15 seconds.
- Verify:
  - Saves do not trigger on every action (check storage write frequency).
- Complete an order or purchase an upgrade.
- Verify:
  - Save occurs immediately after the critical action.
