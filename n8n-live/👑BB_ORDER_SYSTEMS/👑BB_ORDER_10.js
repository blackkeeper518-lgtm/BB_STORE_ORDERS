{
  "nodes": [
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "8b5b24f3-aebe-4090-a483-3d801431e4a9",
                    "leftValue": "={{ $json.bb_express_send_route}}",
                    "rightValue": "🟠",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟠"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "9b45fba5-fdd0-4452-956e-08ca67e6b059",
                    "leftValue": "={{ $json.bb_express_send_route}}",
                    "rightValue": "🟨",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟨"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "2fbee864-78ba-44ea-a353-0635820e2186",
                    "leftValue": "={{ $json.bb_express_send_route}}",
                    "rightValue": "🟦",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟦"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "db68cf51-c9c1-46c7-8188-76170bffde9f",
                    "leftValue": "={{ $json.bb_express_send_route}}",
                    "rightValue": "⚪",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "⚪"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "c9f4aab8-edca-44e9-be75-54a22c0dbae5",
                    "leftValue": "={{ $json.bb_express_send_route}}",
                    "rightValue": "⬛",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "⬛"
            }
          ]
        },
        "options": {
          "fallbackOutput": "none"
        }
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.4,
      "position": [
        -4000,
        7152
      ],
      "id": "d5d7ebc8-1058-4575-a8ff-03d11bbae5be",
      "name": "Switch6",
      "notes": "รองรับ ⚫/🔴/🟠/🟨/🟦/⚪/⬛ ตามสัญญาสี; ไฟล์แนบไม่มีโหนดปลายทางเชื่อมจาก Switch5 จึงต้องต่อ output เข้าห้อง Telegram/ระบบปลายทางก่อนใช้งานจริง."
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://jgobrrwrqksdlfsaydtq.supabase.co/rest/v1/🌀SINGULARITY_xXx_EXCHANGE?on_conflict=upsert_key",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json}}",
        "options": {
          "timeout": 120000
        }
      },
      "id": "5dd216d0-e6f9-429b-8988-b1fb15c942da",
      "name": "🌀SINGULARITY_xXx_EXCHANGE",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -3776,
        7008
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://jgobrrwrqksdlfsaydtq.supabase.co/rest/v1/🗝️HERMES_ARCHIVE?on_conflict=upsert_key",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json}}",
        "options": {
          "timeout": 120000
        }
      },
      "id": "e7602ae2-1e96-4ca5-a3b5-46ac707473ae",
      "name": "🌀SINGULARITY_xXx_EXCHANGE2",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -3776,
        7200
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://jgobrrwrqksdlfsaydtq.supabase.co/rest/v1/💀THANATOS_xXx_DEATH_NOTE?on_conflict=upsert_key",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2JycndycWtzZGxmc2F5ZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk1OTkwMiwiZXhwIjoyMTA3NTM1OTAyfQ.Zqk2yqgtDT3Ua0TERZ8jITu4Gu6MJmSLvInUOsmVnUk"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {
              "name": "on_conflict",
              "value": "upsert_key"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json}}",
        "options": {
          "timeout": 120000
        }
      },
      "id": "7e50b445-f57a-44e1-98dc-f27d82f244a3",
      "name": "💀THANATOS_xXx_DEATH_NOTE3",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -3776,
        7392
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    }
  ],
  "connections": {
    "Switch6": {
      "main": [
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "💀THANATOS_xXx_DEATH_NOTE3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌀SINGULARITY_xXx_EXCHANGE": {
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