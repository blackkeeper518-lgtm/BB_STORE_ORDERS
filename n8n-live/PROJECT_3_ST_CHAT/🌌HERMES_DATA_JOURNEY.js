{
  "nodes": [
    {
      "parameters": {
        "url": "=https://graph.facebook.com/v26.0/{{ $json.page_id }}/conversations",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "fields",
              "value": "id,updated_time,message_count,unread_count,participants{id,name},can_reply,messages.limit(5){id,message,created_time,from{id,name,profile_pic},is_echo,attachments{id,mime_type,name,file_url,image_data{url,preview_url,image_type,render_as_sticker},video_data{url,preview_url}},shares{name,link},sticker}"
            },
            {
              "name": "limit",
              "value": "15"
            },
            {
              "name": "access_token",
              "value": "={{ $json.access_token }}"
            },
            {
              "name": "since",
              "value": "={{ $now.setZone('Asia/Bangkok').minus({ minute: 10 }).toFormat('yyyy-LL-dd HH:mm:ss') }}"
            },
            {
              "name": "until",
              "value": "={{ $now.setZone('Asia/Bangkok').toFormat('yyyy-LL-dd HH:mm:ss') }}"
            }
          ]
        },
        "options": {
          "allowUnauthorizedCerts": false
        }
      },
      "id": "1f26b524-3f58-42ef-b985-534b3351fe78",
      "name": "🌌HERMES_DATA_JOURNEY",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        -3248,
        8320
      ]
    }
  ],
  "connections": {
    "🌌HERMES_DATA_JOURNEY": {
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
