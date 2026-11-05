// ============================================================
// SINGTO V4.3.2 - ENHANCED PRODUCT EXTRACTION ENGINE
// ============================================================
const inputItems = $input.all();

const PRODUCT_MASTER_ARR = [
  { id: 1, sku: 'VESS_MINT_COOL', name: 'เวสมินต์คูล', thName: 'เวสมินต์คูล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นคูล','เวสมิ้นคูล1','เวสมิ้นคูล 1','เวสมิ้นคูล2','เวสมิ้นคูล 2','เวสมิ้นคูล3','เวสมิ้นคูล 3','เวสมิ้นคูล4','เวสมิ้นคูล 4','เวสมิ้นคูล5','เวสมิ้นคูล 5'] },
  { id: 2, sku: 'VESS_MINT_MENTHOL', name: 'เวสมินต์เมนทอล', thName: 'เวสมินต์เมนทอล', price: 350, emoji: '🟩', brand: ['vess'], variant: ['mint'], aliases: ['เวสมิ้นเมนทอล','เวสมิ้นเมนทอล1','เวสมิ้นเมนทอล 1','เวสมิ้นเมนทอล2','เวสมิ้นเมนทอล 2','เวสมิ้นเมนทอล3','เวสมิ้นเมนทอล 3','เวสมิ้นเมนทอล4','เวสมิ้นเมนทอล 4','เวสมิ้นเมนทอล5','เวสมิ้นเมนทอล 5'] },
  { id: 3, sku: 'GOLD_MOUNT_GREEN_WHITE', name: 'โกลด์เมาท์เขียวขาว', thName: 'โกลด์เมาท์เขียวขาว', price: 300, emoji: '🟩', brand: ['gold mount'], variant:['mount'], aliases:['โกเขียวขาว','โกเขียวขาว1','โกเขียวขาว 1','โกเขียวขาว2','โกเขียวขาว 2','โกเขียวขาว3','โกเขียวขาว 3','โกเขียวขาว4','โกเขียวขาว 4','โกเขียวขาว5','โกเขียวขาว 5'] },
  { id: 4, sku: 'MILANO_MENTHOL', name: 'มิลาโน่เมนทอล', thName: 'มิลาโน่เมนทอล', price: 250, emoji: '🟩', brand: ['milano'], variant: ['menthol'], aliases: ['มิลาโน่เมนทอล','มิลาโน่เมนทอล1','มิลาโน่เมนทอล 1','มิลาโน่เมนทอล2','มิลาโน่เมนทอล 2','มิลาโน่เมนทอล3','มิลาโน่เมนทอล 3','มิลาโน่เมนทอล4','มิลาโน่เมนทอล 4','🟢MILANO_GREEN','มิลาโน่เมนทอล 5'] },
  { id: 5, sku: 'MOND_GREEN', name: 'ม่อนเขียว', thName: 'ม่อนเขียว', price: 240, emoji: '🟩', brand: ['mond'], variant: ['green'], aliases: ['🟢 MOND_GREEN 1 คอต','MOND_GREEN ม่อนเขียว','ม่อนเขียว1','ม่อนเขียว 1','ม่อนเขียว2','ม่อนเขียว 2','ม่อนเขียว3','🟢MOND_GREEN ','มอนด์ Signature Green','ม่อนเขียว 4','ม่อนเขียว5','มอนด์'] },
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
  { id: 18, sku: 'OS_MANGO', name: 'โอเอสมะม่วง', thName: 'โอเอสมะม่วง', price: 350, emoji: '🥭', brand:['os'], variant:['mango'], aliases:['OS มะม่วง','OS มะม่วง1','OS มะม่วง 1','OS มะม่วง2','OS มะม่วง 2','OS มะม่วง3','OS มะม่วง 3','OS มะม่วง4','OS มะม่วง 4','OS มะม่วง5','🍇 บุหรี่ OS Premium GIRASSISC กลิ่นมะม่วง'] },
  { id: 19, sku: 'VESS_CRUSH_MINT.X.MANGO', name: 'เวสครัชมินต์มะม่วง', thName: 'เวสครัชมินต์มะม่วง', price: 350, emoji: '🥭', brand:['vess'], variant:['crush'], aliases:['เวสมะม่วง','เวสมะม่วง1','เวสมะม่วง 1','เวสมะม่วง2','เวสมะม่วง 2','เวสมะม่วง3','เวสมะม่วง 3','เวสมะม่วง4','เวสมะม่วง 4','เวสมะม่วง5','เวสมะม่วง 5'] },
  { id: 20, sku: 'OS_STRAWBERRY', name: 'โอเอสสตรอว์เบอร์รี่', thName: 'โอเอสสตรอว์เบอร์รี่', price: 350, emoji: '🍓', brand:['os'], variant:['strawberry'], aliases:['OS สตอเบอร์รี่','OS สตอเบอร์รี่1','OS สตอเบอร์รี่ 1','OS สตอเบอร์รี่2','OS สตอเบอร์รี่ 2','OS สตอเบอร์รี่3','OS สตอเบอร์รี่ 3','OS สตอเบอร์รี่4','OS สตอเบอร์รี่ 4','OS สตอเบอร์รี่5','Os สตอ'] },
  { id: 21, sku: 'MILANO_JAPAN', name: 'มิลาโน่เจแปน', thName: 'มิลาโน่เจแปน', price: 250, emoji: '🍎', brand:['milano'], variant:['japan'], aliases:['มิลาโน่ญี่ปุ่น','มิลาโน่ญี่ปุ่น1','มิลาโน่ญี่ปุ่น 1','มิลาโน่ญี่ปุ่น2','มิลาโน่ญี่ปุ่น 2','มิลาโน่ญี่ปุ่น3','มิลาโน่ญี่ปุ่น 3','มิลาโน่ญี่ปุ่น4','มิลาโน่ญี่ปุ่น 4','มิลาโน่ญี่ปุ่น5','มิลาโน่ญี่ปุ่น 5'] },
  { id: 22, sku: 'OS_PINEAPPLE', name: 'โอเอสสับปะรด', thName: 'โอเอสสับปะรด', price: 350, emoji: '🍍', brand:['os'], variant:['pineapple'], aliases:['OS สับปะรด','OS สับปะรด1','OS สับปะรด 1','OS สับปะรด2','OS สับปะรด 2','OS สับปะรด3','OS สับปะรด 3','OS สับปะรด4','OS สับปะรด 4','OS สับปะรด5','OS สับปะรด 5'] },
  { id: 23, sku: 'VESS_CRUSH_MINT.X.APPLE', name: 'เวสครัชมินต์แอปเปิ้ล', thName: 'เวสครัชมินต์แอปเปิ้ล', price: 350, emoji: '🍎', brand:['vess'], variant:['crush'], aliases:['เวสแอปเปิ้ล','เวสแอปเปิ้ล1','เวสแอปเปิ้ล 1','เวสแอปเปิ้ล2','เวสแอปเปิ้ล 2','เวสแอปเปิ้ล3','เวสแอปเปิ้ล 3','เวสแอปเปิ้ล4','เวสแอปเปิ้ล 4','เวสแอปเปิ้ล5','เวสแอปเปิ้ล 5'] },
  { id: 24, sku: 'OS_WATERMELON', name: 'โอเอสแตงโม', thName: 'โอเอสแตงโม', price: 350, emoji: '🍉', brand:['os'], variant:['watermelon'], aliases:['OS แตงโม','OS แตงโม1','OS แตงโม 1','OS แตงโม2','OS แตงโม 2','OS แตงโม3','OS แตงโม 3','OS แตงโม4','OS แตงโม 4','OS แตงโม5','OS แตงโม 5'] },
  { id: 25, sku: 'VESS_CRUSH_MINT.X.GRAPE', name: 'เวสครัชมินต์องุ่น', thName: 'เวสครัชมินต์องุ่น', price: 350, emoji: '🍇', brand:['vess'], variant:['crush'], aliases:['เวสองุ่นใหญ่','เวสองุ่นใหญ่1','เวสองุ่นใหญ่ 1','เวสองุ่นใหญ่2','เวสองุ่นใหญ่ 2','เวสองุ่นใหญ่3','เวสองุ่นใหญ่ 3','เวสองุ่นใหญ่4','เวสองุ่นใหญ่ 4','เวสองุ่นใหญ่5','เวสองุ่นใหญ่ 5'] },
  { id: 26, sku: 'VESS_GRAPE_SLIMS', name: 'เวสองุ่นสลิม', thName: 'เวสองุ่นสลิม', price: 350, emoji: '🍇', brand:['vess'], variant:['grape'], aliases:['เวสองุ่นสลิม','เวสองุ่นสลิม1','เวสองุ่นสลิม 1','เวสองุ่นสลิม2','เวสองุ่นสลิม 2','เวสองุ่นสลิม3','เวสองุ่นสลิม 3','เวสองุ่นสลิม4','เวสองุ่นสลิม 4','เวสองุ่นสลิม5','เวสองุ่นสลิม 5'] },
  { id: 27, sku: 'MOND_RAINBOW', name: 'ม่อนเรนโบว์', thName: 'ม่อนเรนโบว์', price: 450, emoji: '🌈', brand:['mond'], variant:['rainbow'], aliases:['ม่อนรุ้ง','ม่อนรุ้ง1','ม่อนรุ้ง 1','ม่อนรุ้ง2','ม่อนรุ้ง 2','ม่อนรุ้ง3','ม่อนรุ้ง 3','ม่อนรุ้ง4','ม่อนรุ้ง 4','ม่อนรุ้ง5','ม่อนรุ้ง 5'] },
  { id: 28, sku: 'SEVIOS_RED', name: 'ซีวอสแดง', thName: 'ซีวอสแดง', price: 220, emoji: '🟥', brand:['sevios'], variant:['red'], aliases:['SEVIOS_RED','ซีวอสแดง','ซีวอสแดง1','ซีวอสแดง 1','ชีวอสแดง1','ซีวอสแดง2','ซีวอสแดง 2','ซีวอสแดง3','ชีวอสแดง','ชีวอสแดง 1','ซีวอสแดง 4','ซีวอสแดง5','ซีวอสแดง 5'] },
  { id: 29, sku: 'SIERRA_RED', name: 'เซียร์ร่า', thName: 'เซียร์ร่า', price: 220, emoji: '🟥', brand:['sierra'], variant:['red'], aliases:['เซียร่า','เซียร่า1','เซียร่า 1','เซียร่า2','เซียร่า 2','เซียร่า3','เซียร่า 3','เซียร่า4','เซียร่า 4','เซียร่า5','เซียร่า 5'] },
  { id: 30, sku: 'MOND_GOLD', name: 'ม่อนทอง', thName: 'ม่อนทอง', price: 230, emoji: '🟨', brand:['mond'], variant:['gold'], aliases:['ม่อนทอง','ม่อนทอง1','ม่อนทอง 1','ม่อนทอง2','ม่อนทอง 2','ม่อนทอง3','ม่อนทอง 3','ม่อนทอง4','ม่อนทอง 4','ม่อนทอง5','ม่อนแดง 1','MOND Signature Gold'] },
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
  { id: 42, sku: 'MILANO_PURPLE', name: 'มิลาโน่ม่วง', thName: 'มิลาโน่ม่วง', price: 350, emoji: '🟪', brand:['milano'], variant:['purple'], aliases:['มิลาโน่ม่วง','มิลาโน่ม่วง1','มิลาโน่ม่วง 1','มิลาโน่ม่วง2','มิลาโน่ม่วง 2','มิลาโน่ม่วง3','มิลาโน่ม่วง 3','มิลาโน่ม่วง4','มิลาโน่ม่วง 4','มิม่วง 1','มิม่วง'] },
  { id: 43, sku: 'CAVALLO_TWIN_X_BALL', name: 'คาวาโร่ม่วง', thName: 'คาวาโร่ม่วง', price: 350, emoji: '🟪', brand:['cavallo'], variant:['twin'], aliases:['คาวาโล่ม่วงเม็ดบีบ','คาวาโล่ม่วงเม็ดบีบ1','🟣 CAVALLO TWIN','🟣 CAVALLO ม่วง','คาวาโล่ม่วง 2','คาม่วง','คาม่วง 3','🍇 CAVALLO ม่วง','คาวาโล่ม่วงเม็ดบีบ 4','คาม่วง2','คาม่วง1 ','CAVALLO_ม่วง2'] },
  { id: 44, sku: 'BAROESAN', name: 'บารูซัน', thName: 'บารูซัน', price: 350, emoji: '🍫', brand:['baroesan'], variant:[''], aliases:['บารูอิซัน','บารูอิซัน1','บารูอิซัน 1','บารูอิซัน2','บารูอิซัน 2','บารูอิซัน3','บารูอิซัน 3','บารูอิซัน4','บารูอิซัน 4','บารูอิซัน5','บารูอิซัน 5'] },
  { id: 45, sku: 'CAVALLO_GREEN', name: 'คาวาโล่เขียว', thName: 'คาวาโล่เขียว', price: 250, emoji: '🟩', brand:['cavallo'], variant:['green'], aliases:['CAVALLO_GREEN','CAVALLO GREEN','คาเขียว','คาเขียว1','คาเขียว 1','คาเขียว2','คาเขียว 2','คาเขียว3','คาเขียว 3','คาเขียว4','คาเขียว 4','คาเขียว5'] },
  { id: 46, sku: 'ROYAL_GREEN', name: 'รอยัลเขียว', thName: 'รอยัลเขียว', price: 230, emoji: '🟩', brand:['royal'], variant:['green'], aliases:['รอยัลเขียว','รอยัลเขียว1','รอยัลเขียว 1','รอยัลเขียว2','รอยัลเขียว 2','รอยัลเขียว3','รอยัลเขียว 3','รอยัลเขียว4','รอยัลเขียว 4','รอยัลเขียว5','รอยัลเขียว 5'] },
  { id: 47, sku: '235_GREEN', name: '235 เขียว', thName: '235 เขียว', price: 300, emoji: '🟩', brand:['235'], variant:['green'], aliases:['235 เขียว','235 เขียว1','235 เขียว 1','235 เขียว2','235 เขียว 2','235 เขียว3','235 เขียว 3','235 เขียว4','235 เขียว 4','235 เขียว5','235 เขียว 5'] },
  { id: 48, sku: 'CANYON_GREEN', name: 'แคนยอนเขียว', thName: 'แคนยอนเขียว', price: 350, emoji: '🟩', brand:['canyon'], variant:['green'], aliases:['แคนยอนเขียว','แคนยอนเขียว1','แคนยอนเขียว 1','แคนยอนเขียว2','แคนยอนเขียว 2','แคนยอนเขียว3','แคนยอนเขียว 3','แคนยอนเขียว4','แคนยอนเขียว 4','แคนยอนเขียว5','แคนยอนเขียว 5'] },
  { id: 49, sku: 'GOLD_MOUNT_FULL_GREEN', name: 'โกลด์เมาท์เขียวล้วน', thName: 'โกลด์เมาท์เขียวล้วน', price: 300, emoji: '🟩', brand:['gold mount'], variant:['mount'], aliases:['โกเม้าเขียวล้วน','โกเม้าเขียวล้วน1','โกเม้าเขียวล้วน 1','โกเม้าเขียวล้วน2','โกเม้าเขียวล้วน 2','โกเม้าเขียวล้วน3','โกเม้าเขียวล้วน 3','โกเม้าเขียวล้วน4','โกเม้าเขียวล้วน 4','โกเม้าเขียวล้วน5','โกเม้าเขียวล้วน 5'] },
  { id: 50, sku: 'L&M_GREEN', name: 'แอลแอนด์เอ็มเขียว', thName: 'แอลแอนด์เอ็มเขียว', price: 300, emoji: '🟩', brand:['l&m'], variant:['green'], aliases:['แอลเอ็มเขียว','แอลเอ็มเขียว1','แอลเอ็มเขียว 1','แอลเอ็มเขียว2','แอลเอ็มเขียว 2','แอลเอ็มเขียว3','แอลเอ็มเขียว 3','แอลเอ็มเขียว4','แอลเอ็มเขียว 4','แอลเอ็มเขียว5','LM เขียว'] },
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
  { id: 89, sku: 'CAVALLO_MANGO', name: 'คาวาโร่มะม่วง', thName: 'คาวาโร่มะม่วง', price: 350, emoji: '🥭', brand:['cavallo'], variant:['mango'], aliases:['CAVALLO_MANGO','คาวาโร่มะม่วง','คาวาโร่มะม่วง1','คาวาโร่มะม่วง 1','คามะม่วง','คาม่ะม่วว','คาม่ะม่วว1','คาม่ะม่วว 1'] },
  { id: 90, sku: 'SEVIOS_WATERMELON', name: 'ซีวอสแตงโม', thName: 'ซีวอสแตงโม', price: 350, emoji: '🍉', brand:['sevios'], variant:['watermelon'], aliases:['SEVIOS_WATERMELON','ซีวอสแตงโม','ซีวอส แตงโม','Sevios Double Watermelon Swap','ซีวอสแตงโม 1'] },
     { id: 91, sku: 'VORTEX_GREEN ', name: 'วอเทค', thName: 'วอเทค', price: 350, emoji: '🟩', brand:['vortex'], variant:['green'], aliases:['VORTEX_GREEN','วอเทคเขียว',] },
     { id: 92, sku: 'VORTEX_RED ', name: 'วอเทค', thName: 'วอเทค', price: 350, emoji: '🟥', brand:['vortex'], variant:['red'], aliases:['VORTEX_RED','วอเทคแดง',] },
];

