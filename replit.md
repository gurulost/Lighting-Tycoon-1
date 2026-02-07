# Lighting Tycoon

## Overview

Lighting Tycoon is an idle merge-tycoon mobile game built with React Native and Expo. Players run a neon-lit lighting workshop where they drag-to-merge parts into install kits, fulfill house orders for cash and reputation, and make strategic decisions between using "locked" proprietary components (fast gains, long-term dependency) versus "open-standard" parts (slower but stable).

The game features a cyberpunk aesthetic with industrial-vibrant visuals, dual-glow color systems distinguishing open vs locked parts, and micro-session gameplay designed for 30-90 second play sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native + Expo)

**Framework**: Expo SDK 54 with React Native 0.81, using the new architecture. The app targets iOS, Android, and web platforms.

**Navigation**: React Navigation with native stack navigators. The main game bypasses traditional tab navigation - the merge board IS the primary interface with modal overlays for orders, upgrades, R&D, and settings.

**State Management**: React Context (`GameContext`) with `useReducer` for game state. Actions handle spawning parts, merging, fulfilling orders, purchasing upgrades, R&D progression, and the "Bulb Baron" villain mechanics.

**Animations**: React Native Reanimated for smooth 60fps animations on merges, currency updates, and UI feedback. Expo Haptics provides tactile feedback for game actions.

**Styling**: Custom theme system in `client/constants/theme.ts` with game-specific color palettes (open-standard blues, locked golds/purples, currency colors, tier colors).

### Backend (Express + PostgreSQL)

**Server**: Express 5 with TypeScript, running on Node. Handles game save persistence via REST API endpoints.

**Database**: PostgreSQL with Drizzle ORM. Schema includes:
- `users` table for authentication (not fully implemented yet)
- `gameSaves` table storing session state: currencies, board state (JSONB), unlocked slots, upgrades, R&D nodes, tutorial progress

**API Routes**:
- `GET /api/game/:sessionId` - Fetch saved game
- `POST /api/game` - Create new save
- `PUT /api/game/:sessionId` - Update existing save
- `DELETE /api/game/:sessionId` - Delete save

### Path Aliases

- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

### Key Game Systems

**Merge Board**: 5x6 grid (30 slots) with fixed stations (Workbench, Order Inbox, R&D Bench). Parts merge through 5 tiers: Clips → Tracks → Segments → Smart Kits → Premium Systems.

**Dual Economy**: Open-standard parts (blue glow) vs Locked parts (gold/purple glow). Locked parts raise a Dependency meter that triggers "lockout" events forcing player choices.

**Progression**: Cash, Reputation, and Research currencies. Upgrades expand board space and improve generation. R&D tree leads to "Freedom Controller" as end-game goal.

## External Dependencies

**Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)

**Key NPM Packages**:
- `expo` - Mobile app framework
- `drizzle-orm` + `drizzle-zod` - Database ORM and validation
- `@tanstack/react-query` - Server state management
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Touch gestures for drag-and-drop
- `expo-haptics` - Tactile feedback
- `expo-linear-gradient` - Visual effects
- `expo-image` - Optimized image loading

**Build Tools**:
- `tsx` - TypeScript execution for server
- `esbuild` - Server bundling for production
- `drizzle-kit` - Database migrations

## Recent Changes (January 2026)

### Graphics Overhaul
- **Generated 19 custom neon-styled game assets**: Part sprites for all 5 tiers × 2 families (Open/Locked), station icons, Bulb Baron portrait, Freedom Controller, and particle effects
- **Premium visual styling**: Linear gradients, glow effects, and animated pulses throughout the UI
- **Enhanced components**:
  - `PartItem`: Displays sprite images with tier badges, family indicators, and pulsing glow animations
  - `MergeBoard`: Neon grid lines, gradient tile backgrounds, animated station icons
  - `CurrencyDisplay`: Premium gradient styling with animated value changes
  - `DependencyMeter`: Dynamic color transitions, warning pulses, and Bulb Baron portrait at high dependency
  - `OrderCard`: Gradient backgrounds, requirement chips, pulsing glow when fulfillable
  - `OrdersModal`: Premium header styling with stats row
  - `SettingsModal`: Toggle switches for sound, haptics, and notifications

### Tutorial System
- **TutorialOverlay component**: 6-step onboarding guide for new players
- Steps cover: Welcome, Merge Board, Part Families, Customer Orders, Dependency Meter, Getting Started
- Skip option and progress dots for navigation

### TrimLight Animation System
- **TrimLightStrip component**: Programmable light strip inspired by Trimlight with multiple animation modes
- Animation modes: `twinkle` (random sparkle), `chase` (light chaser), `wave` (gentle pulse), `meteor` (shooting star), `colorFade` (color cycling)
- Pattern options: `open` (blue/cyan), `locked` (gold/purple), `rainbow`, `singleColor`
- Strategic placement follows "accent and augment" principle - light effects enhance gameplay without overwhelming
- **Order fulfillment celebrations**: Different animation modes signal order types (meteor for premium, chase for baron contracts, wave for style match, twinkle for standard)
- **Tier 5 Premium parts**: Subtle animated programs (wave for open parts, chase for locked parts)
- **Milestone celebrations**: Rainbow meteor TrimLightStrip appears briefly when player reaches new reputation tier
- All animations respect reduced motion accessibility setting

### Code Quality Fixes
- **Fixed React Native Web deprecation warnings**: All `pointerEvents` usage converted from prop-based (`pointerEvents="none"`) to style-based (`style={{ pointerEvents: "none" }}`) across 7 files (15+ instances)
- Affected files: GameScreen, MergeBoard, TutorialOverlay, OrdersModal, PartItem, DialogueBubble, DebugOverlay

### Asset Files
All game assets are stored in `assets/images/`:
- Part sprites (Tiers 1-5, webp format): `part-{tier}-{family}.webp`
  - Tier 1: `part-clip-open.webp`, `part-clip-locked.webp`
  - Tier 2: `part-track-open.webp`, `part-track-locked.webp`
  - Tier 3: `part-segment-open.webp`, `part-segment-locked.webp`
  - Tier 4: `part-smartkit-open.webp`, `part-smartkit-locked.webp`
  - Tier 5: `part-premium-open.webp`, `part-premium-locked.webp`
- Part sprites (Tiers 6-16, png format): `part-{tier}-{family}.png`
  - Tier 6 (Array): `part-array-open.png`, `part-array-locked.png`
  - Tier 7 (Spine): `part-spine-open.png`, `part-spine-locked.png`
  - Tier 8 (Stack): `part-stack-open.png`, `part-stack-locked.png`
  - Tier 9 (Grid): `part-grid-open.png`, `part-grid-locked.png`
  - Tier 10 (Kingdom): `part-kingdom-open.png`, `part-kingdom-locked.png`
  - Tier 11 (Lattice): `part-lattice-open.png`, `part-lattice-locked.png`
  - Tier 12 (Beacon): `part-beacon-open.png`, `part-beacon-locked.png`
  - Tier 13 (Nexus): `part-nexus-open.png`, `part-nexus-locked.png`
  - Tier 14 (Skyline): `part-skyline-open.png`, `part-skyline-locked.png`
  - Tier 15 (Atlas): `part-atlas-open.png`, `part-atlas-locked.png`
  - Tier 16 (Legacy): `part-legacy-open.png`, `part-legacy-locked.png`
- Station icons: `station-workbench.webp`, `station-inbox.webp`, `station-rd.webp`
- Characters: `bulb-baron.png`, `freedom-controller.webp`
- Effects: `particle-merge-open.png`, `particle-merge-locked.png`