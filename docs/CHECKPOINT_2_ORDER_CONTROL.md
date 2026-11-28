# Checkpoint 2 · Order Control

Date: 2026-11-28
Branch: `feat/central-visual-system-rebuild`

## Rollback

Rollback this room as one unit to the preceding shell checkpoint:

- `7a0b88f` · `feat: migrate dashboard shell to central visual system`
- Shell rollback tag: `checkpoint-1-shell-rollback-8319742`

## Scope

Migrated only the Order Control visual layer. Query, mutation, filtering, export, copy actions, selected-order state, tracking lookup, chat lookup, Telegram lookup, warnings and data rendering were not changed.

The room no longer uses the old visual owner selectors in `OrderControl.tsx`:

- `order-control-room`
- `cosmic-stage`
- `cosmic-corner`
- `blackbox-hero`
- `signal-metric`
- `order-list-card`
- `order-detail-card`

Central replacements now own the room surfaces:

- `central-visual-order-room`
- `central-visual-order-hero`
- `central-visual-order-search-drawer`
- `central-visual-order-metric`
- `central-visual-order-list-panel`
- `central-visual-order-list-card`
- `central-visual-order-detail-card`

Central CSS controls the room panel/card material, selected/hover states, metric treatment, and search drawer through desktop tokens. The old Order Control selectors remain in legacy CSS files for other historical source references, but no longer match this room's new root or surface classes.

## Validation

- Central adapter tests: passed, 8/8.
- Production build: passed.
- `git diff --check`: passed.
- TypeScript check: still exits 2 on pre-existing repository-wide errors. No `OrderControl`, `DashboardLayout`, or `central-visual` error was reported.
- Build warnings remain the known escaped Tailwind grid selector warnings and bundle-size warning.

## Visual acceptance still required

No browser/deployment session was available in this sandbox, so screenshots were not captured. Before starting Warp Drive migration, inspect `/orders` for:

- background/gutter visibility
- translucent dark cards without full-page accent wash
- selected/hover/empty/loading/error states
- search Sheet portal styling
- responsive layout and scroll behavior
- unchanged order data/actions
