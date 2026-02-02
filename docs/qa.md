# QA Edge-Case Harness

Use this lightweight checklist to validate core friction fixes and first-session sequencing.

## Board Full -> Backpack / Recycle
- Fill the board to 1-2 empty slots.
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
  - Dependency can move but does not trigger crackdown (won't drop below 21).
  - No lockout modal appears before first-session completion.

## Crackdown Trigger
- After first-session completion, complete open-only installs until Dependency crosses below 20.
- Verify:
  - Lockout modal appears.
  - A compliance audit order is inserted.
  - Dependency does not drop below 20 until the audit is resolved.
  - Baron offers do not appear while the audit is active.

## Baron Pressure + Lockout Scaling
- While Dependency is capped at 100, take Baron actions that add Dependency (contract/offer).
- Verify:
  - Baron Pressure increases (lockout lab target increases to base+1 at 40, base+2 at 70).
  - HUD shows the Baron Pressure meter next to Dependency with 40/70 thresholds and the open-only reduction hint.
  - Story beat "baron_attention" triggers the first time pressure crosses 40.
- Trigger lockout and choose Lab route.
- Verify:
  - Lab request target matches the pressure tier captured at lockout start.
  - Open-only installs reduce pressure by 1 (use a debug log or inspect follow-up lockout target).

## Phase 2 Transition
- Complete lockout via Freedom Controller.
- Verify:
  - Dependency stays at 0 (merges/orders do not change it).
  - Baron Pressure applies a reward tax at 40+ (-10%) and 70+ (-20%) to cash + research.
  - Phase 2 goal order is inserted once and highlighted.
  - If the goal order cannot be inserted immediately, it appears on the next available spawn.
  - Compatibility-required orders appear more frequently.
  - Target difficulty feels +1 higher on average.

## Empire Contracts (Projects)
- After completing the Phase 2 goal order, open the Project Board.
- Verify:
  - Three offers appear and include deposit costs + stage counts.
  - Refreshing offers deducts cash and replaces all offers.
- Accept a project:
  - Deposit (and add-on costs) are deducted.
  - A protected project stage order is inserted and cannot be refreshed/dismissed.
  - Project Board shows active stage and installs-remaining countdown (if enabled).
- Complete a project stage:
  - Stage reward is granted.
  - Next stage order appears and stage index advances.
  - Stage-complete story beat appears.
- Complete all stages:
  - Completion payout applies and active project clears.
  - Completing 3/6/9 total projects increases base order slots by +1 each.
- Action deadline:
  - Fulfill non-project orders and confirm deadline decrements.
  - When deadline reaches 0, project fails and penalty applies (deposit loss/pressure/rep debuff).
  - Failure refunds: pressure/rep penalties return the deposit; lose-deposit returns only the remainder.
- Add-ons:
  - Permit Expeditor adds +2 installs to deadline once per stage.
  - Site Logistics grants +2 Open supplier charges and clears unused charges when the project ends.
  - Overtime Crew grants +1 order slot for the project duration.
  - Change Order swaps a stage constraint once.
- Cancel project:
  - Contract cancels, deposit refund is reduced, and active project clears.

## Standards Council (Phase 3)
- Unlock gate:
  - Complete the Expo capstone (or 6 projects + rep tier gate).
  - Verify Council button appears and opens the Council screen.
- Draft:
  - Start a campaign and invest cash + research (partial allowed).
  - Verify progress saves and status moves to PILOT when fully funded.
- Pilot:
  - Complete objective installs (open-only, compat, eco-audit, rush).
  - Verify counters increment only for the active campaign.
- Ratify:
  - When pilot completes, a protected Council showcase order is inserted.
  - Complete the order and confirm campaign status becomes COMPLETED.
- Perks:
  - Verify at least one perk changes gameplay (e.g., open-only drop min tier).
- Lobby Pressure + Hearings:
  - Gain pressure during Draft/Pilot and cross thresholds to trigger a hearing.
  - Confirm penalty applies immediately and clears on objective completion or pay-to-clear.
- Municipal Grants (perk unlock):
  - After unlocking the Municipal Grants perk, spend a grant to reduce Lobby Pressure.

## Second Baron Offer Trigger
- In first-session:
  - If you accept the first Baron offer, complete two orders.
  - OR perform your first locked merge (whichever comes first).
- Verify:
  - Second Baron offer appears once.
  - Story beat "baron_offer_return" appears.

## Lockout Recovery on Load
- Force `lockoutActive = true` in saved state while removing the lockout order entry.
- Reload the game.
- Verify:
  - A lockout order is re-inserted (locked-required order appears).
  - If lab choice is active with remaining lab orders, a lab request is added.
  - Orders list is capped to maxOrders with lockout/lab orders preserved.

## Order Spawn Pressure Gating
- Fill the board until only 0-1 free slots remain (Red band).
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

## Goals / Missions
- Complete tutorial and confirm 1-2 goals appear in the goals strip.
- Merge parts and confirm merge-count goals progress.
- Fulfill orders and confirm order goals progress (open-only vs locked installs).
- Complete a goal and verify:
  - Rewards are granted (cash/rep/research).
  - Toast appears.
  - Goal is replaced by a new one.
- Skip a goal and verify it is replaced without reward.

## Tactical Boosts
- Complete tutorial.
- Supplier Scout:
  - Choose Open route. Verify next 6 spawns force Open on the base drop and counter decrements.
  - Choose Locked route. Verify next 4 spawns force Locked and add +1 Baron Pressure per spawn.
  - Verify forced/tutorial spawns do not consume the counter.
- Baron supply modifiers:
  - Accept a Baron crate or rush offer and verify the bonus locked roll for the next N non-forced spawns.
  - Confirm counters only decrement on non-forced spawns with successful placement.
- Before first session completion, clinic/warranty remain disabled with a clear hint.
- Mentor Workshop Clinic:
  - Activate clinic. Verify next open merges grant +1 research and reduce dependency by 1.
  - Counter decrements on every merge, then expires at 0.
- Baron Warranty Stamp:
  - Refund Relief: fulfill a wrong-family preference order and confirm a softer penalty.
  - Contract Edge: with an active Baron contract, confirm higher cash bonus.
  - Verify Contract Edge is unavailable when no active contract is running.
  - Counter decrements only on non-tutorial, non-lockout, non-lab orders.

## Supplier Overdraw
- Enter cooldown on a supplier and verify the Overdraw button appears after tutorial completion.
- Baron overdraw:
  - Cash is deducted only after placement succeeds.
  - Extra waste chance triggers over multiple taps.
  - Overheat extends cooldown after the free overdraw count.
- Open overdraw:
  - Research is deducted only after placement succeeds.
- Salvage overdraw:
  - Waste parts are consumed (lowest tiers first).
  - If insufficient waste, cash fallback is used instead.
- Verify no charge is taken when the board/backpack is full and placement fails.

## Story Log Cap
- Trigger a high volume of story beats (300+).
- Verify:
  - Story log length never exceeds cap.
  - Most recent beats remain visible and older entries roll off.

## Save Debounce / Critical Flush
- Perform rapid merges for 10-15 seconds.
- Verify:
  - Saves do not trigger on every action (check storage write frequency).
- Complete an order or purchase an upgrade.
- Verify:
  - Save occurs immediately after the critical action.
