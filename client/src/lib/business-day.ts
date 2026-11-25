const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const BB_CUTOFF_HOUR = 14;

function orderDisplayTimestamp(value: unknown): number | null {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  let year = Number(match[3]);
  if (year < 100) year += 1957; // พ.ศ. 69 => ค.ศ. 2026
  else if (year >= 2400) year -= 543;

  const month = Number(match[2]);
  const day = Number(match[1]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;

  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return timestamp;
}

function bangkokWallClockTimestamp(now: Date): number | null {
  if (Number.isNaN(now.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const hour = value("hour");
  const minute = value("minute");
  const second = value("second");
  if (![year, month, day, hour, minute, second].every(Number.isFinite)) return null;
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

/** True when order_time_display falls in BB's current 14:00–14:00 Bangkok business day. */
export function isCurrentBangkokBusinessDay(orderTimeDisplay: unknown, now = new Date()): boolean {
  const orderTimestamp = orderDisplayTimestamp(orderTimeDisplay);
  const nowWallClock = bangkokWallClockTimestamp(now);
  if (orderTimestamp == null || nowWallClock == null) return false;

  const todayStart = new Date(nowWallClock);
  todayStart.setUTCHours(BB_CUTOFF_HOUR, 0, 0, 0);
  const minuteOfDay = new Date(nowWallClock).getUTCHours() * 60 + new Date(nowWallClock).getUTCMinutes();
  if (minuteOfDay < BB_CUTOFF_HOUR * 60) todayStart.setUTCDate(todayStart.getUTCDate() - 1);

  const start = todayStart.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return orderTimestamp >= start && orderTimestamp < end;
}
