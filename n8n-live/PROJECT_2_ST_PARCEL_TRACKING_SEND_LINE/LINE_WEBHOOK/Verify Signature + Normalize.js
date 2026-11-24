const body =
  typeof $json.body === 'string'
    ? JSON.parse($json.body)
    : ($json.body || {});

const events = Array.isArray(body.events)
  ? body.events
  : [];

return events.map((event) => {
  const source = event.source || {};
  const message = event.message || {};

  const lineUserId = source.userId || null;
  const destination = body.destination || null;

  // ลูกค้า 1 คนต่อ 1 ห้อง
  const conversationId = lineUserId
    ? `line_${lineUserId}`
    : null;

  const occurredAt = event.timestamp
    ? new Date(event.timestamp).toISOString()
    : new Date().toISOString();

  const isMessageEvent = event.type === 'message';

  return {
    json: {
      // ระบุแพลตฟอร์มและ OA
      channel: 'line',
      source: 'line',
      destination,
      oa_id: destination,

      // ห้องแชท
      conversation_id: conversationId,

      // Event
      event_id: event.webhookEventId || null,
      webhook_event_id: event.webhookEventId || null,
      event_type: event.type || null,
      event_timestamp: event.timestamp || null,
      created_at: occurredAt,

      // LINE User
      line_user_id: lineUserId,
      user_id: lineUserId,
      source_type: source.type || null,
      group_id: source.groupId || null,
      room_id: source.roomId || null,

      // Message
      line_message_id: message.id || null,
      message_id: message.id || null,
      message_type: message.type || null,
      message_text: message.text || null,
      text: message.text || null,

      // ใช้แยกฝั่งลูกค้า/แอดมิน
      direction: 'inbound',
      speaker: 'customer',

      // ใช้ตอบกลับภายหลัง
      reply_token: event.replyToken || null,

      // ยังไม่รู้ชื่อจาก Webhook โดยตรง
      // Server จะดึงชื่อจริงจาก LINE Profile API
      display_name: null,
      profile_picture_url: null,

      // เก็บ Event ดิบไว้ตรวจสอบ
      raw_event: event,
      raw_payload: body,

      // ช่วยกรอง Event ที่ไม่ใช่ข้อความ
      is_message_event: isMessageEvent,
    },
  };
});
