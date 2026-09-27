
-- =================================================================
-- 🛡 FILE 1: MASTER AUDIT ENGINE V2026 - ตัวแม่คุม 4 ห้อง
-- =================================================================
-- หน้าที่: เรียก 4 หมวดตามลำดับ D -> C -> B -> A (แดงสำคัญสุดเช็คก่อน)
-- ลูกเล่น: เก็บ log ทุกกฏที่ติด, ส่ง Telegram แยกห้อง, บล็อคแต่เก็บไว้ดู
-- =================================================================

-- ห้องเก็บศพ บล็อคแต่ไม่ฆ่าทิ้ง
CREATE TABLE IF NOT EXISTS public.bb_orders_rejected (
  LIKE public.bb_orders_production INCLUDING ALL,
  rejected_at timestamptz DEFAULT now(),
  rejected_reason text,
  all_notes text[]
);
ALTER TABLE public.bb_orders_rejected DROP CONSTRAINT IF EXISTS bb_orders_rejected_pkey;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bb_orders_rejected' AND column_name='rejected_id') THEN
    ALTER TABLE public.bb_orders_rejected ADD COLUMN rejected_id bigserial PRIMARY KEY;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_master_audit_and_route()
RETURNS TRIGGER AS $$
DECLARE
    v_notes TEXT[] := ARRAY[]::TEXT[];
    has_b BOOLEAN := FALSE;
    has_c BOOLEAN := FALSE;
    has_d BOOLEAN := FALSE;
    v_start timestamptz := clock_timestamp();
BEGIN
    -- ล้างค่าเก่า
    NEW.updated_at := now();
    NEW.phone_clean := regexp_replace(COALESCE(NEW.phone_number, NEW.phone, ''), '[^0-9]', '', 'g');
    
    -- เรียก 4 หมวด เรียงตามความแรง D > C > B > A
    PERFORM public.fn_audit_cat_d(NEW, v_notes, has_d);
    PERFORM public.fn_audit_cat_c(NEW, v_notes, has_c);
    PERFORM public.fn_audit_cat_b(NEW, v_notes, has_b);
    PERFORM public.fn_audit_cat_a(NEW, v_notes, has_b, has_c, has_d);

    -- สรุปป้ายสุดท้าย + ลูกเล่นโลกไม่คิด: เก็บเวลาประมวลผล
    IF array_length(v_notes,1) > 0 THEN
        NEW.repair_notes := v_notes;
        NEW.repair_log := 'AUDIT:' || array_to_string(v_notes, ' | ') || ' TIME:' || (EXTRACT(MILLISECOND FROM clock_timestamp() - v_start))::text || 'ms';
        IF has_d THEN 
            NEW.quarantine_status := 'CAT_D_REJECTED'; 
            NEW.warning_tag := '🔴 [REJECTED] ' || v_notes[1];
            -- บล็อคแต่เก็บไว้ดู
            INSERT INTO bb_orders_rejected (upsert_key, order_number, customer_name, phone, sku, cod_amount, quarantine_status, warning_tag, rejected_reason, all_notes, raw_product_block)
            VALUES (NEW.upsert_key, NEW.order_number, COALESCE(NEW.customer_name, NEW.facebook_name), NEW.phone_clean, NEW.sku, NEW.cod_amount, NEW.quarantine_status, NEW.warning_tag, v_notes[1], v_notes, NEW.raw_product_block)
            ON CONFLICT (upsert_key) DO UPDATE SET rejected_at=now(), all_notes=v_notes, rejected_reason=v_notes[1];
        ELSIF has_c THEN 
            NEW.quarantine_status := 'CAT_C_HOLDING'; 
            NEW.warning_tag := '🟠 [HOLDING] ' || v_notes[1];
        ELSIF has_b THEN 
            NEW.quarantine_status := 'CAT_B_WARNING'; 
            NEW.warning_tag := '🟡 [WARNING] ' || v_notes[1];
        END IF;
    ELSE
        NEW.quarantine_status := 'CAT_A_PASS';
        NEW.warning_tag := '🟢 [PASS] บิลปกติ';
        NEW.repair_notes := ARRAY['ปกติ'];
        NEW.repair_log := 'PASS in ' || (EXTRACT(MILLISECOND FROM clock_timestamp() - v_start))::text || 'ms';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_master_audit ON public.bb_orders_production;
CREATE TRIGGER trg_master_audit BEFORE INSERT OR UPDATE ON public.bb_orders_production FOR EACH ROW EXECUTE FUNCTION public.fn_master_audit_and_route();

-- VIEW 4 ห้อง Telegram
CREATE OR REPLACE VIEW public.vw_tg_router AS
SELECT upsert_key, order_number, customer_name, phone_clean as phone, cod_amount, final_display_for_packer, quarantine_status, warning_tag, repair_notes, 
CASE WHEN quarantine_status='CAT_A_PASS' THEN 'ROOM_A' WHEN quarantine_status='CAT_B_WARNING' THEN 'ROOM_B' WHEN quarantine_status='CAT_C_HOLDING' THEN 'ROOM_C' ELSE 'ROOM_D' END as tg_room
FROM bb_orders_production ORDER BY created_at DESC LIMIT 200;

NOTIFY pgrst, 'reload schema';
SELECT 'MASTER READY - 4 ROOMS' as status;
