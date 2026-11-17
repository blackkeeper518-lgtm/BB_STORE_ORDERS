-- BB_STORE_ORDERS · App Customization Center
-- Run this script in the Chat Supabase project.
-- The application server uses the Supabase service-role key; secrets are never stored in these tables.

create extension if not exists pgcrypto;

create table if not exists public.app_themes (
  id uuid primary key default gen_random_uuid(),
  theme_key text not null unique,
  name text not null,
  description text not null default '',
  background_color text not null check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  surface_color text not null check (surface_color ~ '^#[0-9A-Fa-f]{6}$'),
  primary_color text not null check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  border_style text not null default 'gradient' check (border_style in ('gradient','neon','rail','hud','minimal')),
  button_style text not null default 'solid' check (button_style in ('solid','outline','gradient')),
  radius numeric(6,2) not null default 16,
  glow numeric(6,2) not null default 12,
  motion_enabled boolean not null default true,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text, updated_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.app_sounds (
  id uuid primary key default gen_random_uuid(),
  sound_key text not null unique,
  name text not null,
  description text not null default '',
  event_type text not null default 'new_message' check (event_type in ('new_message','message_sent','message_failed','new_order','custom')),
  storage_bucket text not null default 'chat-sounds',
  storage_path text not null,
  public_url text,
  mime_type text not null default 'audio/mpeg',
  duration_ms integer,
  volume numeric(4,3) not null default 0.35 check (volume >= 0 and volume <= 1),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text, updated_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.app_chat_frames (
  id uuid primary key default gen_random_uuid(),
  frame_key text not null unique,
  name text not null,
  description text not null default '',
  base_frame_key text,
  border_color text, accent_color text,
  border_width numeric(6,2), glow numeric(6,2), animation text,
  custom_css text not null default '',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text, updated_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.touch_app_customization_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); new.version = old.version + 1; return new; end; $$;
drop trigger if exists app_themes_touch_updated_at on public.app_themes;
create trigger app_themes_touch_updated_at before update on public.app_themes for each row execute function public.touch_app_customization_updated_at();
drop trigger if exists app_sounds_touch_updated_at on public.app_sounds;
create trigger app_sounds_touch_updated_at before update on public.app_sounds for each row execute function public.touch_app_customization_updated_at();
drop trigger if exists app_chat_frames_touch_updated_at on public.app_chat_frames;
create trigger app_chat_frames_touch_updated_at before update on public.app_chat_frames for each row execute function public.touch_app_customization_updated_at();

-- Service-role server access only. Browser clients must never receive these tables directly.
alter table public.app_themes enable row level security;
alter table public.app_sounds enable row level security;
alter table public.app_chat_frames enable row level security;
drop policy if exists app_themes_service_role_only on public.app_themes;
create policy app_themes_service_role_only on public.app_themes for all to service_role using (true) with check (true);
drop policy if exists app_sounds_service_role_only on public.app_sounds;
create policy app_sounds_service_role_only on public.app_sounds for all to service_role using (true) with check (true);
drop policy if exists app_chat_frames_service_role_only on public.app_chat_frames;
create policy app_chat_frames_service_role_only on public.app_chat_frames for all to service_role using (true) with check (true);

-- Private audio bucket. Upload/read through the server service-role route.
insert into storage.buckets (id, name, public) values ('chat-sounds','chat-sounds',false) on conflict (id) do nothing;
drop policy if exists chat_sounds_service_role_only on storage.objects;
create policy chat_sounds_service_role_only on storage.objects for all to service_role using (bucket_id = 'chat-sounds') with check (bucket_id = 'chat-sounds');

-- Seed the built-in theme catalog; safe to rerun.
insert into public.app_themes (theme_key,name,description,background_color,surface_color,primary_color,accent_color,sort_order)
values
  ('theme-001','Cyber Neon','Cyber Neon · built-in theme','#080d1d','#101827','#00e5ff','#ff00d9',1),
  ('theme-002','Quantum Violet','Quantum Violet · built-in theme','#100c20','#1a1530','#b89aff','#59edff',2),
  ('theme-003','Emerald Matrix','Emerald Matrix · built-in theme','#071710','#10251b','#75ffac','#00e5cf',3),
  ('theme-004','Crimson Ops','Crimson Ops · built-in theme','#170b14','#29121e','#ff728c','#ffc56a',4),
  ('theme-005','Arctic Pulse','Arctic Pulse · built-in theme','#091721','#122637','#8beeff','#c4aeff',5),
  ('theme-006','Midnight Gold','Midnight Gold · built-in theme','#15130b','#252116','#ffd477','#7ae9ff',6),
  ('theme-007','Electric Ocean','Electric Ocean · built-in theme','#080f23','#13223c','#6fafff','#5effd6',7),
  ('theme-008','Solar Flare','Solar Flare · built-in theme','#1a0e0b','#2b1b16','#ffab68','#ff72c7',8),
  ('theme-009','Toxic Lime','Toxic Lime · built-in theme','#0d1609','#1b2713','#bcff63','#68eaff',9),
  ('theme-010','Rose Hologram','Rose Hologram · built-in theme','#190d1e','#2a1830','#ff94dd','#bba2ff',10),
  ('theme-011','Plasma Purple','Plasma Purple · built-in theme','#120920','#211333','#cb8cff','#ff80aa',11),
  ('theme-012','Aqua Terminal','Aqua Terminal · built-in theme','#061918','#102a29','#5dffdf','#9baaff',12),
  ('theme-013','Sakura Circuit','Sakura Circuit · built-in theme','#190e17','#2c1d29','#ffa8cc','#7bfff0',13),
  ('theme-014','Cobalt Reactor','Cobalt Reactor · built-in theme','#080e20','#142039','#82a0ff','#ffcb6f',14),
  ('theme-015','Amber Command','Amber Command · built-in theme','#191409','#2b2515','#ffca63','#d0ff7b',15),
  ('theme-016','Frost Mint','Frost Mint · built-in theme','#0a1815','#142923','#a2ffde','#9fc7ff',16),
  ('theme-017','Ultraviolet Wave','Ultraviolet Wave · built-in theme','#120d23','#211832','#dbacff','#ff8be3',17),
  ('theme-018','Inferno Signal','Inferno Signal · built-in theme','#190d0e','#2c171b','#ff8872','#ffc56b',18),
  ('theme-019','Silver Circuit','Silver Circuit · built-in theme','#0d1420','#1b2735','#d7eaff','#82dfff',19),
  ('theme-020','Galaxy Spectrum','Galaxy Spectrum · built-in theme','#100d20','#1d1933','#97eaff','#ff9cdb',20) on conflict (theme_key) do nothing;

-- Seed the built-in 40-frame catalog; safe to rerun.
insert into public.app_chat_frames (frame_key,name,description,base_frame_key,sort_order)
values
  ('f01','Cyan Precision','เส้นไซแอนบาง + แสงอ่อน อ่านง่าย เหมาะกับข้อมูลทั่วไป','f01',1),
  ('f02','Magenta Aura','ขอบชมพูเรืองแสง ใช้เน้นข้อมูลสำคัญ','f02',2),
  ('f03','Dual Spectrum','ฟ้า–ม่วง–ชมพู แนะนำเป็นกรอบหลักของช่องขวา','f03',3),
  ('f04','Signal Rail','ไฟสถานะด้านซ้าย แยกประเภทข้อมูลอย่างเรียบง่าย','f04',4),
  ('f05','Bottom Neon','แถบไฟด้านล่าง สำหรับยอดสรุปหรือ COD','f05',5),
  ('f06','Frosted Glass','กระจกโปร่งแสง เส้นขอบนุ่ม ดูมีมิติ','f06',6),
  ('f07','Double Scanner','เส้นกรอบสองชั้น สำหรับ Tracking ID','f07',7),
  ('f08','Corner Brackets','วงเล็บสองมุม เหมือนแผงควบคุมในเกม','f08',8),
  ('f09','Cut-Corner HUD','มุมตัดสี่ด้าน ขอบตามรูปทรงจริง','f09',9),
  ('f10','Lime Confirmed','เขียวมะนาวสำหรับสถานะสำเร็จ','f10',10),
  ('f11','Dashed Transmission','เส้นประไซแอน เหมาะกับรายการรอข้อมูล','f11',11),
  ('f12','Inset Circuit','กรอบซ้อนภายใน เหมือนแผงวงจร','f12',12),
  ('f13','Split Header Rail','ไฟบนสองสี ฟ้าหลัก ชมพูเสริม','f13',13),
  ('f14','Scanline Frame','พื้นเส้นสแกนละเอียด พร้อมขอบไฟด้านข้าง','f14',14),
  ('f15','Offset Glitch','กรอบเหลื่อมสองสีแบบกราฟิกไซเบอร์','f15',15),
  ('f16','Docking Tabs','แท็บบน–ล่าง เหมือนโมดูลเชื่อมต่อระบบ','f16',16),
  ('f17','Live Pulse','แสงขอบหายใจเบา ๆ สำหรับสถานะ Live','f17',17),
  ('f18','Orbit Border','แสงหมุนรอบขอบ ไม่หมุนข้อความ','f18',18),
  ('f19','Edge Runner','ไฟวิ่งขอบด้านบน เหมาะกับสถานะ Sync','f19',19),
  ('f20','Reactive Frame','ขอบเรียบ เปลี่ยนเป็นชมพูเมื่อชี้เมาส์','f20',20),
  ('f21','Twin Reactor','วงแหวนพลังงานสองสีหมุนรอบกรอบ พร้อมแสงสองฝั่ง','f21',21),
  ('f22','Exoskeleton HUD','กรอบโครงนอกหลายชั้น เหมือนเกราะห้องควบคุม','f22',22),
  ('f23','Hazard Protocol','ขอบลายเฉียงแบบเขตพลังงาน อารมณ์ไซเบอร์อุตสาหกรรม','f23',23),
  ('f24','Prismatic Shield','เกราะแก้วสะท้อนแสง แถบประกายเลื่อนไปบนกรอบ','f24',24),
  ('f25','Quantum Glitch','ขอบเหลื่อม + เส้นสัญญาณกระโดดเป็นจังหวะ','f25',25),
  ('f26','Radar Chamber','รังสีเรดาร์หมุนในพื้น และวงเซนเซอร์มุมบน','f26',26),
  ('f27','Cryogenic Vault','กรอบฟ้าเย็นหลายชั้น เหมือนตู้นิรภัยข้อมูล','f27',27),
  ('f28','Plasma Core','ขอบชมพูพลาสมา เส้นพลังงานบนและล่าง','f28',28),
  ('f29','Biohazard Matrix','กรอบเขียวนีออน พร้อมเขี้ยวข้างและรหัสลายเฉียง','f29',29),
  ('f30','Astral Gateway','กรอบม่วงจักรวาล แท็บพลังงานหัว–ท้าย','f30',30),
  ('f31','Liquid Spectrum','กรอบโค้งไหลสีฟ้า–ชมพู แสงเหลื่อมสองมุม','f31',31),
  ('f32','Mecha Armor','เกราะตัดมุมสองด้าน พร้อมแถบสัญญาณสองสี','f32',32),
  ('f33','Twin Energy Rails','รางพลังงานด้านซ้าย–ขวาเต้นสลับจังหวะ','f33',33),
  ('f34','Golden Overdrive','เพิ่มสีทองอำพันเป็นรุ่นพิเศษ กรอบหรูแบบไซเบอร์','f34',34),
  ('f35','Digital DNA','ขอบพิกเซลพลังงานหมุนช้า เหมือนรหัสพันธุกรรมดิจิทัล','f35',35),
  ('f36','Circuit Nexus','จุดเชื่อมวงจรสี่มุม พร้อมเส้นขอบซ้อนด้านใน','f36',36),
  ('f37','Sonic Echo','วงคลื่นขยายรอบกรอบ เหมือนสนามสัญญาณ','f37',37),
  ('f38','Hologram Console','กรอบโฮโลแกรมสองชั้น พร้อมแถบแสงด้านข้าง','f38',38),
  ('f39','Solar Flare','กรอบพลาสมาสีชมพู–ส้ม–ทอง สำหรับแจ้งเตือนพิเศษ','f39',39),
  ('f40','Cyber Sovereign','รุ่นจัดเต็ม: สเปกตรัมหมุน กรอบสามชั้น และ Glow สองฝั่ง','f40',40) on conflict (frame_key) do nothing;

-- Example: after uploading an audio file through the server, insert its metadata like this:
-- insert into public.app_sounds (sound_key,name,event_type,storage_path,mime_type) values ('sound-radar','Radar','new_message','radar.mp3','audio/mpeg');
