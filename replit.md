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