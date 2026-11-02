"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export type DeployLogTone = "default" | "muted" | "success" | "warn";

export interface DeployLogLine {
  text: string;
  tone?: DeployLogTone;
  /** Frames to wait after the previous line (default 3). */
  wait?: number;
}

export interface DeployPipelineProps {
  project?: string;
  deploymentId?: string;
  commitMessage?: string;
  commitSha?: string;
  branch?: string;
  domain?: string;
  logs?: (string | DeployLogLine)[];
  /** Duration the counter lands on, in seconds. */
  buildSeconds?: number;
  /** Site screenshot shown once the deployment is ready. */
  preview?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_LOGS: DeployLogLine[] = [
  { text: "Running build in Washington, D.C., USA (East) – iad1", wait: 0 },
  { text: "Build machine configuration: 4 cores, 8 GB" },
  { text: "Cloning git.kitebase.dev/remocn-web (branch main, commit a4f9c21)" },
  { text: "Cloning completed: 412.000ms", wait: 7 },
  { text: "Restored build cache from previous deployment (8kQ2v1Xa)" },
  { text: 'Running "bun install"' },
  {
    text: 'Warning: "engines": { "node": ">=20" } will upgrade the runtime on the next major',
    tone: "warn",
  },
  { text: "bun install v1.2.4 (a3f1e2c4)", tone: "muted", wait: 4 },
  { text: "312 packages installed [4.21s]", wait: 11 },
  { text: 'Running "bun run build"' },
  { text: "  Creating an optimized production build ...", wait: 4 },
  { text: "✓ Compiled successfully in 9.8s", tone: "success", wait: 13 },
  { text: "✓ Generating static pages (24/24)", tone: "success", wait: 6 },
  {
    text: "Route                         Size   First load",
    tone: "muted",
    wait: 5,
  },
  { text: "┌ ○ /                       5.21 kB       112 kB", wait: 2 },
  { text: "├ ○ /docs                   3.08 kB       109 kB", wait: 2 },
  { text: "├ ƒ /api/render                 0 B       101 kB", wait: 2 },
  { text: "└ ○ /changelog              1.84 kB       104 kB", wait: 2 },
  { text: "Build completed in /out [21s]", wait: 6 },
  { text: "Deploying outputs...", wait: 5 },
  { text: "Deployment completed", tone: "success", wait: 10 },
];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const LOG_START = 16;
const ROW_H = 24;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const DARK = {
  dark: true,
  window: "#0B0C0E",
  raised: "#111215",
  text: "#EDEDEF",
  muted: "#8F9198",
  faint: "#5D5F66",
  rule: "rgba(255,255,255,0.07)",
  warnBg: "rgba(245,166,35,0.08)",
  warnText: "#F2B455",
  success: "#45D38E",
  amber: "#F5A623",
  skeleton: "rgba(255,255,255,0.05)",
  depth:
    "0 0 0 1px rgba(255,255,255,0.09), 0 12px 24px -12px rgba(0,0,0,0.6), 0 40px 90px -24px rgba(0,0,0,0.75)",
  outline: "rgba(255,255,255,0.1)",
  button: "#EDEDEF",
  buttonText: "#0B0C0E",
};
const LIGHT: typeof DARK = {
  dark: false,
  window: "#FFFFFF",
  raised: "#F7F7F6",
  text: "#18181A",
  muted: "#6E6E73",
  faint: "#A3A3A8",
  rule: "rgba(20,20,30,0.08)",
  warnBg: "#FFF6E3",
  warnText: "#985200",
  success: "#14925A",
  amber: "#D98A0B",
  skeleton: "rgba(20,20,30,0.05)",
  depth:
    "0 0 0 1px rgba(20,22,30,0.06), 0 2px 4px rgba(20,22,30,0.04), 0 40px 90px -24px rgba(20,30,80,0.3)",
  outline: "rgba(0,0,0,0.1)",
  button: "#18181A",
  buttonText: "#FFFFFF",
};
type Palette = typeof DARK;

const ICONS: Record<string, string> = {
  branch:
    "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  commit: "M12 15a3 3 0 100-6 3 3 0 000 6zM3 12h6M15 12h6",
  globe:
    "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  external:
    "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
};

function Icon({
  name,
  size = 16,
  color,
}: {
  name: string;
  size?: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function Spinner({
  frame,
  size,
  track,
  color,
}: {
  frame: number;
  size: number;
  track: string;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${frame * 14}deg)`, flexShrink: 0 }}
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={track}
        strokeWidth={2}
      />
      <path
        d="M12 3a9 9 0 019 9"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Field({
  label,
  children,
  c,
}: {
  label: string;
  children: React.ReactNode;
  c: Palette;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}
    >
      <span style={{ fontSize: 14, color: c.muted }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
          color: c.text,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const d = Math.floor(ms);
  const m = Math.floor(d / 60000) % 60;
  const s = Math.floor(d / 1000) % 60;
  const x = d % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(m)}:${p(s)}.${p(x, 3)}`;
}

export function DeployPipeline({
  project = "remocn-web",
  deploymentId = "7Hq2xKfaW",
  commitMessage = "feat: launch video components",
  commitSha = "a4f9c21",
  branch = "main",
  domain = "remocn-web.kitebase.app",
  logs = DEFAULT_LOGS,
  buildSeconds = 21,
  preview,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: DeployPipelineProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 720 : 1280;
  const SH = tall ? 1280 : 720;
  const u = Math.min(width / SW, height / SH);
  const c = theme === "dark" ? DARK : LIGHT;
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });
  const ease = (a: number, b: number, easing = ENTER) =>
    interpolate(frame, [a, b], [0, 1], { ...CL, easing });

  const WIN = tall
    ? { x: 80, y: 290, w: 560, h: 900 }
    : { x: 140, y: 60, w: 1000, h: 600 };
  const PAD = tall ? 22 : 26;
  const HEAD = 58;
  const PREV = tall
    ? { w: WIN.w - PAD * 2, h: Math.round(((WIN.w - PAD * 2) * 9) / 16) }
    : { w: 256, h: 144 };
  const SUMMARY_H = tall ? PREV.h + 284 : PREV.h + 48;
  const LOG_TOP = HEAD + SUMMARY_H;
  const LOG_HEAD = 52;
  const LOG_ROWS = Math.floor((WIN.h - LOG_TOP - LOG_HEAD - 12) / ROW_H);

  const lines = logs.map((l) => (typeof l === "string" ? { text: l } : l));
  const ats: number[] = [];
  let at = LOG_START;
  lines.forEach((l, i) => {
    at += l.wait ?? (i === 0 ? 0 : 3);
    ats.push(at);
  });
  const readyAt = (ats[ats.length - 1] ?? LOG_START) + 8;
  const ready = frame >= readyAt;
  const building = frame >= LOG_START && !ready;
  const elapsed = interpolate(
    frame,
    [LOG_START, readyAt],
    [0, buildSeconds],
    CL,
  );
  const msPerFrame = (buildSeconds * 1000) / Math.max(1, readyAt - LOG_START);
  const baseMs = (2 * 60 + 11) * 1000 + 204;

  const win = sp(0, HEAVY);
  const winFade = ease(0, 12);
  const cam = interpolate(frame, [0, 180], [1, 1.035], {
    ...CL,
    easing: CAMERA,
  });
  const headIn = ease(4, 20);

  const appear = ats.map((t) => ease(t, t + 6));
  const total = appear.reduce((a, b) => a + b, 0);
  const scroll = Math.max(0, total - LOG_ROWS) * ROW_H;

  const previewS = sp(readyAt + 2, MORPH);
  const previewFade = ease(readyAt + 2, readyAt + 14);
  const skeletonOut = 1 - ease(readyAt, readyAt + 8, EXIT);
  const visitS = sp(readyAt + 10, CARD);
  const checkS = sp(readyAt, CHIP);
  const statusSwap = ease(readyAt, readyAt + 8);
  const shimmer = ((frame * 1.6) % 160) - 30;
  const statusColor = ready ? c.success : building ? c.amber : c.faint;
  const pulse = ready ? clamp((frame - readyAt) / 24) : (frame % 26) / 26;

  const seconds = Math.floor(elapsed);
  const statusLabel = ready ? "Ready" : building ? "Building" : "Queued";

  const fieldsGrid = (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: tall ? "1fr 1fr" : "1fr 0.8fr 1.1fr",
        rowGap: tall ? 22 : 20,
        columnGap: 24,
        alignContent: "start",
        minWidth: 0,
      }}
    >
      <Field label="Status" c={c}>
        <span
          style={{
            position: "relative",
            width: 9,
            height: 9,
            display: "inline-block",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 5,
              background: statusColor,
              opacity: (1 - pulse) * 0.35,
              transform: `scale(${1 + pulse * 1.6})`,
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 5,
              background: statusColor,
              transform: `scale(${ready ? 0.6 + 0.4 * checkS : 1})`,
            }}
          />
        </span>
        <span
          style={{
            display: "inline-block",
            opacity: ready ? statusSwap : 1,
            transform: `translateY(${ready ? (1 - statusSwap) * 8 : 0}px)`,
          }}
        >
          {statusLabel}
        </span>
      </Field>
      <Field label="Duration" c={c}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {frame < LOG_START ? "–" : `${seconds}s`}
        </span>
      </Field>
      {tall ? null : (
        <Field label="Environment" c={c}>
          Production
        </Field>
      )}
      <div style={{ gridColumn: tall ? "1 / 3" : "1 / 3" }}>
        <Field label="Domain" c={c}>
          <Icon name="globe" size={16} color={c.muted} />
          <span style={{ color: ready ? c.text : c.faint }}>{domain}</span>
          {ready ? <Icon name="external" size={14} color={c.muted} /> : null}
        </Field>
      </div>
      <div style={{ gridColumn: tall ? "1 / 3" : "auto" }}>
        <Field label="Source" c={c}>
          <Icon name="branch" size={15} color={c.muted} />
          <span style={{ fontFamily: mono.fontFamily, fontSize: 15 }}>
            {branch}
          </span>
          <Icon name="commit" size={15} color={c.muted} />
          <span style={{ fontFamily: mono.fontFamily, fontSize: 15 }}>
            {commitSha}
          </span>
          {tall ? (
            <span
              style={{
                color: c.muted,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {commitMessage}
            </span>
          ) : null}
        </Field>
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: geist.fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (c.dark ? "film-blue" : "paper-crease")}
        params={groundParams}
        timeOffset={c.dark ? 5 : 3}
        timeScale={0.4}
      />
      <div
        style={{
          position: "absolute",
          left: (width - SW * u) / 2,
          top: (height - SH * u) / 2,
          width: SW,
          height: SH,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        {tall ? (
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: 150,
              width: WIN.w,
              fontSize: 52,
              fontWeight: 300,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
              color: c.dark ? "#F2F4F8" : "#16181D",
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 18}px)`,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {ready ? (
              <span
                style={{
                  display: "inline-block",
                  opacity: statusSwap,
                  transform: `translateY(${(1 - statusSwap) * 14}px)`,
                }}
              >
                Live in {buildSeconds}s
              </span>
            ) : (
              <span>
                Building
                <span style={{ color: c.muted }}>
                  {" "}
                  · {frame < LOG_START ? 0 : seconds}s
                </span>
              </span>
            )}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: 18,
            overflow: "hidden",
            background: c.window,
            boxShadow: c.depth,
            opacity: winFade,
            transformOrigin: "50% 50%",
            transform: `translateY(${(1 - win) * 60}px) scale(${(0.96 + 0.04 * win) * cam})`,
          }}
        >
          <div
            style={{
              height: HEAD,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: `0 ${PAD}px`,
              boxShadow: `inset 0 -1px 0 ${c.rule}`,
              fontSize: 15,
              whiteSpace: "nowrap",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 2,
                width: `${(elapsed / buildSeconds) * 100}%`,
                background: accent,
                opacity: 1 - ease(readyAt + 2, readyAt + 12, EXIT),
              }}
            />
            <span style={{ color: c.text }}>{project}</span>
            <span style={{ color: c.faint }}>/</span>
            {tall ? null : (
              <>
                <span style={{ color: c.muted }}>Deployments</span>
                <span style={{ color: c.faint }}>/</span>
              </>
            )}
            <span
              style={{
                color: c.muted,
                fontFamily: mono.fontFamily,
                fontSize: 14,
              }}
            >
              {deploymentId}
            </span>
            <div style={{ marginLeft: "auto" }} />
            {frame >= readyAt + 10 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 9,
                  background: c.button,
                  color: c.buttonText,
                  fontSize: 15,
                  transformOrigin: "100% 50%",
                  transform: `scale(${0.85 + 0.15 * visitS})`,
                  opacity: clamp(visitS * 1.5),
                }}
              >
                Visit
                <Icon name="external" size={14} color={c.buttonText} />
              </div>
            ) : null}
          </div>
          <div
            style={{
              height: SUMMARY_H,
              boxSizing: "border-box",
              padding: `24px ${PAD}px`,
              display: "flex",
              flexDirection: tall ? "column" : "row",
              gap: tall ? 26 : 32,
              boxShadow: `inset 0 -1px 0 ${c.rule}`,
            }}
          >
            <div
              style={{
                position: "relative",
                width: PREV.w,
                height: PREV.h,
                flexShrink: 0,
                borderRadius: 10,
                overflow: "hidden",
                background: c.raised,
              }}
            >
              <div
                style={{ position: "absolute", inset: 0, opacity: skeletonOut }}
              >
                {[
                  [0.06, 0.1, 0.14, 0.05],
                  [0.7, 0.08, 0.22, 0.07],
                  [0.22, 0.34, 0.56, 0.1],
                  [0.3, 0.5, 0.4, 0.07],
                  [0.38, 0.66, 0.24, 0.09],
                ].map(([x, y, w, h]) => (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      position: "absolute",
                      left: `${x * 100}%`,
                      top: `${y * 100}%`,
                      width: `${w * 100}%`,
                      height: `${h * 100}%`,
                      borderRadius: 999,
                      background: c.skeleton,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(100deg, transparent ${shimmer - 24}%, ${c.dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)"} ${shimmer}%, transparent ${shimmer + 24}%)`,
                  }}
                />
              </div>
              {ready ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: previewFade,
                    transform: `scale(${1.06 - 0.06 * previewS})`,
                    filter: `blur(${(1 - previewS) * 6}px)`,
                  }}
                >
                  <Img
                    src={preview ?? staticFile("hero.png")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  boxShadow: `inset 0 0 0 1px ${c.outline}`,
                }}
              />
            </div>
            {fieldsGrid}
          </div>
          <div
            style={{
              height: LOG_HEAD,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: `0 ${PAD}px`,
            }}
          >
            <span style={{ fontSize: 16, color: c.text }}>Build logs</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 15,
                color: c.muted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {frame < LOG_START ? "" : `${seconds}s`}
            </span>
            {ready ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: c.success,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${checkS})`,
                }}
              >
                <svg
                  width={11}
                  height={11}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={c.window}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </div>
            ) : building ? (
              <Spinner frame={frame} size={16} track={c.rule} color={c.amber} />
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              top: LOG_TOP + LOG_HEAD,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: "hidden",
              fontFamily: mono.fontFamily,
              fontSize: 14,
              maskImage: `linear-gradient(to bottom, rgba(0,0,0,${1 - clamp(scroll / ROW_H)}) 0, #000 30px)`,
            }}
          >
            <div style={{ transform: `translateY(${-scroll}px)` }}>
              {lines.map((l, i) => {
                const p = appear[i];
                if (p <= 0) return null;
                const tone = l.tone ?? "default";
                const color =
                  tone === "warn"
                    ? c.warnText
                    : tone === "success"
                      ? c.success
                      : tone === "muted"
                        ? c.muted
                        : c.text;
                const ms =
                  baseMs +
                  (ats[i] - LOG_START) * msPerFrame +
                  Math.floor(hash(i) * 90);
                return (
                  <div
                    key={`${i}-${l.text}`}
                    style={{
                      height: ROW_H,
                      display: "flex",
                      alignItems: "center",
                      padding: `0 ${PAD}px`,
                      background: tone === "warn" ? c.warnBg : "transparent",
                      opacity: p,
                      transform: `translateX(${(1 - p) * -10}px)`,
                      whiteSpace: "pre",
                    }}
                  >
                    {tall ? null : (
                      <span
                        style={{ width: 104, flexShrink: 0, color: c.faint }}
                      >
                        {formatTime(ms)}
                      </span>
                    )}
                    <span
                      style={{
                        color,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {l.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
