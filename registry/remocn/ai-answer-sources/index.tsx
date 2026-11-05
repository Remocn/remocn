"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
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

const { fontFamily } = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadNewsreader("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface AnswerSource {
  site: string;
  title: string;
  snippet?: string;
  color?: string;
}

export type AnswerBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] };

export interface AiAnswerSourcesProps {
  query?: string;
  sources?: AnswerSource[];
  answer?: AnswerBlock[];
  related?: string[];
  brand?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_SOURCES: AnswerSource[] = [
  {
    site: "remocn.dev",
    title: "Launch-ready motion components for Remotion",
    snippet:
      "Install animated scenes, transitions and product UI mockups with one command, then render your launch video straight from code.",
    color: "#1C1C1A",
  },
  {
    site: "kitebase.io",
    title: "How we shipped our launch video in four hours",
    snippet:
      "We skipped the editor, stitched five prebuilt scenes together and rendered a 4K cut from CI the night before launch.",
    color: "#C2410C",
  },
  {
    site: "fernway.studio",
    title: "Code-first video: a field guide for solo builders",
    snippet:
      "Treat your video like a component tree. Hook, product, proof, CTA: four beats, each a reusable scene with props.",
    color: "#3F6B4E",
  },
  {
    site: "lumen.news",
    title: "The 30-second launch video is the new landing page",
    color: "#5B5B9A",
  },
  {
    site: "quarry.dev",
    title: "Rendering product UI as video",
    color: "#2D5F8A",
  },
  {
    site: "orbitly.co",
    title: "From terminal to 4K in one command",
    color: "#9A3B33",
  },
  {
    site: "halcyon.fm",
    title: "Launch posts that actually converted",
    snippet:
      "The best-performing launches opened on the product in the first second and ended on a single URL.",
    color: "#8A6A1F",
  },
  {
    site: "tessel.design",
    title: "Motion that reads at 30fps",
    color: "#8A3A5C",
  },
  { site: "kitebase.io", title: "Our launch checklist", color: "#C2410C" },
  { site: "quarry.dev", title: "Device mockups in React", color: "#2D5F8A" },
  { site: "lumen.news", title: "Why demo videos win", color: "#5B5B9A" },
  { site: "orbitly.co", title: "Rendering in CI", color: "#9A3B33" },
];

const DEFAULT_ANSWER: AnswerBlock[] = [
  {
    type: "p",
    text: "The fastest way is to skip the timeline editor and assemble the video from prebuilt motion components. With **remocn** you install animated scenes into a Remotion project and render them straight from code.[0,1,2] Most solo builders ship a 30-second launch video in a single afternoon.[3]",
  },
  { type: "h", text: "A one-afternoon workflow" },
  {
    type: "ul",
    items: [
      "**Pick your beats.** Hook, product, proof and call to action, one component each.[2]",
      "**Drop in your UI.** Every scene accepts your screenshots or live React.[4]",
      "**Render from the terminal.** One command gives you 1080p or 4K, no export dialog.[1,5]",
    ],
  },
  {
    type: "p",
    text: "If you already have a landing page, start with a device mockup and a URL-bar call to action; that pair alone covers most launch posts.[0,2,6]",
  },
];

const DEFAULT_RELATED = [
  "How long should a launch video be?",
  "Which scenes work best for a SaaS demo?",
  "Can I render launch videos in CI?",
];

const LIGHT = {
  main: "#FBFBF9",
  card: "#FFFFFF",
  tile: "#F3F3EF",
  border: "rgba(20,20,10,0.10)",
  hair: "rgba(20,20,10,0.07)",
  ink: "#1C1C1A",
  body: "#3B3B37",
  muted: "#6B6B66",
  faint: "#9A9A94",
  chip: "rgba(20,20,10,0.055)",
  share: "#1C1C1A",
  shareText: "#FFFFFF",
  window:
    "0 0 0 1px rgba(20,20,10,0.06), 0 2px 4px rgba(20,20,10,0.04), 0 32px 80px -24px rgba(20,24,60,0.3)",
  raised:
    "0 0 0 1px rgba(20,20,10,0.06), 0 1px 3px rgba(20,20,10,0.05), 0 16px 40px -12px rgba(20,20,10,0.18)",
};
const DARK: typeof LIGHT = {
  main: "#151616",
  card: "#1C1E1E",
  tile: "#1F2121",
  border: "rgba(255,255,255,0.10)",
  hair: "rgba(255,255,255,0.07)",
  ink: "#ECECE9",
  body: "#C9C9C4",
  muted: "#A0A09B",
  faint: "#6E6E6A",
  chip: "rgba(255,255,255,0.07)",
  share: "#ECECE9",
  shareText: "#151616",
  window:
    "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 48px 120px -24px rgba(0,0,0,0.85)",
  raised: "0 0 0 1px rgba(255,255,255,0.1), 0 18px 40px -10px rgba(0,0,0,0.6)",
};
type Palette = typeof LIGHT;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const GLIDE = { mass: 0.9, damping: 24, stiffness: 130 };
type SpringCfg = typeof CARD | typeof MORPH;

const TYPE_AT = 10;
const SUBMIT = 60;
const THREAD = 64;
const STEP1 = 76;
const STEP2 = 94;
const STEPS_DONE = 120;
const ANSWER_AT = 132;
const RATE = 6;

const ICONS = {
  plus: "M12 5v14M5 12h14",
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  clip: "M20 11.5l-7.8 7.8a5 5 0 01-7-7l8.1-8.2a3.3 3.3 0 014.7 4.7l-8 8.1a1.7 1.7 0 01-2.4-2.4l7.3-7.3",
  mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5.5 11a6.5 6.5 0 0013 0M12 17.5V21",
  up: "M12 19V5M6 11l6-6 6 6",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  share: "M12 3v12M7 8l5-5 5 5M5 13v7h14v-7",
  copy: "M8 8h11v11H8zM5 16V5h11",
  redo: "M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  related: "M4 6h16M4 12h10M4 18h7",
  close: "M6 6l12 12M18 6L6 18",
  sift: "M5 7h14M7.5 12h9M10 17h4",
  layers: "M12 3.5l8.5 4.5-8.5 4.5L3.5 8zM3.5 12.5l8.5 4.5 8.5-4.5",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01",
};

function Icon({
  d,
  size = 18,
  color,
  sw = 1.5,
}: {
  d: string;
  size?: number;
  color: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Favicon({
  src,
  size = 16,
  ring,
}: {
  src: AnswerSource;
  size?: number;
  ring?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: src.color ?? "#6B6B66",
        color: "#fff",
        fontSize: size * 0.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: ring
          ? `0 0 0 2px ${ring}`
          : "inset 0 0 0 1px rgba(0,0,0,0.1)",
        fontFamily,
      }}
    >
      {src.site[0].toUpperCase()}
    </div>
  );
}

function Cursor({
  x,
  y,
  press,
  opacity = 1,
}: {
  x: number;
  y: number;
  press: number;
  opacity?: number;
}) {
  return (
    <svg
      width={26}
      height={30}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2,
        top: y - 2,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.04 * press})`,
        opacity,
        filter:
          "drop-shadow(0 1px 1px rgba(0,0,0,0.25)) drop-shadow(0 6px 10px rgba(0,0,0,0.2))",
        overflow: "visible",
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#1C1C1A"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({
  f,
  color,
  done,
  size = 18,
}: {
  f: number;
  color: string;
  done: boolean;
  size?: number;
}) {
  if (done) return <Icon d={ICONS.check} size={size} color={color} sw={1.8} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${f * 12}deg)`, flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth="2"
      />
      <path
        d="M12 3a9 9 0 019 9"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Tok =
  | { t: "w"; s: string; b: boolean; at: number }
  | { t: "c"; ids: number[]; at: number };

function tokenize(text: string) {
  const toks: Tok[] = [];
  let n = 0;
  let bold = false;
  for (const part of text.split(/(\[\d+(?:,\d+)*\])/)) {
    const m = part.match(/^\[(\d+(?:,\d+)*)\]$/);
    if (m) {
      toks.push({ t: "c", ids: m[1].split(",").map(Number), at: n });
      continue;
    }
    part.split("**").forEach((seg, i) => {
      if (i > 0) bold = !bold;
      for (const w of seg.match(/\S+\s*|\s+/g) ?? []) {
        toks.push({ t: "w", s: w, b: bold, at: n });
        n += w.length;
      }
    });
  }
  return { toks, len: n };
}

interface Unit {
  kind: "p" | "h" | "li";
  toks: Tok[];
  len: number;
  start: number;
  end: number;
}

function plan(answer: AnswerBlock[]) {
  const units: Unit[] = [];
  let t = ANSWER_AT;
  const add = (kind: Unit["kind"], text: string) => {
    const { toks, len } = tokenize(text);
    const end = t + len / RATE;
    units.push({ kind, toks, len, start: t, end });
    t = end + (kind === "h" ? 2 : 5);
  };
  for (const b of answer) {
    if (b.type === "ul") for (const it of b.items) add("li", it);
    else add(b.type, b.text);
  }
  let hover = { u: -1, k: -1, from: 0 };
  units.forEach((u, ui) => {
    let prev = -1;
    u.toks.forEach((tk, k) => {
      if (tk.t !== "c") return;
      hover = { u: ui, k, from: prev + 1 };
      prev = k;
    });
  });
  return { units, end: t, hover };
}

export const AI_ANSWER_SOURCES_DURATION =
  Math.ceil(plan(DEFAULT_ANSWER).end) + 150;

function tint(color: string, alpha: number, fallback: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return fallback;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}

function arc(
  t: number,
  a: [number, number],
  b: [number, number],
  bend: number,
) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a[0] + b[0]) / 2 + (-dy / len) * bend;
  const cy = (a[1] + b[1]) / 2 + (dx / len) * bend;
  const u = 1 - t;
  return {
    x: u * u * a[0] + 2 * u * t * cx + t * t * b[0],
    y: u * u * a[1] + 2 * u * t * cy + t * t * b[1],
  };
}

