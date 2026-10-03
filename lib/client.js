window.__ModuleLoader__.load({ id: "dsh-task-sound", factory: (require, module, exports) => {
var module = { exports: {} }; var exports = module.exports;
globalThis.__dshTaskSoundRequire = require;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/api.js
var BASE = "/task-sound";
async function call(endpoint, body = null) {
  const response = await fetch(`${BASE}/${endpoint}`, body === null ? {
    method: "GET",
    credentials: "same-origin"
  } : {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${String(response.status)}\uFF09`);
  return payload.value;
}
var readState = () => call("state");
var saveConfig = (config2) => call("config", { config: config2 });
var testNotification = (config2) => call("test", { config: config2 });

// src/client/store.js
var config = null;
var draft = null;
var busy = false;
var testing = false;
var error = null;
var snapshot = { config, draft, dirty: false, busy, testing, error };
var listeners = /* @__PURE__ */ new Set();
function refresh() {
  const dirty = config !== null && draft !== null && JSON.stringify(config) !== JSON.stringify(draft);
  snapshot = { config, draft, dirty, busy, testing, error };
  for (const listener of listeners) listener();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return snapshot;
}
function stage(patch) {
  draft = { ...draft ?? config ?? {}, ...patch };
  error = null;
  refresh();
}
function discard() {
  draft = config === null ? null : { ...config };
  error = null;
  refresh();
}
async function load() {
  busy = true;
  refresh();
  try {
    const state = await readState();
    config = state.config;
    draft = { ...state.config };
    error = null;
  } catch (reason) {
    error = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy = false;
    refresh();
  }
}
async function save() {
  if (draft === null || busy) return;
  busy = true;
  error = null;
  refresh();
  try {
    const result = await saveConfig(draft);
    config = result.config;
    draft = { ...result.config };
  } catch (reason) {
    error = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy = false;
    refresh();
  }
}
async function test() {
  if (testing) return;
  testing = true;
  error = null;
  refresh();
  try {
    await testNotification(draft ?? config ?? {});
  } catch (reason) {
    error = reason instanceof Error ? reason.message : String(reason);
  } finally {
    testing = false;
    refresh();
  }
}

// src/client/settings-section.js
var ARM_INTERVAL_MS = 200;
var ARM_TIMEOUT_MS = 3e4;
function moduleRequire() {
  const requireFunction = globalThis.__dshTaskSoundRequire;
  if (typeof requireFunction !== "function") throw new Error("dsh-task-sound: module-table require is not available");
  return requireFunction;
}
var React = () => moduleRequire()("react");
function Row({ title, hint, control }) {
  const R = React();
  return R.createElement(
    "div",
    { className: "dts-row" },
    R.createElement("div", { className: "dts-text" }, R.createElement("div", { className: "dts-title" }, title), R.createElement("div", { className: "dts-hint" }, hint)),
    R.createElement("div", { className: "dts-control" }, control)
  );
}
function Switch(props) {
  const R = React();
  const { Switch: NativeSwitch } = moduleRequire()("@deepseek-ai/dsh-client-ui-primitives");
  return R.createElement(NativeSwitch, props);
}
function SettingsPage() {
  const R = React();
  const { useEffect, useSyncExternalStore } = R;
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void load();
  }, []);
  const draft2 = state.draft;
  if (draft2 === null) return R.createElement("div", { className: "dts-hint" }, state.error ?? "\u6B63\u5728\u52A0\u8F7D\u4EFB\u52A1\u63D0\u9192\u8BBE\u7F6E\u2026");
  return R.createElement(
    "div",
    { className: "dts-page" },
    state.dirty && R.createElement("div", { className: "dts-pending" }, "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),
    state.error && R.createElement("div", { className: "dts-error" }, state.error),
    R.createElement(Row, { title: "\u542F\u7528\u4EFB\u52A1\u5B8C\u6210\u63D0\u9192", hint: "\u53EA\u63D0\u9192\u4E3B\u4F1A\u8BDD\u6210\u529F\u5B8C\u6210\uFF1B\u5B50\u4EE3\u7406\u3001\u5931\u8D25\u548C\u53D6\u6D88\u7684\u56DE\u5408\u4E0D\u4F1A\u63D0\u9192\u3002", control: R.createElement(Switch, { label: "\u542F\u7528\u4EFB\u52A1\u5B8C\u6210\u63D0\u9192", checked: draft2.enabled !== false, disabled: state.busy, onChange: (checked) => stage({ enabled: checked }) }) }),
    R.createElement(Row, { title: "\u6700\u77ED\u4EFB\u52A1\u65F6\u957F", hint: "\u77ED\u4E8E\u8BE5\u65F6\u957F\u7684\u4E3B\u4F1A\u8BDD\u4E0D\u63D0\u9192\uFF1B\u8BBE\u4E3A 0 \u8868\u793A\u6BCF\u6B21\u6210\u529F\u5B8C\u6210\u90FD\u63D0\u9192\u3002", control: R.createElement(R.Fragment, null, R.createElement("input", { className: "dts-input", type: "number", min: 0, max: 86400, step: 1, value: String(Math.round((draft2.minimumDurationMs ?? 1e4) / 1e3)), disabled: state.busy, onChange: (event) => stage({ minimumDurationMs: Math.max(0, Number.parseInt(event.target.value || "0", 10)) * 1e3 }) }), R.createElement("span", { className: "dts-unit" }, "\u79D2")) }),
    R.createElement(
      "div",
      { className: "dts-footer" },
      R.createElement("button", { type: "button", className: "dts-button", disabled: state.testing || state.busy, onClick: () => {
        void test();
      } }, state.testing ? "\u6D4B\u8BD5\u4E2D\u2026" : "\u6D4B\u8BD5\u63D0\u9192"),
      R.createElement("button", { type: "button", className: "dts-button", disabled: !state.dirty || state.busy, onClick: discard }, "\u653E\u5F03"),
      R.createElement("button", { type: "button", className: "dts-button dts-button-primary", disabled: !state.dirty || state.busy, onClick: () => {
        void save();
      } }, state.busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58")
    )
  );
}
var SUMMARY = {
  en: "Configure Windows notifications when main sessions complete",
  zh: "\u914D\u7F6E\u4E3B\u4F1A\u8BDD\u5B8C\u6210\u540E\u7684 Windows \u901A\u77E5"
};
function TaskSoundSettingsSection({ view, locale } = {}) {
  const R = React();
  const { useSyncExternalStore } = R;
  useSyncExternalStore(
    locale === void 0 ? () => () => {
    } : (listener) => locale.subscribe(listener),
    locale === void 0 ? () => void 0 : () => locale.getSnapshot(),
    () => void 0
  );
  if (view !== "summary") return R.createElement(SettingsPage);
  const summary = locale === void 0 ? SUMMARY.zh : locale.resolveText(SUMMARY);
  return R.createElement("span", null, summary);
}
function armSettingsSection(ctx) {
  const startedAt = Date.now();
  let timer;
  let done = false;
  let dispose = null;
  const attempt = () => {
    if (done) return;
    const slots = ctx.get("slots");
    const locale = ctx.get("locale");
    if (slots === void 0 || locale === void 0) {
      if (Date.now() - startedAt <= ARM_TIMEOUT_MS) timer = window.setTimeout(attempt, ARM_INTERVAL_MS);
      return;
    }
    done = true;
    const Section = (props) => React().createElement(TaskSoundSettingsSection, { ...props, locale });
    dispose = slots.inject("plugins.bundle.config", () => slots.register({ name: "plugins.bundle.config", key: "dsh-task-sound" }, Section));
  };
  timer = window.setTimeout(attempt, ARM_INTERVAL_MS);
  return () => {
    done = true;
    if (timer !== void 0) window.clearTimeout(timer);
    if (typeof dispose === "function") dispose();
  };
}

// src/client/styles.js
var STYLE_ID = "dsh-task-sound-styles";
var CSS = `
.dts-page { display:flex; flex-direction:column; width:100%; }
.dts-row { display:flex; align-items:center; justify-content:space-between; gap:24px; min-height:62px; padding:12px 0; border-bottom:.5px solid var(--dsw-alias-border-l2); }
.dts-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.dts-title { font-size:14px; line-height:22px; color:var(--dsw-alias-label-primary); }
.dts-hint { font-size:12px; line-height:18px; color:var(--dsw-alias-label-caption); }
.dts-control { flex:none; display:flex; align-items:center; gap:8px; }
.dts-input,.dts-select { box-sizing:border-box; height:32px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); padding:0 9px; font:inherit; font-size:13px; }
.dts-input[type=number] { width:100px; text-align:right; }
.dts-input[type=text] { width:220px; }
.dts-unit { font-size:12px; color:var(--dsw-alias-label-caption); }
.dts-footer { display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:12px 0 4px; }
.dts-button { appearance:none; padding:5px 14px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:13px; cursor:pointer; }
.dts-button-primary { border-color:transparent; background:var(--dsw-alias-label-primary); color:var(--dsw-alias-bg-layer-3); }
.dts-button:disabled { opacity:.4; cursor:default; }
.dts-pending { color:var(--dsw-alias-label-secondary); font-size:12px; padding-top:8px; }
.dts-error { color:var(--dsw-alias-state-error-primary); font-size:12px; padding-top:8px; }
`;
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// src/client/index.js
var inject = [];
function apply(ctx) {
  injectStyles();
  const dispose = armSettingsSection(ctx);
  globalThis.__dshTaskSound = { open: () => document.querySelector("button") };
  return () => {
    dispose();
    delete globalThis.__dshTaskSound;
  };
}
return { apply: apply, inject: inject }; } });
