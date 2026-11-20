-- ========================================================
-- 1. เคลียร์สิทธิ์ให้ตาราง 💀THANATOS_xXx_DEATH_NOTE
-- (ลบตัวเก่าถ้ามี แล้วสร้างใหม่ให้อ่านข้อมูลได้)
-- ========================================================
DROP POLICY IF EXISTS "Allow public read access" ON "💀THANATOS_xXx_DEATH_NOTE";
CREATE POLICY "Allow public read access" ON "💀THANATOS_xXx_DEATH_NOTE" FOR SELECT USING (true);

-- ========================================================
-- 2. ตั้งค่าสิทธิ์ตาราง 🌀SINGULARITY_xXx_EXCHANGE
-- ========================================================
ALTER TABLE "🌀SINGULARITY_xXx_EXCHANGE" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON "🌀SINGULARITY_xXx_EXCHANGE";
CREATE POLICY "Allow public read access" ON "🌀SINGULARITY_xXx_EXCHANGE" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON "🌀SINGULARITY_xXx_EXCHANGE";
CREATE POLICY "Allow public insert access" ON "🌀SINGULARITY_xXx_EXCHANGE" FOR INSERT WITH CHECK (true);

-- ========================================================
-- 3. ตั้งค่าสิทธิ์ตาราง 🗝️HERMES_ARCHIVE
-- ========================================================
ALTER TABLE "🗝️HERMES_ARCHIVE" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON "🗝️HERMES_ARCHIVE";
CREATE POLICY "Allow public read access" ON "🗝️HERMES_ARCHIVE" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON "🗝️HERMES_ARCHIVE";
CREATE POLICY "Allow public insert access" ON "🗝️HERMES_ARCHIVE" FOR INSERT WITH CHECK (true);
