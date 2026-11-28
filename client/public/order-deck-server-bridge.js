/* Same-origin Order Deck iframe RPC bridge. No browser database credentials are accepted or stored. */
(function () {
  "use strict";
  var pending = new Map();
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    var data = event.data;
    if (!data || data.type !== "ST_ORDER_DECK_SERVER_RESPONSE" || typeof data.requestId !== "string") return;
    var entry = pending.get(data.requestId);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(data.requestId);
    if (data.ok) entry.resolve(data.result);
    else entry.reject(new Error(String(data.error || "Server request failed")));
  });
  window.stOrderDeckServerRequest = function (operation, input) {
    if (window.parent === window) return Promise.reject(new Error("Open Order Deck from the chat workspace to use server data"));
    var requestId = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : "req-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { pending.delete(requestId); reject(new Error("Server request timed out")); }, 60000);
      pending.set(requestId, { resolve: resolve, reject: reject, timer: timer });
      window.parent.postMessage({ type: "ST_ORDER_DECK_SERVER_REQUEST", requestId: requestId, operation: String(operation), input: input || {} }, window.location.origin);
    });
  };
})();
