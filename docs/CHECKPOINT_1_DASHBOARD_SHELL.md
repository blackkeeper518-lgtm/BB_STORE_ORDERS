# Checkpoint 1 · Dashboard Canvas / Shell

Date: 2026-11-28
Branch: `feat/central-visual-system-rebuild`

## Rollback

Pre-change rollback commit: `8319742` (`feat: add scoped central visual css layers`)

If this checkpoint is rejected, reset or revert to the pre-change commit above. Room content/card migration must not start until this shell checkpoint is visually accepted.

## Scope

This checkpoint changes only the Dashboard Canvas / Shell visual ownership. It does not change business logic, source-of-truth, Supabase tables, order/chat/stock/bill/tracking workflows, or Mobile Inbox.

The Dashboard shell now exposes explicit Central Visual markers:

- `data-visual-scope="desktop-app"`
- `data-visual-surface="canvas"`
- `central-visual-shell`
- `central-visual-sidebar`
- `central-visual-sidebar-header`
- `central-visual-sidebar-menu`
- `central-visual-sidebar-footer`
- `central-visual-inset`
- `central-visual-utility-strip`

The old shell class names are no longer used by `DashboardLayout`. The duplicate global sidebar/inset theme bridge in `index.css` was removed. The remaining legacy CSS files are still loaded only for room-specific consumers that have not reached their own migration checkpoint; their old shell selectors no longer match the Dashboard shell.

## Validation

- Central adapter tests: passed, 8/8.
- Production build: passed.
- `git diff --check`: passed.
- `pnpm run check`: still fails on pre-existing repository-wide TypeScript errors (73 errors in legacy/unrelated files, including `ChatHub.tsx`, extension imports, missing router members, and server type paths). No error was reported for `DashboardLayout.tsx`, `central-visual-system.css`, or the shell bridge edits.

## Screenshots

The sandbox has no local browser/deployment session available in this checkpoint, so post-change screenshots were not captured here. Required visual acceptance routes remain `/orders`, `/warp-drive`, `/chats`, and `/mobile-inbox`; Mobile Inbox must remain outside `DashboardLayout` and retain its protected scope.
