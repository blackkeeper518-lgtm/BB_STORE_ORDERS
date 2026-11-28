# DARKSIDE Prime · Global Theme Fallback

`DARKSIDE-PRIME` is now the global theme fallback for the Central Visual runtime.

The fallback is used only when no valid applied room appearance or selected global theme exists. Existing applied room/global choices remain unchanged. The runtime first honors the room appearance, then the persisted global selection, and only then falls back to `DARKSIDE-PRIME`.

The catalog source is `public.app_themes` in the appearance project. The verified catalog row is:

| Field | Value |
|---|---|
| `theme_key` | `DARKSIDE-PRIME` |
| `name` | `DARKSIDE Prime` |
| `background_color` | `#08040f` |
| `surface_color` | `#13091f` |
| `primary_color` | `#ad5cff` |
| `accent_color` | `#5de9ff` |
| `border_style` | `neon` |
| `button_style` | `gradient` |
| `radius` | `10` |
| `glow` | `20` |
| `motion_enabled` | `true` |

A local copy of the same values is retained so the application still has the same fallback when Supabase is unavailable or the catalog has no valid rows. If the catalog is available but the fallback row is missing, the local DARKSIDE Prime fallback is added without changing business data.

The Central Visual adapter recognizes `DARKSIDE-PRIME` as the violet identity family. This affects only visual token adaptation; it does not alter order, chat, stock, bill, tracking, Mobile Inbox, or appearance persistence schemas.

Validation completed: Central adapter tests passed 9/9, production build passed, and `git diff --check` passed. Existing CSS optimizer and bundle-size warnings remain unchanged.
