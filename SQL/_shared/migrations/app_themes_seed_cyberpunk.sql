-- SUPHABASS / ST SINGTO STORE
-- Dynamic mobile-app themes. Run safely more than once.
-- app_themes is the source of truth for the Mobile Inbox theme picker.

insert into public.app_themes
  (theme_key, name, description, background_color, surface_color, primary_color, accent_color, border_style, button_style, radius, glow, motion_enabled, is_enabled, sort_order, version)
values
  ('theme-001', 'Cyber Neon', 'ฟ้าไซเบอร์ × ชมพูนีออน', '#080d1d', '#101827', '#00e5ff', '#ff00d9', 'gradient', 'solid', 16, 12, true, true, 1, 1),
  ('theme-002', 'Quantum Violet', 'ม่วงควอนตัม × ไซแอน', '#100c20', '#1a1530', '#b89aff', '#59edff', 'neon', 'gradient', 16, 14, true, true, 2, 1),
  ('theme-003', 'Emerald Matrix', 'เขียวเมทริกซ์ × มิ้นต์', '#071710', '#10251b', '#75ffac', '#00e5cf', 'hud', 'solid', 14, 11, true, true, 3, 1),
  ('theme-004', 'Crimson Ops', 'แดงปฏิบัติการ × อำพัน', '#170b14', '#29121e', '#ff728c', '#ffc56a', 'rail', 'gradient', 12, 18, true, true, 4, 1),
  ('theme-005', 'Arctic Pulse', 'น้ำแข็ง × ลาเวนเดอร์', '#091721', '#122637', '#8beeff', '#c4aeff', 'neon', 'outline', 16, 13, true, true, 5, 1),
  ('theme-006', 'Midnight Gold', 'ทองกลางคืน × ฟ้า', '#15130b', '#252116', '#ffd477', '#7ae9ff', 'gradient', 'solid', 16, 16, true, true, 6, 1),
  ('theme-007', 'Electric Ocean', 'น้ำเงินไฟฟ้า × เทอร์ควอยซ์', '#080f23', '#13223c', '#6fafff', '#5effd6', 'hud', 'gradient', 15, 14, true, true, 7, 1),
  ('theme-008', 'Solar Flare', 'ส้มสุริยะ × ชมพู', '#1a0e0b', '#2b1b16', '#ffab68', '#ff72c7', 'gradient', 'solid', 16, 15, true, true, 8, 1),
  ('theme-009', 'Toxic Lime', 'มะนาวพิษ × ไซแอน', '#0d1609', '#1b2713', '#bcff63', '#68eaff', 'neon', 'solid', 13, 17, true, true, 9, 1),
  ('theme-010', 'Rose Hologram', 'โรสโฮโลแกรม × ม่วง', '#190d1e', '#2a1830', '#ff94dd', '#bba2ff', 'gradient', 'outline', 18, 14, true, true, 10, 1),
  ('theme-011', 'Plasma Purple', 'พลาสมา × โรส', '#120920', '#211333', '#cb8cff', '#ff80aa', 'neon', 'gradient', 15, 18, true, true, 11, 1),
  ('theme-012', 'Aqua Terminal', 'อควาเทอร์มินัล × อินดิโก', '#061918', '#102a29', '#5dffdf', '#9baaff', 'hud', 'solid', 14, 12, true, true, 12, 1),
  ('theme-013', 'Sakura Circuit', 'ซากุระเซอร์กิต × มิ้นต์', '#190e17', '#2c1d29', '#ffa8cc', '#7bfff0', 'rail', 'gradient', 16, 13, true, true, 13, 1),
  ('theme-014', 'Cobalt Reactor', 'โคบอลต์รีแอคเตอร์ × ทอง', '#080e20', '#142039', '#82a0ff', '#ffcb6f', 'neon', 'solid', 14, 16, true, true, 14, 1),
  ('theme-015', 'Amber Command', 'อำพันบัญชาการ × ไลม์', '#191409', '#2b2515', '#ffca63', '#d0ff7b', 'gradient', 'solid', 16, 12, true, true, 15, 1),
  ('theme-016', 'Frost Mint', 'มิ้นต์เย็น × ฟรอสต์', '#0a1815', '#142923', '#a2ffde', '#9fc7ff', 'minimal', 'outline', 18, 10, true, true, 16, 1),
  ('theme-017', 'Ultraviolet Wave', 'อัลตราไวโอเลต × ชมพู', '#120d23', '#211832', '#dbacff', '#ff8be3', 'gradient', 'gradient', 16, 17, true, true, 17, 1),
  ('theme-018', 'Inferno Signal', 'คอรัล × เปลวไฟ', '#190d0e', '#2c171b', '#ff8872', '#ffc56b', 'rail', 'solid', 12, 19, true, true, 18, 1),
  ('theme-019', 'Silver Circuit', 'เงินวงจร × ไอซ์บลู', '#0d1420', '#1b2735', '#d7eaff', '#82dfff', 'hud', 'outline', 14, 9, true, true, 19, 1),
  ('theme-020', 'Galaxy Spectrum', 'กาแล็กซี × แมเจนตา', '#100d20', '#1d1933', '#97eaff', '#ff9cdb', 'gradient', 'gradient', 18, 16, true, true, 20, 1),
  ('theme-021', 'Meta Monochrome', 'ขาวดำแบบ Meta', '#f5f5f5', '#ffffff', '#111111', '#65676b', 'minimal', 'outline', 14, 3, false, true, 21, 1),
  ('theme-022', 'Black Plain', 'ดำเรียบสำหรับโหมดประหยัดแสง', '#050505', '#111111', '#f5f5f5', '#777777', 'minimal', 'solid', 10, 2, false, true, 22, 1)
on conflict (theme_key) do update set
  name = excluded.name,
  description = excluded.description,
  background_color = excluded.background_color,
  surface_color = excluded.surface_color,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
  border_style = excluded.border_style,
  button_style = excluded.button_style,
  radius = excluded.radius,
  glow = excluded.glow,
  motion_enabled = excluded.motion_enabled,
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  version = excluded.version,
  updated_at = now();
