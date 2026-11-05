"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface BrowserExtensionProps {
  url?: string;
  siteName?: string;
  kicker?: string;
  title?: string;
  dek?: string;
  author?: string;
  date?: string;
  paragraphs?: string[];
  highlights?: string[];
  summary?: string[];
  extensionName?: string;
  collection?: string;
  saveLabel?: string;
  highlightColor?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_PARAGRAPHS = [
  "Every launch we studied had the same shape. The teams that shipped weekly were not the ones with the biggest roadmaps; they were the ones with the shortest distance between a decision and a deploy.",
  "Small teams win because context never has to travel. When the person who talks to customers is the person who writes the code, a bug report becomes a fix before lunch. Nobody writes a ticket about a ticket.",
  "That speed compounds. A team that ships twenty small releases learns twenty times; a team that ships one big release learns once, usually too late to change course.",
  "The lesson is not to stay small forever. It is to protect the short loop as you grow: fewer handoffs, smaller batches, and owners who can ship without asking.",
];
const DEFAULT_HIGHLIGHTS = [
  "they were the ones with the shortest distance between a decision and a deploy.",
  "Small teams win because context never has to travel.",
  "A team that ships twenty small releases learns twenty times",
];
const DEFAULT_SUMMARY = [
  "Weekly shippers keep the loop from decision to deploy short.",
  "Context stays with one owner, so bug reports become fixes fast.",
  "Many small releases teach more than one big launch.",
];

interface Layout {
  w: number;
  h: number;
  win: { x: number; y: number; w: number; h: number };
  articleW: number;
  body: number;
  title: number;
  padTop: number;
  cursorFrom: { x: number; y: number };
}

const LAYOUT_WIDE: Layout = {
  w: 1280,
  h: 720,
  win: { x: 140, y: 64, w: 1000, h: 600 },
  articleW: 492,
  body: 17,
  title: 40,
  padTop: 92,
  cursorFrom: { x: 560, y: 560 },
};

const LAYOUT_TALL: Layout = {
  w: 760,
  h: 1351,
  win: { x: 40, y: 166, w: 680, h: 1020 },
  articleW: 560,
  body: 19,
  title: 44,
  padTop: 150,
  cursorFrom: { x: 420, y: 980 },
};

const TABS_H = 40;
const BAR_H = 48;
const CHROME = TABS_H + BAR_H;
const POP_W = 372;
const extOf = (w: number) => ({ x: w - 112, y: TABS_H + 8, s: 32 });
const popOf = (w: number) => {
  const ext = extOf(w);
  const right = w - (ext.x + ext.s) - 8;
  return { x: w - right - POP_W, top: CHROME + 6 };
};

const T = {
  click: 30,
  read: 36,
  hl: [54, 66, 78],
  sum: 84,
  toSave: 108,
  save: 126,
  saved: 138,
  close: 160,
  toast: 162,
};

const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enterE = Easing.bezier(0.22, 1, 0.36, 1);
const moveE = Easing.bezier(0.65, 0, 0.35, 1);
const exitE = Easing.bezier(0.55, 0, 1, 0.45);
const camE = Easing.bezier(0.87, 0, 0.13, 1);
const tween = (f: number, a: number, b: number, easing = enterE) =>
  interpolate(f, [a, b], [0, 1], { ...clampX, easing });

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Pt {
  x: number;
  y: number;
}
interface Key extends Pt {
  t: number;
}

function pathAt(keys: Key[], f: number): Pt {
  if (f <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.t) {
      const p = moveE(
        Math.min(1, Math.max(0, (f - a.t) / Math.max(1, b.t - a.t))),
      );
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const lift = Math.sin(p * Math.PI) * Math.min(36, d * 0.12);
      return {
        x: a.x + dx * p + (-dy / d) * lift,
        y: a.y + dy * p + (dx / d) * lift,
      };
    }
  }
  return keys[keys.length - 1];
}

type SpringCfg = { mass?: number; damping: number; stiffness?: number };
const HEAVY: SpringCfg = { mass: 1, damping: 26, stiffness: 120 };
const CARD: SpringCfg = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP: SpringCfg = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH: SpringCfg = { damping: 200 };

