{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v22.0/{{ $json.page_id }}/messages",
        "sendQuery": true,
        "queryParameters": {
          "parameters": []
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "={{ 'Bearer ' + $json.access_token }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({\n  recipient: {\n    id: String($json.recipient_psid || $json.customer_id)\n  },\n  messaging_type: \"RESPONSE\",\n  message: {\n    text: String($json.facebook_tracking_message || \"\")\n  }\n}) }}\n",
        "options": {
          "timeout": 120000
        }
      },
      "id": "489afcb1-164e-4184-b4e3-c96c0770f973",
      "name": "👣facebook_tracking_message",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -6944,
        14080
      ],
      "retryOnFail": false,
      "alwaysOutputData": false,
      "executeOnce": false,
      "onError": "continueRegularOutput"
    }
  ],
  "connections": {
    "👣facebook_tracking_message": {
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