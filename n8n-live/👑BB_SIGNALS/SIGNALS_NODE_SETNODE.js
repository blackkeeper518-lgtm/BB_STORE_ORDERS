{
  "nodes": [
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "a1000000-0000-4000-8000-000000000001",
              "name": "upsert_key",
              "value": "={{ String($json.upsert_key ?? '').trim() }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000002",
              "name": "page_id",
              "value": "={{ String($json.page_id ?? '').trim() }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000003",
              "name": "=threadId",
              "value": "={{ $json.threadId ?? $json.thread_id ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000004",
              "name": "customer_id",
              "value": "={{ $json.customer_id ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000005",
              "name": "page_name",
              "value": "={{ $json.page_name ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000006",
              "name": "facebook_name",
              "value": "={{ $json.facebook_name ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000007",
              "name": "customer_name",
              "value": "={{ $json.customer_name ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000008",
              "name": "phone",
              "value": "={{ $json.phone ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000009",
              "name": "extracted_phone",
              "value": "={{ $json.extracted_phone ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000010",
              "name": "order_number",
              "value": "={{ $json.order_number ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000011",
              "name": "order_number_display",
              "value": "={{ $json.order_number_display ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000012",
              "name": "order_date",
              "value": "={{ $json.order_date ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000013",
              "name": "order_time",
              "value": "={{ $json.order_time ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000014",
              "name": "order_time_display",
              "value": "={{ $json.order_time_display ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000015",
              "name": "time_th",
              "value": "={{ $json.time_th ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000017",
              "name": "shipping_carrier",
              "value": "={{ $json.shipping_carrier ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000019",
              "name": "address_display_packer",
              "value": "={{ $json.address_display_packer ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000020",
              "name": "addressclean",
              "value": "={{ $json.addressclean ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000021",
              "name": "district",
              "value": "={{ $json.district ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000022",
              "name": "amphoe",
              "value": "={{ $json.amphoe ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000023",
              "name": "province",
              "value": "={{ $json.province ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000024",
              "name": "zipcode",
              "value": "={{ $json.zipcode ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000025",
              "name": "sku",
              "value": "={{ $json.sku ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000026",
              "name": "manus_for_packer",
              "value": "={{ $json.manus_for_packer ?? null }}",
              "type": "string"
            },
            {
              "id": "a1000000-0000-4000-8000-000000000027",
              "name": "telegram_copy_text",
              "value": "={{ $json.telegram_copy_text ?? null }}",
              "type": "string"
            },
            {
              "id": "df0640ae-c639-4aeb-babb-af5b4f7643e6",
              "name": "cod_amount",
              "value": "={{ $json.cod_amount }}",
              "type": "number"
            },
            {
              "id": "0ea624d3-23c6-4dbe-b9b3-9bda986d12e7",
              "name": "messaging_tag_required",
              "value": "={{ $json.messaging_tag_required ?? null }}",
              "type": "string"
            },
            {
              "id": "dc6eb491-c88e-4447-83ab-23861439aa08",
              "name": "message_id",
              "value": "={{ $json.message_id ?? null }}",
              "type": "string"
            },
            {
              "id": "08a08e44-e180-4724-bee3-f7cb2d456c53",
              "name": "customer_latest_message",
              "value": "={{ $json.customer_latest_message ?? null }}",
              "type": "string"
            },
            {
              "id": "cb2e3a0a-d544-49e4-ae8e-60e4eabe7de9",
              "name": "customer_message_time_th",
              "value": "={{ $json.customer_message_time_th ?? null }}",
              "type": "string"
            },
            {
              "id": "56275703-f688-4c83-90d6-f768aa76ceae",
              "name": "portal_key",
              "value": "={{ $json.portal_key ?? null }}",
              "type": "string"
            },
            {
              "id": "e7f7068b-d8ad-4f9d-878d-89c2afc5a3b9",
              "name": "original",
              "value": "={{ $json.original }}",
              "type": "string"
            },
            {
              "id": "2ff63dad-363f-469c-92e1-ed40bc94147d",
              "name": "telegram_message",
              "value": "={{ $json.telegram_message }}",
              "type": "string"
            },
            {
              "id": "2ee69fb5-d8cf-427e-9a85-75f6eebabda3",
              "name": "send_facebook_route",
              "value": "={{ $json.send_facebook_route }}",
              "type": "string"
            },
            {
              "id": "6b0beee4-d6e6-4fa5-8840-6b6e5ac3a867",
              "name": "customer_latest_message",
              "value": "={{ $json.customer_latest_message }}",
              "type": "string"
            },
            {
              "id": "6095fa7d-ddad-4f34-b616-8a5a8ccf1bef",
              "name": "customer_message_time_th",
              "value": "={{ $json.customer_message_time_th }}",
              "type": "string"
            },
            {
              "id": "e69b8ee8-ee78-49b7-a0b1-b97c00824989",
              "name": "customer_message_time_th",
              "value": "={{ $json.customer_message_time_th }}",
              "type": "string"
            },
            {
              "id": "7ef8894a-1143-4357-83f9-6b566c2d1e23",
              "name": "chat_age_hours",
              "value": "={{ $json.chat_age_hours }}",
              "type": "number"
            },
            {
              "id": "beef9fd4-7bc4-4fab-a6a2-61a50b8ba877",
              "name": "is_within_24h",
              "value": "={{ $json.is_within_24h }}",
              "type": "boolean"
            },
            {
              "id": "b63e1696-ad8f-45e4-ba4f-098bb8d1f263",
              "name": "can_send_standard",
              "value": "={{ $json.can_send_standard }}",
              "type": "boolean"
            },
            {
              "id": "77390ef9-4dde-4ec4-b80e-c24add9cc010",
              "name": "parcel_status_emoji",
              "value": "={{ $json.parcel_status_emoji }}",
              "type": "string"
            },
            {
              "id": "65a530e0-97e4-4ea5-8c06-bf86188d84e9",
              "name": "chat_link_key",
              "value": "={{ $json.chat_link_key }}",
              "type": "string"
            },
            {
              "id": "054bb6a6-fe70-484e-92a8-fdfa5fa07a25",
              "name": "pager_message_time_th",
              "value": "={{ $json.pager_message_time_th }}",
              "type": "string"
            },
            {
              "id": "7bfb3b2b-61b3-47ac-96ee-02f10e2a4f3c",
              "name": "page_latest_message",
              "value": "={{ $json.pager_message_time_th }}",
              "type": "string"
            },
            {
              "id": "1500e585-d867-437a-bca7-c5181a2c3150",
              "name": "phone_candidates",
              "value": "={{ $json.phone_candidates  }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        2048,
        2704
      ],
      "id": "c01653a5-d79d-4def-b396-46d8f79a2e88",
      "name": "Keep 🎯BB_OrderControl Columns2"
    }
  ],
  "connections": {
    "Keep 🎯BB_OrderControl Columns2": {
      "main": [
        []
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "f4fcccb61c84d5d75854e90735e6c1d4dc7f96a459bba4b39bf25fd07d0f4e26"
  }
}