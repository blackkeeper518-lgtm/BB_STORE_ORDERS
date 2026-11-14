{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "=https://efieodrwkmpcxftnlaqx.supabase.co/rest/v1/parcels?tracking_number=eq.{{$json.tracking_number}}",
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
        "jsonBody": "={{ JSON.stringify({\n \n  parcel_status_emoji:  $json.parcel_status_emoji ??null,\n  delivery_status: $json.delivery_status ?? null,\n  consignee: $json.consignee ?? null,\n  phone_number: $json.phone_number ?? null,\n  address: $json.address ?? null,\n  cod_amount: $json.cod_amount ?? null,\n  order_number: $json.order_number ?? null,\n  upsert_key: $json.upsert_key ?? null,\n  recipient_id: $json.recipient_id ?? null,\n  page_id: $json.page_id ?? null,\n  page_name: $json.page_name ?? null,\n\n  facebook_tracking_status: $json.facebook_tracking_status ?? null,\n  facebook_tracking_sent_at: $json.facebook_tracking_sent_at ?? null,\n  facebook_tracking_message: $json.facebook_tracking_message ?? null,\n  drakside_tracking_message: $json.drakside_tracking_message ?? null,\n  sent_at: $json.sent_at ?? new Date().toISOString(),\ntracking_number : $json.tracking_number ?? null,\n  parcel_status_emoji: '⚡SENT',\n  delivery_status: $json.delivery_status ?? null,\n  source_lane: '🌌BB_TRACKING',\n  facebook_tracking_sent_at: $json.facebook_tracking_sent_at ?? null,\n  facebook_tracking_status: $json.facebook_tracking_status ?? null,\n  fb_tracking_message_for_web:\n    $json.fb_tracking_message_for_web\n    ?? $json.facebook_tracking_message\n    ?? null,\n\n  ds_tracking_message_for_web:\n    $json.ds_tracking_message_for_web\n    ?? $json.drakside_tracking_message\n    ?? null\n}) }}\n",
        "options": {
          "timeout": 120000
        }
      },
      "id": "cd7f5d39-fc5c-432d-a380-bb460c4ea3ac",
      "name": "parcels2",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -7168,
        13696
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    }
  ],
  "connections": {},
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "f4fcccb61c84d5d75854e90735e6c1d4dc7f96a459bba4b39bf25fd07d0f4e26"
  }
}