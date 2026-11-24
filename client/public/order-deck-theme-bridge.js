/* DRΛKSIDE ORDER DECK · same-origin theme bridge; Supabase access uses the server relay. */
(function () {
  "use strict";
  function hex(value, fallback) { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
  function applyTheme(theme) {
    if (!theme || typeof theme !== "object") return;
    var root = document.documentElement, body = document.body;
    var bg = hex(theme.bg, "#050611"), surface = hex(theme.surface, "#101329");
    var primary = hex(theme.primary, "#48f0ff"), accent = hex(theme.accent, "#a879ff");
    var text = hex(theme.textPrimary, "#ffffff"), muted = hex(theme.textSecondary, "#c9bfd2");
    var radius = Number.isFinite(Number(theme.radius)) ? Number(theme.radius) : 16;
    var glow = Number.isFinite(Number(theme.glow)) ? Number(theme.glow) : 12;
    [["--shared-theme-bg",bg],["--shared-theme-surface",surface],["--shared-theme-primary",primary],["--shared-theme-accent",accent],["--shared-theme-text",text],["--shared-theme-muted",muted],["--shared-theme-radius",radius+"px"],["--shared-theme-glow",glow+"px"],["--deck-bg",bg],["--deck-surface",surface],["--deck-primary",primary],["--deck-accent",accent],["--deck-text",text],["--deck-muted",muted],["--deck-glow",glow+"px"],["--visual-bg",bg],["--visual-card",surface],["--visual-neon",primary],["--theme-cyan",primary],["--theme-violet",accent],["--theme-text",text],["--theme-muted",muted],["--code-caret-color",primary],["--code-border-color",primary+"55"],["--global-graphic",theme.graphicUrl?"url("+theme.graphicUrl+")":"none"],["--global-font-body",theme.fontBody||"Noto Sans Thai"],["--global-font-heading",theme.fontHeading||"Chakra Petch"]].forEach(function (item) { root.style.setProperty(item[0], item[1]); });
    body.classList.add("shared-runtime-theme");
    body.classList.toggle("shared-runtime-motion", theme.motion !== false);
    body.dataset.sharedThemeKey = String(theme.themeKey || "");
    var badge = document.querySelector(".theme-lab-panel .badge"); if (badge) badge.textContent = "SHARED · ROOM 04";
    var hint = document.querySelector(".theme-lab-panel .hint"); if (hint) hint.textContent = "ธีมนี้อ่านจากเว็บหลักและ app_themes ชุดเดียวกัน · แก้ไขที่ THEME CONTROL ROOM";
    var panel = document.querySelector(".theme-lab-panel"); if (panel) panel.hidden = true;
  }
  function applyRuntime(payload) { if (payload && typeof payload === "object" && payload.theme) applyTheme(payload.theme); }
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (event.data && event.data.type === "ST_SHARED_RUNTIME") applyRuntime(event.data);
  });
  function readStoredTheme() {
    try { var theme = JSON.parse(localStorage.getItem("st-bb-global-theme-payload-v1") || "null"); if (theme) applyTheme(theme); }
    catch (_) { /* browser storage may be unavailable */ }
  }
  window.addEventListener("storage", function (event) { if (event.key === "st-bb-global-theme-payload-v1") readStoredTheme(); });
  readStoredTheme();
})();
