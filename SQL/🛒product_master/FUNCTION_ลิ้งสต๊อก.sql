CREATE OR REPLACE FUNCTION public.fn_auto_link_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    final_joke TEXT;
    clean_th_name TEXT;
    variants_json JSONB;
    variant_count INTEGER;
    random_index INTEGER;
    selected_header TEXT;
BEGIN
    -- สกัดชื่อภาษาไทยสแตนด์บายรอ
    clean_th_name := COALESCE(TRIM(NEW.th_name), 'สินค้า');

    -- 🟢 สเตปที่ 1: สายมีของ (stock_qty > 0) 👉 เปิดลอจิกลักไก่สุ่มข้อความ 1 จาก 5 แบบในตาราง
    IF COALESCE(NEW.stock_qty, 0) > 0 THEN
        NEW.stock_status := '✅ INSTOCK';
        NEW.status := 'ACTIVE';
        
        -- ดึงค่า JSON จากคอลัมน์ normal_header_variants ออกมาเช็ก
        variants_json := NEW.normal_header_variants::JSONB;
        
        -- 🎯 ตรรกะนักสุ่มขวัญใจคนวางระบบ:
        -- เช็กก่อนว่ามีข้อมูลอาร์เรย์ฝังอยู่ไหม ถ้ามีและไม่ว่าง สั่งลุยสุ่มตัวเลขดัชนีทันที!
        IF variants_json IS NOT NULL AND JSONB_ARRAY_LENGTH(variants_json) > 0 THEN
            variant_count := JSONB_ARRAY_LENGTH(variants_json);
            -- ใช้พลังสุ่มเลขคณิตศาสตร์ของเบส (0 ถึง จำนวนข้อความลบหนึ่ง)
            random_index := FLOOR(RANDOM() * variant_count)::INTEGER;
            -- สอยเอาเฉพาะข้อความเสียวใส้ชิ้นที่เลือกออกมาแบนๆ เพียวๆ ตัวเดียว!
            selected_header := variants_json->>random_index;
            NEW.stock_notice := TRIM(selected_header);
        ELSE
            -- 🛡️ ตัวดักระบบว่างเปล่า: ถ้าในตารางปล่อยว่างไว้ ให้ดีดกลับรางสายสินค้าหลักตามใจพี่
            NEW.stock_notice := CASE 
                WHEN UPPER(TRIM(NEW.category)) IN ('COLD', 'COOL') THEN '🧊 สายเย็นรถแช่ · คุมอุณหภูมิระดับพรีเมียม แข็งเป๊กยันปลายทาง'
                WHEN UPPER(TRIM(NEW.category)) = 'SWEET' THEN '🍬 [สายหวานพรีเมียม · หวานกำลังดี แพ็กให้ดีถึงมือ]'
                WHEN UPPER(TRIM(NEW.category)) = 'FRUIT' THEN '🥭 สายผลไม้ · ส่งไวระเบิด คัดสดๆ ไม่สดคัดทิ้ง'
                WHEN UPPER(TRIM(NEW.category)) = 'HOT' THEN '🚀 สายร้อนพร้อมบวก · เคลียร์ทางให้หน่อย รถแรงกำลังจะไป'
                ELSE '🚀 [บิลสมบูรณ์]'
            END;
        END IF;
        
        -- 🔥 [จุดเชื่อมต่อความเทพ] บังคับให้หัวบิลหลักดึงข้อความสายเพรียวลมหนาวที่สุ่มได้ไปใช้งานทันที
        NEW.chosen_header := NEW.stock_notice;
        
    ELSE
        -- ❌ สเตปที่ 2: สายสินค้าหมด (stock_qty = 0) 👉 บังคับดีดป้ายแดงเตือนภัย+ดึงมุกไดนามิกชื่อไทยชนคีย์เหมือนเดิม
        NEW.stock_qty := 0;
        NEW.stock_status := '❌ OUT_OF_STOCK';
        NEW.status := 'OUT_OF_STOCK';
        
        final_joke := TRIM(NEW.out_of_stock_joke);
        
        IF NULLIF(final_joke, '') IS NOT NULL THEN
            NEW.stock_notice := '❌ สินค้าหมดแล้วแม่' || E'\n' || final_joke;
        ELSE
            NEW.stock_notice := '❌ สินค้าหมดแล้วแม่' || E'\n' || '💬 ' || clean_th_name || ' หมดเกลี้ยง! แอบหนีไปเดินสยามกับคนคุยใหม่ละ';
        END IF;
        
        -- 🔥 [จุดเชื่อมต่อความเทพ] บังคับให้หัวบิลหลักสลับมาใช้มุกของหมดแม่ไปแสดงผลบนเว็บและส่งออก
        NEW.chosen_header := NEW.stock_notice;
    END IF;

    -- อัปเดตเวลาการแก้ไขล่าสุด
    NEW.updated_at := timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
