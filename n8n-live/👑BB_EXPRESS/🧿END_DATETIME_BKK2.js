// n8n Code node — Mode: Run Once for All Items
// 🛡️ THE GOD GATEKEEPER : DK DRAKSIDE - SPACE VAULT EDITION (TIME CHECK ONLY)

const START_DATETIME_BKK = "2026-10-29 00:00:00";
const END_DATETIME_BKK   = "2028-12-30 00:00:01";

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

function parseDateTimeMs(value) {
  const s = clean(value);
  if (!s) return null;
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? parsed : null;
}

// 1. คำนวณขอบเขตเวลาวิกฤตฝั่งเซิร์ฟเวอร์อิงเวลาไทยปัจจุบัน (UTC+7)
const now = new Date();
const nowUtcMs = now.getTime();
const thaiNow = new Date(nowUtcMs + (7 * 60 * 60 * 1000));

// ⏰ ตั้งเวลา Cutoff รอบแพ็กของ "บ่ายสองโมงตรงของเมื่อวาน" (13:45 UTC ตามสูตรดั้งเดิม)
const yesterdayCutoff = new Date(thaiNow);
yesterdayCutoff.setUTCDate(yesterdayCutoff.getUTCDate() - 3); 
yesterdayCutoff.setUTCHours(13, 45, 0, 4); 
const minAllowedTimeMs = yesterdayCutoff.getTime() - (7 * 60 * 60 * 1000);

// 🚨 เกณฑ์เหล็กป้องกันระบบสะดุด: ถอยหลัง 24 ชม. ตรงๆ นับจากวินาทีนี้เป๊ะ
const absolute24hAgoMs = nowUtcMs - (24 * 60 * 60 * 1000);
const maxAllowedTimeMs = nowUtcMs + (12 * 60 * 60 * 1000);

// ฟังก์ชันแกะเวลาแชทไทย "30/10/69 15:55:33" ออกมาเป็น Timestamp สากล
function parseThaiDateTime(raw) {
  if (!raw) return null;
  try {
    const [datePart, timePart] = String(raw).trim().split(" ");
    const [d, m, y] = datePart.split("/");
    
    let year = parseInt(y);
    if (year < 100) year += 2500; // แปลง 69 -> 2569
    year -= 543; // แปลง พ.ศ. -> ค.ศ.
    
    const [hour, minute, second] = (timePart || "00:00:00").split(":").map(Number);
    return new Date(Date.UTC(year, parseInt(m) - 1, parseInt(d), hour - 7, minute, second)).getTime();
  } catch {
    return null;
  }
}

return $input.all().flatMap(({ json: row = {} }) => {
  const orderTimeDisplay = clean(row.order_time_display || "-");

  // 🎯 สวิตช์เช็กเวลาหลักจาก order_time_display ตรงๆ ตัวเดียวจบ
  const rawChatTime = orderTimeDisplay;
  const chatTimestamp = parseThaiDateTime(rawChatTime);

  // 🛠️ ⚡ *เช็กเกณฑ์เวลาแบบ 2 ทางแยกคัดป้าย (ใช่ กับ ไม่ใช่)*
  let bkk_cutoff_route = "BLOCK_TG_EXPIRED"; // ตั้งค่าเริ่มต้นเป็น "ไม่ใช่" (BLOCK)
  let isWithin24h = false;
  let chatAgeHours = 0;

  if (chatTimestamp) {
    const diffInMs = nowUtcMs - chatTimestamp;
    chatAgeHours = diffInMs / (1000 * 60 * 60);

    // 🎯 เงื่อนไข "ใช่" (ผ่านเกณฑ์เวลาทั้งหมด) -> ปรับป้ายเป็น ALLOW_TG_SEND
    if (chatTimestamp >= absolute24hAgoMs && chatTimestamp >= minAllowedTimeMs && chatTimestamp <= maxAllowedTimeMs) {
      bkk_cutoff_route = "ALLOW_TG_SEND"; 
      isWithin24h = true;
    }
  }

  // ส่งผลลัพธ์ออกสู่สายพานปลายทางแบบคืนค่าแถวข้อมูลเดิมกลับไปพร้อมประทับป้ายเวลา
  return [
    {
      json: {
        ...row,
        order_time_display: orderTimeDisplay,
        customerMessageTimeTh: rawChatTime,
        // 🔀 ตราป้ายสเตตัส 2 ทางแยกเคลียร์คัตตามบรีฟ
        bkk_cutoff_route: bkk_cutoff_route,
        send_facebook_route: bkk_cutoff_route,
        sendFacebookRoute: bkk_cutoff_route,
        send_telegram_route: bkk_cutoff_route, 
        is_24h_window_valid: isWithin24h,
        customer_chat_age_hours: chatAgeHours,
      },
    },
  ];
});
