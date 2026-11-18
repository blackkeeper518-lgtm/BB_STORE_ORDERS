-- SUPHABASS DARKSIDE / ten additional graphic cyberpunk themes
-- Safe to run repeatedly. Each theme is rendered with the built-in Darkside grid, scanline and glow preview.
insert into public.app_themes
  (theme_key, name, description, background_color, surface_color, primary_color, accent_color, text_primary_color, text_secondary_color, font_body, font_heading, border_style, button_style, radius, glow, motion_enabled, is_enabled, sort_order, version)
values
  ('theme-023', 'Darkside Redline', 'ดำสนิท × แดงเลเซอร์ × เส้นสแกน', '#090307', '#1d0a12', '#ff3157', '#ff9f43', '#fff5f7', '#d6a7b2', 'Noto Sans Thai', 'Chakra Petch', 'rail', 'gradient', 16, 22, true, true, 23, 1),
  ('theme-024', 'Crimson Vault', 'แดงเลือด × ดำโลหะ × วงจรเรืองแสง', '#0b0308', '#220b13', '#e5093f', '#ff4f9a', '#fff1f4', '#d49aa8', 'Noto Sans Thai', 'Chakra Petch', 'neon', 'solid', 14, 24, true, true, 24, 1),
  ('theme-025', 'Magma Relay', 'แมกมา × ส้มร้อน × สัญญาณเตือน', '#120604', '#28100a', '#ff4b24', '#ffc857', '#fff7ed', '#dfb59d', 'Noto Sans Thai', 'Chakra Petch', 'hud', 'gradient', 18, 20, true, true, 25, 1),
  ('theme-026', 'Ruby Protocol', 'ทับทิม × ชมพูไฟฟ้า × แผงควบคุม', '#0c030b', '#230b1c', '#ff1744', '#ff61c7', '#fff2f8', '#d9a9c6', 'Noto Sans Thai', 'Chakra Petch', 'gradient', 'gradient', 15, 21, true, true, 26, 1),
  ('theme-027', 'Red Static', 'แดงสัญญาณรบกวน × เทาเข้ม × scanline', '#08090d', '#19151b', '#ff3b30', '#c7d2fe', '#ffffff', '#b9b5c1', 'Noto Sans Thai', 'Chakra Petch', 'rail', 'outline', 12, 17, true, true, 27, 1),
  ('theme-028', 'Neon Garnet', 'โกเมนเข้ม × แดงนีออน × ฟ้าเย็น', '#09050b', '#1c0d18', '#d90445', '#58e6ff', '#fff4fa', '#a8cbd0', 'Noto Sans Thai', 'Chakra Petch', 'neon', 'solid', 16, 23, true, true, 28, 1),
  ('theme-029', 'Black Ember', 'ถ่านดำ × ประกายไฟ × amber pulse', '#0a0705', '#21130c', '#ff5733', '#ffcf70', '#fff8ef', '#d6b99b', 'Noto Sans Thai', 'Chakra Petch', 'hud', 'gradient', 13, 19, true, true, 29, 1),
  ('theme-030', 'Scarlet Matrix', 'สการ์เล็ต × เขียวพิษ × เมทริกซ์', '#070908', '#111a13', '#ff244f', '#8cff00', '#f7fff4', '#b8c9a7', 'Noto Sans Thai', 'Chakra Petch', 'gradient', 'solid', 17, 22, true, true, 30, 1),
  ('theme-031', 'Night Siren', 'แดงไซเรน × ม่วงเข้ม × คลื่นเตือน', '#0a040d', '#1d0c27', '#ff335f', '#b66dff', '#fff2fb', '#c4a9d1', 'Noto Sans Thai', 'Chakra Petch', 'rail', 'gradient', 19, 25, true, true, 31, 1),
  ('theme-032', 'Operator Black', 'ดำปฏิบัติการ × แดงคม × ขาว tactical', '#050607', '#14171c', '#ff4655', '#e8edf2', '#ffffff', '#a9b2bc', 'Noto Sans Thai', 'Chakra Petch', 'minimal', 'outline', 10, 14, true, true, 32, 1)
on conflict (theme_key) do update set
  name = excluded.name,
  description = excluded.description,
  background_color = excluded.background_color,
  surface_color = excluded.surface_color,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
  text_primary_color = excluded.text_primary_color,
  text_secondary_color = excluded.text_secondary_color,
  font_body = excluded.font_body,
  font_heading = excluded.font_heading,
  border_style = excluded.border_style,
  button_style = excluded.button_style,
  radius = excluded.radius,
  glow = excluded.glow,
  motion_enabled = excluded.motion_enabled,
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  version = excluded.version,
  updated_at = now();