// ============================================================
// V6 - MASTER PRODUCT MATCHING + RAW PRESERVATION + DYNAMIC QTY
// ============================================================
const PRODUCT_MASTER = Object.fromEntries(PRODUCT_MASTER_ARR.map(p => [p.sku, p]));

function value(r, k) {
  const v = r?.[k];
  return v === undefined || v === null ? '' : String(v).trim();
}
function firstExisting(r, keys) {
  if (!Array.isArray(keys)) return '';
  for (const k of keys) { 
    const v = value(r, k); 
    if (v) return v; 
  }
  return '';
}
function parseNumber(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(String(raw).replaceAll(',', '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function formatBaht(n) {
  const num = parseNumber(n);
  return num == null ? '' : new Intl.NumberFormat('th-TH').format(num);
}
function escapeHtml(v) {
  return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

// ตัดแต่งข้อความเพื่อใช้เทียบ SKU (ตัดจำนวนและคำรบออกให้เหลือแต่ชื่อหลัก)
function productPhrase(raw) {
  return String(raw ?? '')
    .normalize('NFKC')
    .replace(/จํานวน/gu, 'จำนวน')
    .replace(/\|.*$/u, '')
    .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:THB|บาท)\b.*$/iu, '')
    .replace(/\s*[-–—]\s*(?:จำนวน\s*)?\d+(?:\.\d+)?\s*(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพ็ก|ซอง)?/giu, ' ')
    .replace(/(?:จำนวน|มี|x|×)\s*\d+(?:\.\d+)?\s*(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพ็ก|ซอง)?/giu, ' ')
    .replace(/\s+[1-9][0-9]*\s*$/u, '') 
    .replace(/(?:ยอด\s*(?:รวม\s*)?COD|COD\s*:?|รหัสไปรษณีย์).*$/iu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function productKey(raw) {
  return productPhrase(raw)
    .replace(/[|｜:：=]+/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพค|กระป๋อง|ซอง)\.?/giu, ' ')
    .replace(/\bx\s*\d+(?:\.\d+)?\b/giu, ' ')
    .replace(/[^A-Za-z0-9ก-๙_\s&.]+/gu, ' ')
    .replace(/\s*[_\s.&]+/gu, '')
    .trim()
    .toUpperCase();
}

const compactKeyCache = new Map();
function compactKey(raw) {
  const source = String(raw ?? '');
  if (compactKeyCache.has(source)) return compactKeyCache.get(source);
  const result = productKey(source).replace(/[ _.&]/g, '');
  compactKeyCache.set(source, result);
  return result;
}

const masterIndex = new Map();
for (const master of PRODUCT_MASTER_ARR) {
  const keys = [master.sku, master.name, master.thName, ...(master.aliases || [])].map(compactKey).filter(Boolean);
  for (const key of keys) {
    const previous = masterIndex.get(key);
    if (!previous) masterIndex.set(key, master);
    else if (previous.sku !== master.sku) masterIndex.set(key, null);
  }
}

const system2Cache = new Map();
function system2Master(raw) {
  const source = String(raw ?? '');
  if (system2Cache.has(source)) return system2Cache.get(source);
  const key = compactKey(source);
  if (!key) { system2Cache.set(source, null); return null; }
  const candidates = PRODUCT_MASTER_ARR.filter(master => {
    const brands = (master.brand || []).map(compactKey).filter(Boolean);
    const variants = (master.variant || []).map(compactKey).filter(Boolean);
    return brands.some(brand => key.includes(brand)) && variants.some(variant => key.includes(variant));
  });
  const result = candidates.length === 1 ? candidates[0] : null;
  system2Cache.set(source, result);
  return result;
}

function isProductLineCandidate(line) {
  const s = String(line ?? '').normalize('NFKC').replace(/จํานวน/gu, 'จำนวน').trim();
  if (!s) return false;
  if (/(?:สรุปรายการสั่งซื้อ|เลขที่ออเดอร์|เวลาสั่งซื้อ|ชื่อผู้รับ|เบอร์โทร|ที่อยู่จัดส่ง|รหัสไปรษณีย์|ยอดรวม\s*COD|COD\s*:?|ขนส่ง|โหนดส่ง|ทีมจะ)/iu.test(s)) return false;
  const trailingQty = s.replace(/(?:\s|^)(?:จำนวน|มี|x|×)?\s*[1-9][0-9]*(?:\.0)?\s*$/iu, '').trim();
  const masterKey = compactKey(trailingQty);
  const exactMasterLine = masterKey && masterIndex.get(masterKey);
  return /(?:จำนวน|มี|x|×)?\s*(?:[1-9]|10)(?:\.0)?\s*(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพ็ก|ซอง)/iu.test(s)
    || /(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพ็ก|ซอง)/iu.test(s)
    || Boolean(exactMasterLine);
}

function extractRawLines(row) {
  const p = row.packer_obj || {};
  const itemRows = [ ...(Array.isArray(row.orderItems) ? row.orderItems : []), ...(Array.isArray(p.orderItems) ? p.orderItems : []) ];
  const fromItems = itemRows.map(x => x?.raw_line || x?.raw_text || x?.product_text || x?.sku || '').filter(Boolean).map(String).filter(isProductLineCandidate);
  if (fromItems.length) return [...new Set(fromItems)];
  const sources = [row.sniper_x_text_clean, row.product_text, row.extracted_product_raw, row.product_lines, row.original, row.full_chunk_text, row.chat_text].filter(v => v !== undefined && v !== null && String(v).trim()).map(String).filter(Boolean);
  return [...new Set(sources.flatMap(src => src.split(/\r?\n/).map(x => x.trim()).filter(isProductLineCandidate)))];
}

function rawProductUntilQuantity(raw) {
  const s = String(raw ?? '').normalize('NFKC').trim();
  const beforePrice = s.split(/\|/u)[0].split(/\b\d[\d,]*(?:\.\d+)?\s*(?:THB|บาท)\b/iu)[0].trim();
  const m = beforePrice.match(/^.*?(?:(?:จำนวน|มี)\s*)?\d+(?:\.\d+)?\s*(?:คอต|คอท|ชิ้น|กล่อง|แพ็ค|แพ็ก|ซอง)?/iu);
  return (m?.[0] || beforePrice).replace(/\s+/gu, ' ').trim();
}

function productCandidatesFromRaw(raw) {
  const clean = rawProductUntilQuantity(raw);
  return [...new Set([clean, productPhrase(raw), raw].map(String).map(x => x.trim()).filter(Boolean))];
}

const mapRawCache = new Map();
function mapOneRaw(raw) {
  const rawSource = String(raw ?? '').trim();
  if (mapRawCache.has(rawSource)) return mapRawCache.get(rawSource);
  const rawDisplay = rawProductUntilQuantity(rawSource);
  const candidates = productCandidatesFromRaw(rawSource);
  let exactMaster = null;
  let matchedCandidate = '';
  
  for (const candidate of candidates) {
    const key = compactKey(candidate);
    const found = key ? masterIndex.get(key) : undefined;
    if (found) { exactMaster = found; matchedCandidate = candidate; break; }
  }
  
  let master = exactMaster;
  let method = exactMaster ? 'PRODUCT_MASTER_EXACT_PRODUCT_PHRASE' : '';
  if (!master) {
    for (const candidate of candidates) {
      const found = system2Master(candidate);
      if (found) { master = found; matchedCandidate = candidate; method = 'PRODUCT_MASTER_BRAND_COLOR_OR_FLAVOR'; break; }
    }
  }
  
  const key = compactKey(matchedCandidate || rawDisplay);
  
  // 🛡️ หากแมปไม่เจอ คืนค่าดิบกลับไปทันทีโดยไม่มีการตัดทิ้ง (Raw Preservation)
  if (!master) {
    const result = {
      raw_line: rawSource,
      raw_source_line: rawSource,
      normalized_product_key: key,
      sku: null,
      master_sku: null,
      master_display_for_packer: null,
      final_product: rawSource,
      mapped_display: rawSource,
      mapping_status: 'UNMAPPED_KEEP_RAW',
      match_method: key ? 'RAW_PRODUCT_PHRASE_NO_MASTER' : 'NO_PRODUCT_KEY'
    };
    mapRawCache.set(rawSource, result);
    return result;
  }

  // 🎯 หากแมปเจอ: ดึง Master Display พร้อมแกะจำนวนมาต่อคำว่า "คอต" ให้ถูกต้องอัตโนมัติ
  const masterBySku = PRODUCT_MASTER[master.sku] || master;
  const display = masterBySku.master_display_for_packer || `${masterBySku.emoji || ''} ${masterBySku.sku} (${masterBySku.thName || masterBySku.name || ''})`.trim();
  
// 🧠 ดึงจำนวนจากข้อความดิบให้แม่นยำ รองรับทั้งตัวเลขเดี่ยวๆ ท้ายบรรทัด หรือมีคำว่า คอต/ชิ้น กำกับ
  const qtyMatch = rawSource.match(/(?:จำนวน|มี|x|×)\s*([1-9][0-9]*)(?:\.0)?\s*(?:คอต|คอท|คอต.|กล่อง|แพ็ค|แพ็ก|ซอง)?/iu)
    || rawSource.match(/(?:^|\s)([1-9][0-9]*)(?:\.0)?\s*(?:คอต|คอท|คอต.|กล่อง|แพ็ค|แพ็ก|ซอง)?\s*$/iu)
    || rawSource.match(/(?:^|\s)([1-9][0-9]*)(?:\.0)?\s*$/u);
    
  const qty = qtyMatch?.[1] || '1'; // ถ้าดึงเจอ เอาค่านั้นมาใช้ ถ้าไม่เจอค่อยตกแต่งเป็น 1
  const canonicalDisplay = `${display} x ${qty} คอต`;

  
  const result = {
    raw_line: rawSource,
    raw_source_line: rawSource,
    normalized_product_key: key,
    sku: master.sku,
    master_sku: master.sku,
    master_display_for_packer: display,
    final_product: canonicalDisplay,
    mapped_display: canonicalDisplay,
    mapping_status: 'MAPPED',
    match_method: method,
    mapping_system: method.includes('EXACT') ? 'SYSTEM_1_EXACT_PRODUCT_PHRASE' : 'SYSTEM_2_SIGNAL_WORDS',
    unit_price: master.price ?? null
  };
  
  mapRawCache.set(rawSource, result);
  return result;
}

function cleanAddressCandidate(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/^\[[^\]]*\]\s*/u, '')
    .replace(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\]?\s*/u, '')
    .replace(/^(?:ที่อยู่จัดส่ง|ที่อยู่|address)\s*[:：]\s*/iu, '')
    .replace(/^(?:ชื่อผู้รับ|ชื่อ|ผู้รับ)\s*[:：].*?\n/iu, '')
    .replace(/\b(?:โทร|เบอร์โทร|เบอร์มือถือ|มือถือ)\s*[:：]?\s*\+?\d[\d\s().-]{8,}/iu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function addressScore(value) {
  const s = cleanAddressCandidate(value);
  if (!s || /^(?:DATA_MISSING|N\/A|null|undefined)$/iu.test(s)) return -999;
  if (/^[1-9]\d{4}$/u.test(s)) return -999;
  const hasHouse = /(?:บ้านเลขที่|เลขที่|^\d{1,5}(?:\/|-)?\s*\d{0,5}\b|\d+\s*ม\.?)/iu.test(s);
  const hasLocal = /(?:ตำบล|ต\.|แขวง)\s*[^\s]+/iu.test(s);
  const hasDistrict = /(?:อำเภอ|อ\.|เขต)\s*[^\s]+/iu.test(s);
  const hasProvince = /(?:จังหวัด|จ\.|กรุงเทพมหานคร|กรุงเทพฯ|กทม)/iu.test(s);
  const hasZip = /(?<!\d)[1-9]\d{4}(?!\d)/u.test(s);
  const hasLandmark = /(?:วัด|ร้านอาหาร|ร้านกาแฟ|ร้านตัดผม|ร้านค้า|ตลาด|โรงเรียน|บริษัท|หอพัก|รีสอร์ท|โรงแรม|คลินิก|โรงพยาบาล|ปั๊ม|ฟาร์ม|สวน|ซอย|ถนน)/iu.test(s);
  let score = 0;
  if (hasHouse) score += 34;
  if (hasLocal) score += 21;
  if (hasDistrict) score += 21;
  if (hasProvince) score += 21;
  if (hasZip) score += 13;
  if (hasLandmark) score += 8;
  score += Math.min(12, Math.floor(s.length / 20));
  if (hasProvince && !hasHouse && !hasLocal && !hasDistrict && !hasLandmark) score -= 30;
  if (hasZip && !hasHouse && !hasLocal && !hasDistrict && !hasLandmark) score -= 20;
  return score;
}

function getAddress(row) {
  const p = row.source_payload || row.packer_obj || {};
  const rawCandidates = [
    ['rescue_address_normalized', [value(row,'rescue_address_normalized'), value(row,'zipcode')].filter(Boolean).join(' ')],
    ['rescue_address', [value(row,'rescue_address'), value(row,'zipcode')].filter(Boolean).join(' ')],
    ['rescue_address_raw', [value(row,'rescue_address_raw'), value(row,'zipcode')].filter(Boolean).join(' ')],
    ['address_fibo_selected_clean', value(row,'address_fibo_selected_clean')],
    ['full_address', value(row,'full_address')],
    ['final_address_for_bill', value(row,'final_address_for_bill')],
    ['full_address_backup_1', value(row,'full_address_backup_1')],
    ['full_address_backup_2', value(row,'full_address_backup_2')],
    ['finalAddress', value(row,'finalAddress')],
    ['address_display_packer', value(row,'address_display_packer')],
    ['addressclean', value(row,'addressclean')],
    ['address_raw_source_line', value(p,'address_raw_source_line')],
    ['address_line_1', value(row,'address_line_1')],
    ['short_address', value(row,'short_address')],
    ['address', value(row,'address')]
  ];
  
  for (const source of [row.original, row.full_chunk_text, row.chat_text]) {
    const text = String(source ?? '').replace(/\\n/g, '\n');
    const zip = (text.match(/(?<!\d)[1-9]\d{4}(?!\d)/u) || [])[0] || '';
    for (const line of text.split(/\r?\n/u)) {
      if (/(?:ที่อยู่จัดส่ง|ที่อยู่|address|บ้านเลขที่|เลขที่|หมู่บ้าน|หมู่|ต\.|ตำบล|อ\.|อำเภอ|จ\.|จังหวัด|แขวง|เขต|ถนน|ซอย)\s*[:：=]?/iu.test(line)) {
        const withZip = zip && !/(?<!\d)[1-9]\d{4}(?!\d)/u.test(line) ? `${line} ${zip}` : line;
        rawCandidates.push(['raw_address_text', withZip]);
      }
    }
  }
  
  const scored = rawCandidates
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim())
    .map(([source, v]) => ({ source, clean: cleanAddressCandidate(v), score: addressScore(v) }))
    .filter(x => x.clean && x.score > -900)
    .sort((a, b) => b.score - a.score || b.clean.length - a.clean.length);
    
  return [...new Map(scored.map(x => [x.clean, x])).values()].map(x => x.clean);
}

