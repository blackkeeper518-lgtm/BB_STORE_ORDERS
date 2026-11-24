import { describe, expect, it } from "vitest";
import { getMetaTraceId, isTransientMetaInternal } from "./meta-errors";

describe("Meta Messenger send errors", () => {
  it("recognizes the reported -1 / 2018012 internal error", () => {
    expect(isTransientMetaInternal("META_TRANSIENT_INTERNAL: (#-1) Unexpected internal error (code=-1, subcode=2018012, trace=AjDHu3AfyLzVj5wjsj8Rwuz)")).toBe(true);
  });

  it("keeps the Meta trace identifier available for support", () => {
    expect(getMetaTraceId("META_TRANSIENT_INTERNAL: code=-1, subcode=2018012, trace=AjDHu3AfyLzVj5wjsj8Rwuz")).toBe("AjDHu3AfyLzVj5wjsj8Rwuz");
  });

  it("does not classify unrelated permission or recipient errors as transient internal errors", () => {
    expect(isTransientMetaInternal("META_SEND_FAILED: permission denied (code=10, subcode=2018001)")).toBe(false);
  });
});
