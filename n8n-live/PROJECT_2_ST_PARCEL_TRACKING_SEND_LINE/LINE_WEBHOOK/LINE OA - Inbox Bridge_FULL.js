{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "line-oa/webhook",
        "options": {
          "rawBody": true
        }
      },
      "id": "04c57d93-c782-474a-a444-dea5316c349e",
      "name": "LINE Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -512,
        -352
      ],
      "webhookId": "line-oa-webhook"
    },
    {
      "parameters": {
        "jsCode": "const body =\n  typeof $json.body === 'string'\n    ? JSON.parse($json.body)\n    : ($json.body || {});\n\nconst events = Array.isArray(body.events)\n  ? body.events\n  : [];\n\nreturn events.map((event) => {\n  const source = event.source || {};\n  const message = event.message || {};\n\n  const lineUserId = source.userId || null;\n  const destination = body.destination || null;\n\n  // ลูกค้า 1 คนต่อ 1 ห้อง\n  const conversationId = lineUserId\n    ? `line_${lineUserId}`\n    : null;\n\n  const occurredAt = event.timestamp\n    ? new Date(event.timestamp).toISOString()\n    : new Date().toISOString();\n\n  const isMessageEvent = event.type === 'message';\n\n  return {\n    json: {\n      // ระบุแพลตฟอร์มและ OA\n      channel: 'line',\n      source: 'line',\n      destination,\n      oa_id: destination,\n\n      // ห้องแชท\n      conversation_id: conversationId,\n\n      // Event\n      event_id: event.webhookEventId || null,\n      webhook_event_id: event.webhookEventId || null,\n      event_type: event.type || null,\n      event_timestamp: event.timestamp || null,\n      created_at: occurredAt,\n\n      // LINE User\n      line_user_id: lineUserId,\n      user_id: lineUserId,\n      source_type: source.type || null,\n      group_id: source.groupId || null,\n      room_id: source.roomId || null,\n\n      // Message\n      line_message_id: message.id || null,\n      message_id: message.id || null,\n      message_type: message.type || null,\n      message_text: message.text || null,\n      text: message.text || null,\n\n      // ใช้แยกฝั่งลูกค้า/แอดมิน\n      direction: 'inbound',\n      speaker: 'customer',\n\n      // ใช้ตอบกลับภายหลัง\n      reply_token: event.replyToken || null,\n\n      // ยังไม่รู้ชื่อจาก Webhook โดยตรง\n      // Server จะดึงชื่อจริงจาก LINE Profile API\n      display_name: null,\n      profile_picture_url: null,\n\n      // เก็บ Event ดิบไว้ตรวจสอบ\n      raw_event: event,\n      raw_payload: body,\n\n      // ช่วยกรอง Event ที่ไม่ใช่ข้อความ\n      is_message_event: isMessageEvent,\n    },\n  };\n});\n"
      },
      "id": "1b5638f0-8413-47ef-bbfd-fb30eb314ced",
      "name": "Verify Signature + Normalize",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -288,
        -352
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "is-message",
              "leftValue": "={{ $json.event_type }}",
              "rightValue": "message",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "50a1d01f-4c25-400a-ae62-32cd5ba98c74",
      "name": "Is Message Event?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        -64,
        -352
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "is-supported-message",
              "leftValue": "={{ $json.message_type }}",
              "rightValue": "text",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            },
            {
              "id": "is-image",
              "leftValue": "={{ $json.message_type }}",
              "rightValue": "image",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            },
            {
              "id": "is-file",
              "leftValue": "={{ $json.message_type }}",
              "rightValue": "file",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            },
            {
              "id": "is-sticker",
              "leftValue": "={{ $json.message_type }}",
              "rightValue": "sticker",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combinator": "or"
        },
        "options": {}
      },
      "id": "25bbe792-22e2-4dd8-8cc6-7b9890593a7e",
      "name": "Supported Message Type?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        160,
        -352
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://yuniclsmvhjuxamdvwbw.supabase.co/rest/v1/line_messages?on_conflict=event_id",
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
            {
              "name": "on_conflict",
              "value": "event_id"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json}}",
        "options": {
          "timeout": 10000
        }
      },
      "id": "d741b6ca-0257-4218-b20a-07b9e8d479a2",
      "name": "Save Message to App Backend",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        384,
        -352
      ],
      "credentials": {
        "httpHeaderAuth": {
          "id": "RFBFxvVQtqpXFuL5",
          "name": "🌌ST_CHAT"
        }
      }
    }
  ],
  "connections": {
    "LINE Webhook": {
      "main": [
        [
          {
            "node": "Verify Signature + Normalize",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verify Signature + Normalize": {
      "main": [
        [
          {
            "node": "Is Message Event?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Message Event?": {
      "main": [
        [
          {
            "node": "Supported Message Type?",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "Supported Message Type?": {
      "main": [
        [
          {
            "node": "Save Message to App Backend",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "Save Message to App Backend": {
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