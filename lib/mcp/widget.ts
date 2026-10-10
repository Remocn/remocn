/**
 * The MCP App view behind `ui://remocn/preview`. One self-contained HTML
 * document, no bundle: it speaks the MCP Apps postMessage dialect directly
 * (JSON-RPC 2.0 over `window.parent.postMessage`) and iframes remocn.dev's
 * chrome-less `/embed/<name>` player pages instead of shipping Remotion.
 *
 * Method names follow `@modelcontextprotocol/ext-apps@2.0.3`
 * (`spec.types.d.ts`, spec 2026-01-26): `ui/initialize` →
 * `ui/notifications/initialized`, then `ui/notifications/tool-input` /
 * `ui/notifications/tool-result` from the host, `ui/open-link` and
 * `ui/notifications/size-changed` from the view.
 *
 * It renders `structuredContent` of either tool:
 * - `{ kind: "preview", … }` from `preview_component`
 * - `{ kind: "plan", … }` from `plan_video`
 */

const STYLE = `
:root { color-scheme: light dark; --bg: #ffffff; --fg: #111111; --muted: #6b6b6b; --border: #e5e5e5; --card: #fafafa; --accent: #2563eb; }
:root[data-theme="dark"] { --bg: #0b0b0b; --fg: #f2f2f2; --muted: #9a9a9a; --border: #262626; --card: #141414; --accent: #60a5fa; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
main { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
h1 { font-size: 15px; margin: 0; font-weight: 600; }
h2 { font-size: 13px; margin: 0; font-weight: 600; }
p { margin: 0; }
.muted { color: var(--muted); font-size: 12px; }
.stage { position: relative; width: 100%; aspect-ratio: 16 / 9; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--card); }
.stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.stage .empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted); font-size: 12px; padding: 12px; text-align: center; }
.beats { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.beat { display: flex; flex-direction: column; gap: 6px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { border: 1px solid var(--border); background: transparent; color: var(--fg); border-radius: 999px; padding: 1px 8px; font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; cursor: pointer; }
.chip[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
.chip.new { cursor: default; border-style: dashed; color: var(--muted); }
.copy { display: flex; gap: 6px; align-items: stretch; }
.copy code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; border: 1px solid var(--border); background: var(--card); border-radius: 8px; padding: 6px 8px; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
button.action { border: 1px solid var(--border); background: var(--card); color: var(--fg); border-radius: 8px; padding: 0 10px; font: inherit; font-size: 12px; cursor: pointer; }
a { color: var(--accent); }
`;

