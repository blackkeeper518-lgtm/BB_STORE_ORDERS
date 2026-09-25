-- เช็คคอลัมน์จริงของ product_alias_dictionary
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_alias_dictionary' 
ORDER BY ordinal_position;

-- ถ้าไม่มี alias ให้เพิ่มเลย
ALTER TABLE public.product_alias_dictionary 
ADD COLUMN IF NOT EXISTS alias TEXT,
ADD COLUMN IF NOT EXISTS alias_norm TEXT,
ADD COLUMN IF NOT EXISTS alias_norm_clean TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS th_name TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS emoji TEXT,
ADD COLUMN IF NOT EXISTS display_for_packer TEXT;

-- สร้าง index ให้ค้นเร็ว
CREATE INDEX IF NOT EXISTS idx_alias_dict_alias ON product_alias_dictionary(alias);
CREATE INDEX IF NOT EXISTS idx_alias_dict_norm ON product_alias_dictionary(alias_norm_clean);
CREATE INDEX IF NOT EXISTS idx_alias_dict_sku ON product_alias_dictionary(sku);

-- เช็คอีกที
SELECT column_name FROM information_schema.columns WHERE table_name='product_alias_dictionary';
