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
                    "id": "54a78a2c-b889-4768-97b2-2c84d2f5b6f4",
                    "leftValue": "={{ $json.parcel_status_emoji }}",
                    "rightValue": "🔥SENT",
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
              "outputKey": "📌"
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
                    "id": "80369207-4141-4d7d-83dd-d8c0c350a5d4",
                    "leftValue": "={{ $json.parcel_status_emoji }}",
                    "rightValue": "🔴",
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
              "outputKey": "🔴"
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
                    "id": "b571e39b-5b2e-4db2-99b7-47cadc0c08c6",
                    "leftValue": "={{ $json.parcel_status_emoji }}",
                    "rightValue": "🟡",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟡"
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
                    "leftValue": "={{ $json.parcel_status_emoji }}",
                    "rightValue": "🟢",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "3fc0a29e-1342-4dc3-bbf8-42480605735d"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟢"
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
        -7616,
        13856
      ],
      "id": "e23f2962-a749-4b54-9343-c3423fc529c8",
      "name": "⛓️THE DEAD INTERSECTION"
    }
  ],
  "connections": {
    "⛓️THE DEAD INTERSECTION": {
      "main": [
        [],
        [],
        [],
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