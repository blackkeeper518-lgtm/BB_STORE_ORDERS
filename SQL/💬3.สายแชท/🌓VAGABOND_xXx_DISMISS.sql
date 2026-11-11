create view public."🌓VAGABOND_xXx_DISMISS"
with
  (security_invoker = true) as
with
  source_rows as (
    select
      'customer'::text as source_side,
      to_jsonb(m.*) as row_data
    from
      Cust_Chat⭐BINARY_xXx_STAR m
    union all
    select
      'page'::text as source_side,
      to_jsonb(m.*) as row_data
    from
      chat_page_messages m
  ),
  normalized as (
    select
      source_rows.source_side,
      COALESCE(
        source_rows.row_data ->> 'id'::text,
        source_rows.row_data ->> 'source_message_id'::text,
        source_rows.row_data ->> 'dedupe_key'::text,
        ''::text
      ) as source_id,
      COALESCE(
        source_rows.row_data ->> 'page_id'::text,
        source_rows.row_data ->> 'pageId'::text,
        ''::text
      ) as page_id,
      COALESCE(
        source_rows.row_data ->> 'page_name'::text,
        source_rows.row_data ->> 'pageName'::text,
        ''::text
      ) as page_name,
      COALESCE(
        source_rows.row_data ->> 'thread_id'::text,
        source_rows.row_data ->> 'conversation_key'::text,
        source_rows.row_data ->> 'conversation_id'::text,
        ''::text
      ) as conversation_key,
      COALESCE(
        source_rows.row_data ->> 'customer_id'::text,
        source_rows.row_data ->> 'sender_id'::text,
        ''::text
      ) as customer_id,
      COALESCE(
        source_rows.row_data ->> 'customer_name'::text,
        source_rows.row_data ->> 'sender_name'::text,
        source_rows.row_data ->> 'facebook_name'::text,
        ''::text
      ) as customer_name,
      case
        when source_rows.source_side = 'page'::text
        or (
          lower(
            COALESCE(
              source_rows.row_data ->> 'speaker_type'::text,
              source_rows.row_data ->> 'speaker'::text,
              ''::text
            )
          ) = any (
            array[
              'page'::text,
              'admin'::text,
              'business'::text,
              'outbound'::text
            ]
          )
        ) then 'page'::text
        else 'customer'::text
      end as speaker_type,
      COALESCE(
        source_rows.row_data ->> 'occurred_at'::text,
        source_rows.row_data ->> 'time'::text,
        source_rows.row_data ->> 'created_at'::text,
        source_rows.row_data ->> 'synced_at'::text,
        ''::text
      ) as occurred_at,
      COALESCE(
        source_rows.row_data ->> 'message_text'::text,
        source_rows.row_data ->> 'message_raw'::text,
        source_rows.row_data ->> 'text'::text,
        ''::text
      ) as message_text,
      regexp_replace(
        COALESCE(
          source_rows.row_data ->> 'message_text'::text,
          source_rows.row_data ->> 'message_raw'::text,
          source_rows.row_data ->> 'text'::text,
          ''::text
        ),
        '[[:space:]]+'::text,
        ''::text,
        'g'::text
      ) as normalized_message,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'delivery_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'service_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'route_area'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'delivery_zone'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_zone'::text,
          ''::text
        ),
        NULLIF(source_rows.row_data ->> 'route'::text, ''::text),
        NULLIF(source_rows.row_data ->> 'area'::text, ''::text),
        NULLIF(
          concat_ws(
            ' / '::text,
            NULLIF(
              source_rows.row_data ->> 'district'::text,
              ''::text
            ),
            NULLIF(source_rows.row_data ->> 'amphoe'::text, ''::text),
            NULLIF(
              source_rows.row_data ->> 'province'::text,
              ''::text
            )
          ),
          ''::text
        ),
        ''::text
      ) as area,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'branch_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'store_branch'::text,
          ''::text
        ),
        NULLIF(source_rows.row_data ->> 'branch'::text, ''::text),
        ''::text
      ) as branch,
      COALESCE(
        NULLIF(
          source_rows.row_data ->> 'carrier_employee'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'delivery_staff_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'driver_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'courier_name'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'shipping_staff'::text,
          ''::text
        ),
        NULLIF(
          source_rows.row_data ->> 'rider_name'::text,
          ''::text
        ),
        ''::text
      ) as carrier_employee,
      COALESCE(
        source_rows.row_data ->> 'tracking_number'::text,
        source_rows.row_data ->> 'parcel_tracking_number'::text,
        ''::text
      ) as tracking_number,
      COALESCE(
        source_rows.row_data ->> 'order_number'::text,
        source_rows.row_data ->> 'order_number_display'::text,
        ''::text
      ) as order_number
    from
      source_rows
  )
select
  md5(
    concat_ws(
      '|'::text,
      source_side,
      source_id,
      page_id,
      conversation_key,
      speaker_type,
      occurred_at,
      message_text
    )
  ) as id,
  page_id,
  page_name,
  conversation_key,
  customer_id,
  customer_name,
  speaker_type,
  occurred_at,
  message_text,
  tracking_number,
  order_number,
  case
    when normalized_message ~~* '%ปิดงาน%'::text then 'ปิดงาน'::text
    when normalized_message ~~* '%ยกเลิก%'::text
    or normalized_message ~~* '%ไม่เอาแล้ว%'::text then 'ยกเลิก / ไม่เอาแล้ว'::text
    when normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ'::text then 'สั่งแล้วไม่รับ'::text
    else null::text
  end as case_type,
  area,
  branch,
  carrier_employee
from
  normalized
where
  normalized_message ~~* '%ปิดงาน%'::text
  or normalized_message ~~* '%ยกเลิก%'::text
  or normalized_message ~~* '%ไม่เอาแล้ว%'::text
  or normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ'::text;