# Lighting Tycoon - Design Guidelines

## Brand Identity

**Purpose**: An idle merge-tycoon game teaching strategic decision-making through a neon-lit lighting workshop where players navigate the tension between fast proprietary gains versus long-term independence.

**Aesthetic Direction**: Industrial-vibrant. Think neon workshop meets cyberpunk repair shop—functional grids with glowing accents, high contrast for readability during quick sessions, and clear visual language that instantly communicates part families and merge states.

**Memorable Element**: The dual-glow system. Every part pulses with either cool blue/white (Open-Standard, trustworthy, stable) or warm gold/purple (Locked, seductive, dangerous). This color distinction is the visual spine of the entire experience.

## Color Palette

**Part Families (Core Game Vocabulary)**
- Open-Standard: `#4A9EFF` (primary blue) with `#FFFFFF` glow
- Locked: `#FFB84D` (gold) with `#A855F7` (purple) accent glow
- Neutral Board: `#1A1A2E` (deep navy background)

**UI System**
- Background: `#0F0F1F` (true dark)
- Surface: `#1F1F2E` (elevated panels)
- Primary Action: `#00D9FF` (cyan, for upgrades/positive actions)
- Danger/Warning: `#FF4D4D` (Dependency alerts)
- Success: `#4DFF88` (order completion)

**Currencies**
- Cash: `#FFD700` (gold coins)
- Reputation: `#00D9FF` (cyan stars)
- Research: `#9D4EDD` (purple beakers)

**Text**
- Primary: `#FFFFFF`
- Secondary: `#A0A0B8`
- Disabled: `#505064`

## Typography

**Font**: System default (SF Pro on iOS, Roboto on Android) for maximum performance during rapid interactions.

**Type Scale**
- Title (Board Header): Bold, 28pt
- Tier Labels (on parts): Bold, 16pt
- Order Card Title: Semibold, 18pt
- Body (tooltips, descriptions): Regular, 14pt
- Micro (timers, counters): Medium, 12pt

## Navigation Architecture

**Primary Screen**: Merge Board (full-screen, persistent)
- Fixed stations: Workbench (top-left), Order Inbox (top-right), R&D Bench (bottom-center, initially locked)
- No traditional tab bar or navigation header—game board IS the main interface

**Modal Overlays** (stack-based modals)
1. Order Detail Modal (slide-up from inbox tap)
2. Upgrade Shop Modal (slide-up from cash button)
3. R&D Tree Modal (slide-up from R&D bench)
4. Lockout Event Modal (full-screen takeover)
5. Settings Modal (accessed via top-right gear icon)

**Onboarding Flow** (tutorial overlay, dismissible after first 60 seconds)

## Screen Specifications

### Main Board Screen
**Layout**:
- Safe area: Full screen with translucent status bar (light content)
- Top HUD (40pt height): Cash, Reputation, Research counters + Settings gear (right)
- Dependency Meter (below HUD, 8pt height): Horizontal progress bar with threshold markers at 20/40/60/80
- Merge Grid (centered): 5×6 grid, each tile 64×64pt with 4pt gaps
- Bottom toast area (safe area bottom + 16pt): Contextual tips/warnings

**Components**:
- Grid tiles: Rounded 8pt corners, subtle inner shadow when empty, glow when occupied
- Part sprites: 56×56pt within tile, with family-colored outer glow (blur radius 8pt)
- Tier badges: Small pill (20×12pt) top-right of part showing tier number
- Drag shadow: 4pt offset, 30% opacity, follows finger
- Merge target highlight: Pulsing 2pt border in matching family color at 1Hz

**Interactions**:
- Long-press part (500ms): Show tooltip modal with stats
- Drag part onto same-tier part: Merge animation (scale 1.2→1.0 over 300ms, particle burst)
- Tap Workbench: Spawn animation (part appears with pop, haptic light impact)
- Tap Order Inbox badge: Slide up order modal

### Order Detail Modal
**Layout**:
- Slide-up from bottom, 70% screen height
- Header: Order title + customer avatar (generated)
- Required items grid: 2-3 tile previews showing needed parts
- Reward display: Cash + Reputation + Research icons with amounts
- Action buttons: "Fulfill Order" (primary) / "Dismiss" (text-only)

