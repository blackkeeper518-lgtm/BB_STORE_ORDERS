//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// 🎯 ORDER_SNIPER_X : MASTER PRODUCTION (ZERO-ERROR TOLERANCE)
//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

// =======================================================
// 🕳️ DARKSIDE GLOBAL SCANNED: ดักจับเลขพัสดุวันนี้จากทุกอณูของดาต้าขาเข้า
// =======================================================

const masterNode = $("UNIFIED META HYDRA INGESTOR").first().json;
const finalOrderTime = masterNode.sc_timestamp || "DATA_MISSING";
const dateTagString  = masterNode.seed_date_tag || "DATA_MISSING";
const dateTagStrinG = masterNode.sc_readable_date || "DATA_MISSING"; 
const dateTagStriNG = masterNode.seed_time_tag || "DATA_MISSING";        
const day_of_month = masterNode.day_of_month || "DATA_MISSING"; 
const day_of_week = masterNode.day_of_week || "DATA_MISSING"; 


// ==========================================
// ฟังก์ชันจัดการเวลาสำหรับโหนดนี้ (ใส่ไว้บนสุดของไฟล์)
// ==========================================
function normalizeFacebookTime(v) { 
  if (!v) return null; 
  const n = String(v).trim().replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); 
  const d = new Date(n); 
  return isNaN(d.getTime()) ? null : d.toISOString(); 
}

function formatThaiDateTime(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;

  const options = { timeZone: 'Asia/Bangkok', hour12: false };
  const day = d.toLocaleDateString('en-US', { ...options, day: '2-digit' });
  const month = d.toLocaleDateString('en-US', { ...options, month: '2-digit' });
  const yearStr = d.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  
  const thaiYear2Digit = String(parseInt(yearStr) + 543).slice(-2);
  const timeStr = d.toLocaleTimeString('en-GB', options);

  return `${day}/${month}/${thaiYear2Digit} ${timeStr}`;
}


// ============================================================
// TRACKING REQUEST: เช็กคำตรง ๆ และต้องเป็นวันที่ไทยเดียวกับบิล
// ไม่ค้นหาเลขพัสดุจริง และไม่เอาเลขพัสดุมาเทียบ
// ============================================================
const trackingRequestPattern =
  /(?:ขอ\s*(?:เลข|เลขพัสดุ|เลขติดตาม|เลขแทร็ก|เลข\s*tracking|เลข\s*AWB)|ขอ\s*(?:เช็ค|เช็ก)\s*เลข|รบกวนแจ้งเลขพัสดุ|ส่งเลขพัสดุให้หน่อย|มีเลขพัสดุไหม|เลขพัสดุออกหรือยัง|เช็คพัสดุ|เช็กพัสดุ|ติดตามพัสดุ|สถานะพัสดุ|tracking\s*(?:number|parcel)?|AWB)/iu;

function bkkDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isPageMessageForGate(msg) {
  const fromId = String(msg?.from?.id || msg?.page_id_inherited || "").trim();
  return msg?.is_echo === true || MASTERCONFIG.some(c => String(c.page_id) === fromId);
}

function hasTrackingRequestSameThaiDate(rawMsgs, currentIndex) {
  const orderDate = bkkDateKey(rawMsgs[currentIndex]?.created_time);
  if (!orderDate) return false;
  for (let j = 0; j <= currentIndex; j++) {
    const msg = rawMsgs[j];
    if (!msg || isPageMessageForGate(msg)) continue;
    if (bkkDateKey(msg.created_time) !== orderDate) continue;
    const body = String(msg.message || msg.original || "").replace(/\\n/g, "\n").trim();
    if (trackingRequestPattern.test(body)) return true;
  }
  return false;
}



// =================================================================
// FRONT NODE PATCH
// Replace the existing block from `let rawText = ...` through the
// `if (qtyMatch) ...` section. Keep the existing output.push mapping.
// =================================================================
     // 1. แปลงเวลาต้นฉบับ Facebook ให้เป็น ISO UTC
  
const ARMY_APP_ID = "2166169297530889";
const BUBBLE_WINDOW = 20;


//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
/* STREAMING_CHUNK: Defining Master Configuration of Pages */
//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

const MASTERCONFIG = [
  { "page_index": "BB_01", "page_id": "103411062505149", "page_name": "🎀BBεїзเบอร์หนึ่งสโตร์", "system_status": "ON", "assigned_agent": "#🌟ไนท์รา", "assigned_hashtag": "🔮#BB_ORDER_01" },
  { "page_index": "BB_02", "page_id": "113923148350742", "page_name": "🎶BB ↠ STORE", "system_status": "ON", "assigned_agent": "#✨Venika", "assigned_hashtag": "🔮#BB_ORDER_02" },
  { "page_index": "BB_03", "page_id": "111414924711459", "page_name": "🍇BBสโตร์.", "system_status": "ON", "assigned_agent": "#🌼Mali", "assigned_hashtag": "🔮#BB_ORDER_03" },
  { "page_index": "BB_04", "page_id": "1047257891810878", "page_name": "💗Bb store๐", "system_status": "ON", "assigned_agent": "#🍉TANGMO", "assigned_hashtag": "🔮#BB_ORDER_04" },
  { "page_index": "BB_05", "page_id": "1064404466767377", "page_name": "เจ๊บี 🅱🅱", "system_status": "ON", "assigned_agent": "#🍁เจ๊บี", "assigned_hashtag": "🔮#BB_ORDER_05" },
  { "page_index": "BB_06", "page_id": "1235719106287717", "page_name": "🛒ร้าน:เจ๊บี", "system_status": "ON", "assigned_agent": "#🍀ใบบัว", "assigned_hashtag": "🔮#BB_ORDER_06" },
  { "page_index": "BB_07", "page_id": "1032290633303246", "page_name": "💬ร้าน:เจ๊ B", "system_status": "ON", "assigned_agent": "#🪐วีนัส", "assigned_hashtag": "🔮#BB_ORDER_07" }
];