function formatOrderTime(row) {
  return firstExisting(row, ['order_time_display','orderTimeDisplay','time_th','order_date']) || '';
}

const grouped = new Map();
for (const item of $input.all()) {
  const row = item.json ?? {};
  const key = value(row,'upsert_key') || value(row,'order_number') || value(row,'threadId');
  if (key && !grouped.has(key)) grouped.set(key, row);
}

return [...grouped.values()].map(row => {
  const rawLines = extractRawLines(row);
  const items = rawLines.map(mapOneRaw).filter(x => x.normalized_product_key || x.raw_line);
  
  const matched = items.filter(x => x.mapping_status === 'MAPPED' || x.mapping_status === 'MATCHED');
  const unmatched = items.filter(x => x.mapping_status !== 'MAPPED' && x.mapping_status !== 'MATCHED');
  
  const mappedDisplay = matched.map(x => x.mapped_display || x.final_product).filter(Boolean);
  const rawDisplay = unmatched.map(x => x.raw_line).filter(Boolean);
  
  // รวมรายการที่แมปแล้วกับข้อมูลดิบที่ไม่เจอเข้าด้วยกัน ป้องกันอตกหล่น
  const productDisplay = [...mappedDisplay, ...rawDisplay].join('\n');
  const productFallback = firstExisting(row, [
    'order_fibo_product',
    'packer_tag_display',
    'for_packer_st_display',
    'manus_for_packer',
    'google_for_packer'
  ]);
  
  const finalProduct = productDisplay || productFallback || '📦 ตรวจสินค้า: ยังไม่พบรายการสินค้า';
  const mappedPrimary = mappedDisplay.join('\n');
  const rawPrimary = rawDisplay.join('\n');
  const sharedProductPrimary = productDisplay || productFallback || '';
  
  const cod = parseNumber(firstExisting(row,['cod_amount','final_order_price','expected_cod','cod']));
  const addressCandidates = getAddress(row);
  const address = addressCandidates[0] || '';
  const orderTimeDisplay = formatOrderTime(row);
  const orderNumber = value(row,'order_number');
  const header = value(row,'stock_notice');
  const customer = firstExisting(row,['customer_name','facebook_name']);
  
  const phoneCandidates = Array.isArray(row.phone_candidates) ? row.phone_candidates : [];
  const labeledPhone = phoneCandidates.find(candidate => candidate && typeof candidate === 'object' && candidate.has_phone_label === true && candidate.phone)?.phone || '';
  const phone = firstExisting(labeledPhone, row.extracted_phone, row.phone);
  
  const message = [
    header, 
    '━━━━━━━━━━━━━━━━━━━━', 
    orderTimeDisplay ? `⏰ เวลาสั่งซื้อ: ${escapeHtml(orderTimeDisplay)}` : '', 
    orderNumber ? `🆔 เลขออเดอร์: ${escapeHtml(orderNumber)}` : '', 
    customer ? `👤 ${escapeHtml(customer)}` : '', 
    cod != null ? `💰 COD: ${formatBaht(cod)} บาท` : '', 
    phone ? `📱 ${escapeHtml(phone)}` : '', 
    address ? `📍 ${escapeHtml(address)}` : '', 
    '📦 รายการสินค้า:', 
    escapeHtml(finalProduct), 
    unmatched.length ? `⚠️ รอตรวจสินค้า ${unmatched.length} รายการ` : '', 
    '━━━━━━━━━━━━━━━━━━━━'
  ].filter(Boolean).join('\n');

  return { 
    json: { 
      ...row, 
      order_captured: true, 
      order_capture_status: 'CAPTURED_KEEP', 
      product_quantity_calculation_disabled: true, 
      order_time_display: orderTimeDisplay, 
      product_items_v5: items, 
      product_items_matched: matched, 
      product_items_unmatched: unmatched, 
      product_map_items: items, 
      product_map_result: productDisplay, 
      product_map_display: productDisplay, 
      product_map_mapped_display: mappedPrimary, 
      product_map_raw: rawPrimary, 
      product_map_primary: sharedProductPrimary, 
      product_map_sku: matched[0]?.sku || '', 
      product_map_source_line: items.map(x => x.raw_source_line || x.raw_line).filter(Boolean).join('\n'), 
      product_map_count: items.length, 
      product_map_mapped_count: matched.length, 
      product_map_unmapped_count: unmatched.length, 
      product_map_sku_list: matched.map(x => x.sku).filter(Boolean), 
      product_map_master_sku_list: matched.map(x => x.master_sku).filter(Boolean), 
      product_map_status: matched.length && unmatched.length ? 'PARTIAL_MAPPED_KEEP_RAW' : matched.length ? 'MAPPED' : unmatched.length ? 'UNMAPPED_KEEP_RAW' : 'MISSING_PRODUCT', 
      product_mapping_is_blocker: false, 
      mapping_status: unmatched.length ? (matched.length ? 'PARTIAL_MAPPED_KEEP_RAW' : 'UNMAPPED_KEEP_RAW') : 'MAPPED', 
      mapping_engine_version: 'PRODUCT_MASTER_SYSTEM_1_2_V6_RAW_PRESERVED', 
      sku: matched.length === 1 ? matched[0].sku : (matched.length > 1 ? matched.map(x => x.sku).filter(Boolean).join(',') : (row.sku || null)), 
      master_sku: matched.length === 1 ? matched[0].master_sku : (matched.length > 1 ? matched.map(x => x.master_sku).filter(Boolean).join(',') : (row.master_sku || null)), 
      
      // ส่งค่าลงฟิลด์สำหรับ Packer ครบถ้วนทุกตัว
     raw_text:$input.first().json.sku, 
      display_for_packer: finalProduct, 
      final_display_for_packer: finalProduct, 
      order_fibo_product: finalProduct, 
      packer_tag_display: finalProduct, 
      for_packer_st_display: finalProduct, 
      manus_for_packer: finalProduct, 
      google_for_packer: finalProduct, 
      final_product: finalProduct, 
      trusted_product: finalProduct, 
      
      product_display_candidates: [finalProduct, ...unmatched.map(x => x.raw_line)].filter(Boolean), 
      product_unmatched_raw: unmatched.map(x => x.raw_line), 
      address_display_packer: address, 
      final_address_for_bill: address, 
      address_candidates: addressCandidates, 
      cod_amount: cod, 
      final_order_price: cod, 
      expected_cod: cod, 
      telegram_product_display: finalProduct, 
      telegram_message: message, 
      telegram_copy_text: [orderNumber, orderTimeDisplay, cod != null ? `${formatBaht(cod)} บาท` : '', customer, phone, address, finalProduct].filter(Boolean).join('\n') 
    } 
  };
});