function CitePill({
  ids,
  sources,
  pop,
  active,
  c,
  children,
}: {
  ids: number[];
  sources: AnswerSource[];
  pop: number;
  active: boolean;
  c: Palette;
  children?: React.ReactNode;
}) {
  const first = sources[ids[0]] ?? sources[0];
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 8px",
        marginLeft: 5,
        borderRadius: 7,
        background: active ? c.ink : c.chip,
        fontFamily,
        fontSize: 15,
        color: active ? c.main : c.muted,
        verticalAlign: 2,
        lineHeight: 1,
        whiteSpace: "nowrap",
        opacity: Math.min(1, pop * 1.5),
        transform: `scale(${0.8 + 0.2 * pop})`,
        transformOrigin: "left center",
      }}
    >
      {first.site}
      {ids.length > 1 ? (
        <span style={{ opacity: 0.6, marginLeft: 4 }}>+{ids.length - 1}</span>
      ) : null}
      {children}
    </span>
  );
}

function HoverCard({
  ids,
  sources,
  c,
  v,
  out,
}: {
  ids: number[];
  sources: AnswerSource[];
  c: Palette;
  v: number;
  out: number;
}) {
  const src = sources[ids[0]] ?? sources[0];
  return (
    <span
      style={{
        position: "absolute",
        left: -10,
        bottom: 34,
        width: 380,
        display: "block",
        padding: "16px 18px 18px",
        borderRadius: 16,
        background: c.card,
        boxShadow: c.raised,
        whiteSpace: "normal",
        textAlign: "left",
        color: c.ink,
        lineHeight: 1.4,
        transformOrigin: "20px 100%",
        opacity: Math.min(1, v * 1.6) * out,
        transform: `translateY(${(1 - v) * 10 + (1 - out) * 4}px) scale(${0.92 + 0.08 * v})`,
        zIndex: 50,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 15,
          color: c.muted,
        }}
      >
        <Favicon src={src} size={18} />
        <span style={{ flex: 1 }}>{src.site}</span>
        {ids.length > 1 ? (
          <span style={{ fontVariantNumeric: "tabular-nums", color: c.faint }}>
            1 / {ids.length}
          </span>
        ) : null}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 10,
          fontSize: 18,
          letterSpacing: "-0.01em",
        }}
      >
        {src.title}
      </span>
      {src.snippet ? (
        <span
          style={{
            marginTop: 6,
            fontSize: 15,
            lineHeight: 1.45,
            color: c.muted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {src.snippet}
        </span>
      ) : null}
    </span>
  );
}

