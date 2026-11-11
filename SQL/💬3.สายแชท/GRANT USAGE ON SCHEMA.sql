GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR"
TO service_role;

GRANT SELECT ON TABLE
  public."🌠BINARY_xXx_MATRIX",
  public."🌓VAGABOND_xXx_DISMISS",
  public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public."🏴‍☠️SIRIUS_xXx_CRASH"
TO service_role;

GRANT USAGE, SELECT ON SEQUENCE
  public."Cust_Chat⭐BINARY_xXx_STAR_id_seq",
  public."Pg_Chat⭐BINARY_xXx_STAR_id_seq"
TO service_role;






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
    RAISE EXCEPTION
      'พบ dedupe_key ซ้ำ: Cust groups=%, Pg groups=%. กรุณาตรวจแถวซ้ำก่อนรันใหม่; สคริปต์นี้ไม่ได้ลบข้อมูล.',
      cust_duplicate_groups,
      page_duplicate_groups;
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS ux_binary_cust_dedupe_key
    ON public."Cust_Chat⭐BINARY_xXx_STAR" (dedupe_key);

  CREATE UNIQUE INDEX IF NOT EXISTS ux_binary_pg_dedupe_key
    ON public."Pg_Chat⭐BINARY_xXx_STAR" (dedupe_key);
END;
$$;




CREATE INDEX IF NOT EXISTS ix_cust_chat_phone
ON public."Cust_Chat⭐BINARY_xXx_STAR" (phone);

CREATE INDEX IF NOT EXISTS ix_pg_chat_phone
ON public."Pg_Chat⭐BINARY_xXx_STAR" (phone);





CREATE UNIQUE INDEX IF NOT EXISTS ux_cust_chat_message_id
ON public."Cust_Chat⭐BINARY_xXx_STAR" (message_id)
WHERE NULLIF(btrim(message_id), '') IS NOT NULL;

-- Pg Chat writer ใช้ ux_binary_pg_dedupe_key; ไม่สร้าง unique message_id ซ้ำซ้อนเพื่อไม่บล็อกแถวจาก upstream
