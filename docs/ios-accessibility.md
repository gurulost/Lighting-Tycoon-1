# iOS accessibility and responsive UI

Settings and tutorial content adapt when system font scale is at least 1.5.
Settings stacks label, explanation and switch; the tutorial keeps its instructions
and hint in a bounded scroll area. A measured skip control reserves its own space.
Primary body text continues to scale. Compact modal headings and HUD metadata may
cap at 200% to preserve navigation, with complete spoken names for the underlying
information. Do not globally disable font scaling or hide required instructions.

The shared native modal wrapper declares an isolated accessibility container.
Gameplay is hidden from accessibility while a takeover is present. Headers take
focus after the native presentation callback; dismissal restores focus to the
workshop Settings control after the native dismissal callback. Nested restart
confirmation hides ordinary Settings and supports native accessibility escape,
scrolling, and keyboard-safe input. Browser checks cover keyboard Escape separately.
Verify with VoiceOver before advertising full screen-reader support: an automation
hierarchy alone does not prove spoken order or focus behavior on a physical device.

`MotionPreferencesProvider` observes iOS Reduce Motion and combines it with the
saved preference. Either preference keeps motion reduced; changing the OS setting
never changes the save. The initial query is conservative and cannot overwrite a
newer change event. Animated modal transitions and shared controls follow the same
effective preference. System motion changes and listener cleanup have focused tests.

## Gameplay HUD and board

The currency toolbar reflows above its icon actions on narrow screens and at
large text sizes. Currency exposes exact spoken amounts; ordinary taps open
the same explanations previously available only by long press. Status and goals
have intrinsic card heights, and at large text sizes their full objective copy
wraps rather than being clipped into fixed-height rows. A labeled, bounded HUD
scroll area keeps this detail available without pushing navigation offscreen.
The HUD toggle actually hides/shows these optional details. At large text sizes
in windows shorter than 600pt it starts collapsed to preserve board space; an
explicit choice lasts for the screen session and is not saved as a preference.

The merge board has its own overflow scroll area. Scrolling is suspended during
a part drag; measured board/station coordinates are refreshed after scrolling.
Navigation stays outside that area and scrolls horizontally when later-phase
actions do not fit. Labels scale up to 200%; buttons retain full spoken names,
counts, gating state and at least 44pt targets. Small part/status badges have
bounded typography; full tier/family/compatibility details remain in accessible
part names and the scalable Part Details dialog.

Backpack/Undo/Recycle wrap on phones or at large text sizes. Open Part Details
with a long press, screen-reader activation, or keyboard Enter/Space, then choose
Move to Backpack to use the first free slot. It respects the same unlock/full
checks and Undo as dragging. A stored part's ordinary activation returns it to the
first free board slot. This avoids requiring an offscreen drag on short displays.
Part Details has a bounded scrollable body and a fixed reachable close control.

## Device checks

Use the standalone E2E build and a dedicated simulator. Record its original content
size with `xcrun simctl ui <UDID> content_size`, then test `medium`,
`extra-extra-extra-large`, `accessibility-extra-large` (AX3), and
`accessibility-extra-extra-extra-large` (AX5). Restore the original setting afterward.
At each size, open and dismiss Settings, read and change every setting, open the
Lab, scroll to the last scenario, and verify the sticky action and close control.
At AX3/AX5, verify tutorial instructions can scroll and Skip remains tappable.
Cancel out of restart confirmation; do not erase a normal save to test layout.

For a repeatable native navigation check, use `.maestro/accessibility.yaml` with
`MAESTRO_STANDALONE=1 MAESTRO_DEVICE_ID=<UDID> MAESTRO_FLOW=.maestro/accessibility.yaml npm run test:maestro`.
It deliberately clears the app's data, so use a dedicated test simulator only.
The flow checks Settings hit-testing, volume controls, scrolling to the final Lab
scenario, selecting it, sticky action reachability, dismissal and reopening.
Run the ordinary smoke flow separately to exercise scenario load/restart/restore.
Retain screenshots per text size and review them; element visibility alone cannot
establish that large text is visually legible or that VoiceOver reads it in order.

Use iPad mini and 13-inch iPad in portrait, landscape, half-width and narrow windows.
Resize with the tutorial, Suppliers, Project Reveal, Settings and Lab open. Check
board hit-testing after resize, safe-area padding, and reachable dismissal.
The browser suite covers live landscape/split-view viewport changes; native checks
must also cover text scaling, screen-reader names, and OS window resizing.

## Performance evidence

Optional image warmup runs one asset at a time after initial interactions and pauses
in background. This bounds concurrency and avoids allocating every decoded asset
at once; no frame-time or memory improvement is claimed without a comparable trace.
After a standalone build, capture symbolicated ETTrace runs for cold launch, first
supplier action, a Phase 2 transition, and Lab load/restore. Keep the exact app/dSYM
UUIDs, OS/model, release channel, replay flag, flow, and processed JSON. Use at least
five equivalent runs for a useful before/after comparison. Report median/p95 time
to interactive and frame stalls, separating Simulator measurements from device data.

Capture app-owned memgraphs after 20 modal cycles and 10 scenario replacements and
restores. Inspect retain paths for any growing app-owned root type; an Expo Go host
memgraph cannot establish app ownership. Validate on an older supported iPhone for
memory pressure, audio interruptions, haptics, energy and thermal behavior.
