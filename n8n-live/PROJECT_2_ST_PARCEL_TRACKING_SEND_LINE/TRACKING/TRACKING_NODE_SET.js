{
  "nodes": [
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "1d0f1403-f2e8-4254-a503-16f92acd35c8",
              "name": "upsert_key",
              "value": "={{ $json.upsert_key }}",
              "type": "string"
            },
            {
              "id": "b6eb782d-a559-40bf-b67c-27427481d306",
              "name": "facebook_tracking_message",
              "value": "={{ $json.facebook_tracking_message }}",
              "type": "string"
            },
            {
              "id": "1c2d1dfd-e5f4-4a4f-9255-4af947950fb7",
              "name": "drakside_tracking_message",
              "value": "={{ $json.drakside_tracking_message }}",
              "type": "string"
            },
            {
              "id": "82ec3452-ac21-43c7-aee0-b4d8663bf85e",
              "name": "threadId",
              "value": "={{ $json.threadId }}",
              "type": "string"
            },
            {
              "id": "ef2f69df-16c7-4781-9b88-08ff088e2ba9",
              "name": "page_name",
              "value": "={{ $json.page_name }}",
              "type": "string"
            },
            {
              "id": "9af76d23-0eea-4788-bd31-cb54ac017c1e",
              "name": "portal_key",
              "value": "={{ $json.portal_key }}",
              "type": "string"
            },
            {
              "id": "72f1845a-c0bd-4a74-bfff-81794753ff3a",
              "name": "order_number",
              "value": "={{ $json.order_number }}",
              "type": "string"
            },
            {
              "id": "33308323-c69c-41cf-86d3-add3bd0f8710",
              "name": "order_number_display",
              "value": "={{ $json.order_number_display }}",
              "type": "string"
            },
            {
              "id": "79491941-12be-46c4-b30e-5ea7b64e7315",
              "name": "message_id",
              "value": "={{ $json.message_id }}",
              "type": "string"
            },
            {
              "id": "1692c474-2a7c-4c7d-958a-cbcb0dad1dda",
              "name": "parcel_status_emoji",
              "value": "={{ $json.parcel_status_emoji}}",
              "type": "string"
            },
            {
              "id": "7e2b9d81-f9a4-46a6-aefc-5e06e29ab6d5",
              "name": "tracking_number",
              "value": "={{ $json.tracking_number}}",
              "type": "string"
            },
            {
              "id": "41bfab11-2f5f-4f94-b0e6-310fa8f85a19",
              "name": "page_id",
              "value": "={{ $json.page_id }}",
              "type": "string"
            },
            {
              "id": "d5117822-5e58-41e6-a538-7d26371f2435",
              "name": "customer_id",
              "value": "={{ $json.customer_id }}",
              "type": "string"
            },
            {
              "id": "6d93e356-d48f-4992-b441-fa36e991e1ea",
              "name": "order_time_display",
              "value": "={{ $json.order_time_display }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        -7168,
        7296
      ],
      "id": "eee552ef-28d0-4906-9419-673433ebd7f3",
      "name": "Edit Fields1"
    }
  ],
  "connections": {
    "Edit Fields1": {
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