export const ORDER_BUSINESS_DAY_CUTOFF_HOUR = 14;

export type OrderBusinessDayRange = {
  startKey: number;
  endKey: number;
};

/** Return the current Bangkok business-day window as sortable YYYYMMDDHHmm keys. */
export function getOrderBusinessDayRange(now: Date = new Date()): OrderBusinessDayRange {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => Number(parts.find((item) => item.type === name)?.value ?? 0);
  const businessDay = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  if (part("hour") < ORDER_BUSINESS_DAY_CUTOFF_HOUR) {
    businessDay.setUTCDate(businessDay.getUTCDate() - 1);
  }

  const makeKey = (date: Date) => Number(
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}${String(ORDER_BUSINESS_DAY_CUTOFF_HOUR).padStart(2, "0")}00`,
  );
  const nextBusinessDay = new Date(businessDay);
  nextBusinessDay.setUTCDate(nextBusinessDay.getUTCDate() + 1);

  return {
    startKey: makeKey(businessDay),
    endKey: makeKey(nextBusinessDay),
  };
}