export function AiAnswerSources({
  query = "What is the fastest way to make a launch video?",
  sources = DEFAULT_SOURCES,
  answer = DEFAULT_ANSWER,
  related = DEFAULT_RELATED,
  brand = "sift",
  accent = "#20808D",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: AiAnswerSourcesProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const portrait = height > width;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const s = Math.min(width / stageW, height / stageH);
  const win = portrait
    ? { x: 28, y: 48, w: 664, h: 1184 }
    : { x: 40, y: 32, w: 1200, h: 656 };
  const AW = win.w;
  const AH = win.h;
  const COL = portrait ? 600 : 700;
  const COL_X = (AW - COL) / 2;
  const PANEL = portrait ? 520 : 360;
  const SHIFT = portrait ? 0 : COL_X - (AW - PANEL - COL) / 2;
  const TOP = 64;
  const FOOT = 132;

  const sp = (at: number, config: SpringCfg = CARD) =>
    spring({ frame: f - at, fps, config });
  const ease = (a: number, b: number, e = ENTER) =>
    interpolate(f, [a, b], [0, 1], { ...CL, easing: e });
  const enter = (v: number, dy = 12): React.CSSProperties => ({
    opacity: Math.min(1, v * 1.3),
    transform: `translateY(${(1 - v) * dy}px)`,
  });
  const click = (at: number) =>
    Math.max(
      0,
      spring({ frame: f - at + 3, fps, config: CHIP }) -
        spring({ frame: f - at, fps, config: CHIP }),
    );

  const { units, end, hover } = plan(answer);
  const ACTIONS = end + 4;
  const RELATED = end + 10;
  const BAR = end + 8;
  const HOVER = end + 34;
  const CARD_AT = HOVER + 22;
  const CLICK = HOVER + 50;
  const PANEL_AT = CLICK + 2;

  const typed = Math.floor(Math.max(0, (f - TYPE_AT) * 1.5));
  const shown = query.slice(0, typed);
  const home = 1 - ease(SUBMIT + 1, SUBMIT + 7, EXIT);
  const threadIn = ease(SUBMIT + 2, SUBMIT + 12);
  const press = click(SUBMIT);
  const inputTop = AH * 0.4;
  const inputH = 128;
  const sendPt: [number, number] = [COL_X + COL - 34, inputTop + inputH - 32];
  const homeCur = {
    ...arc(Math.min(1, sp(30, GLIDE)), [AW * 0.78, AH * 0.94], sendPt, -80),
    o: interpolate(f, [30, 36, SUBMIT + 4, SUBMIT + 8], [0, 1, 1, 0], CL),
  };

  const stepsCollapse = sp(STEPS_DONE + 2, MORPH);
  const panel = sp(PANEL_AT, HEAVY);
  const hoverOn = f >= HOVER + 20;
  const card = sp(CARD_AT, CARD);
  const cardOut = 1 - ease(CLICK, CLICK + 6, EXIT);
  const mark = ease(HOVER + 18, HOVER + 26);
  const citePress = click(CLICK);
  const hoverIds =
    hover.u >= 0
      ? (units[hover.u].toks[hover.k] as { ids: number[] }).ids
      : [0, 1, 2];
  const relCur = {
    ...arc(Math.min(1.02, sp(HOVER, GLIDE)), [300, 170], [34, 14], 60),
    o: ease(HOVER, HOVER + 6),
  };

  const bodySize = 19;
  const cplFor = (kind: Unit["kind"]) =>
    Math.floor((kind === "li" ? COL - 28 : COL) / (bodySize * 0.46));

  const renderUnit = (u: Unit, ui: number) => {
    const r = (f - u.start) * RATE;
    if (r <= 0) return null;
    const lh = u.kind === "h" ? 34 : 30;
    const cpl = cplFor(u.kind);
    const done = f > u.end + 8;
    const maxH = done ? 999 : lh * (1 + Math.min(r, u.len) / cpl) + 16;
    return (
      <div
        key={`u${ui}`}
        style={{ maxHeight: maxH, overflow: done ? "visible" : "hidden" }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            fontFamily: serif,
            color: c.body,
            fontSize: u.kind === "h" ? 25 : bodySize,
            fontWeight: 400,
            letterSpacing: u.kind === "h" ? "-0.015em" : "0",
            lineHeight: `${lh}px`,
            padding:
              u.kind === "h"
                ? "10px 0 8px"
                : u.kind === "li"
                  ? "0 0 8px 4px"
                  : "0 0 16px",
          }}
        >
          {u.kind === "li" ? (
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                background: c.faint,
                marginTop: 13,
                flexShrink: 0,
                opacity: Math.min(1, r / 4),
              }}
            />
          ) : null}
          <div>
            {u.toks.map((tk, k) => {
              const key = `${ui}-${k}`;
              if (tk.t === "w") {
                const cited =
                  ui === hover.u && k >= hover.from && k < hover.k && mark > 0;
                return (
                  <span
                    key={key}
                    style={{
                      opacity: Math.max(0, Math.min(1, (r - tk.at) / 10)),
                      color: tk.b || u.kind === "h" ? c.ink : undefined,
                      whiteSpace: "pre-wrap",
                      background: cited
                        ? tint(accent, 0.16 * mark, c.chip)
                        : undefined,
                      borderRadius: 3,
                    }}
                  >
                    {tk.s}
                  </span>
                );
              }
              const popAt = u.start + tk.at / RATE + 1;
              const isHover = ui === hover.u && k === hover.k;
              return (
                <CitePill
                  key={key}
                  ids={tk.ids}
                  sources={sources}
                  pop={sp(popAt, CHIP)}
                  active={isHover && hoverOn}
                  c={c}
                >
                  {isHover && card > 0.01 && cardOut > 0 ? (
                    <HoverCard
                      ids={tk.ids}
                      sources={sources}
                      c={c}
                      v={card}
                      out={cardOut}
                    />
                  ) : null}
                  {isHover && f >= HOVER ? (
                    <Cursor
                      x={relCur.x}
                      y={relCur.y}
                      press={citePress}
                      opacity={relCur.o}
                    />
                  ) : null}
                </CitePill>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const stepRow = (
    at: number,
    doneAt: number,
    label: string,
    extra: React.ReactNode,
  ) => {
    const v = sp(at);
    return (
      <div style={{ ...enter(v, 8), marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 17,
            color: c.ink,
          }}
        >
          <Spinner
            f={f}
            color={f >= doneAt ? c.muted : accent}
            done={f >= doneAt}
          />
          <span>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 28 }}>
          {extra}
        </div>
      </div>
    );
  };
  const queryChip = (text: string, at: number) => (
    <div
      key={text}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 8,
        background: c.chip,
        fontSize: 15,
        color: c.muted,
        ...enter(sp(at, CHIP), 6),
      }}
    >
      <Icon d={ICONS.search} size={14} color={c.muted} />
      {text}
    </div>
  );

  const sourcesRow = sp(STEP2 + 6, MORPH);
  const actionsIn = sp(ACTIONS, MORPH);
  const barIn = sp(BAR, HEAVY);
  const tiles = portrait ? 2 : 3;

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "earthshine" : "glasswork");

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={groundParams}
        timeOffset={4}
        timeScale={0.35}
      />
      <div
        style={{
          position: "absolute",
          left: (width - stageW * s) / 2,
          top: (height - stageH * s) / 2,
          width: stageW,
          height: stageH,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: win.x,
            top: win.y,
            width: AW,
            height: AH,
            borderRadius: 24,
            overflow: "hidden",
            background: c.main,
            boxShadow: c.window,
            color: c.ink,
            WebkitFontSmoothing: "antialiased",
            opacity: ease(0, 12),
            transform: `translateY(${(1 - sp(0, HEAVY)) * 48}px) scale(${0.96 + 0.04 * sp(0, HEAVY)})`,
          }}
        >
          {home > 0 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: home,
                transform: `translateY(${(1 - home) * -20}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: COL_X,
                  width: COL,
                  top: inputTop - 96,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  ...enter(sp(2), 14),
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    background: c.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon d={ICONS.sift} size={26} color={c.main} sw={2} />
                </div>
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 60,
                    fontWeight: 300,
                    letterSpacing: "-0.035em",
                    lineHeight: 1,
                  }}
                >
                  {brand}
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: COL_X,
                  top: inputTop,
                  width: COL,
                  height: inputH,
                  borderRadius: 20,
                  background: c.card,
                  boxShadow: c.raised,
                  boxSizing: "border-box",
                  padding: "20px 22px 0",
                  ...enter(sp(5), 18),
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    color: shown ? c.ink : c.faint,
                    height: 28,
                  }}
                >
                  {shown || "Ask anything"}
                  {f < SUBMIT && Math.floor(f / 8) % 2 === 0 ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        marginLeft: 2,
                        background: accent,
                        verticalAlign: -4,
                      }}
                    />
                  ) : null}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      padding: 3,
                      gap: 2,
                      borderRadius: 11,
                      background: c.chip,
                    }}
                  >
                    {["Search", "Research"].map((t, i) => (
                      <div
                        key={t}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          height: 30,
                          padding: "0 12px",
                          borderRadius: 8,
                          fontSize: 15,
                          color: i === 0 ? c.ink : c.muted,
                          background: i === 0 ? c.card : "transparent",
                          boxShadow:
                            i === 0
                              ? `0 0 0 1px ${c.hair}, 0 1px 2px ${c.hair}`
                              : "none",
                        }}
                      >
                        <Icon
                          d={i === 0 ? ICONS.search : ICONS.layers}
                          size={15}
                          color={i === 0 ? c.ink : c.muted}
                        />
                        {t}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }} />
                  {[ICONS.globe, ICONS.clip, ICONS.mic].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 34,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Icon d={d} size={19} color={c.muted} />
                    </div>
                  ))}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: shown ? accent : c.chip,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${1 - 0.06 * press})`,
                    }}
                  >
                    <Icon
                      d={ICONS.up}
                      size={19}
                      color={shown ? "#fff" : c.faint}
                      sw={1.8}
                    />
                  </div>
                </div>
              </div>
              <Cursor
                x={homeCur.x}
                y={homeCur.y}
                press={press}
                opacity={homeCur.o}
              />
            </div>
          ) : null}

          {threadIn > 0 ? (
            <div style={{ position: "absolute", inset: 0, opacity: threadIn }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: TOP,
                  background: c.main,
                  zIndex: 4,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "0 24px",
                  boxShadow: `inset 0 -1px 0 ${c.hair}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 26,
                    marginLeft: COL_X - 24 - panel * SHIFT,
                    flex: 1,
                  }}
                >
                  {(
                    [
                      ["Answer", ICONS.sift],
                      ["Links", ICONS.link],
                      ["Images", ICONS.image],
                    ] as const
                  ).map(([t, d], i) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        height: 46,
                        fontSize: 16,
                        color: i === 0 ? c.ink : c.muted,
                        boxShadow:
                          i === 0 ? `inset 0 -1.5px 0 ${c.ink}` : "none",
                      }}
                    >
                      <Icon d={d} size={16} color={i === 0 ? c.ink : c.muted} />
                      {t}
                    </div>
                  ))}
                </div>
                {portrait ? null : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      height: 34,
                      marginBottom: 6,
                      padding: "0 14px",
                      borderRadius: 10,
                      background: c.share,
                      color: c.shareText,
                      fontSize: 15,
                      marginRight: panel * PANEL,
                    }}
                  >
                    <Icon d={ICONS.share} size={15} color={c.shareText} />
                    Share
                  </div>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: COL_X - panel * SHIFT,
                  width: COL,
                  top: TOP,
                  bottom: FOOT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ flexShrink: 0, paddingTop: 28 }}>
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: 34,
                      fontWeight: 300,
                      lineHeight: 1.18,
                      letterSpacing: "-0.025em",
                      marginBottom: 22,
                      ...enter(sp(THREAD), 20),
                    }}
                  >
                    {query}
                  </div>
                  <div
                    style={{
                      position: "relative",
                      height: interpolate(
                        stepsCollapse,
                        [0, 1],
                        [f >= STEP1 ? 122 : 0, 32],
                      ),
                      overflow: "hidden",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ opacity: 1 - stepsCollapse }}>
                      {stepRow(STEP1, STEP2 - 2, "Searching the web", [
                        queryChip("fastest launch video workflow", STEP1 + 4),
                        portrait
                          ? null
                          : queryChip("remotion launch templates", STEP1 + 9),
                      ])}
                      {stepRow(
                        STEP2,
                        STEPS_DONE,
                        `Reading ${sources.length} sources`,
                        [
                          <div
                            key="fav"
                            style={{
                              display: "flex",
                              ...enter(sp(STEP2 + 4, CHIP), 6),
                            }}
                          >
                            {sources.slice(0, 6).map((src, i) => (
                              <div
                                key={`${src.site}${src.title}`}
                                style={{ marginLeft: i ? -5 : 0 }}
                              >
                                <Favicon src={src} size={22} ring={c.main} />
                              </div>
                            ))}
                          </div>,
                        ],
                      )}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        fontSize: 16,
                        color: c.muted,
                        opacity: stepsCollapse,
                      }}
                    >
                      <Icon
                        d={ICONS.check}
                        size={18}
                        color={c.muted}
                        sw={1.8}
                      />
                      Reviewed {sources.length} sources
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      maxHeight: interpolate(sourcesRow, [0, 1], [0, 112]),
                      marginBottom: 20 * Math.min(1, sourcesRow),
                    }}
                  >
                    {[...sources.slice(0, tiles), null].map((src, i) => {
                      const v = sp(STEP2 + 8 + i * 4, CARD);
                      return (
                        <div
                          key={src ? `${src.site}${i}` : "more"}
                          style={{
                            flex: src ? 1 : 0.7,
                            height: 96,
                            borderRadius: 12,
                            background: c.tile,
                            padding: "12px 14px",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            opacity: Math.min(1, v * 1.5),
                            transform: `translateY(${(1 - v) * 14}px) scale(${0.92 + 0.08 * v})`,
                          }}
                        >
                          {src ? (
                            <>
                              <div
                                style={{
                                  fontSize: 15,
                                  lineHeight: "20px",
                                  height: 40,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {src.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                  fontSize: 15,
                                  color: c.muted,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                }}
                              >
                                <Favicon src={src} size={16} />
                                <span
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {src.site}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ display: "flex" }}>
                                {sources
                                  .slice(tiles, tiles + 4)
                                  .map((s2, j) => (
                                    <div
                                      key={`${s2.site}${s2.title}`}
                                      style={{ marginLeft: j ? -4 : 0 }}
                                    >
                                      <Favicon
                                        src={s2}
                                        size={18}
                                        ring={c.tile}
                                      />
                                    </div>
                                  ))}
                              </div>
                              <div style={{ fontSize: 15, color: c.muted }}>
                                +{Math.max(0, sources.length - tiles)} more
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {units.map(renderUnit)}
                  <div
                    style={{
                      maxHeight: interpolate(actionsIn, [0, 1], [0, 60]),
                      overflow: "hidden",
                      opacity: actionsIn,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        padding: "10px 0 16px",
                        boxShadow: `inset 0 -1px 0 ${c.hair}`,
                      }}
                    >
                      {[ICONS.share, ICONS.copy, ICONS.redo].map((d) => (
                        <Icon key={d} d={d} size={18} color={c.muted} />
                      ))}
                      <div style={{ flex: 1 }} />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          height: 30,
                          padding: "0 12px 0 6px",
                          borderRadius: 15,
                          background: c.chip,
                          fontSize: 15,
                          color: c.muted,
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          {hoverIds.slice(0, 3).map((id, j) => (
                            <div key={id} style={{ marginLeft: j ? -5 : 0 }}>
                              <Favicon
                                src={sources[id] ?? sources[0]}
                                size={18}
                                ring={c.main}
                              />
                            </div>
                          ))}
                        </div>
                        {sources.length} sources
                      </div>
                    </div>
                  </div>
                  {related.length > 0 ? (
                    <div
                      style={{
                        maxHeight: interpolate(
                          sp(RELATED, MORPH),
                          [0, 1],
                          [0, 52 + related.length * 52],
                        ),
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          fontSize: 17,
                          padding: "20px 0 8px",
                          ...enter(sp(RELATED), 8),
                        }}
                      >
                        <Icon d={ICONS.related} size={18} color={c.ink} />
                        Related
                      </div>
                      {related.map((q, i) => (
                        <div
                          key={q}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: 52,
                            boxShadow: i ? `inset 0 1px 0 ${c.hair}` : "none",
                            fontSize: 17,
                            color: c.body,
                            ...enter(sp(RELATED + 4 + i * 4), 10),
                          }}
                        >
                          <span style={{ flex: 1 }}>{q}</span>
                          <Icon d={ICONS.plus} size={18} color={accent} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: FOOT,
                  background: `linear-gradient(transparent, ${c.main} 28%)`,
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: COL_X - panel * SHIFT,
                    width: COL,
                    bottom: 22,
                    height: 92,
                    borderRadius: 20,
                    background: c.card,
                    boxShadow: c.raised,
                    boxSizing: "border-box",
                    padding: "16px 18px",
                    fontSize: 17,
                    color: c.faint,
                    opacity: Math.min(1, barIn * 1.4),
                    transform: `translateY(${(1 - barIn) * 48}px)`,
                  }}
                >
                  Ask a follow-up
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Icon d={ICONS.plus} size={20} color={c.muted} />
                    <div style={{ flex: 1 }} />
                    <Icon d={ICONS.mic} size={19} color={c.muted} />
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        background: c.chip,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon d={ICONS.up} size={17} color={c.faint} sw={1.8} />
                    </div>
                  </div>
                </div>
              </div>

              {portrait ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: dark ? "#000" : "#1C1C1A",
                    opacity: (dark ? 0.3 : 0.08) * panel,
                    zIndex: 5,
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  ...(portrait
                    ? {
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 580,
                        borderRadius: "24px 24px 0 0",
                        boxShadow: `0 -1px 0 ${c.border}, 0 -24px 48px -24px rgba(0,0,0,${dark ? 0.6 : 0.2})`,
                        transform: `translateY(${(1 - panel) * 620}px)`,
                      }
                    : {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: PANEL,
                        boxShadow: `-1px 0 0 ${c.border}, -24px 0 48px -24px rgba(0,0,0,${dark ? 0.6 : 0.16})`,
                        transform: `translateX(${(1 - panel) * (PANEL + 48)}px)`,
                      }),
                  background: c.main,
                  zIndex: 6,
                  padding: "20px 24px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 18,
                    height: 30,
                  }}
                >
                  <span style={{ flex: 1 }}>{hoverIds.length} sources</span>
                  <Icon d={ICONS.close} size={18} color={c.muted} />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: c.muted,
                    margin: "22px 0 16px",
                  }}
                >
                  Cited in this answer
                </div>
                {hoverIds.map((id, i) => {
                  const src = sources[id] ?? sources[0];
                  const v = sp(PANEL_AT + 6 + i * 4);
                  return (
                    <div
                      key={`${id}`}
                      style={{
                        padding: "16px 0",
                        boxShadow: i ? `inset 0 1px 0 ${c.hair}` : "none",
                        ...enter(v, 14),
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 15,
                          color: c.muted,
                        }}
                      >
                        <Favicon src={src} size={18} />
                        {src.site}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          lineHeight: 1.3,
                          marginTop: 8,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {src.title}
                      </div>
                      {src.snippet ? (
                        <div
                          style={{
                            fontSize: 15,
                            lineHeight: 1.45,
                            color: c.muted,
                            marginTop: 6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {src.snippet}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