//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
/* PRODUCT_MASTER_ARR: Defining Master Configuration of Pages */
//⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
const PRODUCT_MASTER_ARR = [
  { id: 1, sku: 'VESS_MINT_COOL', name: 'เวสมินต์คูล', thName: 'เวสมินต์คูล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นคูล','เวสมิ้นคูล1','เวสมิ้นคูล 1','เวสมิ้นคูล2','เวสมิ้นคูล 2','เวสมิ้นคูล3','เวสมิ้นคูล 3','เวสมิ้นคูล4','เวสมิ้นคูล 4','เวสมิ้นคูล5','เวสมิ้นคูล 5'] },
  { id: 2, sku: 'VESS_MINT_MENTHOL', name: 'เวสมินต์เมนทอล', thName: 'เวสมินต์เมนทอล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นเมนทอล','เวสมิ้นเมนทอล1','เวสมิ้นเมนทอล 1','เวสมิ้นเมนทอล2','เวสมิ้นเมนทอล 2','เวสมิ้นเมนทอล3','เวสมิ้นเมนทอล 3','เวสมิ้นเมนทอล4','เวสมิ้นเมนทอล 4','เวสมิ้นเมนทอล5','เวสมิ้นเมนทอล 5'] },
  { id: 3, sku: 'GOLD_MOUNT_GREEN_WHITE', name: 'โกลด์เมาท์เขียวขาว', thName: 'โกลด์เมาท์เขียวขาว', price: 300, emoji: '🟩', brand: ['gold mount'], variant:['mount'], aliases:['โกเขียวขาว','โกเขียวขาว1','โกเขียวขาว 1','โกเขียวขาว2','โกเขียวขาว 2','โกเขียวขาว3','โกเขียวขาว 3','โกเขียวขาว4','โกเขียวขาว 4','โกเขียวขาว5','โกเขียวขาว 5'] },
  { id: 4, sku: 'MILANO_MENTHOL', name: 'มิลาโน่เมนทอล', thName: 'มิลาโน่เมนทอล', price: 250, emoji: '🟩', brand: ['milano'], variant: ['menthol'], aliases: ['มิลาโน่เมนทอล','มิลาโน่เมนทอล1','มิลาโน่เมนทอล 1','มิลาโน่เมนทอล2','มิลาโน่เมนทอล 2','มิลาโน่เมนทอล3','มิลาโน่เมนทอล 3','มิลาโน่เมนทอล4','มิลาโน่เมนทอล 4','มิลาโน่เมนทอล5','มิลาโน่เมนทอล 5'] },
  { id: 5, sku: 'MOND_GREEN', name: 'ม่อนเขียว', thName: 'ม่อนเขียว', price: 240, emoji: '🟩', brand: ['mond'], variant: ['green'], aliases: ['🟢 MOND_GREEN 1 คอต','MOND_GREEN ม่อนเขียว','ม่อนเขียว1','ม่อนเขียว 1','ม่อนเขียว2','ม่อนเขียว 2','ม่อนเขียว3','🟢MOND_GREEN ','ม่อนเขียว4','ม่อนเขียว 4','ม่อนเขียว5','ม่อนเขียว 5'] },
  { id: 6, sku: 'PLATINUM_GREEN', name: 'แพลตตินั่มเขียว', thName: 'แพลตตินั่มเขียว', price: 250, emoji: '🟩', brand: ['platinum'], variant: ['green'], aliases: ['แพตตินั่มเขียว','แพตตินั่มเขียว1','แพตตินั่มเขียว 1','แพตตินั่มเขียว2','แพตตินั่มเขียว 2','แพตตินั่มเขียว3','แพตตินั่มเขียว 3','แพตตินั่มเขียว4','แพตตินั่มเขียว 4','แพตตินั่มเขียว5','แพตตินั่มเขียว 5'] },
  { id: 7, sku: 'SEVIOS_GREEN', name: 'ซีวอสเขียว', thName: 'ซีวอสเขียว', price: 220, emoji: '🟩', brand: ['sevios'], variant: ['green'], aliases: ['ซีวอสเขียว','ซีวอสเขียว1','ซีวอสเขียว 1','ซีวอสเขียว2','ซีวอสเขียว 2','ซีวอสเขียว3','ซีวอสเขียว 3','ซีวอสเขียว4','ซีวอสเขียว 4','ซีวอสเขียว5','ซีวอสเขียว 5'] },
  { id: 8, sku: 'SMS_GREEN', name: 'เอสเอ็มเอสเขียว', thName: 'เอสเอ็มเอสเขียว', price: 250, emoji: '🟩', brand: ['sms'], variant: ['green'], aliases: ['เอสเอ็มเอสเขียว','เอสเอ็มเอสเขียว1','เอสเอ็มเอสเขียว 1','เอสเอ็มเอสเขียว2','เอสเอ็มเอสเขียว 2','เอสเอ็มเอสเขียว3','เอสเอ็มเอสเขียว 3','เอสเอ็มเอสเขียว4','เอสเอ็มเอสเขียว 4','เอสเอ็มเอสเขียว5','เอสเอ็มเอสเขียว 5'] },
  { id: 9, sku: 'TEXAS_GREEN', name: 'เท็กซัสเขียว', thName: 'เท็กซัสเขียว', price: 350, emoji: '🟩', brand: ['texas'], variant: ['green'], aliases: ['เท็กซัสเขียว','เท็กซัสเขียว1','เท็กซัสเขียว 1','เท็กซัสเขียว2','เท็กซัสเขียว 2','เท็กซัสเขียว3','เท็กซัสเขียว 3','เท็กซัสเขียว4','เท็กซัสเขียว 4','เท็กซัสเขียว5','เท็กซัสเขียว 5'] },
  { id: 10, sku: 'VESS_GREEN', name: 'เวสเขียว', thName: 'เวสเขียว', price: 260, emoji: '🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียว','เวสเขียว1','เวสเขียว 1','เวสเขียว2','เวสเขียว 2','เวสเขียว3','เวสเขียว 3','เวสเขียว4','เวสเขียว 4','เวสเขียว5','เวสเขียว 5'] },
  { id: 11, sku: 'VESS_GREEN_SLIMS', name: 'เวสเขียวสลิม', thName: 'เวสเขียวสลิม', price: 230, emoji: '🟩', brand:['vess'], variant:['green'], aliases:['เวสเขียวเล็ก','เวสเขียวเล็ก1','เวสเขียวเล็ก 1','เวสเขียวเล็ก2','เวสเขียวเล็ก 2','เวสเขียวเล็ก3','เวสเขียวเล็ก 3','เวสเขียวเล็ก4','เวสเขียวเล็ก 4','เวสเขียวเล็ก5','เวสเขียวเล็ก 5'] },
  { id: 12, sku: 'VESS_MINT', name: 'เวสมินต์', thName: 'เวสมินต์', price: 250, emoji: '🟩', brand:['vess'], variant:['mint'], aliases:['เวสมิ้น','เวสมิ้น1','เวสมิ้น 1','เวสมิ้น2','เวสมิ้น 2','เวสมิ้น3','เวสมิ้น 3','เวสมิ้น4','เวสมิ้น 4','เวสมิ้น5','เวสมิ้น 5'] },
  { id: 13, sku: 'VOXX_GREEN', name: 'ว็อกซ์เขียว', thName: 'ว็อกซ์เขียว', price: 300, emoji: '🟩', brand:['voxx'], variant:['green'], aliases:['วอคเขียว','วอคเขียว1','วอคเขียว 1','วอคเขียว2','วอคเขียว 2','วอคเขียว3','วอคเขียว 3','วอคเขียว4','วอคเขียว 4','วอคเขียว5','วอคเขียว 5'] },
  { id: 14, sku: 'TEXAS_BLUE', name: 'เท็กซัสฟ้า', thName: 'เท็กซัสฟ้า', price: 350, emoji: '🟦', brand:['texas'], variant:['blue'], aliases:['เท็กซัสฟ้า','เท็กซัสฟ้า1','เท็กซัสฟ้า 1','เท็กซัสฟ้า2','เท็กซัสฟ้า 2','เท็กซัสฟ้า3','เท็กซัสฟ้า 3','เท็กซัสฟ้า4','เท็กซัสฟ้า 4','เท็กซัสฟ้า5','เท็กซัสฟ้า 5'] },
  { id: 15, sku: 'VESS_GREEN_BLACK', name: 'เวสเขียวดำ', thName: 'เวสเขียวดำ', price: 250, emoji: '⬛', brand:['vess'], variant:['green'], aliases:['เวสเขียวดำ','เวสเขียวดำ1','เวสเขียวดำ 1','เวสเขียวดำ2','เวสเขียวดำ 2','เวสเขียวดำ3','เวสเขียวดำ 3','เวสเขียวดำ4','เวสเขียวดำ 4','เวสเขียวดำ5','เวสเขียวดำ 5'] },
  { id: 16, sku: 'SIERRA_GREEN', name: 'เซียร์ร่าเขียว', thName: 'เซียร์ร่าเขียว', price: 220, emoji: '🟩', brand:['sierra'], variant:['green'], aliases:['เซียร่าเขียว','เซียร่าเขียว1','เซียร่าเขียว2','เซียร่าเขียว3','เซียร่าเขียว4','เซียร่าเขียว5','เซียร่าเขียว 1','เซียร่าเขียว 2','เซียร่าเขียว 3','เซียร่าเขียว 4','เซียร่าเขียว 5','เซียร์ร่าเขียว'] },
  { id: 17, sku: 'OS_BLUEBERRY', name: 'โอเอสบลูเบอร์รี่', thName: 'โอเอสบลูเบอร์รี่', price: 350, emoji: '🟪', brand:['os'], variant:['blueberry'], aliases:['OS บลูเบอร์รี่','OS บลูเบอร์รี่1','OS บลูเบอร์รี่ 1','OS บลูเบอร์รี่2','OS บลูเบอร์รี่ 2','OS บลูเบอร์รี่3','OS บลูเบอร์รี่ 3','OS บลูเบอร์รี่4','OS บลูเบอร์รี่ 4','OS บลูเบอร์รี่5','OS บลูเบอร์รี่ 5','OS บลู 1'] },
  { id: 18, sku: 'OS_MANGO', name: 'โอเอสมะม่วง', thName: 'โอเอสมะม่วง', price: 350, emoji: '🥭', brand:['os'], variant:['mango'], aliases:['OS มะม่วง','OS มะม่วง1','OS มะม่วง 1','OS มะม่วง2','OS มะม่วง 2','OS มะม่วง3','OS มะม่วง 3','OS มะม่วง4','OS มะม่วง 4','OS มะม่วง5','OS มะม่วง 5'] },
  { id: 19, sku: 'VESS_CRUSH_MINT.X.MANGO', name: 'เวสครัชมินต์มะม่วง', thName: 'เวสครัชมินต์มะม่วง', price: 350, emoji: '🥭', brand:['vess'], variant:['crush'], aliases:['เวสมะม่วง','เวสมะม่วง1','เวสมะม่วง 1','เวสมะม่วง2','เวสมะม่วง 2','เวสมะม่วง3','เวสมะม่วง 3','เวสมะม่วง4','เวสมะม่วง 4','เวสมะม่วง5','เวสมะม่วง 5'] },
  { id: 20, sku: 'OS_STRAWBERRY', name: 'โอเอสสตรอว์เบอร์รี่', thName: 'โอเอสสตรอว์เบอร์รี่', price: 350, emoji: '🍓', brand:['os'], variant:['strawberry'], aliases:['OS สตอเบอร์รี่','OS สตอเบอร์รี่1','OS สตอเบอร์รี่ 1','OS สตอเบอร์รี่2','OS สตอเบอร์รี่ 2','OS สตอเบอร์รี่3','OS สตอเบอร์รี่ 3','OS สตอเบอร์รี่4','OS สตอเบอร์รี่ 4','OS สตอเบอร์รี่5','OS สตอเบอร์รี่ 5'] },
  { id: 21, sku: 'MILANO_JAPAN', name: 'มิลาโน่เจแปน', thName: 'มิลาโน่เจแปน', price: 250, emoji: '🍎', brand:['milano'], variant:['japan'], aliases:['มิลาโน่ญี่ปุ่น','มิลาโน่ญี่ปุ่น1','มิลาโน่ญี่ปุ่น 1','มิลาโน่ญี่ปุ่น2','มิลาโน่ญี่ปุ่น 2','มิลาโน่ญี่ปุ่น3','มิลาโน่ญี่ปุ่น 3','มิลาโน่ญี่ปุ่น4','มิลาโน่ญี่ปุ่น 4','มิลาโน่ญี่ปุ่น5','มิลาโน่ญี่ปุ่น 5'] },
  { id: 22, sku: 'OS_PINEAPPLE', name: 'โอเอสสับปะรด', thName: 'โอเอสสับปะรด', price: 350, emoji: '🍍', brand:['os'], variant:['pineapple'], aliases:['OS สับปะรด','OS สับปะรด1','OS สับปะรด 1','OS สับปะรด2','OS สับปะรด 2','OS สับปะรด3','OS สับปะรด 3','OS สับปะรด4','OS สับปะรด 4','OS สับปะรด5','OS สับปะรด 5'] },
  { id: 23, sku: 'VESS_CRUSH_MINT.X.APPLE', name: 'เวสครัชมินต์แอปเปิ้ล', thName: 'เวสครัชมินต์แอปเปิ้ล', price: 350, emoji: '🍎', brand:['vess'], variant:['crush'], aliases:['เวสแอปเปิ้ล','เวสแอปเปิ้ล1','เวสแอปเปิ้ล 1','เวสแอปเปิ้ล2','เวสแอปเปิ้ล 2','เวสแอปเปิ้ล3','เวสแอปเปิ้ล 3','เวสแอปเปิ้ล4','เวสแอปเปิ้ล 4','เวสแอปเปิ้ล5','เวสแอปเปิ้ล 5'] },
  { id: 24, sku: 'OS_WATERMELON', name: 'โอเอสแตงโม', thName: 'โอเอสแตงโม', price: 350, emoji: '🍉', brand:['os'], variant:['watermelon'], aliases:['OS แตงโม','OS แตงโม1','OS แตงโม 1','OS แตงโม2','OS แตงโม 2','OS แตงโม3','OS แตงโม 3','OS แตงโม4','OS แตงโม 4','OS แตงโม5','OS แตงโม 5'] },
  { id: 25, sku: 'VESS_CRUSH_MINT.X.GRAPE', name: 'เวสครัชมินต์องุ่น', thName: 'เวสครัชมินต์องุ่น', price: 350, emoji: '🍇', brand:['vess'], variant:['crush'], aliases:['เวสองุ่นใหญ่','เวสองุ่นใหญ่1','เวสองุ่นใหญ่ 1','เวสองุ่นใหญ่2','เวสองุ่นใหญ่ 2','เวสองุ่นใหญ่3','เวสองุ่นใหญ่ 3','เวสองุ่นใหญ่4','เวสองุ่นใหญ่ 4','เวสองุ่นใหญ่5','เวสองุ่นใหญ่ 5'] },
  { id: 26, sku: 'VESS_GRAPE_SLIMS', name: 'เวสองุ่นสลิม', thName: 'เวสองุ่นสลิม', price: 350, emoji: '🍇', brand:['vess'], variant:['grape'], aliases:['เวสองุ่นสลิม','เวสองุ่นสลิม1','เวสองุ่นสลิม 1','เวสองุ่นสลิม2','เวสองุ่นสลิม 2','เวสองุ่นสลิม3','เวสองุ่นสลิม 3','เวสองุ่นสลิม4','เวสองุ่นสลิม 4','เวสองุ่นสลิม5','เวสองุ่นสลิม 5'] },
  { id: 27, sku: 'MOND_RAINBOW', name: 'ม่อนเรนโบว์', thName: 'ม่อนเรนโบว์', price: 450, emoji: '🌈', brand:['mond'], variant:['rainbow'], aliases:['ม่อนรุ้ง','ม่อนรุ้ง1','ม่อนรุ้ง 1','ม่อนรุ้ง2','ม่อนรุ้ง 2','ม่อนรุ้ง3','ม่อนรุ้ง 3','ม่อนรุ้ง4','ม่อนรุ้ง 4','ม่อนรุ้ง5','ม่อนรุ้ง 5'] },
  { id: 28, sku: 'SEVIOS_RED', name: 'ซีวอสแดง', thName: 'ซีวอสแดง', price: 220, emoji: '🟥', brand:['sevios'], variant:['red'], aliases:['SEVIOS_RED','ซีวอสแดง','ซีวอสแดง1','ซีวอสแดง 1','ซีวอสแดง2','ซีวอสแดง 2','ซีวอสแดง3','ซีวอสแดง 3','ซีวอสแดง4','ซีวอสแดง 4','ซีวอสแดง5','ซีวอสแดง 5'] },
  { id: 29, sku: 'SIERRA_RED', name: 'เซียร์ร่า', thName: 'เซียร์ร่า', price: 220, emoji: '🟥', brand:['sierra'], variant:['red'], aliases:['เซียร่า','เซียร่า1','เซียร่า 1','เซียร่า2','เซียร่า 2','เซียร่า3','เซียร่า 3','เซียร่า4','เซียร่า 4','เซียร่า5','เซียร่า 5'] },
  { id: 30, sku: 'MOND_GOLD', name: 'ม่อนทอง', thName: 'ม่อนทอง', price: 230, emoji: '🟨', brand:['mond'], variant:['gold'], aliases:['ม่อนทอง','ม่อนทอง1','ม่อนทอง 1','ม่อนทอง2','ม่อนทอง 2','ม่อนทอง3','ม่อนทอง 3','ม่อนทอง4','ม่อนทอง 4','ม่อนทอง5','ม่อนทอง 5','MOND Signature Gold'] },
  { id: 31, sku: 'VESS_GOLD', name: 'เวสทอง', thName: 'เวสทอง', price: 230, emoji: '🟨', brand:['vess'], variant:['gold'], aliases:['เวสทอง','เวสทอง1','เวสทอง 1','เวสทอง2','เวสทอง 2','เวสทอง3','เวสทอง 3','เวสทอง4','เวสทอง 4','เวสทอง5','เวสทอง 5'] },
  { id: 32, sku: 'MILANO_GOLD', name: 'มิลาโน่ทอง', thName: 'มิลาโน่ทอง', price: 250, emoji: '🟨', brand:['milano'], variant:['gold'], aliases:['มิลาโน่ทอง','มิลาโน่ทอง1','มิลาโน่ทอง 1','มิลาโน่ทอง2','มิลาโน่ทอง 2','มิลาโน่ทอง3','มิลาโน่ทอง 3','มิลาโน่ทอง4','มิลาโน่ทอง 4','มิลาโน่ทอง5','มิลาโน่ทอง 5'] },
  { id: 33, sku: 'CAVALLO_RED', name: 'คาวาโร่แดง', thName: 'คาวาโร่แดง', price: 250, emoji: '🟥', brand:['cavallo'], variant:['red'], aliases:['คาแดง','คาแดง1','คาแดง 1','คาแดง2','คาแดง 2','คาแดง3','คาแดง 3','คาแดง4','คาแดง 4','คาแดง5','คาแดง 5'] },
  { id: 34, sku: 'MILANO_KINGS', name: 'มิลาโน่คิง', thName: 'มิลาโน่คิง', price: 250, emoji: '🟥', brand:['milano'], variant:['kings'], aliases:['มิลาโน่คิง','มิลาโน่คิง1','มิลาโน่คิง 1','มิลาโน่คิง2','มิลาโน่คิง 2','มิลาโน่คิง3','มิลาโน่คิง 3','มิลาโน่คิง4','มิลาโน่คิง 4','มิลาโน่คิง5','มิลาโน่คิง 5'] },
  { id: 35, sku: 'PLATINUM_BLACK', name: 'แพตตินั่มดำ', thName: 'แพตตินั่มดำ', price: 250, emoji: '⬛', brand:['platinum'], variant:['black'], aliases:['แพตตินั่มดำ','แพตตินั่มดำ1','แพตตินั่มดำ 1','แพตตินั่มดำ2','แพตตินั่มดำ 2','แพตตินั่มดำ3','แพตตินั่มดำ 3','แพตตินั่มดำ4','แพตตินั่มดำ 4','แพตตินั่มดำ5','แพตตินั่มดำ 5'] },
  { id: 36, sku: 'GOLD_MOUNT_RED_WHITE', name: 'โกเม้าแดงขาว', thName: 'โกเม้าแดงขาว', price: 300, emoji: '🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงขาว','โกเม้าแดงขาว1','โกเม้าแดงขาว 1','โกเม้าแดงขาว2','โกเม้าแดงขาว 2','โกเม้าแดงขาว3','โกเม้าแดงขาว 3','โกเม้าแดงขาว4','โกเม้าแดงขาว 4','โกเม้าแดงขาว5','โกเม้าแดงขาว 5'] },
  { id: 37, sku: 'WALTON_RED', name: 'วอลตันแดง', thName: 'วอลตันแดง', price: 300, emoji: '🟥', brand:['walton'], variant:['red'], aliases:['วอลตันแดง','วอลตันแดง1','วอลตันแดง 1','วอลตันแดง2','วอลตันแดง 2','วอลตันแดง3','วอลตันแดง 3','วอลตันแดง4','วอลตันแดง 4','วอลตันแดง5','วอลตันแดง 5'] },
  { id: 38, sku: 'VOXX_BLACK', name: 'วอคดำ', thName: 'วอคดำ', price: 300, emoji: '⬛', brand:['voxx'], variant:['black'], aliases:['วอคดำ','วอคดำ1','วอคดำ 1','วอคดำ2','วอคดำ 2','วอคดำ3','วอคดำ 3','วอคดำ4','วอคดำ 4','วอคดำ5','วอคดำ 5'] },
  { id: 39, sku: 'TEXAS_GOLD', name: 'เท็กซัสทอง', thName: 'เท็กซัสทอง', price: 350, emoji: '🟨', brand:['texas'], variant:['gold'], aliases:['เท็กซัสทอง','เท็กซัสทอง1','เท็กซัสทอง 1','เท็กซัสทอง2','เท็กซัสทอง 2','เท็กซัสทอง3','เท็กซัสทอง 3','เท็กซัสทอง4','เท็กซัสทอง 4','เท็กซัสทอง5','เท็กซัสทอง 5'] },
  { id: 40, sku: 'JOHN_RED', name: 'JHON', thName: 'JHON', price: 350, emoji: '🟥', brand:['john'], variant:['red'], aliases:['จอนแข็ง','จอนแข็ง1','จอนแข็ง 1','จอนแข็ง2','จอนแข็ง 2','จอนแข็ง3','จอนแข็ง 3','จอนแข็ง4','จอนแข็ง 4','จอนแข็ง5','จอนแข็ง 5'] },
  { id: 41, sku: 'TEXAS_RED', name: 'เท็กซัสแดง', thName: 'เท็กซัสแดง', price: 350, emoji: '🟥', brand:['texas'], variant:['red'], aliases:['เท็กซัสแดง','เท็กซัสแดง1','เท็กซัสแดง 1','เท็กซัสแดง2','เท็กซัสแดง 2','เท็กซัสแดง3','เท็กซัสแดง 3','เท็กซัสแดง4','เท็กซัสแดง 4','เท็กซัสแดง5','เท็กซัสแดง 5'] },
  { id: 42, sku: 'MILANO_PURPLE', name: 'มิลาโน่ม่วง', thName: 'มิลาโน่ม่วง', price: 350, emoji: '🟪', brand:['milano'], variant:['purple'], aliases:['มิลาโน่ม่วง','มิลาโน่ม่วง1','มิลาโน่ม่วง 1','มิลาโน่ม่วง2','มิลาโน่ม่วง 2','มิลาโน่ม่วง3','มิลาโน่ม่วง 3','มิลาโน่ม่วง4','มิลาโน่ม่วง 4','มิลาโน่ม่วง5','มิลาโน่ม่วง 5'] },
  { id: 43, sku: 'CAVALLO_TWIN_X_BALL', name: 'คาวาโร่ม่วง', thName: 'คาวาโร่ม่วง', price: 350, emoji: '🟪', brand:['cavallo'], variant:['twin'], aliases:['คาวาโล่ม่วงเม็ดบีบ','คาวาโล่ม่วงเม็ดบีบ1','คาวาโล่ม่วงเม็ดบีบ 1','🟣 CAVALLO ม่วง','คาวาโล่ม่วง 2','คาม่วง','คาม่วง 3','🍇 CAVALLO ม่วง','คาวาโล่ม่วงเม็ดบีบ 4','คาม่วง2','คาม่วง1 ','CAVALLO_ม่วง2'] },
  { id: 44, sku: 'BAROESAN', name: 'บารูซัน', thName: 'บารูซัน', price: 350, emoji: '🍫', brand:['baroesan'], variant:[''], aliases:['บารูอิซัน','บารูอิซัน1','บารูอิซัน 1','บารูอิซัน2','บารูอิซัน 2','บารูอิซัน3','บารูอิซัน 3','บารูอิซัน4','บารูอิซัน 4','บารูอิซัน5','บารูอิซัน 5'] },
  { id: 45, sku: 'CAVALLO_GREEN', name: 'คาวาโล่เขียว', thName: 'คาวาโล่เขียว', price: 250, emoji: '🟩', brand:['cavallo'], variant:['green'], aliases:['CAVALLO_GREEN','CAVALLO GREEN','คาเขียว','คาเขียว1','คาเขียว 1','คาเขียว2','คาเขียว 2','คาเขียว3','คาเขียว 3','คาเขียว4','คาเขียว 4','คาเขียว5'] },
  { id: 46, sku: 'ROYAL_GREEN', name: 'รอยัลเขียว', thName: 'รอยัลเขียว', price: 230, emoji: '🟩', brand:['royal'], variant:['green'], aliases:['รอยัลเขียว','รอยัลเขียว1','รอยัลเขียว 1','รอยัลเขียว2','รอยัลเขียว 2','รอยัลเขียว3','รอยัลเขียว 3','รอยัลเขียว4','รอยัลเขียว 4','รอยัลเขียว5','รอยัลเขียว 5'] },
  { id: 47, sku: '235_GREEN', name: '235 เขียว', thName: '235 เขียว', price: 300, emoji: '🟩', brand:['235'], variant:['green'], aliases:['235 เขียว','235 เขียว1','235 เขียว 1','235 เขียว2','235 เขียว 2','235 เขียว3','235 เขียว 3','235 เขียว4','235 เขียว 4','235 เขียว5','235 เขียว 5'] },
  { id: 48, sku: 'CANYON_GREEN', name: 'แคนยอนเขียว', thName: 'แคนยอนเขียว', price: 350, emoji: '🟩', brand:['canyon'], variant:['green'], aliases:['แคนยอนเขียว','แคนยอนเขียว1','แคนยอนเขียว 1','แคนยอนเขียว2','แคนยอนเขียว 2','แคนยอนเขียว3','แคนยอนเขียว 3','แคนยอนเขียว4','แคนยอนเขียว 4','แคนยอนเขียว5','แคนยอนเขียว 5'] },
  { id: 49, sku: 'GOLD_MOUNT_FULL_GREEN', name: 'โกลด์เมาท์เขียวล้วน', thName: 'โกลด์เมาท์เขียวล้วน', price: 300, emoji: '🟩', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าเขียวล้วน','โกเม้าเขียวล้วน1','โกเม้าเขียวล้วน 1','โกเม้าเขียวล้วน2','โกเม้าเขียวล้วน 2','โกเม้าเขียวล้วน3','โกเม้าเขียวล้วน 3','โกเม้าเขียวล้วน4','โกเม้าเขียวล้วน 4','โกเม้าเขียวล้วน5','โกเม้าเขียวล้วน 5'] },
  { id: 50, sku: 'L&M_GREEN', name: 'แอลแอนด์เอ็มเขียว', thName: 'แอลแอนด์เอ็มเขียว', price: 300, emoji: '🟩', brand:['l&m'], variant:['green'], aliases:['แอลเอ็มเขียว','แอลเอ็มเขียว1','แอลเอ็มเขียว 1','แอลเอ็มเขียว2','แอลเอ็มเขียว 2','แอลเอ็มเขียว3','แอลเอ็มเขียว 3','แอลเอ็มเขียว4','แอลเอ็มเขียว 4','แอลเอ็มเขียว5','แอลเอ็มเขียว 5'] },
  { id: 51, sku: 'MARLBORO_MENTHOL', name: 'มาโบโร่เมนทอล', thName: 'มาโบโร่เมนทอล', price: 300, emoji: '🟩', brand:['marlboro'], variant:['menthol'], aliases:['มาโบโร่เขียว','มาโบโร่เขียว1','มาโบโร่เขียว 1','มาโบโร่เขียว2','มาโบโร่เขียว 2','มาโบโร่เขียว3','มาโบโร่เขียว 3','มาโบโร่เขียว4','มาโบโร่เขียว 4','มาโบโร่เขียว5','มาโบโร่เขียว 5'] },
  { id: 52, sku: 'WALTON_GREEN', name: 'วอลตันเขียว', thName: 'วอลตันเขียว', price: 300, emoji: '🟩', brand:['walton'], variant:['green'], aliases:['วอลตันเขียว','วอลตันเขียว1','วอลตันเขียว 1','วอลตันเขียว2','วอลตันเขียว 2','วอลตันเขียว3','วอลตันเขียว 3','วอลตันเขียว4','วอลตันเขียว 4','วอลตันเขียว5','วอลตันเขียว 5'] },
  { id: 53, sku: 'CAPITAL_BLUE', name: 'แคปิตอลฟ้า', thName: 'แคปิตอลฟ้า', price: 350, emoji: '🟦', brand:['capital'], variant:['blue'], aliases:['แคปปิตอลฟ้า','แคปปิตอลฟ้า1','แคปปิตอลฟ้า 1','แคปปิตอลฟ้า2','แคปปิตอลฟ้า 2','แคปปิตอลฟ้า3','แคปปิตอลฟ้า 3','แคปปิตอลฟ้า4','แคปปิตอลฟ้า 4','แคปปิตอลฟ้า5','แคปปิตอลฟ้า 5'] },
  { id: 54, sku: 'ORIS_STRAWBERRY', name: 'โอริสสตรอว์เบอร์รี่', thName: 'โอริสสตรอว์เบอร์รี่', price: 350, emoji: '🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { id: 55, sku: 'ORIS_STRAWBERRY_2CAPS', name: 'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', thName: 'โอริสสตรอว์เบอร์รี่ 2 เม็ดบีบ', price: 450, emoji: '🍓', brand:['oris'], variant:['strawberry'], aliases:['โอริสสตรอว์เบอร์รี่','โอริสสตรอว์เบอร์รี่1','โอริสสตรอว์เบอร์รี่ 1','โอริสสตรอว์เบอร์รี่2','โอริสสตรอว์เบอร์รี่ 2','โอริสสตรอว์เบอร์รี่3','โอริสสตรอว์เบอร์รี่ 3','โอริสสตรอว์เบอร์รี่4','โอริสสตรอว์เบอร์รี่ 4','โอริสสตรอว์เบอร์รี่5','โอริสสตรอว์เบอร์รี่ 5'] },
  { id: 56, sku: 'PLATINUM_STRAWBERRY', name: 'แพลตตินั่มสตรอว์เบอร์รี่', thName: 'แพลตตินั่มสตรอว์เบอร์รี่', price: 300, emoji: '🍓', brand:['platinum'], variant:['strawberry'], aliases:['แพลตตินั่มสตรอว์เบอร์รี่','แพลตตินั่มสตรอว์เบอร์รี่1','แพลตตินั่มสตรอว์เบอร์รี่ 1','แพลตตินั่มสตรอว์เบอร์รี่2','แพลตตินั่มสตรอว์เบอร์รี่ 2','แพลตตินั่มสตรอว์เบอร์รี่3','แพลตตินั่มสตรอว์เบอร์รี่ 3','แพลตตินั่มสตรอว์เบอร์รี่4','แพลตตินั่มสตรอว์เบอร์รี่ 4','แพลตตินั่มสตรอว์เบอร์รี่5','แพลตตินั่มสตรอว์เบอร์รี่ 5'] },
  { id: 57, sku: 'ORIS_CHERRY', name: 'โอริสเชอร์รี่', thName: 'โอริสเชอร์รี่', price: 350, emoji: '🍒', brand:['oris'], variant:['cherry'], aliases:['โอริสเชอร์รี่','โอริสเชอร์รี่1','โอริสเชอร์รี่ 1','โอริสเชอร์รี่2','โอริสเชอร์รี่ 2','โอริสเชอร์รี่3','โอริสเชอร์รี่ 3','โอริสเชอร์รี่4','โอริสเชอร์รี่ 4','โอริสเชอร์รี่5','โอริสเชอร์รี่ 5'] },
  { id: 58, sku: 'JOHN_APPLE_2CAPS', name: 'จอห์นแอปเปิ้ล 2 เม็ดบีบ', thName: 'จอห์นแอปเปิ้ล 2 เม็ดบีบ', price: 350, emoji: '🍎', brand:['john'], variant:['apple'], aliases:['จอนแอปเปิ้ล 2 เม็ดบีบ','จอนแอปเปิ้ล 2 เม็ดบีบ1','จอนแอปเปิ้ล 2 เม็ดบีบ 1','จอนแอปเปิ้ล 2 เม็ดบีบ2','จอนแอปเปิ้ล 2 เม็ดบีบ 2','จอนแอปเปิ้ล 2 เม็ดบีบ3','จอนแอปเปิ้ล 2 เม็ดบีบ 3','จอนแอปเปิ้ล 2 เม็ดบีบ4','จอนแอปเปิ้ล 2 เม็ดบีบ 4','จอนแอปเปิ้ล 2 เม็ดบีบ5','จอนแอปเปิ้ล 2 เม็ดบีบ 5'] },
  { id: 59, sku: 'MOND_APPLE_FRUIT', name: 'ม่อนแอปเปิ้ล', thName: 'ม่อนแอปเปิ้ล', price: 200, emoji: '🍎', brand:['mond'], variant:['apple'], aliases:['ม่อนแอปเปิ้ล','ม่อนแอปเปิ้ล1','ม่อนแอปเปิ้ล 1','ม่อนแอปเปิ้ล2','ม่อนแอปเปิ้ล 2','ม่อนแอปเปิ้ล3','ม่อนแอปเปิ้ล 3','ม่อนแอปเปิ้ล4','ม่อนแอปเปิ้ล 4','ม่อนแอปเปิ้ล5','ม่อนแอปเปิ้ล 5'] },
  { id: 60, sku: 'ORIS_APPLE', name: 'โอริสแอปเปิ้ล', thName: 'โอริสแอปเปิ้ล', price: 350, emoji: '🍎', brand:['oris'], variant:['apple'], aliases:['โอริสแอปเปิ้ล','โอริสแอปเปิ้ล1','โอริสแอปเปิ้ล 1','โอริสแอปเปิ้ล2','โอริสแอปเปิ้ล 2','โอริสแอปเปิ้ล3','โอริสแอปเปิ้ล 3','โอริสแอปเปิ้ล4','โอริสแอปเปิ้ล 4','โอริสแอปเปิ้ล5','โอริสแอปเปิ้ล 5'] },
  { id: 61, sku: 'PLATINUM_APPLE', name: 'แพลตตินั่มแอปเปิ้ล', thName: 'แพลตตินั่มแอปเปิ้ล', price: 300, emoji: '🍎', brand:['platinum'], variant:['apple'], aliases:['แพลตตินั่มแอปเปิ้ล','แพลตตินั่มแอปเปิ้ล1','แพลตตินั่มแอปเปิ้ล 1','แพลตตินั่มแอปเปิ้ล2','แพลตตินั่มแอปเปิ้ล 2','แพลตตินั่มแอปเปิ้ล3','แพลตตินั่มแอปเปิ้ล 3','แพลตตินั่มแอปเปิ้ล4','แพลตตินั่มแอปเปิ้ล 4','แพลตตินั่มแอปเปิ้ล5','แพลตตินั่มแอปเปิ้ล 5'] },
  { id: 62, sku: 'ORIS_GRAPE', name: 'โอริสองุ่น', thName: 'โอริสองุ่น', price: 350, emoji: '🍇', brand:['oris'], variant:['grape'], aliases:['โอริสองุ่น','โอริสองุ่น1','โอริสองุ่น 1','โอริสองุ่น2','โอริสองุ่น 2','โอริสองุ่น3','โอริสองุ่น 3','โอริสองุ่น4','โอริสองุ่น 4','โอริสองุ่น5','โอริสองุ่น 5'] },
{ id: 63, sku: 'JOHN_BLACK', name: 'จอนดำ', thName: 'จอนดำ', price: 220, emoji: '⬛', brand:['john'], variant:['black'], aliases:['จอนดำ','จอนดำ1','จอนดำ 1','จอนดำ2','จอนดำ 2','จอนดำ3','จอนดำ 3','จอนดำ4','จอนดำ 4','จอนดำ5','John ดำ'] },
  { id: 64, sku: 'ROYAL_RED', name: 'รอยัลแดง', thName: 'รอยัลแดง', price: 230, emoji: '🟥', brand:['royal'], variant:['red'], aliases:['รอยัลแดง','รอยัลแดง1','รอยัลแดง 1','รอยัลแดง2','รอยัลแดง 2','รอยัลแดง3','รอยัลแดง 3','รอยัลแดง4','รอยัลแดง 4','รอยัลแดง5','รอยัลแดง 5'] },
  { id: 65, sku: 'GM_RED', name: 'จีเอ็มแดง', thName: 'จีเอ็มแดง', price: 250, emoji: '🟥', brand:['gm'], variant:['red'], aliases:['จีเอ็ม','จีเอ็ม1','จีเอ็ม 1','จีเอ็ม2','จีเอ็ม 2','จีเอ็ม3','จีเอ็ม 3','จีเอ็ม4','จีเอ็ม 4','จีเอ็ม5','จีเอ็ม 5'] },
  { id: 66, sku: 'KRONG_THIP_RED', name: 'กรองทิพย์', thName: 'กรองทิพย์', price: 250, emoji: '🟥', brand:['krong thip'], variant:['thip'], aliases:['กรองทิพย์','กรองทิพย์1','กรองทิพย์ 1','กรองทิพย์2','กรองทิพย์ 2','กรองทิพย์3','กรองทิพย์ 3','กรองทิพย์4','กรองทิพย์ 4','กรองทิพย์5','กรองทิพย์ 5'] },
  { id: 67, sku: 'SMS_RED', name: 'เอสเอ็มเอสแดง', thName: 'เอสเอ็มเอสแดง', price: 250, emoji: '🟥', brand:['sms'], variant:['red'], aliases:['เอสเอ็มเอสแดง','เอสเอ็มเอสแดง1','เอสเอ็มเอสแดง 1','เอสเอ็มเอสแดง2','เอสเอ็มเอสแดง 2','เอสเอ็มเอสแดง3','เอสเอ็มเอสแดง 3','เอสเอ็มเอสแดง4','เอสเอ็มเอสแดง 4','เอสเอ็มเอสแดง5','เอสเอ็มเอสแดง 5'] },
  { id: 68, sku: 'VESS_RED', name: 'เวสแดง', thName: 'เวสแดง', price: 260, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดง','เวสแดง1','เวสแดง 1','เวสแดง2','เวสแดง 2','เวสแดง3','เวสแดง 3','เวสแดง4','เวสแดง 4','เวสแดง5','เวสแดง 5'] },
  { id: 69, sku: 'VESS_RED_LIGHT', name: 'เวสแดงอ่อน', thName: 'เวสแดงอ่อน', price: 260, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงอ่อน','เวสแดงอ่อน1','เวสแดงอ่อน 1','เวสแดงอ่อน2','เวสแดงอ่อน 2','เวสแดงอ่อน3','เวสแดงอ่อน 3','เวสแดงอ่อน4','เวสแดงอ่อน 4','เวสแดงอ่อน5','เวสแดงอ่อน 5'] },
  { id: 70, sku: 'MARLBORO_GOLD', name: 'มาโบโร่ทอง', thName: 'มาโบโร่ทอง', price: 300, emoji: '🟨', brand:['marlboro'], variant:['gold'], aliases:['มาโบโร่ขาว','มาโบโร่ขาว1','มาโบโร่ขาว 1','มาโบโร่ขาว2','มาโบโร่ขาว 2','มาโบโร่ขาว3','มาโบโร่ขาว 3','มาโบโร่ขาว4','มาโบโร่ขาว 4','มาโบโร่ขาว5','มาโบโร่ขาว 5'] },
  { id: 71, sku: '235_RED', name: '235 แดง', thName: '235 แดง', price: 300, emoji: '🟥', brand:['235'], variant:['red'], aliases:['235 แดง','235 แดง1','235 แดง 1','235 แดง2','235 แดง 2','235 แดง3','235 แดง 3','235 แดง4','235 แดง 4','235 แดง5','235 แดง 5'] },
  { id: 72, sku: 'GOLD_MOUNT_FULL_RED', name: 'โกลด์เมาท์แดงล้วน', thName: 'โกลด์เมาท์แดงล้วน', price: 300, emoji: '🟥', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าแดงล้วน','โกเม้าแดงล้วน1','โกเม้าแดงล้วน 1','โกเม้าแดงล้วน2','โกเม้าแดงล้วน 2','โกเม้าแดงล้วน3','โกเม้าแดงล้วน 3','โกเม้าแดงล้วน4','โกเม้าแดงล้วน 4','โกเม้าแดงล้วน5','โกเม้าแดงล้วน 5'] },
  { id: 73, sku: 'JOHN_WHITE', name: 'จอนขาว', thName: 'จอนขาว', price: 300, emoji: '🟥', brand:['john'], variant:['white'], aliases:['จอนอ่อน','จอนอ่อน1','จอนอ่อน 1','จอนอ่อน2','จอนอ่อน 2','จอนอ่อน3','จอนอ่อน 3','จอนอ่อน4','จอนอ่อน 4','จอนอ่อน5','จอนอ่อน 5'] },
  { id: 74, sku: 'L&M_RED', name: 'เวสแดงพรีเมี่ยม', thName: 'เวสแดงพรีเมี่ยม', price: 300, emoji: '🟥', brand:['l&m'], variant:['red'], aliases:['แอลเอ็มแดง','แอลเอ็มแดง1','แอลเอ็มแดง 1','แอลเอ็มแดง2','แอลเอ็มแดง 2','แอลเอ็มแดง3','แอลเอ็มแดง 3','แอลเอ็มแดง4','แอลเอ็มแดง 4','แอลเอ็มแดง5','แอลเอ็มแดง 5'] },
  { id: 75, sku: 'MARLBORO_RED', name: 'มาโบโร่แดง', thName: 'มาโบโร่แดง', price: 300, emoji: '🟥', brand:['marlboro'], variant:['red'], aliases:['มาโบโร่แดง','มาโบโร่แดง1','มาโบโร่แดง 1','มาโบโร่แดง2','มาโบโร่แดง 2','มาโบโร่แดง3','มาโบโร่แดง 3','มาโบโร่แดง4','มาโบโร่แดง 4','มาโบโร่แดง5','มาโบโร่แดง 5'] },
  { id: 76, sku: 'VESS_RED_PREMIUM', name: 'เวสแดงพรีเมี่ยม', thName: 'เวสแดงพรีเมี่ยม', price: 300, emoji: '🟥', brand:['vess'], variant:['red'], aliases:['เวสแดงพรีเมี่ยม','เวสแดงพรีเมี่ยม1','เวสแดงพรีเมี่ยม 1','เวสแดงพรีเมี่ยม2','เวสแดงพรีเมี่ยม 2','เวสแดงพรีเมี่ยม3','เวสแดงพรีเมี่ยม 3','เวสแดงพรีเมี่ยม4','เวสแดงพรีเมี่ยม 4','เวสแดงพรีเมี่ยม5','เวสแดงพรีเมี่ยม 5'] },
  { id: 77, sku: 'CANYON_RED', name: 'แคนยอนแดง', thName: 'แคนยอนแดง', price: 350, emoji: '🟥', brand:['canyon'], variant:['red'], aliases:['แคนยอนแดง','แคนยอนแดง1','แคนยอนแดง 1','แคนยอนแดง2','แคนยอนแดง 2','แคนยอนแดง3','แคนยอนแดง 3','แคนยอนแดง4','แคนยอนแดง 4','แคนยอนแดง5','แคนยอนแดง 5'] },
  { id: 78, sku: 'PLATINUM_BLUE_COOL', name: 'แพลตตินั่มบลูคูล', thName: 'แพลตตินั่มบลูคูล', price: 350, emoji: '🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มฟ้าคูล','แพลตตินั่มฟ้าคูล1','แพลตตินั่มฟ้าคูล 1','แพลตตินั่มฟ้าคูล2','แพลตตินั่มฟ้าคูล 2','แพลตตินั่มฟ้าคูล3','แพลตตินั่มฟ้าคูล 3','แพลตตินั่มฟ้าคูล4','แพลตตินั่มฟ้าคูล 4','แพลตตินั่มฟ้าคูล5','แพลตตินั่มฟ้าคูล 5'] },
  { id: 79, sku: 'PLATINUM_BLUE_MINT_2CAPS', name: 'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', thName: 'แพลตตินั่มบลูมินต์ 2 เม็ดบีบ', price: 350, emoji: '🟦', brand:['platinum'], variant:['blue'], aliases:['แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 1','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 2','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 3','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 4','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ5','แพลตตินั่มบลูมิ้นท์ 2 เม็ดบีบ 5'] },
  { id: 80, sku: 'MILANO_FIZZ', name: 'มิลาโน่ฟิซ', thName: 'มิลาโน่ฟิซ', price: 350, emoji: '🍫', brand:['milano'], variant:['fizz'], aliases:['มิลาโน่ฟิซ','มิลาโน่ฟิซ1','มิลาโน่ฟิซ 1','มิลาโน่ฟิซ2','มิลาโน่ฟิซ 2','มิลาโน่ฟิซ3','มิลาโน่ฟิซ 3','มิลาโน่ฟิซ4','มิลาโน่ฟิซ 4','มิลาโน่ฟิซ5','มิลาโน่ฟิซ 5'] },
  { id: 81, sku: 'SUK_DEFAULT', name: 'สุขดั้งเดิม', thName: 'สุขดั้งเดิม', price: 350, emoji: '🍫', brand:['suk'], variant:['default'], aliases:['ซุค','ซุค1','ซุค 1','ซุค2','ซุค 2','ซุค3','ซุค 3','ซุค4','ซุค 4','ซุค5','ซุค 5'] },
  { id: 82, sku: 'ORIS_BLUE_1CAPS', name: 'โอริสฟ้า 1 เม็ดบีบ', thName: 'โอริสฟ้า 1 เม็ดบีบ', price: 400, emoji: '🟦', brand:['oris'], variant:['blue'], aliases:['โอริสฟ้า','โอริสฟ้า1','โอริสฟ้า 1','โอริสฟ้า2','โอริสฟ้า 2','โอริสฟ้า3','โอริสฟ้า 3','โอริสฟ้า4','โอริสฟ้า 4','โอริสฟ้า5','โอริสฟ้า 5'] },
  { id: 83, sku: 'ORIS_BLUE_2CAPS', name: 'โอริสฟ้า 2 เม็ดบีบ', thName: 'โอริสฟ้า 2 เม็ดบีบ', price: 450, emoji: '🟦', brand:['oris'], variant:['blue'], aliases:['โอริสบลู','โอริสบลู1','โอริสบลู 1','โอริสบลู2','โอริสบลู 2','โอริสบลู3','โอริสบลู 3','โอริสบลู4','โอริสบลู 4','โอริสบลู5','โอริสบลู 5'] },
  { id: 84, sku: 'BLUE_ICE_ICE_1CAPS', name: 'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', thName: 'บลูไอซ์ ไอซ์ 1 เม็ดบีบ', price: 450, emoji: '🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { id: 85, sku: 'BLUE_ICE_ICE_2CAPS', name: 'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', thName: 'บลูไอซ์ ไอซ์ 2 เม็ดบีบ', price: 450, emoji: '🍫', brand:['blue ice'], variant:['ice'], aliases:['บลูไอซ์','บลูไอซ์1','บลูไอซ์ 1','บลูไอซ์2','บลูไอซ์ 2','บลูไอซ์3','บลูไอซ์ 3','บลูไอซ์4','บลูไอซ์ 4','บลูไอซ์5','บลูไอซ์ 5'] },
  { id: 86, sku: 'D&J_DEFAULT', name: 'ดีแอนด์เจดั้งเดิม', thName: 'ดีแอนด์เจดั้งเดิม', price: 450, emoji: '🍫', brand:['d&j'], variant:['default'], aliases:['ดีแอนด์เจ','ดีแอนด์เจ1','ดีแอนด์เจ 1','ดีแอนด์เจ2','ดีแอนด์เจ 2','ดีแอนด์เจ3','ดีแอนด์เจ 3','ดีแอนด์เจ4','ดีแอนด์เจ 4','ดีแอนด์เจ5','ดีแอนด์เจ 5'] },
  { id: 87, sku: 'MOND_BLACK', name: 'ม่อนดำ', thName: 'ม่อนดำ', price: 450, emoji: '⬛', brand:['mond'], variant:['black'], aliases:['ม่อนดำ','ม่อนดำ1','ม่อนดำ 1','ม่อนดำ2','ม่อนดำ 2','ม่อนดำ3','ม่อนดำ 3','ม่อนดำ4','ม่อนดำ 4','ม่อนดำ5','ม่อนดำ 5'] },
  { id: 88, sku: 'CAVALLO_WATERMELON', name: 'คาวาโร่แตงโม', thName: 'คาวาโร่แตงโม', price: 350, emoji: '🍉', brand:['cavallo_watermelon'], variant:['watermelon'], aliases:['คาแตงโม','คา แตงโม1','CAVALLO_แตงโม','คาโรแตงโม','CAVALLO_WATERMELON','CAVALLO_WATERMELON '] },
  { id: 89, sku: 'CAVALLO_MANGO', name: 'คาวาโร่มะม่วง', thName: 'คาวาโร่มะม่วง', price: 350, emoji: '🥭', brand:['cavallo'], variant:['mango'], aliases:['CAVALLO_MANGO','คาวาโร่มะม่วง','คามะม่วง','🥭CAVALLO _MANGO'] },
  { id: 90, sku: 'SEVIOS_WATERMELON', name: 'ซีวอสแตงโม', thName: 'ซีวอสแตงโม', price: 350, emoji: '🍉', brand:['sevios'], variant:['watermelon'], aliases:['SEVIOS_WATERMELON','ซีวอสแตงโม','ซีวอส แตงโม'] },
   { id: 91, sku: 'VORTEX_GREEN ', name: 'วอเทค', thName: 'วอเทค', price: 350, emoji: '🟩', brand:['vortex'], variant:['green'], aliases:['VORTEX_GREEN','วอเทคเขียว','🟢 VORTEX_GREEN',] },
     { id: 92, sku: 'VORTEX_RED ', name: 'วอเทค', thName: 'วอเทค', price: 350, emoji: '🟥', brand:['vortex'], variant:['red'], aliases:['VORTEX_RED','วอเทคแดง',] },
];

function cleanAlias(raw){ 
  if(!raw) return ""; 
  return String(raw).replace(/\|+/g," ").replace(/_{2,}/g," ").replace(/`+/g,"").replace(/<code>|<\/code>/gi,"").replace(/\s{2,}/g," ").trim(); 
}

function extractMessages(obj, pageIdFromParent=""){  
  let messages = [];  
  if(Array.isArray(obj)){  
    obj.forEach(item=>{ messages = messages.concat(extractMessages(item, pageIdFromParent)); });  
  } else if(typeof obj==='object' && obj!==null){  
    if(obj.message && obj.id){  
      let cleanedMsg = obj.message.replace(/udfe[0-9a-fA-F]{0,4}/gi,"").replace(/\\?ud[0-9a-fA-F]+/gi,"");  
      messages.push({...obj, message:cleanedMsg, page_id_inherited:pageIdFromParent});  
    }  
    let currentPageId = pageIdFromParent;  
    if(obj.participants?.data){  
      const pageP = obj.participants.data.find(p=>p.id?.length>10);  
      if(pageP) currentPageId = pageP.id;  
    }  
    for(const key in obj){ messages = messages.concat(extractMessages(obj[key], currentPageId)); }  
  }  
  return messages;  
}

const items = $input.all();
let threads = {};
for(const w of items){
  for(const conv of (w.json.data || [])){
    if(!conv.id) continue;
    if(!threads[conv.id]) threads[conv.id] = { msgs: [], parts: conv.participants?.data || [] };
    threads[conv.id].msgs.push(...extractMessages(conv));
  }
}

function fmt(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

const output = [];


for (const tid in threads) {
  let rawMsgs = threads[tid].msgs.sort(
    (a, b) => new Date(a.created_time) - new Date(b.created_time)
  );

  const pagePart = threads[tid].parts.find(
    p => MASTERCONFIG.some(c => String(c.page_id) === String(p.id))
  );

  const masterConfigNode =
    MASTERCONFIG.find(
      c => String(c.page_id) === String(pagePart?.id)
    ) || MASTERCONFIG[0];

  const customerPart = threads[tid].parts.find(
    p => String(p.id) !== String(masterConfigNode.page_id)
  );

  const customer_id = String(customerPart?.id || "").trim();


  for (let i = 0; i < rawMsgs.length; i++) {
    const m = rawMsgs[i];

    let SNIPER_X_TEXT = m.message || "";
    SNIPER_X_TEXT = SNIPER_X_TEXT
      .replace(/\\n/g, "\n")
      .replace(/\\\s*n/gi, "\n");

    // ประมวลผลต่อ
  }


  
  for(let i=0; i<rawMsgs.length; i++){
    const m = rawMsgs[i];
    let SNIPER_X_TEXT = m.message || ""; 
    SNIPER_X_TEXT = SNIPER_X_TEXT.replace(/\\n/g,'\n').replace(/\\\s*n/gi,'\n');
    
    // ยอมรับทั้งคำว่า COD หรือ ยอดรวม หรือ ออเดอร์
  const realOrderTimeUtc = normalizeFacebookTime(m.created_time);
    const orderTimeDisplay = formatThaiDateTime(realOrderTimeUtc);
    // วันที่ไทยของบิลนี้มาจากเวลา API เช่น 20/10/69 10:21:31
    const trackingRequestSameThaiDate = hasTrackingRequestSameThaiDate(rawMsgs, i);

    // 2. ดึงข้อมูล วัน/เดือน/ปี/เวลา ตามโซนเวลาไทย
    const dateObj = realOrderTimeUtc ? new Date(realOrderTimeUtc) : new Date();
    const optionsTh = { timeZone: 'Asia/Bangkok' };

    const day = dateObj.toLocaleDateString('en-US', { ...optionsTh, day: '2-digit' });
    const month = dateObj.toLocaleDateString('en-US', { ...optionsTh, month: '2-digit' });
    const year = dateObj.toLocaleDateString('en-US', { ...optionsTh, year: '2-digit' });

    const realOrderTimeStr = dateObj.toLocaleTimeString('en-GB', { ...optionsTh, hour12: false });
    const timeStr = realOrderTimeStr.replace(/:/g, ''); 

    // 3. ประกอบรหัสออเดอร์
    const dynamicOrderNumber = `ORD-${day}${month}${year}-${timeStr}`;
    
    
  let fbCustomerName = "";
let threadId = tid;
let customer_id = "";
let message_id = m.id;
    
// หา customer จาก participants แค่ครั้งเดียว
if (Array.isArray(threads[tid].parts)) {
  const custPart = threads[tid].parts.find(
    p => String(p.id) !== String(masterConfigNode.page_id)
  );

  if (custPart) {
    fbCustomerName = String(custPart.name || '').trim();
    customer_id = String(custPart.id || '').trim();
  }
}

// รับเฉพาะข้อความที่มีสัญญาณออเดอร์
if (!/(cod|ยอด|ยอดรวม|บาท)/iu.test(SNIPER_X_TEXT)) {
  continue;
}

let ev = [];
let evTime = [];

// เดินย้อนหลังเพื่อเก็บข้อความลูกค้า
for (
  let j = i - 1;
  j >= Math.max(0, i - BUBBLE_WINDOW);
  j--
) {
  const up = rawMsgs[j];
  if (!up) continue;

  const upFromId =
    up.from?.id ||
    up.page_id_inherited ||
    '';

  const isPageMessage =
    MASTERCONFIG.some(c =>
      String(c.page_id) === String(upFromId)
    ) ||
    up.is_echo === true;

  // ไม่เอาข้อความจากเพจมาปนกับข้อความลูกค้า
  if (isPageMessage) continue;

  const txt = String(up.message || '').trim();
  if (!txt) continue;

  if (!fbCustomerName && up.from?.name) {
    fbCustomerName = String(up.from.name).trim();
  }

  const customerLabel =
    fbCustomerName ||
    up.from?.name ||
    'ลูกค้า';

  const customerTime =
    up.created_time
      ? (
          formatThaiDateTime(
            (normalizeFacebookTime(up.created_time) || up.created_time)
              instanceof Date
              ? (normalizeFacebookTime(up.created_time) || up.created_time).toISOString()
              : String(normalizeFacebookTime(up.created_time) || up.created_time)
          ) ||
          orderTimeDisplay
        )
      : orderTimeDisplay;

  // รูปแบบใหม่:
  // [customer_name : orderTimeDisplay] : ข้อความ
  ev.unshift(
    `[${customerLabel} : ${customerTime}] : ${txt}`
  );

  // ถ้ายังมี node ถัดไปใช้ evTime ให้เก็บรูปแบบเดียวกัน
  evTime.unshift(
    `[${customerLabel} : ${customerTime}] : ${txt}`
  );
}

// ข้อความบิลจากเพจปัจจุบัน
const pageLabel =
  masterConfigNode.page_name ||
  'เพจ';

const pageTime =
  orderTimeDisplay ||
  (
    m.created_time
      ? (
          formatThaiDateTime(
            (normalizeFacebookTime(m.created_time) || m.created_time)
              instanceof Date
              ? (normalizeFacebookTime(m.created_time) || m.created_time).toISOString()
              : String(normalizeFacebookTime(m.created_time) || m.created_time)
          ) ||
          'เวลาไม่ทราบ'
        )
      : 'เวลาไม่ทราบ'
  );

const pageText = SNIPER_X_TEXT.slice(0, 400);

// รูปแบบใหม่:
// [masterConfigNode.page_name: orderTimeDisplay] : ข้อความบิล
ev.push(
  `[${pageLabel} : ${pageTime}] : ${pageText}`
);

evTime.push(
  `[${pageLabel} : ${pageTime}] : ${pageText}`
);

// รายชื่อคำสั่งชี้ขาด (เจอคำเหล่านี้ = ออเดอร์ทันที)



// 📐 ฟังก์ชันคำนวณอายุแชท 24 ชั่วโมง
function getChatStatus(lastInteractionTime) {
  if (!lastInteractionTime) return { hoursAgo: 999, isWithin24h: false, canSend: false };

  const lastTime = new Date(lastInteractionTime).getTime();
  const now = new Date().getTime();
  const diffInHours = (now - lastTime) / (1000 * 60 * 60);

  return {
    hoursAgo: parseFloat(diffInHours.toFixed(1)),
    isWithin24h: diffInHours <= 24,
    canSend: diffInHours <= 24
  };
}
// ============================================================
// DK DRAKSIDE — FIRST NODE SIGNAL + HARD GATE
// เรียงลำดับ 1 → 2 → 3 → 4
// ============================================================
   
      // ============================================================
      // 🔪 [รวมร่าง 2 ใน 4 อย่าง - บล็อกดีไซน์สับชิ้นส่วนสั้นเพียวขนานดัชนีของอาจารย์]
      // ============================================================
      // 2. สับยอด COD (กระบวนท่าทลายกล่องก้ามปูของอาจารย์)
      const codMatch = SNIPER_X_TEXT.match(/(?:cod|COD|ยอดรวมCOD|ราคา)[\s:：]*\[?([0-9,.]+)\]?/i) || SNIPER_X_TEXT.match(/💰\s*ยอดรวมCOD\s*:\s*([0-9,.]+)/);
      const rawCod = codMatch ? (codMatch[1] || codMatch[2]) : (SNIPER_X_TEXT.match(/\b\d{2,4}\b/)?.[0] || "0");
      const hascodAmount  = Number(rawCod.replace(/[, ]/g, "")) || 0;

      // 3. ดึงสัญลักษณ์ 🚨, ✅, 🤖, 🍁 ดีไซน์บล็อกขนานดึงอินเด็กซ์ สั้นๆ ไร้คำแต่งเติม
      const botMatch = SNIPER_X_TEXT.match(/(🚨)/);
      const botFlag = botMatch ? botMatch[1] : "";

      const BB_ORDER = SNIPER_X_TEXT.match(/(✅#BB_ORDER)/);
      const BBFlag = BB_ORDER ? BB_ORDER[1] : "";
    
      // สกัด ✅ ปกติ (ต้องไม่ไช่ ✅#BB_ORDER เพื่อป้องกันการสับสน)
      const checkMatch = !BBFlag && SNIPER_X_TEXT.match(/(✅)/);
      const successFlag = checkMatch ? checkMatch[0] : "";

      const alertMatch = SNIPER_X_TEXT.match(/(🤖)/);
      const readyFlag = alertMatch ? alertMatch[1] : "";

      const GuMatch = SNIPER_X_TEXT.match(/(🍁)/);
      const GuFlag = GuMatch ? GuMatch[1] : "";

      // คัดสรรความบริสุทธิ์ของธงเบิกทาง (คุณสมบัติชี้ขาดออเดอร์แท้)
      const hasOrderSignature = botFlag !== "" || BBFlag !== "" || successFlag !== "" || readyFlag !== "" || GuFlag !== "";
    
             // ============================================================
      // 🔪 [กล่องคำสั่งชี้ขาดฟิกพิเศษของอาจารย์ - สัญญาสอยทันที]
      // ============================================================
      const KILLER_KEYWORDS = ["🍁", "🤖", " ✅", "🚨", "✅#BB_ORDER "];
      
      // 1. เช็คธงชี้ขาดทั่วไปในแชท
      const isKillerFlag = KILLER_KEYWORDS.some(k => SNIPER_X_TEXT.includes(k));
      
      // 2. เช็คเงื่อนไขแอดมินคนพิมพ์สด (คำว่า COD ต้องอยู่บรรทัดแรกสุดเท่านั้น)
      const firstLineText = (SNIPER_X_TEXT.split('\n')[0] || "").trim();
      const isHumanKiller = firstLineText.includes("COD");

      // รวมพลังชี้ขาดรวบยอด (เจอธง หรือ แอดมินคีย์ COD บรรทัดแรก = ชี้ขาดทันที)
      const isAbsoluteKiller = isKillerFlag || isHumanKiller;

      // ============================================================
      // 🔥 [ด่านชี้ขาดความปลอดภัยสูงสุดตามสั่ง - ดีดขยะทิ้ง 100%] 🔥
      // ============================================================
      // ถ้ายอดรวมน้อยกว่า 200 (และไม่ใช่คำสั่งชี้ขาด) หรือ ไม่มีลายเซ็นออเดอร์เดิม ให้ดีดทิ้ง
      if ((hascodAmount < 200 && !isAbsoluteKiller) || (!hasOrderSignature && !isAbsoluteKiller)) {
        continue; 
      }

      // ============================================================
      // 🔥 [ด่านชี้ขาดความปลอดภัยสูงสุดตามสั่ง - ดีดขยะทิ้ง 100%] 🔥
      // ============================================================
    
      // ============================================================
      // 🎈 [BALLOON ENGINE V1.5] สกัดธงและระบุตัวตนคนพิมพ์บิล
      // ============================================================
      // 1. สกัดเศษสัญลักษณ์ที่เจอจริง
      let extractedSignatureEmoji = "";
      if (botFlag !== "") extractedSignatureEmoji += "🚨 ";
      if (BBFlag !== "")  extractedSignatureEmoji += "✅#BB_ORDER ";
      if (successFlag !== "") extractedSignatureEmoji += "✅ ";
      if (readyFlag !== "") extractedSignatureEmoji += "🤖 ";
      if (GuFlag !== "")    extractedSignatureEmoji += "🍁 ";
      extractedSignatureEmoji = extractedSignatureEmoji.trim() || "ไม่พบธง";

      // 2. ระบุตัวตนผู้เขียนบิล (แยกแยะ 3 สถานะตามธงชี้ขาดชัดเจน)
      let sniperAuthorClass = "UNKNOWN_SOURCE";
      let authorNameTH = "ไม่ทราบ";

      if (botFlag !== "") {
        sniperAuthorClass = "🚨OFFICIAL_BOT";
        authorNameTH = "🚨 แอดมิน BOT";
      } else if (BBFlag !== "") {
        // ถ้าเจอ ✅#BB_ORDER เป็นบอทของระบบเจ๊ BB 
        sniperAuthorClass = "🚨OFFICIAL_BOT";
        authorNameTH = "🚨 ✅#BB_ORDER";
      } else if (GuFlag !== "") {
        // เจอใบเมเปิ้ล ชี้ชัดว่าเป็นคีย์ลัดร่างเทพของจารย์
        sniperAuthorClass = "🍁DARK_HUMAN_AHK";
        authorNameTH = "🍁แอดมินผม DARK_HUMAN_AHK";
      } else if (successFlag !== "" || readyFlag !== "") {
        // เจอ ✅ ปกติ หรือ 🤖 ถือว่าเป็นแอดมินคนพิมพ์สด/คีย์มือ
        sniperAuthorClass = "👤HUMAN_ADMIN";
        authorNameTH = "✅แอดมินคน";
      }
      
      // ============================================================
      // 📊 [PRE-COUNT ORDER JET V4.9] นับใบจริงเฉพาะของเฟสชื่อนี้ตัวจริง
      // ============================================================
      const currentThreadBills = Array.isArray(rawMsgs) 
        ? rawMsgs.filter(m => {
            const isTargetFacebook = String(m.facebook_name || '').trim() === String(fbCustomerName || '').trim();
            const mText = String(m.message || m.original || '').normalize('NFC');
            const hasFlag = /(🚨|✅|🤖|🍁|#BB_ORDER)/iu.test(mText);
            return isTargetFacebook && hasFlag;
          })
        : [];

      // จำนวนใบจริงตามจริงในกลุ่ม
      const currentthreadtotalbills = currentThreadBills.length > 0 ? currentThreadBills.length : 1;

      // สเตตัสคำอธิบายหน้าตาราง
      const duplicate_count_th = currentthreadtotalbills > 1 
        ? `พบคู่/ก้อนทวน ${currentthreadtotalbills} ใบ` 
        : "ไม่พบคู่";

      // ============================================================
      // 🎈 [BALLOON NOTICE GENERATOR] พ่นคำอธิบายสถานะหน้าตาราง
      // ============================================================
      const balloonNotice =
        `ธงที่พบ: ${extractedSignatureEmoji} | ` +
        `ผู้เขียน: ${authorNameTH} | ` +
        `สัญญาณ: COMPLETENESS_ONLY | ` +
        `ดึงรอบนี้เจอชื่อเฟสซ้ำ: ${currentthreadtotalbills} ใบ`;

      // FINAL OUTPUT ของโหนดแรก
      m.sniperAuthorClass = String(sniperAuthorClass || '');
      m.currentthreadtotalbills = currentthreadtotalbills;
      m.duplicate_count_th = duplicate_count_th;
      m.balloonNotice = balloonNotice;
/**
 * สกัดเบอร์ไทยจากข้อความ
 *
 * ผลลัพธ์:
 * {
 *   phone: "0639102651" | "021234567" | null,
 *   phone_type: "MOBILE" | "LANDLINE" | null,
 *   phone_status: "OK" | "MISSING_PHONE" | "INVALID_PHONE" | "PHONE_REVIEW",
 *   phone_candidates: string[],
 *   rejected_candidates: string[]
 * }
 *
 * กติกา:
 * - มือถือ: 10 หลัก, prefix 061–066, 080–089, 090–099
 * - เบอร์บ้าน: 9 หลัก, รหัสพื้นที่ 02, 03, 04, 05 หรือ 07
 * - ล้างตัวคั่นภายในผู้สมัครเบอร์ก่อนตรวจ เช่น เว้นวรรค - . * / วงเล็บ
 * - รองรับรูปแบบ +66 / 66 รวมกรณีมี 0 ซ้ำหลังรหัสประเทศ
 * - ไม่เติมเลข 0 เพื่อซ่อมเบอร์ในประเทศที่ขาดหลัก
 * - ไม่แก้ความยาวผิด และไม่เดาเมื่อมีหลายเบอร์
 */
const text = SNIPER_X_TEXT || '';
let customer_name = "";

// 1. ดักจับตามโครงสร้างป้ายกำกับปกติ (กรณีบอทสรุป หรือมีคำว่า ชื่อ:)
const explicitNameMatch = text.match(
  /(?:^|\n)\s*(?:👤\s*)?(?:ชื่อผู้รับ|ชื่อ[-\s]*นามสกุล|ชื่อ)\s*[:：]\s*([^\r\n]+)/iu
);

// 2. 🎯 [ทีเด็ดแก้เคสนี้] ดักจับชื่อไทยที่โดนแอดมินแปะไว้ "หลังรหัสไปรษณีย์ 5 หลัก" ก่อนถึงคำว่า โทร/เบอร์/06x/08x/09x
const afterZipcodeNameMatch = text.match(
  /\b\d{5}\b\s+((?:นาย|นาง|นางสาว|น\.ส\.|คุณ|พระ|หลวงพ่อ)?\s*[\u0E00-\u0E7F]{2,20}\s*[\u0E00-\u0E7F]{2,20})(?=\s*(?:โทร|เบอร์|📱|0[689]\d{8}|$))/iu
);

// 3. ดักจับบรรทัดภาษาไทยทั่วไปก่อนถึงเบอร์โทร
const lineNameMatch = text.match(
  /(?:^|\n)\s*([\u0E00-\u0E7F\s\.]{2,40})(?=\s*\n\s*(?:0[689]\d{8}|📱|📍|📮|\d{3,5}))/iu
);

const nameMatch = explicitNameMatch || afterZipcodeNameMatch || lineNameMatch;

if (nameMatch?.[1]) {
  customer_name = nameMatch[1]
    .replace(/(?:✅|DATA_MISSING|NULL)\s*$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 4. ถ้าสแกนจากข้อความไม่เจอจริงๆ ค่อยใช้ชื่อ Facebook (เป็นทางเลือกสุดท้าย)
if (!customer_name && fbCustomerName) {
  customer_name = fbCustomerName.trim();
}

    
/**
 * PART 1: ฟังก์ชันสกัดและตรวจสอบเบอร์โทรศัพท์ไทย (extractThaiPhone)
 * รองรับการแปลงเลขไทย, ตรวจสอบความยาว 10 หลัก (มือถือ) และ 9 หลัก (เบอร์บ้าน)
 */
let validatedPhone = "";

function extractThaiPhone(text) {
  const sourceText = String(text ?? "");

  // แปลงเลขไทยและข้อความ "\n" แบบ literal
  const normalizedText = sourceText
    .replace(/\\n/g, "\n")
    .replace(/[๐-๙]/g, (digit) =>
      String("๐๑๒๓๔๕๖๗๘๙".indexOf(digit))
    );

  const lines = normalizedText.split(/\r?\n/);

  const phoneLabel = /(?:เบอร์|โทรศัพท์|โทร|มือถือ|phone|tel(?:ephone)?)/iu;
  const nonPhoneLabel =
    /(?:เลขที่ออเดอร์|เลขออเดอร์|รหัสไปรษณีย์|ไปรษณีย์|postcode|postal|zip\s*code)/iu;

  const candidatePattern =
    /(?<!\d)\+?\d(?:[\d\s().*\/-]*\d){5,14}(?![\d\s().*\/-]*\d)/g;

 function normalizeCandidate(raw) {
    let digits = String(raw).replace(/\D/g, "");

    if (digits.startsWith("66")) {
      digits = digits.slice(2);
      if (digits.startsWith("0")) {
        digits = digits.slice(1);
      }
      digits = `0${digits}`;
    }

    if (/^0(?:6[1-6]|8[0-9]|9[0-9])\d{7}$/.test(digits)) {
      return { phone: digits, type: "MOBILE" };
    }

   
if (/^02\d{7}$/.test(digits) || /^0[3457]\d{6}$/.test(digits)) {
      return { phone: digits, type: "LANDLINE" };
    }
    return null;
  }

  function isExcludedByContext(line, startIndex) {
    const before = line.slice(Math.max(0, startIndex - 50), startIndex);
    return /(?:เลขที่ออเดอร์|เลขออเดอร์|order\s*(?:id|no|number)?|ORD|รหัสไปรษณีย์|ไปรษณีย์|postcode|postal|zip\s*code)\s*[:#-]?\s*$/iu.test(
      before
    );
  }

  function scanLines(linesToScan) {
    const valid = [];
    const rejected = [];

    for (const line of linesToScan) {
      for (const match of line.matchAll(candidatePattern)) {
        const raw = match[0];
        const startIndex = match.index ?? 0;

        if (isExcludedByContext(line, startIndex)) {
          continue;
        }

        const normalized = normalizeCandidate(raw);

        if (normalized) {
          valid.push(normalized);
        } else {
          const digits = raw.replace(/\D/g, "");
          if (digits.length >= 8) {
            rejected.push(digits);
          }
        }
      }
    }

    const uniqueValid = [
      ...new Map(
        valid.map((item) => [item.phone, item])
      ).values(),
    ];

    return {
      valid: uniqueValid,
      rejected: [...new Set(rejected)],
    };
  }

  const labeledLines = lines.filter(
    (line) => phoneLabel.test(line) && !nonPhoneLabel.test(line)
  );

  let result = scanLines(labeledLines);

  if (result.valid.length === 0) {
    result = scanLines(lines);
  }

  const phoneCandidates = result.valid.map((item) => item.phone);

  if (result.valid.length === 1) {
    const match = result.valid[0];
    return {
      phone: match.phone,
      phone_type: match.type,
      phone_status: "OK",
      phone_candidates: phoneCandidates,
      rejected_candidates: result.rejected,
    };
  }

  if (result.valid.length > 1) {
    return {
      phone: null,
      phone_type: null,
      phone_status: "PHONE_REVIEW",
      phone_candidates: phoneCandidates,
      rejected_candidates: result.rejected,
    };
  }

  return {
    phone: null,
    phone_type: null,
    phone_status:
      result.rejected.length > 0 ? "INVALID_PHONE" : "MISSING_PHONE",
    phone_candidates: [],
    rejected_candidates: result.rejected,
  };
}
// Drop-in helper สำหรับแทน candidatePattern/loop เดิมใน n8n Code node
// แก้กรณี ZIP/เลขห้องอยู่ติดกับเบอร์: ตรวจทีละบรรทัดและเริ่ม candidate จาก 0 หรือ +66

const phoneLabel = /(?:เบอร์|โทรศัพท์|โทร|มือถือ|phone|tel(?:ephone)?)/iu;
const nonPhoneLabel = /(?:เลขที่ออเดอร์|เลขออเดอร์|รหัสไปรษณีย์|ไปรษณีย์|postcode|postal|zip\s*code)/iu;
const orderOrTimeLine = /(?:เวลาสั่งซื้อ|order[_\s-]*(?:time|id|number)|เลขที่ออเดอร์|เลขออเดอร์)/iu;

// จับเฉพาะเบอร์ไทย 9–10 หลัก (ขึ้นต้น 0) หรือรหัสประเทศ +66
// ใช้ space/tab เท่านั้น ไม่ให้ regex ข้ามบรรทัด และไม่ใช้ slash เพื่อกันรูปแบบวันที่
const TH_PHONE_CANDIDATE = /(?<!\d)(?:\+?66(?:[ \t().-]*\d){8,9}|0(?:[ \t().-]*\d){8,9})(?!\d)/g;

function normalizeCandidate(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');

  if (digits.startsWith('66')) {
    digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = `0${digits}`;
  }

  // มือถือไทย 10 หลัก: 06x/08x/09x (รองรับ 067–069 ด้วย)
  if (/^0[689]\d{8}$/u.test(digits)) {
    return { phone: digits, type: 'MOBILE' };
  }

  // โทรศัพท์พื้นฐานไทย 9 หลัก: 02–07 ตามด้วยเลข 7 หลัก
  if (/^0[2-7]\d{7}$/u.test(digits)) {
    return { phone: digits, type: 'LANDLINE' };
  }

  return null;
}

function extractThaiPhone(sourceText) {
  const text = String(sourceText ?? '').replace(/\\n/g, '\n');
  const lines = text.split(/\r?\n/u);
  const accepted = [];
  const rejected = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!line.trim() || orderOrTimeLine.test(line)) continue;

    const hasPhoneLabel = phoneLabel.test(line);
    // สร้าง RegExp ใหม่ทุกบรรทัดเพื่อไม่ให้ lastIndex จาก global regex ค้าง
    const pattern = new RegExp(TH_PHONE_CANDIDATE.source, TH_PHONE_CANDIDATE.flags);

    for (const match of line.matchAll(pattern)) {
      const raw = match[0];
      const normalized = normalizeCandidate(raw);
      const before = line.slice(Math.max(0, match.index - 36), match.index);
      const nonPhoneContext = nonPhoneLabel.test(before) && !phoneLabel.test(before);

      if (normalized) {
        accepted.push({
          ...normalized,
          raw,
          line: line.trim(),
          line_no: lineIndex + 1,
          has_phone_label: hasPhoneLabel,
          non_phone_label_nearby: nonPhoneContext,
        });
      } else {
        rejected.push({ raw, line: line.trim(), line_no: lineIndex + 1 });
      }
    }
  }

  // เบอร์ที่ระบุด้วย label มี priority; ตัดเบอร์ซ้ำแต่เก็บหลักฐานบรรทัดแรก
  accepted.sort((a, b) => Number(b.has_phone_label) - Number(a.has_phone_label) || a.line_no - b.line_no);
  const unique = [];
  const seen = new Set();
  for (const item of accepted) {
    if (seen.has(item.phone)) continue;
    seen.add(item.phone);
    unique.push(item);
  }

  return {
    phone: unique[0]?.phone ?? '',
    phone_type: unique[0]?.type ?? '',
    phone_candidates: unique,
    rejected_phone_candidates: rejected,
  };
}

// ตัวอย่างแทนโค้ดเดิมใน node:
// const phoneResult = extractThaiPhoneCandidates(original || raw_text || normalizedText);
// const validatedPhone = phoneResult.phone || 'DATA_MISSING';
// const phoneCandidates = phoneResult.phone_candidates;
// const rejectedPhoneCandidates = phoneResult.rejected_phone_candidates;

/**
 * PART 2: การเรียกใช้งานและดึงค่าตัวแปรเบอร์โทรศัพท์
 */
const phoneResult = extractThaiPhone(text);

validatedPhone = phoneResult.phone ?? "";
const phoneStatus = phoneResult.phone_status;
const phoneType = phoneResult.phone_type;
const phoneCandidates = phoneResult.phone_candidates;
const rejectedPhoneCandidates = phoneResult.rejected_candidates;
// =================================================================
// FRONT NODE PATCH
// Replace the existing block from `let rawText = ...` through the
// `if (qtyMatch) ...` section. Keep the existing output.push mapping.
// =================================================================
     let addrLines = [];
    const addressLinesSrc = text.split('\n');
    for (let l of addressLinesSrc) {
      if (/สรุปรายการสั่งซื้อ|COD|⏰|💰|รายการสินค้า|ORDER_MYSTORY|CAVALLO|St_Singto|เจ๊บี|ได้รับข้อมูลครบถ้วนแล้ว|จัดการลงคิวให้|ข้อมูลครบถ้วน|ปิดยอดสำเร็จ|สถานะ|เลขที่ออเดอร์|เลขออเดอร์|ยอดรวม|ยอดเงิน|เวลาสั่งซื้อ|ส่งฟรี|โปรโมชั่น|ไม่มีบวกเพิ่ม|เก็บปลายทาง|ส่ง\s*ปณ|\*+ปณ\*+|[─━═—–_]{3,}/iu.test(l)) continue;
      let onlyDigits = l.replace(/[-\s\.]/g, "");
      if (/^0\d{9}$/.test(onlyDigits)) continue;
      if (/^\d{5}$/.test(l) && addrLines.length === 0) continue;
      if (/^ชื่อ\.?/.test(l) && l.length < 15 && !/\d/.test(l)) continue;
      if (/^(\ขวัญ|วันนา|[ก-๙]{1,2}\s*ชื่)$/.test(l)) continue;
      if (l.length > 3) addrLines.push(l);
    }

    let finalAddressClean = addrLines.join(" ")
      .replace(/[━─═—–_]{3,}/g, "")
      .replace(/เลขออเดอร์.*?(?=\s|$)/gi, "")
      .replace(/ชื่อ\.วันนา|ขวัญ/g, "")
      .replace(/(\d{5})\.(\d+)/g, "$1 $2")
      .replace(/ซอย\./g, "ซอย ")
      .replace(/\s{2,}/g, " ")
      .trim();

    let rawAddressBody = finalAddressClean
      .replace(/◦+/g, " ")
      .replace(/[⊱✿✧･ﾟ*💗🌸🍇🎯💜🟣🍁🚨🍁「」┌┐└┘✦🆔]/g, " ")
      .replace(/#.*ORDER_MYSTORY.*/gi, " ")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ")
      .replace(/[\uDC00-\uDFFF\uD800-\uDBFF\uFFFD\uDCB0]/g, " ")
      .replace(/[─━═][=-=-───────────=-=-=-]{3,}.*?เลขที่ออเดอร์.*?["─━═]{3,}/gi, " ")
      .replace(/[─━—–_]{3,}[ \t]*ชื่อ:[ \t]*/g, '')
      .replace(/เลขที่ออเดอร์.*|เลขออเดอร์.*/gi, " ")
      .replace(/```/g, "")
      .replace(/(?:─{2,}|═{2,}|[─═┌┐└┘│])/g, '').replace(/\s+/g, ' ')
      .replace(/\[\s*สถานะ.*?\]/g, "")
      .replace(/[\─\═\┌\┐\└\┘\│]+/g, ' ').replace(/\s+/g, ' ')
      .replace(/(?:ได้รับข้อมูลครบถ้วนแล้ว|จัดการลงคิวให้|ข้อมูลครบถ้วน|ขอบคุณที่อุดหนุน|หนูจัดการลงคิวให้).*?(?=\s|$)/giu, " ")
      .replace(/(?:🚨|🤖|🔮|💜|🍁|🏩|✅|❌|⚡|✦|「|」|┌|┐|└|┘)/gu, " ")
      .replace(/⏰.*?(?:น\.|น)/g, "")
      .replace(/💰.*?(?:บาท)?/gi, "")
      .replace(/🤖\s*\[.*?\]/g, "")
      .replace(/\b(COD|ยอดรวม|สรุปรายการ|รายการสินค้า|เวลาสั่งซื้อ)\b.*$/gims, "")
      .replace(/(?:ชื่อ\.?|เบอร์โทร\.?|เบอร์)\s*[0-9\-]{9,}/gi, " ")
      .replace(/\b0\d{1}[-\s]?\d{3}[-\s]?\d{4}\b/g, " ")
      .replace(/เลขไปรษณีย์|รหัสไปรษณีย์|ไปรษณีย์/g, " ")
      
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!rawAddressBody || rawAddressBody.length < 10) rawAddressBody = finalAddressClean;
    finalAddressClean = rawAddressBody;

    let houseStart = finalAddressClean.match(/(\d+\/\d+|\d+\s*ม\.\s*\d+|\d+\s*หมู่\s*\d+)/);
    if (houseStart) {
      let idx = finalAddressClean.indexOf(houseStart[0]);
      if (idx > 0 && idx < 30) finalAddressClean = finalAddressClean.substring(idx);
    }

    // 1. ดึงรหัสไปรษณีย์ 5 หลัก
let hasshipping_zipcode = (finalAddressClean.match(/\b([1-9][0-9]{4})\b/) || [])[1] || "";

// 🎯 [ต่อท้ายบรรทัด 881] ตัดข้อความทุกอย่างหลังรหัสไปรษณีย์ 5 หลักทิ้งทันที!
if (hasshipping_zipcode) {
  const zipIndex = finalAddressClean.indexOf(hasshipping_zipcode);
  if (zipIndex !== -1) {
    // เอาเฉพาะเนื้อหาตั้งแต่เริ่ม จนถึงจบตัวเลขรหัสไปรษณีย์ 5 หลักพอ
    finalAddressClean = finalAddressClean.substring(0, zipIndex + 5).trim();
  }
}
    
    let spacedAddr = finalAddressClean
      
      .replace(/(ตำบล|อำเภอ|จังหวัด|ต\.|อ\.|จ\.)/g, " $1 ")
      .replace(/\./g, " ")
      .replace(/(\d{5})/g, " $1 ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (customer_name && finalAddressClean.includes(customer_name)) {
      finalAddressClean = finalAddressClean.replace(customer_name, "").trim();
    }
    finalAddressClean = finalAddressClean.replace(/(?:โทร|เบอร์)?\s*[:：]?\s*0[0-9\s-]{8,13}\d/g, "").trim();
    const houseNumMatch = finalAddressClean.match(/\d+[\/\d]*\s+/);
    if (houseNumMatch && houseNumMatch.index > 0 && houseNumMatch.index < 15) {
      finalAddressClean = finalAddressClean.substring(houseNumMatch.index).trim();
    }
    finalAddressClean = finalAddressClean.replace(/(?:โทร|เบอร์)?\s*[:：]?\s*0[0-9\s-]{8,13}\d/g, "").trim();

    let hassubDistrict = (spacedAddr.match(/(?:^|\s)(?:ตำบล|ต)\s+([ก-๙]{2,})/)||[])[1] || "";
    let hasdistrict = (spacedAddr.match(/(?:^|\s)(?:อำเภอ|อ)\s+([ก-๙]{2,})/)||[])[1] || "";
    let hasgetProvince = (spacedAddr.match(/(?:^|\s)(?:จังหวัด|จ)\s+([ก-๙]{2,}(?:\s[ก-๙]+)?)/)||[])[1] || "";

    if (!hasgetProvince) {
      if (/กทม|กรุงเทพ/i.test(spacedAddr)) hasgetProvince = "กรุงเทพมหานคร";
      else {
        let provList = ["กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","อยุธยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"];
        for (let p of provList) {
          if (spacedAddr.includes(p)) {
            hasgetProvince = p === "อยุธยา" ? "พระนครศรีอยุธยา" : p;
            break;
          }
        }
      }
    }

    let shortAddressClean = "";
    let mHouse = spacedAddr.match(/(\d+\/\d+|\d+)\s*(?:หมู่|ม)\s*\d+/i);
    if (mHouse) shortAddressClean = mHouse[0].trim();
    else {
      let noZip = spacedAddr.replace(/^\d{5}\s+/, "").replace(/\s+\d{5}(\s|$)/, " ");
      if (hasgetProvince) noZip = noZip.replace(hasgetProvince, "").replace(/กรุงเทพ.*/, "").trim();
      shortAddressClean = noZip.split(/\s+(?:ตำบล|ต|อำเภอ|อ|จังหวัด|จ)\s+/)[0].trim().substring(0, 50);
      shortAddressClean = shortAddressClean.split(/\s+บ้าน/)[0].trim();
      if (!shortAddressClean) shortAddressClean = noZip.substring(0, 40);
    }

    let pureCleanAddress = shortAddressClean;
    if (hassubDistrict && !pureCleanAddress.includes(hassubDistrict)) pureCleanAddress += ` ต.${hassubDistrict}`;
    if (hasdistrict && !pureCleanAddress.includes(hasdistrict)) pureCleanAddress += ` อ.${hasdistrict}`;
    if (hasgetProvince && !pureCleanAddress.includes(hasgetProvince) && !pureCleanAddress.includes("กรุงเทพ")) pureCleanAddress += ` จ.${hasgetProvince}`;
    if (hasshipping_zipcode && !pureCleanAddress.includes(hasshipping_zipcode)) pureCleanAddress += ` ${hasshipping_zipcode}`;
    pureCleanAddress = pureCleanAddress.replace(/\s*จ\.กรุงเทพมหานคร/, " จ.กรุงเทพมหานคร").trim();
    pureCleanAddress = [...new Set(pureCleanAddress.split(/\s+/))].join(" ").trim();
    pureCleanAddress = [...new Set(pureCleanAddress.split(/\s+/))].join(" ").trim();

    // =================================================================
    // 👁️ LANDMARK SYSTEM & MOLECULAR ADDRESS FEATURES (ยัดตรงนี้เลยครับจารย์)
    // =================================================================
    const landmarkType = function(value) {
      const s = String(value ?? '');
      if (/สำนักสงฆ์/iu.test(s)) return 'MONK_RESIDENCE';
      if (/ศูนย์\s*ปฏิบัติธรรม|สถานปฏิบัติธรรม/iu.test(s)) return 'DHARMA_CENTER';
      if (/โบสถ์|มัสยิด|กุฏิ|ศาลเจ้า/iu.test(s)) return 'FAITH_LANDMARK';
      if (/วัด/iu.test(s)) return 'TEMPLE';
      if (/สำนัก/iu.test(s)) return 'RELIGIOUS_CENTER';
      if (/สนาม\s*(?:กีฬา|ฟุตบอล|กอล์ฟ)|สเตเดียม|stadium/iu.test(s)) return 'SPORTS_VENUE';
      if (/หมู่บ้าน|โครงการ|คอนโด|อพาร์ทเม้นท์|อพาร์ตเมนต์|แฟลต|แมนชั่น|หอพัก|ชุมชน/iu.test(s)) return 'HOUSING_PROJECT';
      if (/บริษัท|หจก\.?|บจก\.?|สำนักงาน|ออฟฟิศ|ร้าน|โรงงาน|โกดัง|อู่|ฟาร์ม|ห้าง|ตลาด|ศูนย์การค้า|ศูนย์ราชการ|มหาวิทยาลัย|โรงเรียน|โรงพยาบาล|รีสอร์ท|โรงแรม|ตึก|ชั้น/iu.test(s)) return 'BUSINESS_OR_INSTITUTION';
      if (/แขวง|เขต|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|ถนน|ถ\.|ซอย|ซ\.|ตรอก|หมู่\s*\d+|ม\.\s*\d+/iu.test(s)) return 'AREA_ROAD_ADDRESS';
      return 'GENERAL_LANDMARK';
    };

    const addressFeatures = function(value) {
      const s = String(value ?? '');
      const features = [];
      if (/บริษัท|หจก\.?|บจก\.?|สำนักงาน|ออฟฟิศ|ร้าน|โรงงาน|โกดัง|อู่|ฟาร์ม|ห้าง/iu.test(s)) features.push('BUSINESS_OR_WORKPLACE');
      if (/รีสอร์ท|โรงแรม|อาคาร|ตึก|ชั้น/iu.test(s)) features.push('RESIDENCE_OR_BUILDING');
      if (/แขวง/iu.test(s)) features.push('SUBDISTRICT_KHWANG');
      if (/เขต/iu.test(s)) features.push('DISTRICT_KHET');
      if (/ถนน|ถ\./iu.test(s)) features.push('ROAD');
      if (/ซอย|ตรอก/iu.test(s)) features.push('SOI_OR_ALLEY');
      if (/หมู่บ้าน|โครงการ|คอนโด|อพาร์ทเม้นท์|อพาร์ตเมนต์|แฟลต|แมนชั่น|หอพัก/iu.test(s)) features.push('HOUSING_PROJECT');
      if (/หมู่\s*\d+|ม\.\s*\d+/iu.test(s)) features.push('VILLAGE_NUMBER');
      if (/สนาม\s*(?:กีฬา|ฟุตบอล|กอล์ฟ)|สเตเดียม|stadium/iu.test(s)) features.push('SPORTS_VENUE');
      if (/วัด/iu.test(s)) features.push('TEMPLE');
      if (/สำนักสงฆ์/iu.test(s)) features.push('MONK_RESIDENCE');
      if (/โบสถ์|มัสยิด|กุฏิ|ศาลเจ้า/iu.test(s)) features.push('FAITH_LANDMARK');
      if (/โรงเรียน|รร\.?|มหาวิทยาลัย|โรงพยาบาล|รพ\.?|อนามัย|ตู้ยาม|ตลาด/iu.test(s)) features.push('COMMUNITY_OR_PUBLIC_PLACE');
      if (/ข้าง|ตรงข้าม|เยื้อง|หลัง|หน้า|ติดกับ|ใกล้กับ|สะพาน|ทางเข้า/iu.test(s)) features.push('DIRECTIONAL_LANDMARK');
      if (/ชื่อป้าย|ป้ายหน้ากล่อง|จุดสังเกต|แลนด์มาร์ก|จุดหมาย/iu.test(s)) features.push('DELIVERY_SIGNPOST');
      if (/สำนัก|ศูนย์\s*ปฏิบัติธรรม|สถานปฏิบัติธรรม/iu.test(s)) features.push('RELIGIOUS_CENTER');
      return [...new Set(features)];
    };

    // 🎯 แปลงและสกัดค่าตัวแปรออกมารองรับระบบฟิโบนักชีหลังบ้าน
    let hasLandmarkCategory = landmarkType(pureCleanAddress);
    let hasAddressFeatures = addressFeatures(pureCleanAddress);

    // =================================================================
    // (จุดนี้โค้ดของจารย์จะรันคำนวณราคาสินค้า หรือเงื่อนไข qtyMatch ต่อได้เลยครับ)
    // =================================================================


    pureCleanAddress = pureCleanAddress
      .replace(/^(พระ|หลวงพ่อ|หลวงตา|หลวงพี่|ครูบา|พระมหา|ท่านเจ้าคุณ|คุณ|นาย|นาง|นางสาว)\s+[ก-๙\.\s]+/i, "")
      .replace(/\s*จ\.กรุงเทพมหานคร/, " จ.กรุงเทพมหานคร")
      .trim();
const addressMatch = String(text || '').match(
  /(?:🏠\s*)?ที่.?อยู่(?:จัดส่ง)?\s*[:：]\s*([^\r\n]+)/iu
);

const addressFromOrderBlock = (addressMatch?.[1] || '')
  .replace(/<[^>]*>/gu, '')
  .replace(/[✅✔️🏠📍]/gu, '')
  .replace(/\s+/gu, ' ')
  .trim();

function isUsableAddress(value) {
  const s = String(value || '').trim();

  if (!s || /หนู|แอดมิน|ทีมงาน|ลองเช็ค|ลองเช็ก|ถ้ายัง|ดูแลต่อ|รอรับสินค้า|ขอบคุณ/iu.test(s)) {
    return false;
  }

  const hasHouseNumber =
    /\d{1,5}\s*\/\s*\d{1,5}|(?:บ้านเลขที่|เลขที่)\s*\d{1,5}|\d{1,5}\s*(?=ม\.?|หมู่|ต\.?|ตำบล|ถนน|ซอย)/iu.test(s);

  const hasLocation =
    /ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต|(?<!\d)[1-9]\d{4}(?!\d)/iu.test(s);

  return hasHouseNumber && hasLocation;
}

const finalAddress = isUsableAddress(addressFromOrderBlock)
  ? addressFromOrderBlock
  : isUsableAddress(pureCleanAddress)
    ? pureCleanAddress
    : '🔴 รอเช็คที่อยู่';

// =================================================================
// FRONT NODE PATCH
// Replace the existing block from `let rawText = ...` through the
// `if (qtyMatch) ...` section. Keep the existing output.push mapping.
// =================================================================

const rawText = String(m.message ?? "");
SNIPER_X_TEXT = rawText.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
const rows = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const divider = s => /^[━╌═⫘─└───────────────┘\s]{3,}$/u.test(s) || /^[◦⊱✿✧･ﾟ*🌸]+$/u.test(s);
// แบบที่ 2 (ของจาร์ย)
const marker = /(?:📦\s*)?(?:ราย\s*การสินค้า|Box\s*ราย\s*การสินค้า)\s*[:：]?/iu;
const markerIndex = rows.findIndex(s => marker.test(s));

    let detectedShippingCarrier = '⚡FLASH EXPRESS'; // Default

// 🎯 ล้าง/มองข้ามคำว่า "รหัสไปรษณีย์" ออกก่อนประมวลผลขนส่ง
const cleanTextForCarrier = rawText.replace(/(?:รหัส|เลข)\s*ไปรษณีย์/giu, '');

if (/(?:เคอรี่|kerry|kex)/iu.test(cleanTextForCarrier)) {
  detectedShippingCarrier = '🔶KERRY EXPRESS';

} else if (/(?:ป\s*ณ\.?|ส่ง\s*ปณ|ปณไทย|(?:ขนส่ง|ส่ง)\s*ไปรษณีย์|\bไปรษณีย์ไทย\b)/iu.test(cleanTextForCarrier)) {
  // 🎯 ดักเฉพาะ: ปณ / ปณ. / ป ณ / ส่ง ปณ / ส่ง ไปรษณีย์ / ไปรษณีย์ไทย
  // (จะไม่ติดคำว่า "รหัสไปรษณีย์" อีกต่อไป!)
  detectedShippingCarrier = '📮ไปรษณีย์ไทย';

} else if (/(?:j\s*&\s*t|เจแอนด์ที|jnt)/iu.test(cleanTextForCarrier)) {
  detectedShippingCarrier = '🚚 J&T EXPRESS';

} else if (/(?:flash\s*express|⚡\s*flash|แฟลช)/iu.test(cleanTextForCarrier)) {
  detectedShippingCarrier = '⚡FLASH EXPRESS';
}


    
const isStandardOrder =
  /🚨\s*\[สถานะ\s*:\s*ปิดยอดสำเร็จ!?\s*\]\s*🚨/u.test(text) &&
  /🆔\s*เลขออเดอร์\s*[:：]/u.test(text) &&
  /💰\s*ยอด(?:รวม)?\s*COD/iu.test(text) &&
  /📦\s*รายการสินค้า\s*[:：]/u.test(text);

const isBotRecap =
  !isStandardOrder &&
  /(?:หนูส่งข้อมูลออเดอร์[\s\S]*?ทีมงาน[\s\S]*?เตรียมจัดส่ง|หนูเชื่อมต่อพี่[\s\S]*?ทีม|ส่งต่อให้ทีมจัดส่ง)/iu.test(text);

const orderSourceType = isStandardOrder
  ? "STANDARD_ORDER"
  : isBotRecap
    ? "BOT_RECAP"
    : "OTHER";

let productLines = [];

if (!isBotRecap && markerIndex >= 0) {
  const markerLine = rows[markerIndex];
  const markerMatch = markerLine.match(marker);
  const inlineProduct = markerMatch
    ? markerLine.slice(markerMatch.index + markerMatch[0].length).trim()
    : "";

  if (inlineProduct && !/ORDER_MYSTORY/iu.test(inlineProduct)) {
    productLines.push(inlineProduct);
  }

  for (let i = markerIndex + 1; i < rows.length; i++) {
    const line = rows[i];

    if (
      divider(line) ||
      /^(?:✨\s*)?รวม\s*\d/iu.test(line) ||
      /^(?:🚚\s*ขนส่ง|#|LINE\s*[:：@])/iu.test(line) ||
      /(?:ขอบพระคุณ|ขอบคุณ|รายการออเดอร์|lin\.ee\/)/iu.test(line)
    ) break;

    if (!/ORDER_MYSTORY/iu.test(line)) productLines.push(line);
  }
} else if (!isBotRecap && orderSourceType === "OTHER") {
  const lastLine = [...rows].reverse().find(s =>
    !divider(s) && !/^#/u.test(s) && !/ORDER_MYSTORY/iu.test(s)
  );
  if (lastLine) productLines.push(lastLine);
}

const finalSniperText = productLines.join("\n")
  .replace(/^(?:💗\s*เจ๊บี\s*B{1,2}|🏀\s*สิงโตสโตร์|🎯\s*St[_\s-]*Singto|🛕\s*ST\s*singto)\s*(?:\r?\n|$)/iu, "")
  .trim();

const itemLines = finalSniperText.split(/\r?\n/)
  .map(s => s.trim())
  .filter(s => s && !/ORDER_MYSTORY/iu.test(s) && !divider(s));

const orderItems = itemLines.map((rawLine, i) => {
  const unitMatch = rawLine.match(/(\d+(?:\.\d+)?)\s*(คอต\.?|หีบ|กล่อง|ชิ้น|แพ็ค|แพ็ก)/iu);
  const qtyMatch = unitMatch ||
    rawLine.match(/(?:x|×)\s*(\d+(?:\.\d+)?)/iu) ||
    rawLine.match(/(?:^|\s)(\d{1,3})\s*$/u);

  const quantity = qtyMatch ? Number(qtyMatch[1]) : null;
  const unit = unitMatch ? unitMatch[2].replace(/\.$/u, "") : "คอต";

const upper = rawLine.toUpperCase();

const productKey = s =>
  String(s ?? "").toUpperCase().replace(/[\s_-]+/gu, "");

const lineKey = productKey(rawLine);

const prod = PRODUCT_MASTER_ARR.find(p =>
  [p.sku, p.thName, p.name, ...(p.aliases || [])]
    .filter(Boolean)
    .some(term => {
      const termKey = productKey(term);
      return termKey && lineKey.includes(termKey);
    })
);
// 1. ดึงบรรทัดดิบๆ มาก่อนตามปกติ
const rawItemLines = finalSniperText.split(/\r?\n/)
  .map(s => s.trim())
  .filter(s => 
    s && 
    !/ORDER_MYSTORY/iu.test(s) && 
    !divider(s) && 
    !/(?:🚚\s*ขนส่ง|📦\s*รายการสินค้า)/iu.test(s)
  );

// 2. จัดการรวมบรรทัดที่ถูกตัดขึ้นบรรทัดใหม่ (เช่น ชื่อสินค้าอยู่บรรทัดนึง จำนวนอยู่บรรทัดล่าง หรือชื่อสินค้าขาดจำนวน)
const itemLines = [];
for (let i = 0; i < rawItemLines.length; i++) {
  const currentLine = rawItemLines[i];
  
  // เช็คว่าบรรทัดนี้มีตัวเลขจำนวนหรือยัง (เช่น มีคำว่า คอต, กล่อง, ชิ้น, x1, หรือตัวเลขโดๆ)
  const hasQty = /(\d+(?:\.\d+)?)\s*(คอต\.?|หีบ|กล่อง|ชิ้น|แพ็ค|แพ็ก)|(?:x|×)\s*(\d+(?:\.\d+)?)|(?:^|\s)(\d{1,3})\s*$/iu.test(currentLine);

  // ถ้าบรรทัดนี้ไม่มีจำนวน และมีบรรทัดถัดไป (และบรรทัดถัดไปดันมีจำนวน หรือเป็นตัวเลข)
  // ให้เอามายุบรวมกับบรรทัดก่อนหน้าซะ
  if (!hasQty && i + 1 < rawItemLines.length) {
    const nextLine = rawItemLines[i + 1];
    const nextHasQty = /(\d+(?:\.\d+)?)\s*(คอต\.?|หีบ|กล่อง|ชิ้น|แพ็ค|แพ็ก)|(?:x|×)\s*(\d+(?:\.\d+)?)|(?:^|\s)(\d{1,3})\s*$/iu.test(nextLine);
    
    if (nextHasQty) {
      // รวมร่างมันซะ! เช่น "🟢 VORTEX_GREEN" + " | จำนวน 1 คอต"
      itemLines.push(`${currentLine} ${nextLine}`);
      i++; // ข้ามบรรทัดถัดไปไปเลยเพราะเอามายุบรวมแล้ว
      continue;
    }
  }
  
  itemLines.push(currentLine);
}

  const price = prod?.price == null ? null : Number(prod.price);

  return {
    line_id: i + 1,
    sku: prod?.sku ?? null,
    product_id: prod?.id ?? null,
    th_name: prod?.thName ?? null,
    product_name: prod?.thName ?? null,
    variant_name: prod?.variant ?? [],
    quantity,
    quantity_unit: unit === "คอต" ? "คอต." : unit,

    unit_label: "",
    unit_price: prod?.price ?? null,
    discount: 0,
    line_total: quantity !== null && price !== null && Number.isFinite(price) ? quantity * price : null,
    currency: "THB",
    emoji: prod?.emoji ?? "",
    final_product: prod
      ? `${prod.emoji ? prod.emoji + " " : ""}${prod.sku} (${prod.thName})${quantity === null ? "" : ` x ${quantity} ${unit}`}`
      : rawLine,
    raw_line: rawLine,
    line_no: i + 1,
    pick_status: prod ? "PENDING" : "REVIEW_NOT_MATCHED",
    extractedQtyNum: quantity
  };
});


// ============================================================
// FINAL BILL SIGNAL — DARKSIDE เป็นโหนดต้นทางจบงาน
// ใช้ packer_obj เป็นหลัก; จำนวนเป็นข้อมูลประกอบ ไม่ใช่ตัวบล็อก
// ============================================================
function darksideText(value) {
  return String(value ?? '').trim();
}
function darksideMissing(value) {
  return !darksideText(value) || /^(?:DATA_MISSING|null|undefined|ไม่มีข้อมูล|ไม่พบข้อมูล|ไม่ระบุ|รอเช็คที่อยู่)$/iu.test(darksideText(value));
}
function darksideRealProduct(value) {
  const product = darksideText(value);
  if (darksideMissing(product)) return false;
  if (/(?:ยอดรวม\s*COD|ยอด\s*COD|COD\s*[:：]?)/iu.test(product)) return false;

  const hasExplicitQuantity =
    /(?:x|×)\s*\d+/iu.test(product) ||
    /จำนวน\s*\d+/iu.test(product) ||
    /\d+\s*(?:คอต|คอต.|ชิ้น|กล่อง|ซอง|แพ็ค|แพ็ก)/iu.test(product);

  // รองรับบรรทัดสินค้าแบบแอดมิน เช่น "ดีเจ 1" หรือ "ชีวอสแดง 2"
  // จำนวนนี้ถูก parser แยกแล้ว; SKU จะยังไม่แมปก็ไม่เป็นเหตุให้บล็อกบิล
  const hasTrailingQuantity = product
    .split(/\r?\n/u)
    .some(line => /(?:^|\s)\d{1,3}(?:\.\d+)?\s*$/u.test(line.trim()));

  return /[\p{L}]/u.test(product) && (hasExplicitQuantity || hasTrailingQuantity);
}

function darksideRealAddress(value) {
  const address = darksideText(value);
  if (darksideMissing(address)) return false;
  return /(?:หมู่|หมู่บ้าน|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|ถนน|ซอย)/iu.test(address) || /(?<!\d)\d{5}(?!\d)/u.test(address);
}
const packerDisplaySummary = orderItems
  .map(i => i.final_product || i.raw_line)
  .filter(Boolean)
  .join("\n");

const finalPackerDisplaySummary = packerDisplaySummary || finalSniperText;
const qtyItems = orderItems.filter(i => i.quantity !== null && Number.isFinite(i.quantity));
const extractedQtyNum = qtyItems.length
  ? qtyItems.reduce((sum, i) => sum + i.quantity, 0)
  : null;
const unitDisplay = qtyItems.length
  ? String(qtyItems[0].quantity_unit || "คอต.").replace(/\.$/u, "")
  : "คอต";
const extractedQtyDisplay = qtyItems.length
  ? `${extractedQtyNum.toLocaleString("th-TH")} ${unitDisplay}`
  : "ไม่พบจำนวน";

    

const darksidePackerStatus = orderSourceType === "BOT_RECAP" ? "BOT_RECAP_BACKUP" : "READY_TO_PACK";
const darksidePackerProduct = finalPackerDisplaySummary || packerDisplaySummary || finalSniperText;
const darksidePackerAddress = pureCleanAddress;
const darksideMissingReasons = [];
if (darksidePackerStatus !== "READY_TO_PACK") darksideMissingReasons.push(`STATUS_${darksidePackerStatus || "MISSING"}`);
if (!darksideRealProduct(darksidePackerProduct)) darksideMissingReasons.push("PRODUCT_MISSING_OR_INVALID");
if (!darksideRealAddress(darksidePackerAddress)) darksideMissingReasons.push("ADDRESS_MISSING_OR_INVALID");
const darksideBillDataComplete = darksideMissingReasons.length === 0;
const darksideBillDataReason = darksideBillDataComplete ? "PACKER_OBJ_COMPLETE" : darksideMissingReasons.join("|");
const bbExpressSendRoute = darksideBillDataComplete ? '⚪' : '⚫';

const finalAuthorClass = String(
  m.sniperauthorclass ||
  m.sniperAuthorClass ||
  sniperAuthorClass ||
  ''
).trim();

const finalBalloonNotice = String(
  m.balloonnotice ||
  m.balloonNotice ||
  balloonNotice ||
  ''
).trim();

const isHumanAdminFinal =
  finalAuthorClass === '👤HUMAN_ADMIN' ||
  finalAuthorClass === '🍁DARK_HUMAN_AHK' ||
  /ผู้เขียน\s*:\s*✅?\s*แอดมินคน/iu.test(finalBalloonNotice) ||
  /ผู้เขียน\s*:\s*🍁แอดมินผม/iu.test(finalBalloonNotice);

if (isHumanAdminFinal) {
  m.bb_express_send_route = '⚪';
  m.route_reason_color = 'WHITE_READY';
  m.route_reason_label = '⚪ [HUMAN_ADMIN_CONFIRMED]';
}

// คำนวณสถานะ 24 ชั่วโมงจากเวลาข้อความล่าสุด
    // 3. 🎯 แปะป้ายเส้นทาง (Routing Tag) ตั้งแต่โหนดหน้าตรงนี้เลย!
       // 🔍 กวาดหาข้อความสุดท้ายและเวลาล่าสุดของฝั่งลูกค้า (Customer) ตัวจริง
        let lastCustomerMsg = "DATA_MISSING";
        let lastCustomerTime = "";
        for (let k = rawMsgs.length - 1; k >= 0; k--) {
            const msgCheck = rawMsgs[k];
            const isPage = msgCheck.is_echo === true || MASTERCONFIG.some(c => String(c.page_id) === String(msgCheck.from?.id || msgCheck.page_id_inherited || ''));
            if (!isPage && msgCheck.message) {
                lastCustomerMsg = msgCheck.message;
                lastCustomerTime = formatThaiDateTime(normalizeFacebookTime(msgCheck.created_time) || msgCheck.created_time) || "";
                break;
            }
        }

        // 🔍 กวาดหาข้อความสุดท้ายและเวลาล่าสุดของฝั่งเพจ/บอท (Page/Bot) ตัวจริง
        let lastPageMsg = "DATA_MISSING";
        let lastPageTime = "";
        for (let k = rawMsgs.length - 1; k >= 0; k--) {
            const msgCheck = rawMsgs[k];
            const isPage = msgCheck.is_echo === true || MASTERCONFIG.some(c => String(c.page_id) === String(msgCheck.from?.id || msgCheck.page_id_inherited || ''));
            if (isPage && msgCheck.message) {
                lastPageMsg = msgCheck.message;
                lastPageTime = formatThaiDateTime(normalizeFacebookTime(msgCheck.created_time) || msgCheck.created_time) || "";
                break;
            }
        }

      const messageTime = m.created_time || new Date().toISOString();
      const chatStatus = getChatStatus(messageTime);
// Completeness only: true=⚪, false=⚫; no latest/history selection.
// ============================================================
// FINAL HUMAN ADMIN WHITE OVERRIDE
// แอดมินคนสรุปแล้ว = ขาวทันที
// บอทไม่ถูกแตะต้อง
// ============================================================
const normalizedPageId = String(masterConfigNode.page_id || "").trim();
const normalizedThreadId = String(threadId || "").trim();

const chatLinkKey =
  normalizedPageId && normalizedThreadId
    ? `${normalizedPageId}_${normalizedThreadId}`
    : "";
    
output.push({
  json: {
    
 chat_link_key: chatLinkKey,
    bb_express_send_route: bbExpressSendRoute,
 currentthreadtotalbills: currentthreadtotalbills,
          duplicate_count_th: duplicate_count_th,
          balloonnotice: balloonNotice,
          sniperauthorclass: sniperAuthorClass,
    // ... คอลัมน์ดั้งเดิม 89 ตัวในลูปของพี่ดึงมาใส่ให้ครบถ้วนไม่มีบิ่นหาย ...
    upsert_key: `${masterConfigNode.page_index || "BB_00"}_${dynamicOrderNumber}_${validatedPhone}_${hasshipping_zipcode}`,
    facebook_name: (fbCustomerName || '').trim(),
    threadId: threadId || "",
    time_th: `⏰${realOrderTimeStr}`,
    customer_id: customer_id,
    tracking_request_same_thai_date: trackingRequestSameThaiDate,
    tracking_request_route_hint: trackingRequestSameThaiDate ? "CUSTOMER_REQUEST_TRACKING_SAME_DAY" : "",
    order_date: `📅 ${day}/${month}/${year}`,
    order_time: realOrderTimeUtc,
    order_time_display: orderTimeDisplay,
    day_of_week: day_of_week,
    order_time_source: 'FACEBOOK_MESSAGE_CREATED_TIME',
    page_id: masterConfigNode.page_id,
    page_name: masterConfigNode.page_name,
    order_number: dynamicOrderNumber,
    cod_amount: hascodAmount, // 💰 ยอดเงินสัจจะโหนดแรกสุด
    customer_name: customer_name,
     phone: validatedPhone || "DATA_MISSING",
    extracted_phone: validatedPhone || "DATA_MISSING",
    phone_type: phoneType|| "DATA_MISSING",
    phone_status: phoneStatus|| "DATA_MISSING",
    phone_candidates: phoneCandidates|| "DATA_MISSING",
    rejected_phone_candidates: rejectedPhoneCandidates|| "DATA_MISSING",
    address_display_packer: pureCleanAddress|| "DATA_MISSING",
    addressclean: pureCleanAddress|| "DATA_MISSING",
    finalAddress : finalAddress ,
    short_address: shortAddressClean|| "DATA_MISSING",
    district: hassubDistrict || "DATA_MISSING",
    amphoe: hasdistrict || "DATA_MISSING",
     province: hasgetProvince || "DATA_MISSING",
    zipcode: hasshipping_zipcode || "DATA_MISSING",
 
    order_source_type: orderSourceType,
    audit_flags: "PASS",
    chat_timeline: ev,
    cod_check_status: "PASS",
    message_id:m.id,
    
    shipping_carrier: detectedShippingCarrier,
    portal_key : masterConfigNode.page_index,
    assigned_agent: masterConfigNode.assigned_agent,
    assigned_hashtag: masterConfigNode.assigned_hashtag,
    original: rawText,
      orderItems: orderItems,
    
       // 🎯 ฟิกตัวแปรสะท้อนข้อความและเวลาล่าสุดของแต่ละฝั่งจากที่โหนดปาดมาให้ครบถ้วน
    // 🎯 ส่งค่าตัวแปรสุดท้ายที่แท้จริงของแต่ละฝั่งเข้า JSON ขาออก
        customer_latest_message: lastCustomerMsg,
        customer_message_time_th: lastCustomerTime,
        page_latest_message: lastPageMsg,
        page_message_time_th: lastPageTime,
chat_age_hours: chatStatus.hoursAgo,
          is_within_24h: chatStatus.isWithin24h,
          can_send_standard: chatStatus.canSend,
  messaging_tag_required: chatStatus.isWithin24h ? null : "POST_PURCHASE_UPDATE",

    for_packer_st_display : packerDisplaySummary,
    
    sku: finalSniperText,       
    google_for_packer: finalSniperText,
    manus_for_packer: finalPackerDisplaySummary,
    final_order_qty: extractedQtyNum,
    extracted_text_qty: extractedQtyNum,
    qty_display_th: `🔢 จำนวน ${extractedQtyDisplay}`,
    darksideBillDataComplete: darksideBillDataComplete,
    bill_data_complete: darksideBillDataComplete,
    darkside_completeness_status: darksideBillDataComplete ? "COMPLETE" : "INCOMPLETE",
    darkside_missing_reasons: [...darksideMissingReasons],
    bill_data_reason: darksideBillDataReason,
    bill_signal_source: "PACKER_OBJ_COMPLETENESS_ONLY",
    bill_quantity_is_blocker: false,
    route_reason_emoji: darksideBillDataComplete ? '⚪' : '⚫',
    route_reason_color: darksideBillDataComplete ? 'WHITE' : 'BLACK_VOID',
    route_reason_label: darksideBillDataComplete
      ? '⚪ [COMPLETENESS] สินค้าและที่อยู่ผ่านเกณฑ์'
      : `⚫ [COMPLETENESS] ${darksideBillDataReason}`,
    packer_obj: {
  cod_value: hascodAmount,
  status: darksidePackerStatus,
  packer_tag_display: packerDisplaySummary,
  for_packer_st_display: packerDisplaySummary,
  order_number: dynamicOrderNumber,
  order_time_display: orderTimeDisplay,
  page_name: masterConfigNode.page_name,
  facebook_name  :(fbCustomerName || '').trim(),
  customer: customer_name,
  phone_number: validatedPhone,
  address: pureCleanAddress,
  zipcode: hasshipping_zipcode,
  // แก้ไขป้องกันอาเรย์ว่างระเบิดกลางคัน
  packer_emoji: (typeof orderItems !== 'undefined' && orderItems && orderItems.length > 0) ? orderItems[0].emoji : '📦',
  // แก้ไขตัวสะกดคำว่า packer ให้ตรงตามมาตรฐานของห้องอื่น
    sku: finalSniperText,       
    google_for_packer: finalSniperText,
    manus_for_packer: finalPackerDisplaySummary,
    final_order_qty: extractedQtyNum,
    extracted_text_qty: extractedQtyNum,
    qty_display_th: `🔢 จำนวน ${extractedQtyDisplay}`,
    darksideBillDataComplete: darksideBillDataComplete,
    bill_data_complete: darksideBillDataComplete,
    darkside_completeness_status: darksideBillDataComplete ? "COMPLETE" : "INCOMPLETE",
    darkside_missing_reasons: [...darksideMissingReasons],
    bill_data_reason: darksideBillDataReason,
    bill_signal_source: "PACKER_OBJ_COMPLETENESS_ONLY",
   message_id:m.id,
    bill_quantity_is_blocker: false,
      
        }
      } 
    });

  }
}

// ============================================================

// Darkside returns every source row with completeness metadata and diagnostic count only.
// No latest selection, HISTORY_ONLY filtering, color routing, or send decision here.
return output;
