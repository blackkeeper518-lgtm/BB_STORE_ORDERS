// ============================================================
// 🟥TRACKING_REQUEST🔴FINAL - BB EXPRESS SEND ROUTE - ปั้มแดงอย่างเดียว
// รองรับระบบ 7 เพจแบบ 100% ไดนามิก เช็กจากชื่อลูกค้าแทนการฟิกชื่อเพจ
// ============================================================

// ---------- 1. ตัวช่วยแปลงวันที่ไทยสับชิ้นส่วนเพียว ----------
function parseThaiDate(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  let [_, d, mo, y, h, mi, s] = m;
  y = parseInt(y);
  if (y < 100) y += 2500; // 69 -> 2569
  if (y > 2400) y -= 543; // 2569 -> 2026
  return new Date(y, parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi), parseInt(s || 0));
}

function parseAnyDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  return parseThaiDate(v);
}

// ---------- 2. ฟังก์ชั่นจับคำขอเลข (🛡️ ฉบับปิดจุดดักคำขอเลขเก่าข้ามวันข้ามคืน) ----------
function bindTrackingRequestToOrder(row, { maxDays = 3 } = {}) {
  const timeline = row.chat_timeline || row.chatTimeline || row.timeline || [];
  // 🎯 ดึงเวลาสากลหน้าจอหลักของพี่มาตั้งเป็นหมุดเวลาอ้างอิงหลัก
  const orderTime = parseAnyDate(row.order_time_display || row.order_time || row.order_time_thai_label || row["⏰ เวลาสั่งซื้อ"]);
  const currentCustomerName = String(row.facebook_name || row.customer_name || '').trim();

  const keywords = [
    "ขอเลข", "เลขพัสดุ", "เลขพัส", "เลขพัสดุผม", "เลขพัสดุหน่อย",
    "เช็คเลข", "เช็คของ", "ของส่งยัง", "ส้งแล้วขอเลข", "ดูไม่ได้",
    "เลขพัสดุได้ยัง", "ส่งยัง", "ได้เลขยัง", "ขอเลขหน่อย", "ขอเลขพัสดุ"
  ];

  let firstAskTime = null;
  let lastAskTime = null;
  let matchedText = null;

  const text = Array.isArray(timeline) ? timeline.join("\n") : String(timeline || "");
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const dateM = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
    const askDate = dateM ? parseThaiDate(dateM[0]) : null;
    const lower = line.toLowerCase();
    
    let isCustomer = false;
    const senderMatch = line.match(/^\[([^\]]+)\]/);
    if (senderMatch && currentCustomerName) {
      if (senderMatch[1].includes(currentCustomerName)) {
        isCustomer = true;
      }
    }
    
    const isAsk = keywords.some(k => lower.includes(k));

    // 🛡️ 🔥 [ลอจิกชี้ขาดความปลอดภัย]: คำขอเลขนั้นต้องเกิดขึ้น "หลัง" เวลาสั่งออเดอร์นี้เท่านั้น (askDate > orderTime)
    // ถ้าเวลาขอเลขมันเก่ากว่าเวลาบิลนี้ แปลว่าเป็นคำขอเลขของบิลเก่าในอดีต -> ดีดทิ้ง ไม่เอามาคำนวณให้ระบบเพี้ยน!
    if (isCustomer && isAsk && askDate && orderTime) {
      if (askDate >= orderTime) { 
        if (!firstAskTime || askDate < firstAskTime) {
          firstAskTime = askDate;
          matchedText = line;
        }
        if (!lastAskTime || askDate > lastAskTime) lastAskTime = askDate;
      }
    }
  }

  if (!firstAskTime) return { detected: false, route: "PASS_THROUGH", diffHours: null, firstAskTime: null };

  let diffHours = null;
  let direction = "ASK_AFTER_ORDER"; // ล็อคสิทธิ์เป็นขอหลังสั่งชัวร์ 100%
  if (orderTime) {
    diffHours = Math.abs(firstAskTime - orderTime) / 3600000;
  }

  return {
    detected: true,
    route: "TRACKING_REQUEST",
    diffHours,
    direction,
    firstAskTime: firstAskTime.toISOString(),
    lastAskTime: lastAskTime ? lastAskTime.toISOString() : null,
    matchedText,
    orderTime: orderTime ? orderTime.toISOString() : null
  };
}

