CREATE INDEX IF NOT EXISTS ix_cust_chat_phone
ON public."Cust_Chat⭐BINARY_xXx_STAR" (phone);

CREATE INDEX IF NOT EXISTS ix_pg_chat_phone
ON public."Pg_Chat⭐BINARY_xXx_STAR" (phone);


-- ช่วยค้นข้อความตามห้อง แต่อนุญาตให้หลายข้อความใช้ chat_link_key เดียวกัน

CREATE INDEX IF NOT EXISTS ix_chat_customer_chat_link_key
ON public."Cust_Chat⭐BINARY_xXx_STAR" (chat_link_key);

CREATE INDEX IF NOT EXISTS ix_chat_page_chat_link_key
ON public."Pg_Chat⭐BINARY_xXx_STAR" (chat_link_key);