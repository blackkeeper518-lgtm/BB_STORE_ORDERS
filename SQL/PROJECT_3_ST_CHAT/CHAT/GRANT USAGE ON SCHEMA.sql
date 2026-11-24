GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR"
TO service_role;

GRANT SELECT ON TABLE
  public."🌓VAGABOND_xXx_DISMISS",
  public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public."🏴‍☠️SIRIUS_xXx_CRASH"
TO service_role;

GRANT USAGE, SELECT ON SEQUENCE
  public."Cust_Chat⭐BINARY_xXx_STAR_id_seq",
  public."Cust_Chat⭐BINARY_xXx_STAR_message_row_id_seq",
  public."Pg_Chat⭐BINARY_xXx_STAR_id_seq",
  public."Pg_Chat⭐BINARY_xXx_STAR_message_row_id_seq"
TO service_role;

CREATE INDEX IF NOT EXISTS ix_cust_chat_phone
  ON public."Cust_Chat⭐BINARY_xXx_STAR" (phone);

CREATE INDEX IF NOT EXISTS ix_pg_chat_phone
  ON public."Pg_Chat⭐BINARY_xXx_STAR" (phone);
