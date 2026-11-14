{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://yuniclsmvhjuxamdvwbw.supabase.co/rest/v1/Pg_Chat⭐BINARY_xXx_STAR",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bmljbHNtdmhqdXhhbWR2d2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDM2NzUxNCwiZXhwIjoyMTA5OTQzNTE0fQ.bdJCImBurhWjrk8pWPaWweP9UUnEovLlUIf5jibgIXY"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({\n\n  chat_link_key: String($json.chat_link_key ?? ''),\n  upsert_key: String($json.upsert_key ?? ''),\n  page_id: String($json.page_id ?? ''),\n\n  thread_id: String(\n    $json.thread_id ??\n    $json.threadId ??\n    ''\n  ),\n\n  threadId: String(\n    $json.threadId ??\n    $json.thread_id ??\n    ''\n  ),\n\n  page_name: $json.page_name ?? undefined,\n  portal_key: $json.portal_key ?? undefined,\n\n  customer_id:\n    $json.customer_id ??\n    $json.recipient_id ??\n    undefined,\n\n  recipient_id: $json.recipient_id ?? undefined,\n\n  // ชื่อจาก Facebook API\n  facebook_name: $json.facebook_name ?? undefined,\n\n  message_id: $json.message_id ?? undefined,\n\n  speaker: 'page',\n  is_sent: true,\n\n  occurred_at: $json.occurred_at ?? $now,\n  sync_status: 'READY_TO_SAVE',\n\n  message_text: $json.message_text ?? undefined,\n  tracking_number: $json.tracking_number ?? undefined,\n  parcel_status_emoji: $json.parcel_status_emoji ?? undefined,\n\n  facebook_tracking_message:\n    $json.facebook_tracking_message ?? undefined,\n\n  drakside_tracking_message:\n    $json.drakside_tracking_message ?? undefined,\n\n  // จุดสำคัญ: โหนดล่างนี้บันทึกหลังส่งสำเร็จ จึงปั้มตรง ๆ\n  facebook_tracking_status: '⚡SENT',\n  facebook_tracking_sent_at: $now,\n\norder_number: $json.order_number ?? undefined,\n  order_number_display: $json.order_number_display ?? undefined,\n  cod_amount: $json.cod_amount ?? undefined,\n  phone: $json.phone ?? undefined,\n  shipping_carrier: $json.shipping_carrier ?? undefined,\n  address_display_packer:\n    $json.address_display_packer ?? undefined,\n  manus_for_packer: $json.manus_for_packer ?? undefined,\n  dedupe_key:\n    String($json.message_id ?? '') +\n    ':' +\n    String($json.recipient_id ?? ''),\n\n  target_room: 'Pg_Chat⭐BINARY_xXx_STAR',\n  source_lane: '🌌BB_TRACKING',\n\n  // ฟิลด์เดิมไว้ท้ายสุด\n  recipient_name: $json.recipient_name ?? undefined,\n  customer_name: $json.customer_name ?? undefined\n\n}) }}\n",
        "options": {
          "timeout": 30000
        }
      },
      "id": "88815e0c-ee2a-4b35-af22-d2bd68c26061",
      "name": "Pg_Chat⭐BINARY_xXx_STAR7",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -6496,
        14080
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "credentials": {
        "httpHeaderAuth": {
          "id": "RFBFxvVQtqpXFuL5",
          "name": "🌌BB_CHAT"
        }
      }
    }
  ],
  "connections": {
    "Pg_Chat⭐BINARY_xXx_STAR7": {
      "main": [
        []
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "f4fcccb61c84d5d75854e90735e6c1d4dc7f96a459bba4b39bf25fd07d0f4e26"
  }
}