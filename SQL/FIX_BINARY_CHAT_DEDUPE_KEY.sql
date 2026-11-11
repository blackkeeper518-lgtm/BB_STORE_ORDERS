-- แก้ PostgreSQL 42P10 สำหรับ n8n ที่ส่ง on_conflict=dedupe_key
-- สคริปต์นี้ตรวจ duplicate groups ก่อน; ถ้าพบจะหยุดโดยไม่ลบหรือแก้แถวข้อมูลใด ๆ
-- เมื่อไม่มีค่าซ้ำ จะสร้าง unique index แบบไม่ใส่ WHERE ให้ PostgREST ใช้ ON CONFLICT ได้

DO $$
DECLARE
  cust_duplicate_groups bigint;
  page_duplicate_groups bigint;
BEGIN
  SELECT COUNT(*)
    INTO cust_duplicate_groups
  FROM (
    SELECT dedupe_key
    FROM public."Cust_Chat⭐BINARY_xXx_STAR"
    WHERE dedupe_key IS NOT NULL
    GROUP BY dedupe_key
    HAVING COUNT(*) > 1
  ) AS duplicates;

  SELECT COUNT(*)
    INTO page_duplicate_groups
  FROM (
    SELECT dedupe_key
    FROM public."Pg_Chat⭐BINARY_xXx_STAR"
    WHERE dedupe_key IS NOT NULL
    GROUP BY dedupe_key
    HAVING COUNT(*) > 1
  ) AS duplicates;

  IF cust_duplicate_groups > 0 OR page_duplicate_groups > 0 THEN
    RAISE EXCEPTION 'พบ dedupe_key ซ้ำ: Cust groups=%, Pg groups=%. กรุณาตรวจและจัดการแถวซ้ำก่อนรันใหม่; ไม่มีการลบข้อมูลโดยสคริปต์นี้.',
      cust_duplicate_groups,
      page_duplicate_groups;
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS ux_binary_cust_dedupe_key
    ON public."Cust_Chat⭐BINARY_xXx_STAR" (dedupe_key);

  CREATE UNIQUE INDEX IF NOT EXISTS ux_binary_pg_dedupe_key
    ON public."Pg_Chat⭐BINARY_xXx_STAR" (dedupe_key);
END;
$$;
