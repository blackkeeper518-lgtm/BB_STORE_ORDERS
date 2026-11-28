-- Seed the first 10 selectable backgrounds for the Appearance Control Room.
-- These entries are catalog/config only; the renderer can choose how to animate each config.

insert into public.app_backgrounds
  (background_key, name, description, background_type, asset_url, poster_url, config, is_enabled, sort_order, version, created_by, updated_by)
values
  ('original-space', 'Original Space', 'อวกาศเดิมของระบบ · ดาวและ canvas หลักของ Warp Drive', 'native-space', null, null, '{"motion":"full","preserveSpaceCanvas":true,"overlay":"none"}'::jsonb, true, 1, 1, 'appearance-seed', 'appearance-seed'),
  ('deep-orbit', 'Deep Orbit', 'วงโคจรลึก โทนน้ำเงินเข้ม เคลื่อนไหวเบา ๆ', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 20% 10%, rgba(59,130,246,.24), transparent 34%)","radial-gradient(circle at 80% 70%, rgba(124,58,237,.18), transparent 38%)"],"base":"#030712","animation":"orbit-slow","motion":"reduced"}'::jsonb, true, 2, 1, 'appearance-seed', 'appearance-seed'),
  ('blue-nebula', 'Blue Nebula', 'เนบิวลาสีน้ำเงิน อ่านง่าย เหมาะกับห้องปฏิบัติการ', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 12% 18%, rgba(14,165,233,.30), transparent 34%)","radial-gradient(circle at 88% 60%, rgba(37,99,235,.22), transparent 42%)"],"base":"#06111f","animation":"nebula-drift","motion":"reduced"}'::jsonb, true, 3, 1, 'appearance-seed', 'appearance-seed'),
  ('plasma-orchid', 'Plasma Orchid', 'พลาสมาม่วงชมพูแบบ cyber แต่ไม่ทับพื้นหลังการ์ด', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 22% 8%, rgba(217,70,239,.25), transparent 31%)","radial-gradient(circle at 78% 80%, rgba(124,58,237,.24), transparent 38%)"],"base":"#10051b","animation":"plasma-breathe","motion":"reduced"}'::jsonb, true, 4, 1, 'appearance-seed', 'appearance-seed'),
  ('signal-amber', 'Signal Amber', 'อำพันสำหรับติดตามสถานะและสัญญาณเตือน', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 18% 0%, rgba(245,158,11,.22), transparent 32%)","linear-gradient(145deg, #100b06, #1b1208 55%, #080706)"],"animation":"signal-pulse","motion":"reduced"}'::jsonb, true, 5, 1, 'appearance-seed', 'appearance-seed'),
  ('quiet-black', 'Quiet Black', 'ดำสงบ ลดแสงรบกวนสำหรับหน้าข้อมูลหนาแน่น', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 80% 0%, rgba(148,163,184,.12), transparent 30%)"],"base":"#050608","animation":"none","motion":"off"}'::jsonb, true, 6, 1, 'appearance-seed', 'appearance-seed'),
  ('aurora-drift', 'Aurora Drift', 'แสงเหนือไหลช้า โทนฟ้าเขียว ใช้กับห้องดูสถานะ', 'css-animated', null, null, '{"layers":["linear-gradient(120deg, rgba(20,184,166,.18), transparent 42%)","radial-gradient(circle at 70% 20%, rgba(34,211,238,.20), transparent 34%)"],"base":"#04151a","animation":"aurora-drift","motion":"reduced"}'::jsonb, true, 7, 1, 'appearance-seed', 'appearance-seed'),
  ('starfield-grid', 'Starfield Grid', 'ดาวละเอียดผสม grid สำหรับหน้า operations', 'css-animated', null, null, '{"layers":["radial-gradient(circle, rgba(125,211,252,.42) 0 1px, transparent 1.5px)","linear-gradient(rgba(56,189,248,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.08) 1px, transparent 1px)"],"backgroundSize":"120px 96px, 42px 42px, 42px 42px","base":"#050b17","animation":"grid-drift","motion":"reduced"}'::jsonb, true, 8, 1, 'appearance-seed', 'appearance-seed'),
  ('solar-dust', 'Solar Dust', 'ฝุ่นแสงอาทิตย์ โทนอุ่น เหมาะกับห้องสรุปยอด', 'css-animated', null, null, '{"layers":["radial-gradient(circle at 18% 14%, rgba(251,146,60,.24), transparent 34%)","radial-gradient(circle at 82% 72%, rgba(234,179,8,.18), transparent 38%)"],"base":"#160b05","animation":"dust-float","motion":"reduced"}'::jsonb, true, 9, 1, 'appearance-seed', 'appearance-seed'),
  ('horizon-cyan', 'Horizon Cyan', 'เส้นขอบฟ้าไซแอน สะอาดและประหยัด motion', 'css-animated', null, null, '{"layers":["linear-gradient(180deg, rgba(34,211,238,.18), transparent 45%)","radial-gradient(ellipse at 50% 100%, rgba(6,182,212,.22), transparent 52%)"],"base":"#06131b","animation":"horizon-scan","motion":"reduced"}'::jsonb, true, 10, 1, 'appearance-seed', 'appearance-seed')
on conflict (background_key) do update set
  name = excluded.name,
  description = excluded.description,
  background_type = excluded.background_type,
  asset_url = excluded.asset_url,
  poster_url = excluded.poster_url,
  config = excluded.config,
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  version = excluded.version,
  updated_by = excluded.updated_by;
