# Baseline · Central Visual System Rebuild

- Baseline branch source: `fix/room-04-card-theme`
- Baseline commit: `a227435 docs: plan central visual system rebuild`
- Previous code checkpoint: `da5fd3b fix: allow complete appearance persistence`
- Rebuild branch: `feat/central-visual-system-rebuild`
- Baseline captured: 2026-11-28
- Workspace status at capture: clean
- Rollback: `git switch fix/room-04-card-theme` or reset/revert to `a227435`

## Safety boundary

This rebuild changes only the visual/appearance layer. The following are protected and must not be changed as part of the visual migration: order processing, chat send/receive, stock, bill, parcel/tracking, business source-of-truth, business database tables, and Mobile Inbox behavior.

## Route inventory

| Route | Component / room | Visual migration scope | Protected behavior |
|---|---|---|---|
| `/` | HomeRoute | global shell | navigation only |
| `/orders` | OrderControl | shell, panels, cards, tables | order query/actions |
| `/order-editor` | OrderEditor | shell, forms, cards | order editing |
| `/script-atelier` | ScriptAtelier | shell, editor surfaces | script data/actions |
| `/parcel-mapping` | ParcelMapping | shell, mapping cards | parcel workflow |
| `/warp-drive` | WarpDriveRoom | shell, panels, background | tracking/warp workflow |
| `/chats` | ChatHub | shell, chat surfaces | chat workflow |
| `/line-chat` | LineChat | shell, chat surfaces | LINE workflow |
| `/mobile-inbox` | MobileInbox | **protected / exclude from bulk CSS** | mobile chat behavior and UI |
| `/secret-gallery` | SecretGallery | control room, real card preview | vault/gallery behavior |
| `/secret-gallery/connect` | SecretGallery | same room contract | vault connection |
| `/secret-gallery/images` | SecretGallery | same room contract | gallery behavior |
| `/telegram-delivery` | TelegramDeliveryRoom | shell, panels, cards | Telegram delivery |
| `/andromeda` | TelegramDeliveryRoom | shell, panels, cards | Telegram delivery |
| `/telegram-sent-history` | TelegramSentHistory | shell, archive cards | sent history |
| `/alert-room` | AlertRoom | shell, alert panels | alert workflow |
| `/blackbox` | BlackboxRoom | shell, operational cards | blackbox workflow |
| `/order-performance` | OrderPerformance | shell, metrics | reporting behavior |
| `/stock-room` | StockRoom | shell, product cards/tables | stock workflow |
| `/system-manual` | SystemManual | shell, document surfaces | manual content |
| `/mapping-dashboard` | MappingDashboard | shell, mapping surfaces | mapping behavior |
| `/order-buckets` | OrderBuckets | shell, bucket cards | order grouping |
| `/daily-order-summary` | DailyOrderSummary | shell, summary cards | reporting behavior |
| `/order-history` | OrderHistory | shell, history cards/tables | history behavior |
| `/connect` | redirect to SecretGallery | same room contract | connection behavior |
| `/skin-pack-preview` | SkinPackPreview | inspect before migration | skin preview only |
| `/shipping/import` | ParcelImport | shell, forms | import workflow |

## Current visual/runtime entry points

### Central/runtime candidates

- `client/src/contexts/GlobalThemeRuntime.tsx`
- `client/src/lib/appearance-runtime.ts`
- `client/src/lib/theme-lab.ts`
- `client/src/lib/darkside-skin-engine.ts`
- `client/src/components/AppearanceControlRoom.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/components/DarksideThemePicker.tsx`
- `client/src/components/DarksideCommandPalette.tsx`

### CSS and visual bridges to inventory before deletion

- `client/src/index.css`
- `client/src/BB-STORE-ORDERS-cyberpunk-neon.css`
- `client/src/styles/cyber-frames.css`
- `client/src/styles/ops-console-desktop.css`
- selectors/classes: `.neon-card`, `.project-room-card`, `[data-slot="card"]`, room-specific wrappers, hard-coded `bg-[#...]`, `bg-black/...`, gradients, and `!important` visual bridges

### Catalog/admin surfaces

- `client/src/components/CustomizationAdmin.tsx`
- `client/src/components/CyberFrameVault.tsx`
- `public.app_themes`
- `public.app_chat_frames`
- `public.app_backgrounds`
- `public.app_customization_selections`

## Current appearance contract snapshot

- Current selection layers: Atmosphere, Theme, Background, Card Style, Frame, Applied/Draft
- Current fallback order: Room → Global → Default
- Current Card Style keys: `balanced`, `glass`, `dense`, `solid`
- Current Appearance asset types: `theme`, `frame`, `atmosphere`, `card_style`, `background`
- Current persistence table: `app_customization_selections`
- Draft is local; Applied is persisted through the protected vault proxy
- Current reference direction: Dark Base + Accent Theme + Background Atmosphere + Card Material

## Baseline visual references

These are references only; they are not application data and must not be embedded into business workflows.

- Room 04 operational card reference: https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795855071890-255b378d-0e84-4c63-b783-23822e137bab-image.png
- Room 04 / operational shell reference: https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795855244260-759683ec-3a2b-4c62-a160-984ba23823f4-image.png
- Mobile layer/card references: https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795855411930-b3df090b-9d70-404b-b0bf-fa382492df9c-image.png
- Dark Base / Crimson reference: https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795857219983-39ec10a1-59ef-4ead-8a6b-a4435de17871-image.png
- Dark Base / Amber reference: https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795857231167-ed71f83c-b8a4-4fd7-8d8a-c3e4f1d78490-image.png

## Verification recorded before migration

- `git diff --check`: passed at baseline work
- Production build: passed at `da5fd3b` checkpoint
- Known unrelated build warnings: CSS optimizer warnings for escaped Tailwind grid selectors and bundle-size warning
- No visual migration has started on this branch yet

## Phase 0 exit criteria

- [x] Baseline branch/source commit recorded
- [x] Dedicated rebuild branch created
- [x] Route inventory recorded
- [x] Visual/runtime entry points recorded
- [x] Protected business/mobile boundaries recorded
- [x] Reference URLs recorded
- [ ] Desktop/mobile screenshot matrix captured for every in-scope room
- [ ] Current token/class consumer map completed
- [ ] Central Visual Contract approved before Phase 1 implementation
