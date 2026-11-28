# External visual diagnosis — 2026-11-28

Source screenshot supplied by user:
https://efieodrwkmpcxftnlaqx.supabase.co/storage/v1/object/public/warp-images/warp/1795866345536-b7e4f2ce-39a0-4fd7-bfb4-5a25282b420e-image.png

Observed behavior: the Desktop sidebar appears to sit over the page instead of pushing the main content. The `/orders` area is compressed/covered and the right side becomes a large black region.

Repository findings:
- `ops-console-desktop.css` was a legacy stylesheet imported from `main.tsx`; it had no JSX consumers and was removed.
- `index.css` still contains legacy `!important` rules targeting `.global-theme-runtime .order-control-room` and `[data-slot="sidebar-inner"]`, which can override the Central Visual System.
- `Sidebar` currently renders a fixed sidebar container while a separate sidebar gap is used for layout. The migration target is a docked desktop rail whose gap and `SidebarInset` width are authoritative.
