import { describe, expect, it } from "vitest";
import { metaTransientSendNotice } from "./meta-send-notice";

describe("metaTransientSendNotice", () => {
  it("warns to check Business Suite before retrying and keeps the Meta trace id", () => {
    const notice = metaTransientSendNotice(
      "META_TRANSIENT_INTERNAL: เกิดข้อผิดพลาดภายใน (code=-1, subcode=2018012, trace=AjDHu3AfyLzVj5wjsj8Rwuz)",
    );

    expect(notice).toContain("ผลการส่งยังไม่ยืนยัน");
    expect(notice).toContain("ตรวจข้อความใน Meta Business Suite ก่อนส่งซ้ำ");
    expect(notice).toContain("trace: AjDHu3AfyLzVj5wjsj8Rwuz");
  });

  it("recognizes a wrapped partial-send error", () => {
    const notice = metaTransientSendNotice(
      "ส่งข้อความแล้ว แต่ส่งรูปไม่สำเร็จ: META_TRANSIENT_INTERNAL: Meta error (code=-1, subcode=2018012, trace=trace_456)",
    );

    expect(notice).toContain("ตรวจข้อความใน Meta Business Suite ก่อนส่งซ้ำ");
    expect(notice).toContain("trace: trace_456");
  });

  it("leaves ordinary delivery errors to the existing UI", () => {
    expect(metaTransientSendNotice("META_SEND_FAILED: invalid recipient")).toBeNull();
  });
});