interface Pal {
  base: string;
  scrim: string;
  popShadow: string;
  tabs: string;
  tab: string;
  bar: string;
  omni: string;
  page: string;
  ink: string;
  body: string;
  muted: string;
  faint: string;
  line: string;
  border: string;
  pop: string;
  well: string;
  hover: string;
  green: string;
  shadow: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        base: "#07060C",
        scrim: "rgba(6,5,12,0.25)",
        popShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.1), 0 24px 56px -12px rgba(0,0,0,0.7)",
        tabs: "#1B1C1F",
        tab: "#2A2B2F",
        bar: "#2A2B2F",
        omni: "#1B1C1F",
        page: "#151517",
        ink: "#EDEDEF",
        body: "#C9C9CE",
        muted: "#A4A5AB",
        faint: "#6E6F76",
        line: "rgba(255,255,255,0.07)",
        border: "rgba(255,255,255,0.1)",
        pop: "#1F1F23",
        well: "rgba(255,255,255,0.05)",
        hover: "rgba(255,255,255,0.1)",
        green: "#3DD68C",
        shadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08), 0 40px 90px -24px rgba(0,0,0,0.75)",
        dark: true,
      }
    : {
        base: "#EEF0F6",
        scrim: "rgba(246,246,250,0.2)",
        popShadow:
          "0 0 0 1px rgba(17,19,24,0.08), 0 4px 10px rgba(17,19,24,0.05), 0 24px 56px -12px rgba(17,19,24,0.25)",
        tabs: "#ECEDF0",
        tab: "#FFFFFF",
        bar: "#FFFFFF",
        omni: "#F1F3F4",
        page: "#FFFFFF",
        ink: "#171717",
        body: "#2E2E33",
        muted: "#5F6168",
        faint: "#8E9096",
        line: "rgba(17,19,24,0.07)",
        border: "rgba(17,19,24,0.1)",
        pop: "#FFFFFF",
        well: "#F5F5F6",
        hover: "rgba(17,19,24,0.07)",
        green: "#16A34A",
        shadow:
          "0 0 0 1px rgba(17,19,24,0.07), 0 2px 4px rgba(17,19,24,0.04), 0 32px 72px -20px rgba(30,30,70,0.3)",
        dark: false,
      };
}

const ICONS = {
  back: "M19 12H5M11 6l-6 6 6 6",
  fwd: "M5 12h14M13 6l6 6-6 6",
  reload: "M20 11a8 8 0 1 0-2.3 5.7M20 4.5V11h-6.5",
  lock: "M7.5 11V8a4.5 4.5 0 0 1 9 0v3M6 11h12v9.5H6z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  puzzle:
    "M10 4.5a2 2 0 1 1 4 0V6h4v4h-1.5a2 2 0 1 0 0 4H18v4.5h-4.5V17a2 2 0 1 0-4 0v1.5H5V14h1.5a2 2 0 1 0 0-4H5V6h5z",
  key: "M14.5 9.5a4.5 4.5 0 1 1-1.3-3.2M15.5 3.5l5 5M18 6l-2.5 2.5M9.6 14.4 3.5 20.5M6 18l2 2",
  close: "M6 6l12 12M18 6 6 18",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  check: "M20 6.5 9.5 17 4 11.5",
  chevDown: "M6 9l6 6 6-6",
  highlighter: "M9 11l-6 6v3h9l3-3M22 6.5 15.5 13 11 8.5 17.5 2z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  bookmark: "M18 21l-6-4.5L6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z",
  plus: "M12 5v14M5 12h14",
} as const;
type IconName = keyof typeof ICONS;

