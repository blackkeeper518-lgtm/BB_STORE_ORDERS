// n8n Code node — Mode: Run Once for All Items
// 🛡️ THE GOD GATEKEEPER : DK DRAKSIDE - SPACE VAULT EDITION (TIME CHECK ONLY)

// 1. คำนวณเวลาปัจจุบันและ cutoff โดยอิงเวลาไทย (UTC+7)
const now = new Date();
const nowUtcMs = now.getTime();
const thaiNow = new Date(nowUtcMs + 7 * 60 * 60 * 1000);

// Cutoff = 14:00 ของเมื่อวาน ตามเวลาไทย
const yesterdayCutoffBkk = new Date(thaiNow);
yesterdayCutoffBkk.setUTCDate(yesterdayCutoffBkk.getUTCDate() - 0);
yesterdayCutoffBkk.setUTCHours(11, 30, 21, 0);

// แปลง cutoff เวลาไทยกลับเป็น timestamp UTC
const minAllowedTimeMs =
  yesterdayCutoffBkk.getTime() - 7 * 60 * 60 * 1000;

// ฟังก์ชันแกะเวลาแชทไทย เช่น "12/11/69 15:55:33"
function parseThaiDateTime(raw) {
  if (!raw) return null;

  try {
    const [datePart, timePart] = String(raw).trim().split(/\s+/);
    if (!datePart) return null;

    const [dayText, monthText, yearText] = datePart.split("/");
    let year = Number.parseInt(yearText, 10);
    const month = Number.parseInt(monthText, 10);
    const day = Number.parseInt(dayText, 10);

    if (![year, month, day].every(Number.isFinite)) return null;

    // รองรับปี พ.ศ. แบบ 2 หลัก เช่น 69 และ 4 หลัก เช่น 2569
    if (year < 100) year += 2500;
    if (year >= 2400) year -= 543;

    const [hour = 0, minute = 0, second = 0] = (timePart || "00:00:00")
      .split(":")
      .map(Number);

    if (![hour, minute, second].every(Number.isFinite)) return null;

    // เวลาไทย UTC+7 แปลงเป็น UTC timestamp
    return Date.UTC(year, month - 1, day, hour - 7, minute, second);
  } catch {
    return null;
  }
}

return $input.all().flatMap(({ json: row = {} }) => {
  const orderTimeDisplay = String(row.order_time_display ?? "-")
    .trim()
    .replace(/\s+/g, " ");

  const chatTimestamp = parseThaiDateTime(orderTimeDisplay);

  let bkk_cutoff_route = "BLOCK_TG_EXPIRED";
  let isAfterCutoff = false;
  let isWithin24h = false;
  let chatAgeHours = 0;

  if (chatTimestamp !== null) {
    const diffInMs = nowUtcMs - chatTimestamp;
    chatAgeHours = diffInMs / (1000 * 60 * 60);

    // ผ่านเมื่อเวลาอยู่ตั้งแต่เมื่อวาน 14:00 ถึงเวลาปัจจุบัน
    if (chatTimestamp >= minAllowedTimeMs && chatTimestamp <= nowUtcMs) {
      bkk_cutoff_route = "ALLOW_TG_SEND";
      isAfterCutoff = true;
    }

    // เก็บสถานะ 24 ชั่วโมงเดิมไว้ให้ฟิลด์นี้ยังตรงกับชื่อ
    isWithin24h =
      chatTimestamp >= nowUtcMs - 24 * 60 * 60 * 1000 &&
      chatTimestamp <= nowUtcMs;
  }

  return [
    {
      json: {
        ...row,
        order_time_display: orderTimeDisplay,
        customerMessageTimeTh: orderTimeDisplay,

        bkk_cutoff_route,
        send_facebook_route: bkk_cutoff_route,
        sendFacebookRoute: bkk_cutoff_route,
        send_telegram_route: bkk_cutoff_route,

        // สถานะใหม่: ผ่าน cutoff เมื่อวาน 14:00 เวลาไทย
        is_after_yesterday_1400_bkk: isAfterCutoff,

        // คงสถานะ 24 ชั่วโมงไว้ตามความหมายเดิม
        is_24h_window_valid: isWithin24h,

        customer_chat_age_hours: chatAgeHours,
      },
    },
  ];
});
