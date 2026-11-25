const assert = require('node:assert/strict');
const fs = require('node:fs');

const sourcePath = `${__dirname}/../PROJECT_2_ST_PARCEL_TRACKING_SEND_LINE/EXPRESS/🚨DELIVERY_RISK_PROVINCE_HEADER🚨.js`;
const source = fs.readFileSync(sourcePath, 'utf8');
const input = { json: {
  order_number: '🌿_ORD-251126-155946',
  province: 'เลย', zipcode: 'DATA_MISSING', phone: 'DATA_MISSING',
  cod_amount: 100, cod_candidates: [350, 100],
  source_gate_status: 'BLACK_REVIEW', source_gate_color: '⚫', risk_alert_allowed: false,
  darksideBillDataComplete: false, bill_data_complete: false,
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
