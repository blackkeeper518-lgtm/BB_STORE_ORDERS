-- ค้นหาพัสดุจาก phone_number หรือ order_phone
-- รันไฟล์นี้ทั้งชุดใน Supabase SQL Editor

create or replace function public.FUNCTION_get_parcel_by_phone_v2(search_phone text)
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_phone text;
  result_records json;
begin
  normalized_phone :=
    pg_catalog.regexp_replace(
      coalesce(search_phone, ''),
      '[^0-9]',
      '',
      'g'
    );

  if pg_catalog.length(normalized_phone) <> 10 then
    return pg_catalog.json_build_object(
      'success', false,
      'reason', 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
    );
  end if;

  select coalesce(
    pg_catalog.json_agg(
      pg_catalog.to_jsonb(q)
      order by q.pickup_date desc nulls last, q.id desc
    ),
    '[]'::json
  )
  into result_records
  from (
    select
      id,
      pickup_date,
      tracking_number,
      consignee,
      cod_amount
    from public.parcels
    where
      pg_catalog.regexp_replace(
        coalesce(phone_number::text, ''),
        '[^0-9]',
        '',
        'g'
      ) = normalized_phone
      or pg_catalog.regexp_replace(
        coalesce(order_phone::text, ''),
        '[^0-9]',
        '',
        'g'
      ) = normalized_phone
    order by pickup_date desc nulls last, id desc
    limit 50
  ) as q;

  if pg_catalog.json_array_length(result_records) = 0 then
    return pg_catalog.json_build_object(
      'success', false,
      'reason', 'ไม่พบข้อมูลพัสดุ'
    );
  end if;

  return pg_catalog.json_build_object(
    'success', true,
    'data', result_records
  );
end;
$$;
