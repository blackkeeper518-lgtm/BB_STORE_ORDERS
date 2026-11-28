# Visual Runtime and Consumer Inventory

Baseline: `a227435` · branch: `feat/central-visual-system-rebuild` · captured 2026-11-28.

This is an inventory only. It does not authorize deleting legacy CSS yet.

## Runtime ownership

| Area | Current owner | Baseline finding | Migration note |
|---|---|---|---|
| Theme/background loading | `client/src/contexts/GlobalThemeRuntime.tsx` | Loads catalogs and resolves room/global/default selections; injects CSS variables | Replace with one explicit visual contract provider after consumer map approval |
| Appearance persistence | `client/src/lib/appearance-runtime.ts` | Draft/local state, applied state, Supabase proxy persistence and reset | Preserve Draft → Preview → Apply → Reset semantics |
| Control room | `client/src/components/AppearanceControlRoom.tsx` | Owns room selection and appearance actions | Keep business/persistence behavior; change only visual controls later |
| Global desktop shell | `client/src/components/DashboardLayout.tsx` | Sidebar, top utility strip and theme selector are shell-level consumers | First migration target after contract is approved |
| Card primitive | `client/src/components/ui/card.tsx` | Shared primitive exists but not all rooms consume it consistently | Make this the visual contract boundary, not a business-data boundary |
| Legacy skin normalization | `client/src/lib/darkside-skin-engine.ts` | Runtime/normalization candidate with legacy names | Replace and remove only after all consumers migrate |
| Frame styling | `client/src/styles/cyber-frames.css` | Separate frame layer with selectors overlapping cards | Convert to contract tokens, then delete old selectors |
| Desktop operational styling | `client/src/styles/ops-console-desktop.css` | Room/shell overrides and theme references | Audit per selector before removal |
| Global stylesheet | `client/src/index.css` | Largest bridge: 529 matches for theme-related patterns and 419 hard-coded surface/gradient matches | Split by contract layer during Phase 1; no blind delete |
| Legacy neon stylesheet | `client/src/BB-STORE-ORDERS-cyberpunk-neon.css` | Contains legacy card/visual rules | Retire after consumer migration |

## Consumer counts from baseline scan

The scan covers `client/src` TypeScript/TSX/CSS files. Counts are occurrences, not unique semantic consumers.

- Theme/runtime-related pattern: 584 matches in 10 files; `index.css` accounts for 529.
- Appearance runtime/persistence pattern: 32 matches in 3 files.
- Card contract patterns (`.neon-card`, `.project-room-card`, card slot): 77 matches in 7 files.
- Legacy theme/darkside patterns: 103 matches in 15 files.
- Hard-coded surfaces/gradients (`bg-[#...]`, `bg-black/...`, `bg-white/...`, gradients): 926 matches in 50 files.
- Mobile Inbox-related pattern: 1,062 matches in 14 files, including 874 in `index.css` and 130 in `MobileInbox.tsx`.

## Highest-risk files

1. `client/src/index.css` — global bridge and Mobile Inbox selectors coexist; must be partitioned carefully.
2. `client/src/components/DashboardLayout.tsx` — shell-level theme selector/layout ownership.
3. `client/src/contexts/GlobalThemeRuntime.tsx` — runtime source of CSS variables and fallbacks.
4. `client/src/lib/appearance-runtime.ts` — persistence contract; do not mix with CSS rewrite.
5. `client/src/pages/SecretGallery.tsx` — preview/control-room consumer and card reference.
6. `client/src/styles/ops-console-desktop.css` and `client/src/styles/cyber-frames.css` — overlapping room/frame overrides.
7. `client/src/pages/MobileInbox.tsx` — protected; no bulk migration.

## Protected Mobile Inbox boundary

- Route: `/mobile-inbox`
- Component: `client/src/pages/MobileInbox.tsx`
- Additional mobile consumers: `MobileInboxProductDock.tsx`, `MobileStockPanel.tsx`, chat controls and mobile-safe-area tests.
- Compatibility rule: the new visual root must not leak desktop card/background/frame rules into this route. Use an explicit exclusion marker or separate root scope and verify with a screenshot/test before each migration batch.

## Baseline screenshot matrix

Screenshots are clean browser captures from the current deployed app. They are reference evidence, not generated design assets.

| Capture | Route | Purpose | File |
|---|---|---|---|
| Desktop shell/chat | `/chats` | Shared sidebar/top strip and chat cards | `/home/ubuntu/screenshots/bb-store-orders-iibr_2026-11-28_09-21-49_5943.webp` |
| Desktop orders | `/orders` | Metrics/card/table language | [`orders.webp`](baseline-screenshots/orders.webp) |
| Room 04 | `/warp-drive` | Dark base + space background + operational panels | [`warp-drive.webp`](baseline-screenshots/warp-drive.webp) |
| Secret Gallery lock | `/secret-gallery` | Current control-room entry surface | [`secret-gallery-lock.webp`](baseline-screenshots/secret-gallery-lock.webp) |
| Protected mobile | `/mobile-inbox` | Exclusion reference only | [`mobile-inbox-protected.webp`](baseline-screenshots/mobile-inbox-protected.webp) |

Note: Secret Gallery requires its room password to reach the authenticated preview/control room. The lock surface is recorded; no password was entered during baseline capture.

## Phase 0 conclusion

The baseline is sufficient to start Phase 1 design/contract work, but not to delete legacy visual files. The next approval point is the Central Visual Contract: token names, layer order, route scope, Mobile Inbox exclusion mechanism, and rollback checkpoint.
