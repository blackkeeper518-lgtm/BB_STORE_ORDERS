const assert = require('node:assert/strict');
const fs = require('node:fs');

const sourcePath = `${__dirname}/../PROJECT_2_ST_PARCEL_TRACKING_SEND_LINE/EXPRESS/🚨DELIVERY_RISK_PROVINCE_HEADER🚨.js`;
const source = fs.readFileSync(sourcePath, 'utf8');

function hasStructuredOrderEvidence(text) {
  const cod = text.match(/(?:ยอด\s*(?:รวม\s*)?COD|COD|เก็บเงินปลายทาง|ราคา)\s*[:=：]?\s*\[?([0-9][0-9,.]*)\]?/iu);
  const amount = cod ? Number(cod[1].replace(/[, ]/g, '')) : 0;
  const phone = /(?:^|\D)0[689]\d{8}(?:\D|$)/u.test(text.replace(/[\s-]/gu, ''));
  const postal = /(?<!\d)\d{5}(?!\d)/u.test(text);
  const product = /(?:^|\n)[^\n]*(?:\d+(?:\.\d+)?\s*(?:คอต\.?|หีบ|กล่อง|ชิ้น|แพ็ค|แพ็ก)|(?:x|×)\s*\d+(?:\.\d+)?|\s\d{1,3})\s*(?:\n|$)/iu.test(text);
  return amount >= 200 && phone && postal && product;
}

const genuineOrders = [
  '💰 ยอดรวมCOD: 250 บาท\n📱 เบอร์: 0825758116\n📍 ตราด\n📮 รหัสไปรษณีย์: 23150\n📦 รายการสินค้า:\n🟢Cavallo Green | จำนวน 1 คอต',
  'COD 250\nเบอร์098-8943426\nจ.นครสวรรค์60000\nเวสเขียวดำ 1',
  '💰 COD: 750 บาท\n0613973567\nจ.ปราจีนบุรี 25110\n📦 รายการสินค้า:\n🟢 CAVALLO_GREEN  3 คอต.',
];
for (const order of genuineOrders) assert.equal(hasStructuredOrderEvidence(order), true);
assert.equal(hasStructuredOrderEvidence('หนูเช็คให้แล้ว ยังไม่มีของพร้อมส่ง แบบ COD พี่อยากให้เทียบตัวไหน'), false);
assert.match('พี่ศรัทธาสนใจรับเป็นรสไหนดีคะ หรือจะจัดเซ็ต 3 คอต', /(?:สนใจรับ|รสไหนดี|จะจัดเซ็ต)/iu);
assert.match('ส่งฟรีถึงหน้าบ้าน แกะเช็คก่อนจ่าย มีของพร้อมส่ง', /(?:ส่งฟรีถึงหน้าบ้าน|แกะเช็คก่อนจ่าย|พร้อมส่ง)/iu);

const input = { json: {
  order_number: '🌿_ORD-251126-155946',
  province: 'เลย', zipcode: 'DATA_MISSING', phone: 'DATA_MISSING',
  cod_amount: 100, cod_candidates: [350, 100],
  source_gate_status: 'BLACK_REVIEW', source_gate_color: '⚫', risk_alert_allowed: false,
  darksideBillDataComplete: false, bill_data_complete: false,
  // สินค้าเป็นข้อความถามลูกค้าไม่ใช่เหตุให้ปัดดำโดยตัวมันเอง;
  // เคสนี้เป็น BLACK_REVIEW เพราะ gate อื่นขาด/ขัดแย้งทั้งหมด
  original: 'พี่ศรัทธาสนใจรับเป็นรสไหนดีคะ หรือจะจัดเซ็ต 3 คอตตุนฉ่ำๆ',
  darkside_missing_reasons: [
    'COD_CONFLICT_MULTIPLE_VALUES', 'COD_BELOW_MINIMUM_200',
    'PHONE_MISSING_OR_INVALID', 'POSTAL_CODE_MISSING_OR_INVALID',
    'MAPPED_PRODUCT_OR_QUANTITY_MISSING',
  ],
  packer_obj: { source_gate_status: 'BLACK_REVIEW' },
  bill_header: 'old', stock_notice: 'old',
} };

const execute = new Function('$input', source);
const output = execute({ all: () => [input] })[0].json;
assert.equal(output.delivery_risk_status, 'BLACK_REVIEW');
assert.equal(output.risk_alert_allowed, false);
assert.equal(output.delivery_risk_normal_alert_allowed, false);
assert.equal(output.bill_header, '');
assert.equal(output.stock_notice, '');
assert.equal(output.delivery_risk_header, '');
assert.equal(output.delivery_risk_header_active, false);
assert.ok(output._delivery_gate.missingReasons.length > 0);
console.log('PASS risk-destination incomplete-order regression');
