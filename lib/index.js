// src/settings.js
import z from "@deepseek-ai/schemastery";

// src/policy.js
var DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  minimumDurationMs: 1e4
});
function normalizeConfig(input) {
  const duration = Number(input?.minimumDurationMs);
  return {
    enabled: input?.enabled !== false,
    minimumDurationMs: Number.isFinite(duration) && duration >= 0 ? Math.floor(duration) : DEFAULT_CONFIG.minimumDurationMs
  };
}
function isMainSession(header) {
  return header.origin !== "subagent" && (header.delegationDepth ?? 0) === 0;
}

// src/settings.js
var NAMESPACE = "task-sound";
var Config = z.object({
  enabled: z.boolean().default(DEFAULT_CONFIG.enabled).volatile(),
  minimumDurationMs: z.number().step(1e3).min(0).max(864e5).default(DEFAULT_CONFIG.minimumDurationMs).volatile()
});
function readConfig(config) {
  return normalizeConfig(Object.fromEntries(
    Object.keys(DEFAULT_CONFIG).map((key) => [key, config[key]?.get?.() ?? config[key] ?? DEFAULT_CONFIG[key]])
  ));
}
function createTaskSoundSettings(ctx, config) {
  let active;
  ctx.inject(["settings"], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), "dsh-task-sound: settings presentation");
    active = { settings: child.settings };
    child.effect(() => () => {
      if (active?.settings === child.settings) active = void 0;
    }, "dsh-task-sound: settings");
  });
  return {
    read: () => readConfig(config),
    async update(patch) {
      const next = normalizeConfig({ ...readConfig(config), ...patch ?? {} });
      if (active === void 0) throw new Error("DSH \u8BBE\u7F6E\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
      const descriptor = active.settings.describe().find((item) => item.ns === NAMESPACE);
      if (descriptor === void 0) throw new Error(`\u627E\u4E0D\u5230\u63D2\u4EF6\u914D\u7F6E\u9879 ${NAMESPACE}`);
      await active.settings.replace(NAMESPACE, next, descriptor.revision);
      return readConfig(config);
    }
  };
}

// src/sound.js
import { spawn } from "node:child_process";
function sendWindowsNotification(notification, options = {}) {
  const platform = options.platform ?? process.platform;
  if (platform !== "win32") return Promise.resolve("unsupported");
  const command = [
    "$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]",
    "$null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime]",
    "$title = [System.Security.SecurityElement]::Escape($env:DSH_TASK_SOUND_TITLE)",
    "$message = [System.Security.SecurityElement]::Escape($env:DSH_TASK_SOUND_MESSAGE)",
    "$xml = New-Object Windows.Data.Xml.Dom.XmlDocument",
    // With no <audio> element, Windows uses the ordinary notification sound.
    `$xml.LoadXml(('<toast><visual><binding template="ToastGeneric"><text>{0}</text><text>{1}</text></binding></visual></toast>' -f $title, $message))`,
    "$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)",
    "$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'",
    "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)",
    "Start-Sleep -Milliseconds 200"
  ].join("; ");
  const spawnImpl = options.spawnImpl ?? spawn;
  return new Promise((resolve, reject) => {
    const child = spawnImpl("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ], {
      windowsHide: true,
      stdio: "ignore",
      env: { ...process.env, DSH_TASK_SOUND_TITLE: notification.title, DSH_TASK_SOUND_MESSAGE: notification.message }
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve("notified") : reject(new Error(`PowerShell exited with code ${String(code)}`)));
  });
}

// src/tracker.js
function createTurnTracker(config, options) {
  const now = options.now ?? (() => performance.now());
  const starts = /* @__PURE__ */ new Map();
  const notified = /* @__PURE__ */ new Set();
  const notifiedOrder = [];
  return {
    /** @param {{id: string, header: {origin?: string, delegationDepth?: number}}} session @param {{type: string, data: any}} event */
    observe(session, event) {
      if (!isMainSession(session.header)) return;
      const turn = event.data?.turn;
      if (!Number.isSafeInteger(turn) || turn < 1) return;
      if (event.type === "turn/start") {
        let turns2 = starts.get(session.id);
        if (turns2 === void 0) {
          turns2 = /* @__PURE__ */ new Map();
          starts.set(session.id, turns2);
        }
        if (!turns2.has(turn)) turns2.set(turn, now());
        return;
      }
      if (event.type !== "turn/end") return;
      const turns = starts.get(session.id);
      const startedAt = turns?.get(turn);
      turns?.delete(turn);
      if (turns?.size === 0) starts.delete(session.id);
      if (event.data?.reason?.kind !== "completed" || startedAt === void 0) return;
      const key = `${session.id}:${String(turn)}`;
      if (notified.has(key)) return;
      const durationMs = Math.max(0, now() - startedAt);
      const currentConfig = typeof config === "function" ? config() : config;
      if (durationMs < currentConfig.minimumDurationMs) return;
      notified.add(key);
      notifiedOrder.push(key);
      if (notifiedOrder.length > 2048) {
        const oldest = notifiedOrder.shift();
        if (oldest !== void 0) notified.delete(oldest);
      }
      const compactId = session.id.startsWith("session-") ? session.id.slice("session-".length) : session.id;
      const title = options.titleFor?.(session)?.trim() || `\u4F1A\u8BDD ${compactId.slice(0, 8)}`;
      options.notify({ sessionId: session.id, title, turn, durationMs });
    }
  };
}

