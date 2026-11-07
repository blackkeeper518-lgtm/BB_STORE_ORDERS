export type OrderWarningSeverity = "BLOCK" | "REVIEW";
export type OrderWarning = {
  code: string;
  severity: OrderWarningSeverity;
  message: string;
};

const BILL_AUDIT_MARKER = "⚠️ BILL_AUDIT:";

type OrderRow = Record<string, unknown>;

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/** Read-only display adapter: all checks are performed upstream by n8n. */
export function getOrderWarnings(value: unknown): OrderWarning[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const row = value as OrderRow;
  const notice = text(row.balloonnotice ?? row.balloonNotice);
  const markerIndex = notice.lastIndexOf(BILL_AUDIT_MARKER);
  if (markerIndex < 0) return [];

  const payload = notice.slice(markerIndex + BILL_AUDIT_MARKER.length).trim();
  if (!payload) return [];

  return payload.split(/;\s*/u).map((part, index) => {
    const entry = part.trim();
    const match = entry.match(/^\[([A-Z0-9_]+)\]\s*(.*)$/u);
    return {
      code: match?.[1] ?? `N8N_BILL_AUDIT_${index + 1}`,
      severity: "REVIEW" as const,
      message: (match?.[2] || entry).trim(),
    };
  }).filter((warning) => Boolean(warning.message));
}
