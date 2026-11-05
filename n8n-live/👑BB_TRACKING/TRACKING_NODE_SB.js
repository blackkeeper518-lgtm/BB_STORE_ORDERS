{
  "nodes": [
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "parcels",
        "matchType": "allFilters",
        "filters": {
          "conditions": [
            {
              "keyName": "phone_number",
              "condition": "eq",
              "keyValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.phone}}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "facebook_tracking_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "facebook_tracking_status",
              "fieldValue": "🔥SENT"
            },
            {
              "fieldId": "message_id",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.message_id }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "🔥SENT"
            },
            {
              "fieldId": "recipient_id",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.customer_id}}"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "upsert_key",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.upsert_key}}"
            },
            {
              "fieldId": "order_number",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.order_number}}"
            },
            {
              "fieldId": "order_phone",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.extracted_phone}}"
            },
            {
              "fieldId": "portal_key",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.portal_key}}"
            },
            {
              "fieldId": "page_name",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.page_name}}"
            },
            {
              "fieldId": "parcel_status_emoji",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.parcel_status_emoji}}"
            },
            {
              "fieldId": "facebook_tracking_message",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.facebook_tracking_message}}"
            },
            {
              "fieldId": "drakside_tracking_message",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.drakside_tracking_message}}"
            },
            {
              "fieldId": "phone_candidates",
              "fieldValue": "={{ $('⛓️THE DEAD INTERSECTION').item.json.phone_candidates }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -6272,
        7712
      ],
      "id": "f94f7f39-5844-48b4-ad18-8c1e07dedc45",
      "name": "🧧FB_TRACKING_TODAY9",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "Zh6TPBgVH5JoqWt6",
          "name": "🧿BB_xXx_ORDERCONTROL"
        }
      },
      "onError": "continueRegularOutput"
    }
  ],
  "connections": {
    "🧧FB_TRACKING_TODAY9": {
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