const SCRIPT = `
(function () {
  var nextId = 1;
  var pending = {};
  var root = document.getElementById("root");

  function send(msg) { window.parent.postMessage(msg, "*"); }
  function request(method, params) {
    var id = nextId++;
    send({ jsonrpc: "2.0", id: id, method: method, params: params || {} });
    return new Promise(function (resolve, reject) { pending[id] = { resolve: resolve, reject: reject }; });
  }
  function notify(method, params) { send({ jsonrpc: "2.0", method: method, params: params || {} }); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") node.textContent = attrs[k];
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function openLink(url) {
    request("ui/open-link", { url: url }).catch(function () { window.open(url, "_blank", "noopener"); });
  }
  function link(text, url) {
    return el("a", { href: url, text: text, onclick: function (e) { e.preventDefault(); openLink(url); } });
  }

  function copyText(text, button) {
    function done(ok) {
      var label = button.textContent;
      button.textContent = ok ? "Copied" : "Select + copy";
      setTimeout(function () { button.textContent = label; }, 1500);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }
  function copyRow(label, text) {
    var button = el("button", { class: "action", type: "button", text: "Copy" });
    button.addEventListener("click", function () { copyText(text, button); });
    return el("div", {}, [
      el("p", { class: "muted", text: label }),
      el("div", { class: "copy" }, [el("code", { text: text }), button]),
    ]);
  }

  function stage(src, title) {
    var box = el("div", { class: "stage" });
    if (src) {
      box.appendChild(el("iframe", { src: src, title: title, loading: "lazy", allow: "autoplay; fullscreen" }));
    } else {
      box.appendChild(el("div", { class: "empty", text: "No live preview for this beat. The recipe asks for a new component here." }));
    }
    return box;
  }

  function renderPreview(data) {
    root.replaceChildren(
      el("h1", { text: data.title + " (" + data.name + ")" }),
      stage(data.embedUrl, data.title),
      el("p", { class: "muted" }, [link("Docs", data.docsPage), document.createTextNode(" · " + data.durationInFrames + "f @ " + data.fps + "fps")]),
      copyRow("Install", data.install)
    );
  }

  function renderBeat(beat) {
    var frames = beat.startFrame != null && beat.endFrame != null ? " · " + beat.startFrame + "–" + beat.endFrame + "f" : "";
    var current = beat.preview;
    var box = stage(current && current.embedUrl, beat.name);
    var chips = el("div", { class: "chips" });
    (beat.options || []).forEach(function (opt) {
      var chip = el("button", { class: "chip", type: "button", text: opt.name, "aria-pressed": String(!!current && opt.name === current.name) });
      if (opt.embedUrl) {
        chip.addEventListener("click", function () {
          box.replaceChildren(el("iframe", { src: opt.embedUrl, title: opt.name, allow: "autoplay; fullscreen" }));
          chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        });
      } else chip.disabled = true;
      chips.appendChild(chip);
    });
    (beat.buildNew || []).forEach(function (name) {
      chips.appendChild(el("span", { class: "chip new", text: "build: " + name }));
    });
    return el("section", { class: "beat" }, [
      el("h2", { text: beat.name + frames }),
      beat.what ? el("p", { class: "muted", text: beat.what.replace(/\\*\\*|\`/g, "") }) : null,
      box,
      chips,
    ]);
  }

  function renderPlan(data) {
    root.replaceChildren(
      el("h1", { text: "Video plan: " + data.archetype + (data.variant ? " · " + data.variant : "") }),
      el("p", { class: "muted", text: data.brief }),
      el("div", { class: "beats" }, data.beats.map(renderBeat)),
      data.install ? copyRow("Install the picked components", data.install) : null,
      copyRow("Claude Code", data.prompts.claudeCode),
      copyRow("Codex / any agent", data.prompts.generic)
    );
  }

  function render(result) {
    var data = result && result.structuredContent;
    if (!data) {
      var text = (result && result.content || []).filter(function (c) { return c.type === "text"; }).map(function (c) { return c.text; }).join("\\n\\n");
      root.replaceChildren(el("pre", { text: text || "No result." }));
      return;
    }
    if (data.kind === "preview") renderPreview(data);
    else if (data.kind === "plan") renderPlan(data);
  }

  function applyContext(ctx) {
    if (ctx && (ctx.theme === "dark" || ctx.theme === "light")) {
      document.documentElement.setAttribute("data-theme", ctx.theme);
    }
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var msg = event.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (msg.id != null && !msg.method) {
      var p = pending[msg.id]; delete pending[msg.id];
      if (p) msg.error ? p.reject(msg.error) : p.resolve(msg.result);
      return;
    }
    if (msg.method === "ui/notifications/tool-result") render(msg.params);
    else if (msg.method === "ui/notifications/tool-input") root.replaceChildren(el("p", { class: "muted", text: "Working…" }));
    else if (msg.method === "ui/notifications/host-context-changed") applyContext(msg.params);
    else if (msg.id != null) send({ jsonrpc: "2.0", id: msg.id, result: {} });
  });

  new ResizeObserver(function () {
    notify("ui/notifications/size-changed", { height: Math.ceil(document.documentElement.scrollHeight) });
  }).observe(document.body);

  request("ui/initialize", {
    appInfo: { name: "remocn-preview", version: "1.0.0" },
    appCapabilities: {},
    protocolVersion: "2026-01-26",
  }).then(function (res) {
    applyContext(res && res.hostContext);
    notify("ui/notifications/initialized", {});
  }, function () {});
})();
`;

export const PREVIEW_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>remocn preview</title>
<style>${STYLE}</style>
</head>
<body>
<main id="root"><p class="muted">Waiting for the tool result…</p></main>
<script>${SCRIPT}</script>
</body>
</html>
`;
