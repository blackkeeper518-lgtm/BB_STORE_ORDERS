# Visual Route Inventory

Captured from `client/src/App.tsx` on 2026-11-28, baseline commit `a227435`.

## Shared shell routes

All routes below render through `Shell`, which currently wraps `DashboardLayout`:

- `/shipping/import` → `ParcelImport`
- `/orders` → `OrderControl`
- `/order-editor` → `OrderEditor`
- `/script-atelier` → `ScriptAtelier`
- `/parcel-mapping` → `ParcelMapping`
- `/warp-drive` → `WarpDriveRoom`
- `/chats` → `ChatHub`
- `/line-chat` → `LineChat`
- `/vagabond` → `CloseJobHistory`
- `/close-job-history` → `CloseJobHistory`
- `/telegram-delivery` → `TelegramDeliveryRoom`
- `/andromeda` → `TelegramDeliveryRoom`
- `/telegram-sent-history` → `TelegramSentHistory`
- `/alert-room` → `AlertRoom`
- `/blackbox` → `BlackboxRoom`
- `/order-performance` → `OrderPerformance`
- `/stock-room` → `StockRoom`
- `/system-manual` → `SystemManual`
- `/mapping-dashboard` → `MappingDashboard`
- `/order-buckets` → `OrderBuckets`
- `/daily-order-summary` → `DailyOrderSummary`
- `/order-history` → `OrderHistory`

## Special routes

- `/secret-gallery`, `/secret-gallery/connect`, `/secret-gallery/images` → `SecretGallery`; protected vault/control-room flow, visual migration in scope after shell contract is ready.
- `/mobile-inbox` → `MobileInbox`; protected exclusion. Do not apply bulk desktop visual CSS or refactor this route during the rebuild.
- `/skin-pack-preview` → `SkinPackPreview`; inspection/catalog route, migrate only after the new contract exists.
- `/connect` → redirect to `/secret-gallery/connect`.
- `/` → device-aware redirect to `/mobile-inbox` or `/chats`.
- `/404` and fallback → `NotFound`.

## Migration order proposal

1. Shared shell and token root.
2. Representative desktop rooms: `/orders`, `/warp-drive`, `/chats`.
3. Remaining shell routes in functional groups.
4. Secret Gallery as the visual control-room preview.
5. Skin pack preview/catalog surfaces.
6. Mobile Inbox remains excluded and receives only an explicit compatibility check.