// src/routes.js
var MAX_BODY_BYTES = 64 * 1024;
function registerRoutes({ webServer, handlers }) {
  return webServer.register({
    kind: "prefix",
    path: "/task-sound",
    handler: (request, response) => {
      void handle(request, response, handlers).catch((error) => writeJson(response, 500, { ok: false, error: { message: error instanceof Error ? error.message : String(error) } }));
    }
  });
}
async function handle(request, response, handlers) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const endpoint = url.pathname.slice("/task-sound".length).replace(/^\/+|\/+$/g, "");
  const target = handlers[endpoint];
  if (target === void 0) return writeJson(response, 404, { ok: false, error: { message: "\u672A\u77E5\u7AEF\u70B9" } });
  const method = request.method ?? "GET";
  if (method !== target.method) return writeJson(response, 405, { ok: false, error: { message: "\u8BF7\u6C42\u65B9\u6CD5\u4E0D\u6B63\u786E" } });
  let payload = {};
  if (method === "POST") {
    const raw = await readBody(request);
    if (raw === null) return writeJson(response, 413, { ok: false, error: { message: "\u8BF7\u6C42\u4F53\u8FC7\u5927" } });
    if (raw.trim() !== "") payload = JSON.parse(raw);
  }
  writeJson(response, 200, { ok: true, value: await target.run(payload) });
}
async function readBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function writeJson(response, status, body) {
  const text = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "content-length": Buffer.byteLength(text) });
  response.end(text);
}

// src/index.js
var name = "dsh-task-sound";
var inject = ["sessions", "sessionProjections"];
function apply(ctx, rawConfig) {
  const logger = ctx.logger(name);
  const settings = createTaskSoundSettings(ctx, rawConfig);
  const notify = async (details = { sessionId: "test", title: "DSH \u901A\u77E5\u6D4B\u8BD5", turn: 0, durationMs: 0 }, override, force = false) => {
    const config = override === void 0 ? settings.read() : normalizeConfig({ ...settings.read(), ...override });
    if (!force && !config.enabled) return "disabled";
    const seconds = Math.max(0, Math.round(details.durationMs / 1e3));
    const result = await sendWindowsNotification({
      title: details.title,
      message: details.turn === 0 ? "\u8FD9\u662F\u4E00\u6761 DSH \u4EFB\u52A1\u5B8C\u6210\u63D0\u9192\u6D4B\u8BD5\u3002" : `\u4E3B\u4F1A\u8BDD\u5DF2\u5B8C\u6210\uFF0C\u8017\u65F6 ${String(seconds)} \u79D2\u3002`
    });
    if (result === "unsupported") logger.warn("\u4EFB\u52A1\u5B8C\u6210\u63D0\u9192\u76EE\u524D\u4EC5\u652F\u6301 Windows");
    return result;
  };
  const tracker = createTurnTracker(() => settings.read(), {
    titleFor: (session) => ctx.sessionProjections.snapshot(session, ["title"]).values.title ?? "",
    notify: (details) => {
      void notify(details).catch((error) => logger.warn(`\u53D1\u9001\u4EFB\u52A1\u5B8C\u6210\u63D0\u9192\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`));
    }
  });
  ctx.on("session/event", (session, event) => tracker.observe(session, event));
  ctx.inject(["webServer"], (child) => {
    child.effect(() => registerRoutes({
      webServer: child.webServer,
      handlers: {
        state: { method: "GET", run: async () => ({ config: settings.read() }) },
        config: { method: "POST", run: async (payload) => ({ config: await settings.update(payload?.config ?? payload) }) },
        test: { method: "POST", run: async (payload) => ({ result: await notify(void 0, payload?.config, true) }) }
      }
    }), "dsh-task-sound: routes");
  });
}
export {
  Config,
  DEFAULT_CONFIG,
  apply,
  createTurnTracker,
  inject,
  isMainSession,
  name,
  normalizeConfig,
  sendWindowsNotification
};
