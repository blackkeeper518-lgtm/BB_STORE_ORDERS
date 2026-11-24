{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://yuniclsmvhjuxamdvwbw.supabase.co/rest/v1/Pg_Chat⭐BINARY_xXx_STAR?on_conflict=message_id",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            },
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bmljbHNtdmhqdXhhbWR2d2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDM2NzUxNCwiZXhwIjoyMTA5OTQzNTE0fQ.bdJCImBurhWjrk8pWPaWweP9UUnEovLlUIf5jibgIXY"
            },
            {
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bmljbHNtdmhqdXhhbWR2d2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDM2NzUxNCwiZXhwIjoyMTA5OTQzNTE0fQ.bdJCImBurhWjrk8pWPaWweP9UUnEovLlUIf5jibgIXY"
            },
            {
              "name": "on_conflict",
              "value": "message_id"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json}}",
        "options": {}
      },
      "id": "d3763a43-7e80-4acf-81ba-b824ee049db8",
      "name": "Pg_Chat⭐BINARY_xXx_STAR",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [
        -2576,
        8416
      ],
      "retryOnFail": false,
      "waitBetweenTries": 5000,
      "executeOnce": false,
      "alwaysOutputData": true,
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