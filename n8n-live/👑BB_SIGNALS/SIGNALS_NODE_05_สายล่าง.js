// 💌 TRACKING_REQUEST1 — latest bill per paired/group cluster
// n8n Code node: Run Once for All Items
// หน้าที่: ถ้ามีบิลคู่/บิลซ้ำในกลุ่มเดียวกัน ให้เหลือใบล่าสุดเพียง 1 ใบ
// รองรับทั้งฟิลด์เก่าและฟิลด์ใหม่จากโหนดก่อนหน้า

const items = $input.all();

function first(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function text(value) {
  return String(value ?? "").trim();
}

function normalizePhone(value) {
  return text(value).replace(/\D/g, "");
}

function parseTime(value) {
  if (value === undefined || value === null || value === "") return 0;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 100000000000 ? value * 1000 : value;
  }

  const raw = text(value);
  if (!raw) return 0;

  // Numeric timestamps stored as strings.
  if (/^\d{10,13}$/.test(raw)) {
    const numeric = Number(raw);
    return numeric < 100000000000 ? numeric * 1000 : numeric;
  }

  // Thai display format: DD/MM/YY HH:mm[:ss], where YY is Buddhist short year.
  const thai = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (thai) {
    let year = Number(thai[3]);
    if (year < 100) year += 2500;
    if (year >= 2400) year -= 543;
    const month = Number(thai[2]);
    const day = Number(thai[1]);
    const hour = Number(thai[4]);
    const minute = Number(thai[5]);
    const second = Number(thai[6] || 0);
    // These display fields are Bangkok local time.
    const utc = Date.UTC(year, month - 1, day, hour - 7, minute, second);
    return Number.isFinite(utc) ? utc : 0;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowTime(row) {
  return parseTime(first(
    row.order_time_ms_reference,
    row.order_time_bkk_iso,
    row.order_time,
    row.order_time_display,
    row.order_time_thai_label,
    row.created_at,
    row.updated_at,
    row.pager_message_time_th,
    row.customer_message_time_th,
  ));
}

function groupKey(row) {
  const explicit = first(
    row.pair_group_key,
    row.cluster_key,
    row.tracking_group_key,
    row.chat_link_key,
  );
  if (explicit) return `explicit:${text(explicit)}`;

  const page = text(first(row.page_id, row.pageId, row.Page_ID));
  const thread = text(first(row.thread_id, row.threadId, row.conversation_key, row.conversation_id));
  if (page && thread) return `thread:${page}:${thread}`;
  if (thread) return `thread:${thread}`;

  const customer = text(first(row.customer_id, row.sender_id));
  if (page && customer) return `customer:${page}:${customer}`;

  const phone = normalizePhone(first(row.phone, row.extracted_phone, row.matched_phone));
  if (phone) return `phone:${phone}`;

  return `row:${text(first(row.upsert_key, row.order_number, row.message_id))}`;
}

function canonicalLatestHint(row) {
  return row.is_latest_canonical === true
    || row.is_latest_canonical === "true"
    || row.is_latest_canonical === 1
    || row.is_latest_canonical === "1"
    || row.node2_group_is_latest === true
    || row.node2_group_is_latest === "true"
    || row.node2_group_is_latest === 1
    || row.node2_group_is_latest === "1";
}

const groups = new Map();
for (let index = 0; index < items.length; index += 1) {
  const source = { ...(items[index].json ?? {}) };
  const key = groupKey(source);
  const entry = { source, index, time: rowTime(source), latestHint: canonicalLatestHint(source) };
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}

const output = [];
for (const [key, entries] of groups) {
  // Prefer the canonical latest marker when it is present and unambiguous.
  // Always use timestamp/index as deterministic fallback.
  const hinted = entries.filter(entry => entry.latestHint);
  const candidates = hinted.length ? hinted : entries;
  candidates.sort((a, b) => (b.time - a.time) || (b.index - a.index));
  const winner = candidates[0];
  const ordered = [...entries].sort((a, b) => (a.time - b.time) || (a.index - b.index));
  const position = ordered.findIndex(entry => entry === winner) + 1;

  const row = winner.source;
  const groupCount = entries.length;
  row.tracking_group_key = key;
  row.tracking_group_count = groupCount;
  row.tracking_group_position = position;
  row.tracking_is_latest = true;
  row.tracking_duplicate_blocked = groupCount > 1;
  row.tracking_dedup_reason = groupCount > 1
    ? "LATEST_ONLY_FROM_PAIRED_OR_GROUP"
    : "SINGLE_IN_GROUP";

  // Keep both spellings available for downstream nodes that have not migrated yet.
  row.currentThreadTotalBills = Number(first(row.currentThreadTotalBills, row.currentthreadtotalbills, groupCount)) || groupCount;
  row.currentthreadtotalbills = row.currentThreadTotalBills;
  row.cluster_bill_count = Number(first(row.cluster_bill_count, groupCount)) || groupCount;
  row.cluster_position = position;
  row.is_latest_canonical = true;
  row.canonical_status = groupCount > 1 ? "LATEST_CANONICAL" : first(row.canonical_status, "SINGLE_CANONICAL");

  output.push({ json: row });
}

return output;
