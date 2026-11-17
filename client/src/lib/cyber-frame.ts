export type CyberFrameId = `f${string}`;

export const CYBER_FRAME_OPTIONS = [
  { id: "f01", name: 'Cyan Precision', description: 'เส้นไซแอนบาง + แสงอ่อน อ่านง่าย เหมาะกับข้อมูลทั่วไป', number: 1 },
  { id: "f02", name: 'Magenta Aura', description: 'ขอบชมพูเรืองแสง ใช้เน้นข้อมูลสำคัญ', number: 2 },
  { id: "f03", name: 'Dual Spectrum', description: 'ฟ้า–ม่วง–ชมพู แนะนำเป็นกรอบหลักของช่องขวา', number: 3 },
  { id: "f04", name: 'Signal Rail', description: 'ไฟสถานะด้านซ้าย แยกประเภทข้อมูลอย่างเรียบง่าย', number: 4 },
  { id: "f05", name: 'Bottom Neon', description: 'แถบไฟด้านล่าง สำหรับยอดสรุปหรือ COD', number: 5 },
  { id: "f06", name: 'Frosted Glass', description: 'กระจกโปร่งแสง เส้นขอบนุ่ม ดูมีมิติ', number: 6 },
  { id: "f07", name: 'Double Scanner', description: 'เส้นกรอบสองชั้น สำหรับ Tracking ID', number: 7 },
  { id: "f08", name: 'Corner Brackets', description: 'วงเล็บสองมุม เหมือนแผงควบคุมในเกม', number: 8 },
  { id: "f09", name: 'Cut-Corner HUD', description: 'มุมตัดสี่ด้าน ขอบตามรูปทรงจริง', number: 9 },
  { id: "f10", name: 'Lime Confirmed', description: 'เขียวมะนาวสำหรับสถานะสำเร็จ', number: 10 },
  { id: "f11", name: 'Dashed Transmission', description: 'เส้นประไซแอน เหมาะกับรายการรอข้อมูล', number: 11 },
  { id: "f12", name: 'Inset Circuit', description: 'กรอบซ้อนภายใน เหมือนแผงวงจร', number: 12 },
  { id: "f13", name: 'Split Header Rail', description: 'ไฟบนสองสี ฟ้าหลัก ชมพูเสริม', number: 13 },
  { id: "f14", name: 'Scanline Frame', description: 'พื้นเส้นสแกนละเอียด พร้อมขอบไฟด้านข้าง', number: 14 },
  { id: "f15", name: 'Offset Glitch', description: 'กรอบเหลื่อมสองสีแบบกราฟิกไซเบอร์', number: 15 },
  { id: "f16", name: 'Docking Tabs', description: 'แท็บบน–ล่าง เหมือนโมดูลเชื่อมต่อระบบ', number: 16 },
  { id: "f17", name: 'Live Pulse', description: 'แสงขอบหายใจเบา ๆ สำหรับสถานะ Live', number: 17 },
  { id: "f18", name: 'Orbit Border', description: 'แสงหมุนรอบขอบ ไม่หมุนข้อความ', number: 18 },
  { id: "f19", name: 'Edge Runner', description: 'ไฟวิ่งขอบด้านบน เหมาะกับสถานะ Sync', number: 19 },
  { id: "f20", name: 'Reactive Frame', description: 'ขอบเรียบ เปลี่ยนเป็นชมพูเมื่อชี้เมาส์', number: 20 },
  { id: "f21", name: 'Twin Reactor', description: 'วงแหวนพลังงานสองสีหมุนรอบกรอบ พร้อมแสงสองฝั่ง', number: 21 },
  { id: "f22", name: 'Exoskeleton HUD', description: 'กรอบโครงนอกหลายชั้น เหมือนเกราะห้องควบคุม', number: 22 },
  { id: "f23", name: 'Hazard Protocol', description: 'ขอบลายเฉียงแบบเขตพลังงาน อารมณ์ไซเบอร์อุตสาหกรรม', number: 23 },
  { id: "f24", name: 'Prismatic Shield', description: 'เกราะแก้วสะท้อนแสง แถบประกายเลื่อนไปบนกรอบ', number: 24 },
  { id: "f25", name: 'Quantum Glitch', description: 'ขอบเหลื่อม + เส้นสัญญาณกระโดดเป็นจังหวะ', number: 25 },
  { id: "f26", name: 'Radar Chamber', description: 'รังสีเรดาร์หมุนในพื้น และวงเซนเซอร์มุมบน', number: 26 },
  { id: "f27", name: 'Cryogenic Vault', description: 'กรอบฟ้าเย็นหลายชั้น เหมือนตู้นิรภัยข้อมูล', number: 27 },
  { id: "f28", name: 'Plasma Core', description: 'ขอบชมพูพลาสมา เส้นพลังงานบนและล่าง', number: 28 },
  { id: "f29", name: 'Biohazard Matrix', description: 'กรอบเขียวนีออน พร้อมเขี้ยวข้างและรหัสลายเฉียง', number: 29 },
  { id: "f30", name: 'Astral Gateway', description: 'กรอบม่วงจักรวาล แท็บพลังงานหัว–ท้าย', number: 30 },
  { id: "f31", name: 'Liquid Spectrum', description: 'กรอบโค้งไหลสีฟ้า–ชมพู แสงเหลื่อมสองมุม', number: 31 },
  { id: "f32", name: 'Mecha Armor', description: 'เกราะตัดมุมสองด้าน พร้อมแถบสัญญาณสองสี', number: 32 },
  { id: "f33", name: 'Twin Energy Rails', description: 'รางพลังงานด้านซ้าย–ขวาเต้นสลับจังหวะ', number: 33 },
  { id: "f34", name: 'Golden Overdrive', description: 'เพิ่มสีทองอำพันเป็นรุ่นพิเศษ กรอบหรูแบบไซเบอร์', number: 34 },
  { id: "f35", name: 'Digital DNA', description: 'ขอบพิกเซลพลังงานหมุนช้า เหมือนรหัสพันธุกรรมดิจิทัล', number: 35 },
  { id: "f36", name: 'Circuit Nexus', description: 'จุดเชื่อมวงจรสี่มุม พร้อมเส้นขอบซ้อนด้านใน', number: 36 },
  { id: "f37", name: 'Sonic Echo', description: 'วงคลื่นขยายรอบกรอบ เหมือนสนามสัญญาณ', number: 37 },
  { id: "f38", name: 'Hologram Console', description: 'กรอบโฮโลแกรมสองชั้น พร้อมแถบแสงด้านข้าง', number: 38 },
  { id: "f39", name: 'Solar Flare', description: 'กรอบพลาสมาสีชมพู–ส้ม–ทอง สำหรับแจ้งเตือนพิเศษ', number: 39 },
  { id: "f40", name: 'Cyber Sovereign', description: 'รุ่นจัดเต็ม: สเปกตรัมหมุน กรอบสามชั้น และ Glow สองฝั่ง', number: 40 },
] as const;

export type CyberFrameOption = (typeof CYBER_FRAME_OPTIONS)[number];
export const CYBER_FRAME_SELECTION_KEY = "nightops-cyber-frame-selection-v1";
export const CYBER_FRAME_EVENT = "nightops-cyber-frame-change";
export const CYBER_FRAME_ROOM_SELECTION_KEY = "nightops-cyber-frame-room-selection-v1";

export function readCyberFrame(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CYBER_FRAME_SELECTION_KEY) || "";
}

export function saveCyberFrame(id: string) {
  localStorage.setItem(CYBER_FRAME_SELECTION_KEY, id);
  window.dispatchEvent(new CustomEvent(CYBER_FRAME_EVENT, { detail: { id } }));
}

export function readCyberFrameRooms(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(localStorage.getItem(CYBER_FRAME_ROOM_SELECTION_KEY) || "{}");
    return value && typeof value === "object" ? value as Record<string, string> : {};
  } catch { return {}; }
}

export function saveCyberFrameRoom(roomKey: string, id: string) {
  const next = { ...readCyberFrameRooms(), [roomKey]: id };
  localStorage.setItem(CYBER_FRAME_ROOM_SELECTION_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CYBER_FRAME_EVENT, { detail: { roomKey, id } }));
}