// ---------- 3. NODE2 MAIN ----------
return items.map(item => {
  const row = item.json;
  const originalRoute = row.bb_express_send_route;
  const originalBackup = row.status_color_backup || row.routing_tag_backup || "⚪White";

  // 🔎 💥 [ดักจับสัญญาณส่งเลขพัสดุออโต้หมุดแดงสั้นเพียว]
  const timelineContent = Array.isArray(row.chat_timeline) ? row.chat_timeline.join("\n") : String(row.chat_timeline || "");
  const latestMessageContent = String(row.page_latest_message || "");
  
  const hasAutoTrackingSignal = timelineContent.includes("📌") || latestMessageContent.includes("📌");

  const trackingCheck = bindTrackingRequestToOrder(row, { maxDays: 3 });
  row.tracking_check = trackingCheck;

  const askTime = trackingCheck.firstAskTime ? new Date(trackingCheck.firstAskTime) : null;
  const orderTime = trackingCheck.orderTime ? new Date(trackingCheck.orderTime) : parseAnyDate(row.order_time_display || row.order_time);

  row.status_color_backup = originalBackup;
  row.routing_tag_backup = originalBackup;
  row.is_safety_white = originalBackup === "⚪White";

  // ⚡ ด่านตัดสินผลลัพธ์แยกเส้นทาง
  if (hasAutoTrackingSignal) {
    // เพิ่งรับเลขไปหรือระบบพ่นหมุดหมุดแดงออโต้ให้ล่าสุด -> ปั้มแดงกลม 🔴 ทันที
    row.bb_express_send_route = "🔴";
    row.node2_route_signal = "TRACKING_REQUEST_AUTO";
    row.node2_tracking_request_detected = true;
    row.node2_tracking_request_48h = false;
    row.node2_tracking_request_event = "พบสัญญาณแจ้งเลขพัสดุอัตโนมัติ 📌";
    row.node2_tracking_request_route_hint = "🔴";
  } else if (trackingCheck.detected && askTime && orderTime) {
    const diffAfter = (askTime - orderTime) / 3600000;

    if (diffAfter < 48) {
      // ลูกค้าขอเลขภายใน 48 ชั่วโมงหลังสั่งซื้อ -> ต้องส่งเลข ปั้มแดงเหลี่ยม 🟥
      row.bb_express_send_route = "🟥";
      row.node2_route_signal = "TRACKING_REQUEST";
      row.node2_tracking_request_detected = true;
      row.node2_tracking_request_48h = true;
      row.node2_tracking_request_event = trackingCheck.matchedText;
      row.node2_tracking_request_route_hint = "🟥";
    } else {
      // นอกเหนือจากนั้น ดันเข้าแดงกลม 🔴
      row.bb_express_send_route = "🔴";
      row.node2_route_signal = "TRACKING_REQUEST";
      row.node2_tracking_request_detected = true;
      row.node2_tracking_request_48h = false;
      row.node2_tracking_request_event = trackingCheck.matchedText;
      row.node2_tracking_request_route_hint = "🔴";
    }
  } else {
    row.bb_express_send_route = originalRoute;
    row.node2_route_signal = "PASS_THROUGH";
    row.node2_tracking_request_detected = false;
    row.node2_tracking_request_48h = false;
  }

  // ปลั๊กอินคัดปลายทางแยกห้องเก็บตารางหลัก
  if (row.bb_express_send_route === "🟥" || row.bb_express_send_route === "🔴") {
    row.target_room = "RED_ROOM";
    row.routing_tag = row.bb_express_send_route === "🟥" ? "🟥 Red48" : "🔴 Red";
    row.status_color = row.bb_express_send_route === "🟥" ? "🟥 Red" : "🔴 Red";
  } else {
    row.target_room = "WHITE_ROOM";
  }

  return item;
});
