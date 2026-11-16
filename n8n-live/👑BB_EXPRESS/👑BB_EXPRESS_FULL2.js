{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [
        -11408,
        6144
      ],
      "id": "b94576bd-7399-4b0f-bbb8-c9bb4883bc1a",
      "name": "🎱🍁#DARKSIDEMARKETING"
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "getAll",
        "tableId": "🪐ANDROMEDA_xXx_SENT",
        "returnAll": true,
        "filters": {
          "conditions": []
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -12976,
        5712
      ],
      "id": "0612a60f-86be-4e60-a968-b28369e56538",
      "name": "🪐ANDROMEDA_xXx_SENT",
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 3
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.3,
      "position": [
        -13200,
        5712
      ],
      "id": "558526e1-e309-4081-b62b-3b147c07f241",
      "name": "Schedule Trigger4"
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🗝️HERMES_ARCHIVE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐👑⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "🔥SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "🌟GENESIS_xXx_HISTORY"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11408,
        5632
      ],
      "id": "b1b97e48-0653-4556-a794-745b5447c994",
      "name": "🗝️HERMES_ARCHIVE",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🗝️HERMES_ARCHIVE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐👑⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "☁️NEBULA_xXx_HISTORYz"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11632,
        5952
      ],
      "id": "6b9ebcdc-187a-4bcb-8630-ad439470d4da",
      "name": "🗝️HERMES_ARCHIVE2",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🌀SINGULARITY_xXx_EXCHANGE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐👑⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "☁️NEBULA_xXx_HISTORYz"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11632,
        6144
      ],
      "id": "d8e439e9-0843-4eac-a6eb-ac31000f2e88",
      "name": "🌀SINGULARITY_xXx_EXCHANGE",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🌀SINGULARITY_xXx_EXCHANGE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐👑⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "☁️NEBULA_xXx_HISTORYz"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11632,
        6336
      ],
      "id": "6b122f1a-76e4-4043-8a1a-1b621e64d4d3",
      "name": "🌀SINGULARITY_xXx_EXCHANGE1",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "b571e39b-5b2e-4db2-99b7-47cadc0c08c6",
                    "leftValue": "={{ $json.source_table }}",
                    "rightValue": "🗝️HERMES_ARCHIVE",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🗝️"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.source_table }}",
                    "rightValue": "🌀SINGULARITY_xXx_EXCHANGE",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "3fc0a29e-1342-4dc3-bbf8-42480605735d"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🌀"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.4,
      "position": [
        -12080,
        5344
      ],
      "id": "d999dbb5-bfdb-4512-9642-c11ac9422b6f",
      "name": "Switch2"
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🗝️HERMES_ARCHIVE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐🍁⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "🔥SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "☁️NEBULA_xXx_HISTORYz"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11856,
        5248
      ],
      "id": "a34c8765-9c38-457d-81fe-7fb5a2ac1fec",
      "name": "🗝️HERMES_ARCHIVE1",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {
        "useCustomSchema": true,
        "operation": "update",
        "tableId": "🌀SINGULARITY_xXx_EXCHANGE",
        "filters": {
          "conditions": [
            {
              "keyName": "upsert_key",
              "condition": "eq",
              "keyValue": "={{ $('⭐⭐🍁⭐⭐').item.json.upsert_key }}"
            }
          ]
        },
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "telegram_sent",
              "fieldValue": "true"
            },
            {
              "fieldId": "telegram_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "delivery_state",
              "fieldValue": "😈 Red Devil (Ghost)"
            },
            {
              "fieldId": "sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "delivery_status",
              "fieldValue": "SENT"
            },
            {
              "fieldId": "telegram_sent_at",
              "fieldValue": "={{ $now.toISO() }}"
            },
            {
              "fieldId": "target_room",
              "fieldValue": "☁️NEBULA_xXx_HISTORYz"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        -11856,
        5440
      ],
      "id": "c2dfdece-2d2c-4e27-861b-aca570c33f4d",
      "name": "🌀SINGULARITY_xXx_EXCHANGE2",
      "alwaysOutputData": false,
      "credentials": {
        "supabaseApi": {
          "id": "M57HMGs21S6xg28P",
          "name": "🌀SINGULARITY_X_ZERO"
        }
      }
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [
        -11632,
        5344
      ],
      "id": "6ee6636c-3983-4431-991b-a50d3de012da",
      "name": "🎱🍁#DARKSIDEMARKETING1"
    },
    {
      "parameters": {
        "jsCode": "function value(r, k) {\n  const v = r?.[k];\n  return v === undefined || v === null ? \"\" : String(v).trim();\n}\n\nfunction firstExisting(r, keys) {\n  for (const k of keys) {\n    const v = value(r, k);\n    if (v !== \"\") return v;\n  }\n  return \"\";\n}\n\nfunction escapeHtml(v) {\n  return String(v ?? \"\")\n    .replaceAll(\"&\", \"&amp;\")\n    .replaceAll(\"<\", \"&lt;\")\n    .replaceAll(\">\", \"&gt;\")\n    .replaceAll('\"', \"&quot;\");\n}\n\nfunction htmlToPlainText(value) {\n  return String(value ?? \"\")\n    .replace(/<br\\s*\\/?\\s*>/gi, \"\\n\")\n    .replace(/<\\/(?:p|div|li|tr|h[1-6])\\s*>/gi, \"\\n\")\n    .replace(/<[^>]*>/g, \"\")\n    .replace(/&nbsp;/gi, \" \")\n    .replace(/&#39;|&apos;/gi, \"'\")\n    .replace(/&quot;/gi, '\"')\n    .replace(/&lt;/gi, \"<\")\n    .replace(/&gt;/gi, \">\")\n    .replace(/&amp;/gi, \"&\")\n    .replace(/&#(\\d+);/g, (_, n) => String.fromCodePoint(Number(n)))\n    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))\n    .replace(/\\r\\n?/g, \"\\n\")\n    .replace(/[ \\t]+\\n/g, \"\\n\")\n    .replace(/\\n{3,}/g, \"\\n\\n\")\n    .trim();\n}\n\nconst inputItems = $input.all();\n\nreturn inputItems.map((item) => {\n  const row = item?.json ?? {};\n\n  // 1. ดึงข้อความบิลเดิม (ที่มีบล็อก Change Audit ครบถ้วนแล้ว) มาเป็นตัวตั้งต้น\n  let telegramMsg = firstExisting(row, [\n    'telegram_message',\n    'telegram_main_bill',\n    'telegram_message_for_send_final',\n    'raw_text'\n  ]);\n\n  // 2. ดึง stock_notice มาแต่งHTMLให้หล่อเหมือนฝั่งบิลเดี่ยว\n  const rawStockNotice = firstExisting(row, ['stock_notice', 'dynamic_header', 'header_notice']);\n  const formattedNotice = rawStockNotice ? `<b>${escapeHtml(rawStockNotice)}</b>` : \"\";\n\n  // 3. เช็คว่าในข้อความมี stock_notice ตัวนี้แปะอยู่แล้วหรือยัง (ป้องกันการเบิ้ลซ้ำ)\n  const hasNoticeAlready = formattedNotice && telegramMsg.includes(rawStockNotice);\n\n  // 4. ถ้ามี stock_notice และยังไม่เคยถูกแปะ ให้เอามา \"เสียบบนสุด\" เหนือเวลาสั่งซื้อ\n  if (formattedNotice && !hasNoticeAlready) {\n    telegramMsg = `${formattedNotice}\\n${telegramMsg}`;\n  }\n\n  // สร้างฟิลด์เว็บแยกจาก HTML สำหรับ Telegram; ฟิลด์ส่งกลุ่มคงเดิม\n  const telegramChangeAlert = firstExisting(row, ['telegram_change_alert']);\n  const telegramMessageWeb = htmlToPlainText(telegramMsg);\n  const telegramChangeAlertWeb = htmlToPlainText(telegramChangeAlert);\n\n  return {\n    json: {\n      ...row,\n      // อัปเดตฟิลด์ข้อความส่งออกให้เป็นตัวที่ใส่หัวแจ้งเตือนสต็อกเรียบร้อยแล้ว\n      telegram_message: telegramMsg,\n      telegram_main_bill: telegramMsg,\n      telegram_message_for_send_final: telegramMsg,\n      telegram_message_web: telegramMessageWeb,\n      telegram_change_alert_web: telegramChangeAlertWeb,\n      audit_header_inject_status: formattedNotice ? (hasNoticeAlready ? 'ALREADY_EXISTS' : 'INJECTED_SUCCESS') : 'NO_NOTICE'\n    }\n  };\n});"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -12528,
        5712
      ],
      "id": "45f8bf41-dd92-474c-a995-45a663eacf40",
      "name": "BILL HEADER INJECTOR"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "43e7ccd4-eff3-429b-bdfb-bcdfc8fb5c8c",
                    "leftValue": "={{ $json.bb_express_send_route }}",
                    "rightValue": "⚪",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "⚪"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "3f45f9a3-ab1a-4291-bcca-95a9019e3d1d",
                    "leftValue": "={{ $json.bb_express_send_route }}",
                    "rightValue": "🟦",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟦"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "5ec59028-1923-4c09-8d97-123e567a9672",
                    "leftValue": "={{ $json.bb_express_send_route }}",
                    "rightValue": "🟨",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟨 "
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "bc264af8-5ebc-46ca-bfec-55687302d37f",
                    "leftValue": "={{ $json.bb_express_send_route }}",
                    "rightValue": "🟠",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🟠"
            }
          ]
        },
        "options": {
          "fallbackOutput": "none"
        }
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.4,
      "position": [
        -12080,
        6016
      ],
      "id": "bf707e91-83bd-4ea4-8f26-4e9cf5847637",
      "name": "⭐⭐👑⭐⭐"
    },
    {
      "parameters": {
        "jsCode": "// n8n Code node — Mode: Run Once for All Items\n// 🛡️ THE GOD GATEKEEPER : DK DRAKSIDE - SPACE VAULT EDITION (TIME CHECK ONLY)\n\nconst START_DATETIME_BKK = \"2026-10-29 00:00:00\";\nconst END_DATETIME_BKK   = \"2028-12-30 00:00:01\";\n\nconst clean = (value) => String(value ?? \"\").trim().replace(/\\s+/g, \" \");\n\nfunction parseDateTimeMs(value) {\n  const s = clean(value);\n  if (!s) return null;\n  const parsed = Date.parse(s);\n  return Number.isFinite(parsed) ? parsed : null;\n}\n\n// 1. คำนวณขอบเขตเวลาวิกฤตฝั่งเซิร์ฟเวอร์อิงเวลาไทยปัจจุบัน (UTC+7)\nconst now = new Date();\nconst nowUtcMs = now.getTime();\nconst thaiNow = new Date(nowUtcMs + (7 * 60 * 60 * 1000));\n\n// ⏰ ตั้งเวลา Cutoff รอบแพ็กของ \"บ่ายสองโมงตรงของเมื่อวาน\" (13:45 UTC ตามสูตรดั้งเดิม)\nconst yesterdayCutoff = new Date(thaiNow);\nyesterdayCutoff.setUTCDate(yesterdayCutoff.getUTCDate() - 3); \nyesterdayCutoff.setUTCHours(13, 45, 0, 4); \nconst minAllowedTimeMs = yesterdayCutoff.getTime() - (7 * 60 * 60 * 1000);\n\n// 🚨 เกณฑ์เหล็กป้องกันระบบสะดุด: ถอยหลัง 24 ชม. ตรงๆ นับจากวินาทีนี้เป๊ะ\nconst absolute24hAgoMs = nowUtcMs - (24 * 60 * 60 * 1000);\nconst maxAllowedTimeMs = nowUtcMs + (12 * 60 * 60 * 1000);\n\n// ฟังก์ชันแกะเวลาแชทไทย \"30/10/69 15:55:33\" ออกมาเป็น Timestamp สากล\nfunction parseThaiDateTime(raw) {\n  if (!raw) return null;\n  try {\n    const [datePart, timePart] = String(raw).trim().split(\" \");\n    const [d, m, y] = datePart.split(\"/\");\n    \n    let year = parseInt(y);\n    if (year < 100) year += 2500; // แปลง 69 -> 2569\n    year -= 543; // แปลง พ.ศ. -> ค.ศ.\n    \n    const [hour, minute, second] = (timePart || \"00:00:00\").split(\":\").map(Number);\n    return new Date(Date.UTC(year, parseInt(m) - 1, parseInt(d), hour - 7, minute, second)).getTime();\n  } catch {\n    return null;\n  }\n}\n\nreturn $input.all().flatMap(({ json: row = {} }) => {\n  const orderTimeDisplay = clean(row.order_time_display || \"-\");\n\n  // 🎯 สวิตช์เช็กเวลาหลักจาก order_time_display ตรงๆ ตัวเดียวจบ\n  const rawChatTime = orderTimeDisplay;\n  const chatTimestamp = parseThaiDateTime(rawChatTime);\n\n  // 🛠️ ⚡ *เช็กเกณฑ์เวลาแบบ 2 ทางแยกคัดป้าย (ใช่ กับ ไม่ใช่)*\n  let bkk_cutoff_route = \"BLOCK_TG_EXPIRED\"; // ตั้งค่าเริ่มต้นเป็น \"ไม่ใช่\" (BLOCK)\n  let isWithin24h = false;\n  let chatAgeHours = 0;\n\n  if (chatTimestamp) {\n    const diffInMs = nowUtcMs - chatTimestamp;\n    chatAgeHours = diffInMs / (1000 * 60 * 60);\n\n    // 🎯 เงื่อนไข \"ใช่\" (ผ่านเกณฑ์เวลาทั้งหมด) -> ปรับป้ายเป็น ALLOW_TG_SEND\n    if (chatTimestamp >= absolute24hAgoMs && chatTimestamp >= minAllowedTimeMs && chatTimestamp <= maxAllowedTimeMs) {\n      bkk_cutoff_route = \"ALLOW_TG_SEND\"; \n      isWithin24h = true;\n    }\n  }\n\n  // ส่งผลลัพธ์ออกสู่สายพานปลายทางแบบคืนค่าแถวข้อมูลเดิมกลับไปพร้อมประทับป้ายเวลา\n  return [\n    {\n      json: {\n        ...row,\n        order_time_display: orderTimeDisplay,\n        customerMessageTimeTh: rawChatTime,\n        // 🔀 ตราป้ายสเตตัส 2 ทางแยกเคลียร์คัตตามบรีฟ\n        bkk_cutoff_route: bkk_cutoff_route,\n        send_facebook_route: bkk_cutoff_route,\n        sendFacebookRoute: bkk_cutoff_route,\n        send_telegram_route: bkk_cutoff_route, \n        is_24h_window_valid: isWithin24h,\n        customer_chat_age_hours: chatAgeHours,\n      },\n    },\n  ];\n});\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -12752,
        5712
      ],
      "id": "ef76c5ad-a83c-4a46-a857-d6b655735a89",
      "name": "🧿END_DATETIME_BKK"
    },
    {
      "parameters": {
        "batchSize": 3,
        "options": {}
      },
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        -11856,
        5712
      ],
      "id": "14c7d457-23e2-4e28-821e-6cbb623511ac",
      "name": "Loop Over Items"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "id": "b571e39b-5b2e-4db2-99b7-47cadc0c08c6",
                    "leftValue": "={{ $json.bkk_cutoff_route }}",
                    "rightValue": "BLOCK_TG_EXPIRED",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🚫"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 3
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.bkk_cutoff_route }}",
                    "rightValue": "ALLOW_TG_SEND",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "3fc0a29e-1342-4dc3-bbf8-42480605735d"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "🆕"
            }
          ]
        },
        "options": {
          "fallbackOutput": "none"
        }
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.4,
      "position": [
        -12304,
        5712
      ],
      "id": "fa419897-d5d9-44b8-b134-53541f104eea",
      "name": "⭐⭐🍁⭐⭐"
    },
    {
      "parameters": {
        "chatId": "-1004343164176",
        "text": "={{ $json.telegram_message }}",
        "additionalFields": {
          "appendAttribution": false,
          "parse_mode": "HTML"
        }
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        -11856,
        6336
      ],
      "id": "8397a601-f704-45b4-aab7-7ad9724d70f9",
      "name": "🔸 PARADOX_xXx_EXCHANGE",
      "webhookId": "73d3a847-c366-44ce-909e-ebf33b1ee1df",
      "credentials": {
        "telegramApi": {
          "id": "byg0vHxo5ZIap74c",
          "name": "เทส"
        }
      }
    },
    {
      "parameters": {
        "chatId": "-1003546625293",
        "text": "={{ $json.telegram_message }}",
        "additionalFields": {
          "appendAttribution": false,
          "parse_mode": "HTML"
        }
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        -11856,
        6144
      ],
      "id": "68c1387c-d1a4-4a5c-97c1-4297d055afe2",
      "name": "🌟GENESIS_xXx_HISTORY",
      "webhookId": "73d3a847-c366-44ce-909e-ebf33b1ee1df",
      "credentials": {
        "telegramApi": {
          "id": "e60ukliyR12WX6Pe",
          "name": "ฺฺBBBBB"
        }
      }
    },
    {
      "parameters": {
        "chatId": "-1003546625293",
        "text": "={{ $json.telegram_message }}",
        "additionalFields": {
          "appendAttribution": false,
          "parse_mode": "HTML"
        }
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        -11856,
        5952
      ],
      "id": "a4f0aa14-caf4-47e5-ac3f-8e416dfba464",
      "name": "🌟GENESIS_xXx_HISTORY1",
      "webhookId": "73d3a847-c366-44ce-909e-ebf33b1ee1df",
      "credentials": {
        "telegramApi": {
          "id": "e60ukliyR12WX6Pe",
          "name": "ฺฺBBBBB"
        }
      }
    },
    {
      "parameters": {
        "chatId": "-1003546625293",
        "text": "={{ $json.telegram_message }}",
        "additionalFields": {
          "appendAttribution": false,
          "parse_mode": "HTML"
        }
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        -11632,
        5632
      ],
      "id": "735570e0-7b77-4ba5-a0c9-df4ccb62deb2",
      "name": "🌟GENESIS_xXx_HISTORY2",
      "webhookId": "73d3a847-c366-44ce-909e-ebf33b1ee1df",
      "credentials": {
        "telegramApi": {
          "id": "e60ukliyR12WX6Pe",
          "name": "ฺฺBBBBB"
        }
      }
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        -11184,
        5712
      ],
      "id": "87bb4430-5c0d-425f-a3aa-0fb03aff9373",
      "name": "Wait",
      "webhookId": "39166bf4-cbfb-4e70-80f9-35db4e024436"
    }
  ],
  "connections": {
    "🪐ANDROMEDA_xXx_SENT": {
      "main": [
        [
          {
            "node": "🧿END_DATETIME_BKK",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Schedule Trigger4": {
      "main": [
        [
          {
            "node": "🪐ANDROMEDA_xXx_SENT",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🗝️HERMES_ARCHIVE": {
      "main": [
        [
          {
            "node": "Wait",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🗝️HERMES_ARCHIVE2": {
      "main": [
        [
          {
            "node": "🎱🍁#DARKSIDEMARKETING",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌀SINGULARITY_xXx_EXCHANGE": {
      "main": [
        [
          {
            "node": "🎱🍁#DARKSIDEMARKETING",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌀SINGULARITY_xXx_EXCHANGE1": {
      "main": [
        [
          {
            "node": "🎱🍁#DARKSIDEMARKETING",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch2": {
      "main": [
        [
          {
            "node": "🗝️HERMES_ARCHIVE1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🗝️HERMES_ARCHIVE1": {
      "main": [
        [
          {
            "node": "🎱🍁#DARKSIDEMARKETING1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌀SINGULARITY_xXx_EXCHANGE2": {
      "main": [
        [
          {
            "node": "🎱🍁#DARKSIDEMARKETING1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "BILL HEADER INJECTOR": {
      "main": [
        [
          {
            "node": "⭐⭐🍁⭐⭐",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "⭐⭐👑⭐⭐": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌟GENESIS_xXx_HISTORY1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🌟GENESIS_xXx_HISTORY",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "🔸 PARADOX_xXx_EXCHANGE",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🧿END_DATETIME_BKK": {
      "main": [
        [
          {
            "node": "BILL HEADER INJECTOR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Items": {
      "main": [
        [],
        [
          {
            "node": "🌟GENESIS_xXx_HISTORY2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "⭐⭐🍁⭐⭐": {
      "main": [
        [
          {
            "node": "Switch2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "⭐⭐👑⭐⭐",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🔸 PARADOX_xXx_EXCHANGE": {
      "main": [
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌟GENESIS_xXx_HISTORY": {
      "main": [
        [
          {
            "node": "🌀SINGULARITY_xXx_EXCHANGE",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌟GENESIS_xXx_HISTORY1": {
      "main": [
        [
          {
            "node": "🗝️HERMES_ARCHIVE2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "🌟GENESIS_xXx_HISTORY2": {
      "main": [
        [
          {
            "node": "🗝️HERMES_ARCHIVE",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "f4fcccb61c84d5d75854e90735e6c1d4dc7f96a459bba4b39bf25fd07d0f4e26"
  }
}