function Icon({
  name,
  color,
  size = 16,
  stroke = 1.75,
  fill = "none",
}: {
  name: IconName;
  color: string;
  size?: number;
  stroke?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d={ICONS[name]}
        fill={fill}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({
  color,
  size,
  frame,
}: {
  color: string;
  size: number;
  frame: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", transform: `rotate(${frame * 22}deg)` }}
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={2.5}
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#16171A"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExtMark({ accent, size }: { accent: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <path d="M7 4h10v16l-5-3.6L7 20z" fill="#fff" />
      </svg>
    </div>
  );
}

function Paragraph({
  text,
  marks,
  frame,
  color,
}: {
  text: string;
  marks: { text: string; at: number }[];
  frame: number;
  color: string;
}) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  for (const m of marks) {
    const i = rest.indexOf(m.text);
    if (i < 0) continue;
    parts.push(rest.slice(0, i));
    const p = tween(frame, m.at, m.at + 12, moveE);
    parts.push(
      <span
        key={k++}
        style={{
          backgroundImage: `linear-gradient(${color}, ${color})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${p * 100}% 100%`,
          borderRadius: 2,
          padding: "1px 0",
        }}
      >
        {m.text}
      </span>,
    );
    rest = rest.slice(i + m.text.length);
  }
  parts.push(rest);
  return <>{parts}</>;
}

export function BrowserExtension({
  url = "quarry.blog/notes/why-small-teams-ship-faster",
  siteName = "Quarry Journal",
  kicker = "Notes · 6 min read",
  title = "Why small teams ship faster",
  dek = "On the short loop between a decision and a deploy.",
  author = "Priya Raman",
  date = "Oct 14, 2026",
  paragraphs = DEFAULT_PARAGRAPHS,
  highlights = DEFAULT_HIGHLIGHTS,
  summary = DEFAULT_SUMMARY,
  extensionName = "remocn",
  collection = "Reading list",
  saveLabel = "Save to remocn",
  highlightColor,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: BrowserExtensionProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const L = H > W ? LAYOUT_TALL : LAYOUT_WIDE;
  const WIN = L.win;
  const EXT = extOf(WIN.w);
  const POP = popOf(WIN.w);
  const u = W / L.w;
  const pal = palette(theme);
  const hlColor =
    highlightColor ??
    (pal.dark ? "rgba(250,204,21,0.26)" : "rgba(250,204,21,0.36)");
  const sp = (at: number, config: SpringCfg, durationInFrames?: number) =>
    spring({ frame: frame - at, fps, config, durationInFrames });
  const tap = (at: number) => sp(at - 2, MORPH, 3) - sp(at + 2, CHIP);

  const enter = sp(0, HEAVY);
  const extPt = {
    x: WIN.x + EXT.x + EXT.s / 2 + 2,
    y: WIN.y + EXT.y + EXT.s / 2 + 3,
  };
  const savePt = {
    x: WIN.x + POP.x + POP_W / 2 + 30,
    y: WIN.y + POP.top + 404,
  };
  const keys: Key[] = [
    { t: 6, ...L.cursorFrom },
    { t: T.click - 3, ...extPt },
    { t: T.toSave - 12, ...extPt },
    { t: T.save - 3, ...savePt },
    { t: T.saved + 8, ...savePt },
    { t: T.saved + 34, x: savePt.x + 60, y: savePt.y + 150 },
  ];
  const cur = pathAt(keys, frame);
  const press = Math.max(tap(T.click), tap(T.save));
  const cursorOp =
    tween(frame, 4, 10) * (1 - tween(frame, T.saved + 28, T.saved + 36, exitE));
  const hoverExt =
    tween(frame, T.click - 7, T.click - 3) *
    (1 - tween(frame, T.toSave - 10, T.toSave - 6));

  const open = sp(T.click + 1, CARD);
  const closeP = tween(frame, T.close, T.close + 7, exitE);
  const popOp = tween(frame, T.click + 1, T.click + 5) * (1 - closeP);
  const reading = tween(frame, T.read, T.hl[0] - 2, moveE);
  const hlCount = T.hl.filter((t) => frame >= t + 6).length;
  const sumIn = (i: number) => tween(frame, T.sum + i * 3, T.sum + i * 3 + 10);
  const saveHover = tween(frame, T.save - 6, T.save - 2);
  const saving = frame >= T.save + 1 && frame < T.saved;
  const saved = frame >= T.saved;
  const savedIn = sp(T.saved, CHIP);
  const toast = sp(T.toast, CARD);
  const toastOp = tween(frame, T.toast, T.toast + 6);

  const marks = highlights.map((h, i) => ({
    text: h,
    at: T.hl[i] ?? T.hl[T.hl.length - 1] + i * 10,
  }));
  const scroll = interpolate(frame, [T.hl[1] - 4, T.hl[2] + 6], [0, 52], {
    ...clampX,
    easing: moveE,
  });
  const cam = interpolate(frame, [0, 200], [1, 1.03], {
    ...clampX,
    easing: camE,
  });
  const ink = pal.dark ? "#EDEDEF" : "#171717";
  const favicon = (size: number) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: pal.well,
        boxShadow: `inset 0 0 0 1px ${pal.line}`,
        color: ink,
        fontFamily: serif,
        fontSize: size * 0.55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      Q
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: pal.base,
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "velvet-hour" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 6 : 2}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.w,
          height: L.h,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam})`,
            transformOrigin: `${(extPt.x / L.w) * 100}% ${(extPt.y / L.h) * 100}%`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              borderRadius: 14,
              overflow: "hidden",
              background: pal.page,
              boxShadow: pal.shadow,
              opacity: Math.min(1, enter * 1.6),
              transform: `translateY(${(1 - enter) * 48}px) scale(${0.97 + 0.03 * enter})`,
            }}
          >
            <div
              style={{
                height: TABS_H,
                background: pal.tabs,
                display: "flex",
                alignItems: "flex-end",
                padding: "0 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignSelf: "center",
                  marginRight: 16,
                }}
              >
                {[0, 1, 2].map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 99,
                      boxShadow: `inset 0 0 0 1px ${pal.border}`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  width: 280,
                  height: 32,
                  borderRadius: "10px 10px 0 0",
                  background: pal.tab,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                  fontSize: 13,
                  color: pal.ink,
                }}
              >
                {favicon(16)}
                <span
                  style={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </span>
              </div>
            </div>

            <div
              style={{
                height: BAR_H,
                background: pal.bar,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                borderBottom: `1px solid ${pal.line}`,
                position: "relative",
              }}
            >
              {(["back", "fwd", "reload"] as IconName[]).map((n) => (
                <div
                  key={n}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    name={n}
                    color={n === "fwd" ? pal.faint : pal.muted}
                    size={17}
                    stroke={1.5}
                  />
                </div>
              ))}
              <div
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 99,
                  background: pal.omni,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 14px",
                  fontSize: 14,
                  color: pal.faint,
                  marginRight: 8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ color: pal.ink }}>{url.split("/")[0]}</span>
                <span style={{ marginLeft: -8 }}>
                  /{url.split("/").slice(1).join("/")}
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: EXT.x,
                  top: EXT.y - TABS_H,
                  width: EXT.s,
                  height: EXT.s,
                  borderRadius: 8,
                  background:
                    open > 0.01 && popOp > 0
                      ? pal.hover
                      : withAlpha(
                          pal.dark ? "#ffffff" : "#111318",
                          (pal.dark ? 0.1 : 0.07) * hoverExt,
                        ),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 - 0.04 * tap(T.click)})`,
                }}
              >
                <ExtMark accent={accent} size={18} />
              </div>
              <div style={{ width: EXT.s }} />
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="puzzle" color={pal.muted} size={17} stroke={1.5} />
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 99,
                  marginLeft: 4,
                  background: pal.well,
                  boxShadow: `inset 0 0 0 1px ${pal.line}`,
                  color: pal.muted,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                LP
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: CHROME,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: `${L.padTop}px 56px 0`,
                  transform: `translateY(${-scroll}px)`,
                }}
              >
                <article style={{ width: L.articleW }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: pal.faint,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {kicker}
                  </div>
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: L.title,
                      fontWeight: 400,
                      lineHeight: 1.08,
                      letterSpacing: "-0.025em",
                      color: pal.ink,
                      marginTop: 10,
                      textWrap: "balance",
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: L.body + 1,
                      fontWeight: 300,
                      color: pal.muted,
                      marginTop: 10,
                      lineHeight: 1.45,
                    }}
                  >
                    {dek}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 18,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: pal.ink }}>{author}</span>
                    <span style={{ color: pal.faint }}>{date}</span>
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: pal.line,
                      margin: "22px 0 22px",
                    }}
                  />
                  {paragraphs.map((p) => (
                    <p
                      key={p.slice(0, 24)}
                      style={{
                        fontFamily: serif,
                        fontSize: L.body,
                        lineHeight: 1.65,
                        color: pal.body,
                        margin: "0 0 18px",
                        textWrap: "pretty",
                      }}
                    >
                      <Paragraph
                        text={p}
                        marks={marks.filter((m) => p.includes(m.text))}
                        frame={frame}
                        color={hlColor}
                      />
                    </p>
                  ))}
                </article>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 58,
                  background: pal.page,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 56px",
                  borderBottom: `1px solid ${pal.line}`,
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 21,
                    color: pal.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {siteName}
                </span>
                <span
                  style={{
                    marginLeft: 36,
                    display: "flex",
                    gap: 22,
                    fontSize: 14,
                    color: pal.muted,
                  }}
                >
                  <span>Essays</span>
                  <span style={{ color: pal.ink }}>Notes</span>
                  <span>About</span>
                </span>
              </div>
            </div>

            {popOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: POP.x,
                  top: POP.top,
                  width: POP_W,
                  borderRadius: 14,
                  background: pal.pop,
                  boxShadow: pal.popShadow,
                  opacity: popOp,
                  transform: `translateY(${(1 - open) * -8 - closeP * 6}px) scale(${0.94 + 0.06 * open - 0.03 * closeP})`,
                  transformOrigin: `${EXT.x + EXT.s / 2 - POP.x}px -8px`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "14px 16px",
                    borderBottom: `1px solid ${pal.line}`,
                  }}
                >
                  <ExtMark accent={accent} size={20} />
                  <span style={{ fontSize: 15, color: pal.ink }}>
                    {extensionName}
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    <Icon
                      name="close"
                      color={pal.faint}
                      size={15}
                      stroke={1.5}
                    />
                  </span>
                </div>

                <div style={{ padding: "14px 16px 16px" }}>
                  <div
                    style={{ display: "flex", gap: 11, alignItems: "center" }}
                  >
                    {favicon(36)}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          color: pal.ink,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{ fontSize: 13, color: pal.faint, marginTop: 2 }}
                      >
                        {url.split("/")[0]} · {author}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: pal.muted,
                      height: 18,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {reading < 1 ? (
                      <>
                        <Spinner color={pal.muted} size={13} frame={frame} />
                        Reading page
                        <span style={{ marginLeft: "auto" }}>
                          {Math.round(reading * 100)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon
                          name="highlighter"
                          color={pal.muted}
                          size={14}
                          stroke={1.5}
                        />
                        <span>
                          {hlCount} {hlCount === 1 ? "highlight" : "highlights"}
                        </span>
                        <span style={{ marginLeft: "auto", color: pal.faint }}>
                          6 min read
                        </span>
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 2,
                      borderRadius: 99,
                      background: pal.well,
                      overflow: "hidden",
                      opacity: 1 - tween(frame, T.hl[0], T.hl[0] + 6, exitE),
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: ink,
                        transformOrigin: "0 50%",
                        transform: `scaleX(${reading})`,
                      }}
                    />
                  </div>

                  <div
                    style={{ marginTop: 14, fontSize: 13, color: pal.faint }}
                  >
                    Summary
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      minHeight: 160,
                      position: "relative",
                    }}
                  >
                    {summary.map((s, i) => {
                      const a = sumIn(i);
                      return (
                        <div
                          key={s}
                          style={{
                            display: "flex",
                            gap: 10,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: pal.ink,
                            marginBottom: 10,
                            opacity: a,
                            transform: `translateY(${(1 - a) * 8}px)`,
                          }}
                        >
                          <span
                            style={{
                              width: 14,
                              color: pal.faint,
                              fontVariantNumeric: "tabular-nums",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span style={{ textWrap: "pretty" }}>{s}</span>
                        </div>
                      );
                    })}
                    {frame < T.sum + 6 ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: "4px 0 auto 24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          opacity:
                            tween(frame, T.read + 4, T.read + 10) *
                            (1 - tween(frame, T.sum - 2, T.sum + 4, exitE)),
                        }}
                      >
                        {[92, 74, 86, 58].map((w) => (
                          <div
                            key={w}
                            style={{
                              width: `${w}%`,
                              height: 10,
                              borderRadius: 5,
                              background: pal.well,
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 40,
                      borderTop: `1px solid ${pal.line}`,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: pal.faint }}>Collection</span>
                    <span style={{ marginLeft: "auto", color: pal.ink }}>
                      {collection}
                    </span>
                    <Icon
                      name="chevDown"
                      color={pal.faint}
                      size={15}
                      stroke={1.5}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      height: 40,
                      borderRadius: 8,
                      background: saved
                        ? withAlpha(pal.green, pal.dark ? 0.14 : 0.1)
                        : accent,
                      color: saved ? pal.green : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 15,
                      transform: `scale(${1 - 0.04 * tap(T.save)})`,
                      filter: `brightness(${saved ? 1 : 1 - 0.08 * saveHover})`,
                    }}
                  >
                    {saving ? (
                      <Spinner color="#fff" size={14} frame={frame} />
                    ) : saved ? (
                      <span
                        style={{
                          opacity: Math.min(1, savedIn),
                          transform: `scale(${0.4 + 0.6 * savedIn})`,
                        }}
                      >
                        <Icon
                          name="check"
                          color={pal.green}
                          size={16}
                          stroke={2}
                        />
                      </span>
                    ) : null}
                    <span>
                      {saving
                        ? "Saving"
                        : saved
                          ? `Saved to ${collection}`
                          : saveLabel}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {toastOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  top: POP.top,
                  transform: `translateY(${(1 - toast) * -18}px) scale(${0.96 + 0.04 * toast})`,
                  transformOrigin: "100% 0",
                  opacity: toastOp,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 52,
                  padding: "0 8px 0 16px",
                  borderRadius: 12,
                  background: pal.pop,
                  boxShadow: pal.popShadow,
                  color: pal.ink,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="check" color={pal.green} size={16} stroke={2} />
                <span>Saved to {collection}</span>
                <span
                  style={{
                    color: pal.faint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {highlights.length} highlights
                </span>
                <span
                  style={{
                    marginLeft: 4,
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 8,
                    background: pal.well,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Open
                </span>
              </div>
            ) : null}
          </div>

          {cursorOp > 0 ? (
            <div style={{ opacity: cursorOp }}>
              <Cursor x={cur.x} y={cur.y} press={press} />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