**States**:
- Fulfilled: Checkmark animation, fly-up currency animations to top HUD
- Insufficient: Grayed items with red X, "Fulfill" button disabled

### Upgrade Shop Modal
**Layout**:
- Slide-up from bottom, full-screen scrollable list
- Category headers: Space, Workbench, Quality Tools, Logistics, R&D
- Upgrade cards: Icon (left), title + description, cost (right), "Upgrade" button
- Visual preview: Small before/after illustration for visual upgrades

**Feedback**:
- On purchase: Card pulses green, immediate board change (e.g., unlocked tile appears), confetti burst

### R&D Tree Modal
**Layout**:
- Full-screen dark overlay
- Node tree (vertical flow): Circular nodes connected by lines
- Each node: Icon, title, cost in Research, lock state
- Freedom Controller node (bottom): Large, glowing when unlocked

### Lockout Event Modal
**Layout**:
- Full-screen takeover with dramatic vignette
- Phase 1: "FIRMWARE UPDATE" header, Bulb Baron mascot (generated), warning text
- Phase 2: Two choice cards side-by-side (Emergency Crate vs Lab Requests)
- Phase 3: Liberation animation (chains breaking, Dependency dropping)

### Settings Modal
**Layout**:
- Standard slide-up modal
- Toggle switches: Sound FX, Haptics, Reduced Motion
- Text size slider
- Reset Progress (nested under "Advanced" with double-confirmation)

## Visual Feedback System

**Merge Animation** (300ms total):
1. Parts snap together (100ms)
2. Bright flash in family color (50ms)
3. New tier part scales in (150ms)
4. Particle burst (20-30 particles, 400ms decay)
5. Haptic: Medium impact
6. Sound: "Snap" + ascending pitch per tier

**Order Completion** (800ms sequence):
1. "STAMP" sound + haptic heavy impact
2. Checkmark overlay on order card (200ms)
3. Currency fly-up animations to HUD (600ms bezier curve)
4. Counter increment with bounce (100ms)

**Dependency Threshold Hit** (when crossing 20/40/60/80):
1. Meter flashes warning color (3 pulses)
2. Haptic: Warning pattern (3 short buzzes)
3. Toast appears: "DEPENDENCY RISING: [consequence]"

**Workbench Cooldown**:
- Circular progress indicator around Workbench icon
- On ready: Glow pulse + haptic light
- Subtle "breathing" animation when tapable

## Generated Assets

**App Identity**:
- `icon.png` - Neon lightbulb with split blue/gold glow, industrial badge frame
- `splash-icon.png` - Same icon on dark workshop background

**Game Board**:
- `workbench-station.png` - Industrial workbench with tools, neon accent
- `order-inbox-station.png` - Mail tray with glowing notification badge area
- `rd-bench-locked.png` - Lab table with lock overlay
- `rd-bench-unlocked.png` - Lab table with active beakers

**Part Sprites** (56×56pt each, transparent background):
- `clip-open.png` through `premium-open.png` - Blue/white glowing parts (5 tiers)
- `clip-locked.png` through `premium-locked.png` - Gold/purple glowing parts (5 tiers)

**Characters**:
- `bulb-baron-avatar.png` - Cartoonish villain mascot, gold suit, lightbulb monocle
- `customer-avatar-1.png` through `customer-avatar-5.png` - Diverse homeowner portraits

**Empty States**:
- `empty-orders.png` - Mailbox with "No new orders" illustration
- `empty-research.png` - Lab table with "Research locked" padlock

**UI Elements**:
- `currency-cash.png` - Gold coin icon (24×24pt)
- `currency-reputation.png` - Cyan star icon (24×24pt)
- `currency-research.png` - Purple beaker icon (24×24pt)
- `particle-spark.png` - Small glow particle for merge bursts (8×8pt)

**Onboarding**:
- `tutorial-hand.png` - Pointing hand for first-time gestures

All assets should use vibrant neon colors with subtle bloom effects, industrial/technical styling, and transparent backgrounds for compositing. Avoid photorealism—aim for stylized clarity that reads instantly at 30fps during rapid gameplay.