{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "=https://efieodrwkmpcxftnlaqx.supabase.co/rest/v1/parcels?tracking_number=eq.{{ $('📌📣').item.json.tracking_number }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaWVvZHJ3a21wY3hmdG5sYXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzg2NDExMiwiZXhwIjoyMTA5NDQwMTEyfQ.2QPueeHKAAfb-tYDiA_c7xDvlkwTNVehZ9qPQqR8Mo4"
            },
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaWVvZHJ3a21wY3hmdG5sYXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzg2NDExMiwiZXhwIjoyMTA5NDQwMTEyfQ.2QPueeHKAAfb-tYDiA_c7xDvlkwTNVehZ9qPQqR8Mo4"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {
              "name": "on_conflict",
              "value": "tracking_number"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({\n  sent_at: $now.toISO(),\n  parcel_status_emoji: '⚡SENT',\n  delivery_status:'⚡SENT',\n  source_lane: '🌌BB_TRAaCKING',\nupsert_key:\n $('📌📣').item.json.upsert_key ?? $json.upsert_key ?? null,\n  consignee:\n    $('📌📣').item.json.consignee ?? $json.consignee ?? null,\n  phone_number:\n    $('📌📣').item.json.phone_number ?? $json.phone_number ?? null,\n  address:\n    $('📌📣').item.json.address ?? $json.address ?? null,\n  cod_amount:\n    $('📌📣').item.json.cod_amount ?? $json.cod_amount ?? null,\n\n  order_number:\n    $('📌📣').item.json.order_number ?? $json.order_number ?? null,\n  upsert_key:\n    $('📌📣').item.json.upsert_key ?? $json.upsert_key ?? null,\n  recipient_id:\n    $('📌📣').item.json.recipient_id ?? $json.recipient_id ?? null,\n  page_id:\n    $('📌📣').item.json.page_id ?? $json.page_id ?? null,\n  page_name:\n    $('📌📣').item.json.page_name ?? $json.page_name ?? null,\n  tracking_number :\n    $('📌📣').item.json.tracking_number  ?? $json.tracking_number  ?? null,\n  facebook_tracking_status:\n    $('📌📣').item.json.facebook_tracking_status ?? $json.facebook_tracking_status ?? null,\n  facebook_tracking_sent_at:\n    $('📌📣').item.json.facebook_tracking_sent_at ?? $json.facebook_tracking_sent_at ?? null,\n  facebook_tracking_message:\n    $('📌📣').item.json.facebook_tracking_message ?? $json.facebook_tracking_message ?? null,\n  drakside_tracking_message:\n    $('📌📣').item.json.drakside_tracking_message ?? $json.drakside_tracking_message ?? null,\n  chat_link_key:\n   $('📌📣').item.json.chat_link_key,\n  fb_tracking_message_for_web:\n    $('📌📣').item.json.fb_tracking_message_for_web\n    ?? $('📌📣').item.json.facebook_tracking_message\n    ?? $json.fb_tracking_message_for_web\n    ?? $json.facebook_tracking_message\n    ?? null,\n\n  ds_tracking_message_for_web:\n    $('📌📣').item.json.ds_tracking_message_for_web\n    ?? $('📌📣').item.json.drakside_tracking_message\n    ?? $json.ds_tracking_message_for_web\n    ?? $json.drakside_tracking_message\n    ?? null\n}) }}\n",
        "options": {
          "timeout": 120000
        }
      },
      "id": "76576904-a91f-472e-a198-69fc6b1e4947",
      "name": "parcels4",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -6720,
        14080
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    }
  ],
  "connections": {
    "parcels4": {
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