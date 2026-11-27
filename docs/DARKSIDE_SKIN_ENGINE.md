# DARKSIDE // INBOX — Data-Driven Skin Engine

## Schema ที่แนะนำ

`app_themes` ยังใช้คอลัมน์เดิมได้ทั้งหมด (`background_color`, `surface_color`, `primary_color`, `accent_color`, `radius`, `glow`, `motion_enabled`) และเพิ่ม `category`, `config jsonb`, `updated_at` โดย `config` ใช้โครงสร้างนี้:

```json
{
  "material": "glass | hud | oled | holo | solid",
  "frame": "rounded | cut-corner | rail | minimal | pill",
  "border_motion": "beam | pulse | scan | none",
  "colors": { "bg": "#08040f", "surface": "#13091f", "primary": "#ad5cff", "accent": "#5de9ff", "border": "rgba(173,92,255,.32)" },
  "backdrop_blur": 18,
  "glow_strength": 20,
  "audio": { "notification": "https://…", "click": "https://…", "switch": "https://…", "volume": 0.28, "enabled": true }
}
```

`chat_frames` เป็น relation เสริมต่อ `theme_key` สำหรับ override `shape`, `material`, `border_motion`, `radius`; `sound_packs` เป็น relation เสริมสำหรับ `notification_url`, `click_url`, `switch_url` และ `config`. ถ้า relation ไม่มีข้อมูล ระบบใช้ค่าจาก `app_themes.config` แล้ว fallback ไปคอลัมน์ legacy อัตโนมัติ จึงไม่ต้อง migrate ข้อมูลเดิมในครั้งเดียว

## Frontend ที่ส่งมอบ

- `client/src/lib/darkside-skin-engine.ts` เป็น core: row normalizer, HSL/RGB/HEX luminance, auto-contrast, root CSS injector, frame/material attributes, low-latency audio preload/playback, clipboard tracking parser และ fuzzy score
- `client/src/contexts/GlobalThemeRuntime.tsx` query `app_themes` แบบ `select('*')`, เติม `chat_frames`/`sound_packs` แบบ best-effort และ sync active skin ผ่าน `localStorage`/custom event
- `client/src/components/DarksideThemePicker.tsx` แสดงจำนวนสกินจริง, search, category filter, swatch, material/frame preview, active state และ mute
- `client/src/components/DarksideCommandPalette.tsx` รองรับ `Ctrl+K`, `/`, theme switching, order search และ quick reply copy
- `client/src/styles/darkside-skin-engine.css` รองรับ Glassmorphism, Cyber HUD cut-corner, OLED Stealth, Holo Gradient, beam/pulse/scan และ responsive split-screen layout
- `ChatHub.tsx` ดักเลขพัสดุจาก paste event แล้วเติมข้อความพร้อม tactical notification sound

## ติดตั้ง

1. รัน `supabase-darkside-skin-engine.sql` ใน Supabase SQL Editor
2. ตรวจ policy ของ `app_themes`, `chat_frames`, `sound_packs` ให้ server-side Supabase client ของโปรเจกต์อ่านได้
3. ถ้าใช้ไฟล์เสียงจริง ให้วาง URL HTTPS ลง `sound_packs` หรือ `config.audio`
4. ตรวจ `pnpm check` และ `pnpm build`
