{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://efieodrwkmpcxftnlaqx.supabase.co/rest/v1/🏹HUNTER_xXx_TARGET?on_conflict=upsert_key",
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
      "id": "b8e026af-04ff-489e-9676-e061f0bf74b6",
      "name": "🏹HUNTER_xXx_TARGET",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -6944,
        7296
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
    "instanceId": "f4fcccb61c84d5d75854e90735e6c1d4dc7f96a459bba4b39bf25fd07d0f4e26"
  }
}