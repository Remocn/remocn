"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
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

export type CalloutSide = "top" | "bottom" | "left" | "right";

export interface Callout {
  x: number;
  y: number;
  title: string;
  body?: string;
  side?: CalloutSide;
  delay?: number;
}

export interface UiCalloutProps {
  callouts?: Callout[];
  variant?: "tooltip" | "pill";
  src?: string;
  children?: React.ReactNode;
  screenshotWidth?: number;
  screenshotHeight?: number;
  stagger?: number;
  theme?: "light" | "dark";
  accent?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const DEFAULT_CALLOUTS: Callout[] = [
  {
    x: 358,
    y: 113,
    title: "Status at a glance",
    body: "Every issue carries its state, from Backlog to Done.",
    side: "bottom",
  },
  {
    x: 1333,
    y: 153,
    title: "Owners and due dates",
    body: "A name and a date on every row, so nothing slips.",
    side: "bottom",
  },
  {
    x: 40,
    y: 342,
    title: "Ship in cycles",
    body: "Unfinished work rolls into the next cycle on its own.",
    side: "bottom",
  },
];

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const INTRO = 14;
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Pt {
  x: number;
  y: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Route {
  start: Pt;
  elbow: Pt;
  end: Pt;
  card: Box;
  attach: "left" | "right" | "top" | "bottom";
}

const DIRS: Record<CalloutSide, Pt> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function buildRoute(
  t: Pt,
  side: CalloutSide,
  l1: number,
  turn: 1 | -1,
  size: { w: number; h: number },
  u: number,
): Route {
  const d = DIRS[side];
  const start = { x: t.x + d.x * 17 * u, y: t.y + d.y * 17 * u };
  const elbow = { x: start.x + d.x * l1, y: start.y + d.y * l1 };
  const vertical = side === "top" || side === "bottom";
  const l2 = (vertical ? 36 : 30) * u;
  const end = vertical
    ? { x: elbow.x + turn * l2, y: elbow.y }
    : { x: elbow.x, y: elbow.y + turn * l2 };
  if (vertical) {
    const x = turn === 1 ? end.x : end.x - size.w;
    return {
      start,
      elbow,
      end,
      card: { x, y: end.y - size.h / 2, ...size },
      attach: turn === 1 ? "left" : "right",
    };
  }
  const x = d.x === 1 ? end.x - 26 * u : end.x - size.w + 26 * u;
  const y = turn === 1 ? end.y : end.y - size.h;
  return {
    start,
    elbow,
    end,
    card: { x, y, ...size },
    attach: turn === 1 ? "top" : "bottom",
  };
}

const overlaps = (a: Box, b: Box, m: number) =>
  a.x < b.x + b.w + m &&
  b.x < a.x + a.w + m &&
  a.y < b.y + b.h + m &&
  b.y < a.y + a.h + m;

function routeAll(
  targets: Pt[],
  callouts: Callout[],
  sizes: { w: number; h: number }[],
  W: number,
  H: number,
  u: number,
): Route[] {
  const placed: Route[] = [];
  targets.forEach((t, i) => {
    const towardCenter: 1 | -1 = t.x < W / 2 ? 1 : -1;
    const sides: CalloutSide[] = callouts[i].side
      ? [callouts[i].side as CalloutSide]
      : t.y < H / 2
        ? ["bottom", "top", "right", "left"]
        : ["top", "bottom", "right", "left"];
    const turns: (1 | -1)[] = [towardCenter, towardCenter === 1 ? -1 : 1];
    let best: Route | null = null;
    search: for (const side of sides) {
      for (const turn of turns) {
        for (const l1 of [56, 96, 136, 176]) {
          const r = buildRoute(
            t,
            side,
            l1 * u,
            side === "left" || side === "right" ? 1 : turn,
            sizes[i],
            u,
          );
          const c = r.card;
          const m = 16 * u;
          if (c.x < m || c.y < m || c.x + c.w > W - m || c.y + c.h > H - m)
            continue;
          if (placed.some((p) => overlaps(p.card, c, 12 * u))) continue;
          if (
            targets.some((p) =>
              overlaps(
                { x: p.x - 20 * u, y: p.y - 20 * u, w: 40 * u, h: 40 * u },
                c,
                0,
              ),
            )
          )
            continue;
          best = r;
          break search;
        }
      }
    }
    placed.push(
      best ?? buildRoute(t, sides[0], 56 * u, towardCenter, sizes[i], u),
    );
  });
  return placed;
}

function routeTall(
  targets: Pt[],
  sizes: { w: number; h: number }[],
  slotTop: number,
  stack: boolean,
  W: number,
  u: number,
): Route[] {
  let y = slotTop;
  return targets.map((t, i) => {
    const size = sizes[i];
    const turn: 1 | -1 = t.x < W / 2 ? 1 : -1;
    const start = { x: t.x, y: t.y + 17 * u };
    const cy = y + size.h / 2;
    if (stack) y += size.h + 14 * u;
    const elbow = { x: t.x, y: cy };
    const end = { x: t.x + turn * 30 * u, y: cy };
    const m = 40 * u;
    const x =
      turn === 1
        ? Math.min(end.x, W - m - size.w)
        : Math.max(m, end.x - size.w);
    return {
      start,
      elbow,
      end,
      card: { x, y: cy - size.h / 2, ...size },
      attach: turn === 1 ? "left" : "right",
    };
  });
}

const disc = { position: "absolute", inset: 0, borderRadius: 999 } as const;

function Ring({
  local,
  accent,
  dark,
  u,
  fps,
  rest = 0,
}: {
  local: number;
  accent: string;
  dark: boolean;
  u: number;
  fps: number;
  rest?: number;
}) {
  const pop = spring({ frame: local, fps, config: CHIP });
  const phase = ((((local - 8) % 48) + 48) % 48) / 48;
  const size = 24 * u;
  return (
    <div
      style={{
        position: "absolute",
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        opacity: 1 - 0.45 * rest,
        transform: `scale(${1 - 0.25 * rest})`,
      }}
    >
      {local > 8 && rest < 1 && (
        <div
          style={{
            ...disc,
            background: withAlpha(accent, 0.3),
            transform: `scale(${1 + ENTER(phase) * 1.1})`,
            opacity: (1 - phase) * (1 - rest),
          }}
        />
      )}
      <div
        style={{
          ...disc,
          background: withAlpha(accent, 0.16),
          boxShadow: `inset 0 0 0 ${1.5 * u}px ${withAlpha(accent, 0.55)}`,
          transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
          opacity: clamp(pop * 2, 0, 1),
          ...center,
        }}
      >
        <div
          style={{
            width: 10 * u,
            height: 10 * u,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 0 ${2 * u}px ${dark ? "#161618" : "#FFFFFF"}`,
          }}
        />
      </div>
    </div>
  );
}

function wipeClip(attach: Route["attach"], p: number, r: number) {
  const hidden = `calc(${(1 - p) * 100}% - ${p * 48}px)`;
  const out = "-48px";
  if (attach === "left")
    return `inset(${out} ${hidden} ${out} ${out} round ${r}px)`;
  if (attach === "right")
    return `inset(${out} ${out} ${out} ${hidden} round ${r}px)`;
  if (attach === "top")
    return `inset(${out} ${out} ${hidden} ${out} round ${r}px)`;
  return `inset(${hidden} ${out} ${out} ${out} round ${r}px)`;
}

export function UiCallout({
  callouts = DEFAULT_CALLOUTS,
  variant = "tooltip",
  src,
  children,
  screenshotWidth = MOCK_W,
  screenshotHeight = MOCK_H,
  stagger = 30,
  theme = "light",
  accent = "#3B5BFD",
  ground,
  groundParams,
  speed = 1,
}: UiCalloutProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const u = tall ? W / 660 : Math.min(W / 1280, H / 720);
  const dark = theme === "dark";
  const pill = variant === "pill";
  const sw = screenshotWidth;
  const sh = screenshotHeight;
  const resolvedGround: GshPresetId | undefined =
    ground ??
    (groundParams ? undefined : dark ? "cobalt-rise" : "paper-crease");

  const cardW = 330 * u;
  const sizes = callouts.map((c) => {
    if (pill) return { w: (c.title.length * 9.2 + 56) * u, h: 44 * u };
    const lines = c.body ? Math.ceil(c.body.length / 34) : 0;
    return { w: cardW, h: (118 + lines * 23) * u };
  });
  const maxCard = Math.max(...sizes.map((z) => z.h));
  const stackH = pill
    ? sizes.reduce((a, z) => a + z.h + 14 * u, -14 * u)
    : maxCard;

  const s = ((tall ? 0.92 : 0.74) * W) / sw;
  const left = (W - sw * s) / 2;
  const winH = sh * s;
  const gapBelow = 56 * u;
  const top = tall ? (H - (winH + gapBelow + stackH)) / 2 : (H - winH) / 2;
  const radius = 12 / s;
  const enter = spring({ frame: frame + 2, fps, config: HEAVY });

  const targets = callouts.map((c) => ({
    x: left + c.x * s,
    y: top + c.y * s,
  }));
  const routes = tall
    ? routeTall(targets, sizes, top + winH + gapBelow, pill, W, u)
    : routeAll(targets, callouts, sizes, W, H, u);
  const starts = callouts.map((c, i) => c.delay ?? INTRO + i * stagger);
  const foldAt = (i: number) =>
    starts[i + 1] === undefined
      ? 0
      : spring({
          frame: frame - starts[i + 1] - 16,
          fps,
          config: MORPH,
        });
  const drift =
    1 + 0.03 * CAMERA(clamp(frame / (starts[starts.length - 1] + 70), 0, 1));

  const content = src ? (
    <Img
      src={src}
      style={{ width: sw, height: sh, objectFit: "cover", display: "block" }}
    />
  ) : (
    (children ?? (
      <IssuesMock theme={theme} accent={accent} width={sw} height={sh} />
    ))
  );

  const card = dark
    ? {
        bg: "#1C1D21",
        depth: `0 0 0 1px rgba(255,255,255,0.1), 0 ${18 * u}px ${44 * u}px -${10 * u}px rgba(0,0,0,0.7)`,
        title: "#F3F3F5",
        body: "rgba(243,243,245,0.62)",
        dotOff: "rgba(255,255,255,0.18)",
        btnBg: "#F3F3F5",
        btnInk: "#121316",
      }
    : {
        bg: "#FFFFFF",
        depth: `0 0 0 1px rgba(16,24,40,0.07), 0 ${2 * u}px ${4 * u}px rgba(16,24,40,0.05), 0 ${18 * u}px ${44 * u}px -${10 * u}px rgba(16,24,40,0.22)`,
        title: "#141518",
        body: "rgba(20,21,24,0.62)",
        dotOff: "rgba(20,21,24,0.16)",
        btnBg: "#141518",
        btnInk: "#FFFFFF",
      };
  const cardR = 14 * u;

  const pillEl = (c: Callout, attach: Route["attach"]) => (
    <div
      style={{
        height: 44 * u,
        boxSizing: "border-box",
        ...row,
        gap: 10 * u,
        padding: `0 ${18 * u}px 0 ${15 * u}px`,
        borderRadius: 999,
        background: dark ? "#F4F4F6" : "#16171B",
        color: dark ? "#121316" : "#F7F7F8",
        fontSize: 18 * u,
        fontWeight: 400,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        width: "fit-content",
        marginLeft: attach === "right" ? "auto" : undefined,
        boxShadow: dark
          ? `0 ${10 * u}px ${28 * u}px -${6 * u}px rgba(0,0,0,0.55)`
          : `0 ${2 * u}px ${4 * u}px rgba(16,24,40,0.12), 0 ${10 * u}px ${24 * u}px -${6 * u}px rgba(16,24,40,0.28)`,
      }}
    >
      <span
        style={{
          width: 8 * u,
          height: 8 * u,
          borderRadius: 9,
          background: accent,
          flexShrink: 0,
        }}
      />
      {c.title}
    </div>
  );

  const cardEl = (c: Callout, i: number, textOp: number) => (
    <div
      style={{
        background: card.bg,
        borderRadius: cardR,
        padding: `${18 * u}px ${18 * u}px ${16 * u}px`,
        boxShadow: card.depth,
      }}
    >
      <div
        style={{
          opacity: textOp,
          transform: `translateY(${(1 - textOp) * 6 * u}px)`,
        }}
      >
        <div
          style={{
            fontSize: 21 * u,
            lineHeight: 1.25,
            fontWeight: 400,
            color: card.title,
            letterSpacing: "-0.02em",
          }}
        >
          {c.title}
        </div>
        {c.body && (
          <div
            style={{
              marginTop: 6 * u,
              fontSize: 16.5 * u,
              lineHeight: 1.42,
              color: card.body,
              textWrap: "pretty",
            }}
          >
            {c.body}
          </div>
        )}
        <div
          style={{
            marginTop: 16 * u,
            ...row,
            justifyContent: "space-between",
          }}
        >
          <div style={{ ...row, gap: 6 * u }}>
            {callouts.map((d, j) => (
              <span
                key={`${d.title}-dot`}
                style={{
                  width: j === i ? 18 * u : 6 * u,
                  height: 6 * u,
                  borderRadius: 6 * u,
                  background: j === i ? accent : card.dotOff,
                }}
              />
            ))}
          </div>
          <span
            style={{
              height: 34 * u,
              padding: `0 ${14 * u}px`,
              borderRadius: cardR - 6 * u,
              background: card.btnBg,
              color: card.btnInk,
              fontSize: 16 * u,
              fontWeight: 400,
              ...row,
            }}
          >
            {i === callouts.length - 1 ? "Got it" : "Next"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        background: dark ? "#02040A" : "#EEECE8",
      }}
    >
      <GshGround
        preset={resolvedGround}
        params={groundParams}
        timeOffset={dark ? 3 : 6}
        timeScale={0.4}
      />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: sw,
            height: sh,
            transformOrigin: "0 0",
            transform: `translateY(${(1 - enter) * 40 * u}px) scale(${s})`,
            opacity: clamp(enter * 2, 0, 1),
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: dark
              ? `0 0 0 ${1 / s}px rgba(255,255,255,0.1), 0 ${30 / s}px ${70 / s}px -${14 / s}px rgba(0,0,0,0.7)`
              : `0 0 0 ${1 / s}px rgba(16,24,40,0.08), 0 ${2 / s}px ${4 / s}px rgba(16,24,40,0.05), 0 ${30 / s}px ${70 / s}px -${14 / s}px rgba(16,24,40,0.24)`,
          }}
        >
          {content}
        </div>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          {routes.map((r, i) => {
            const p =
              MOVE(clamp((frame - starts[i] - 6) / 11, 0, 1)) *
              (pill ? 1 : 1 - foldAt(i));
            if (p <= 0) return null;
            const k = 10 * u;
            const a = {
              x: r.elbow.x - Math.sign(r.elbow.x - r.start.x) * k,
              y: r.elbow.y - Math.sign(r.elbow.y - r.start.y) * k,
            };
            const b = {
              x: r.elbow.x + Math.sign(r.end.x - r.elbow.x) * k,
              y: r.elbow.y + Math.sign(r.end.y - r.elbow.y) * k,
            };
            return (
              <path
                key={`line-${callouts[i].title}`}
                d={`M ${r.start.x} ${r.start.y} L ${a.x} ${a.y} Q ${r.elbow.x} ${r.elbow.y} ${b.x} ${b.y} L ${r.end.x} ${r.end.y}`}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - p}
                stroke={accent}
                strokeWidth={1.75 * u}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>
        {routes.map((r, i) => {
          const c = callouts[i];
          const local = frame - starts[i];
          if (local < 0) return null;
          const wipe = spring({ frame: local - 15, fps, config: CARD });
          const textIn = interpolate(local, [19, 31], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ENTER,
          });
          const fold = pill ? 0 : foldAt(i);
          const side = r.attach === "left" || r.attach === "right";
          const origin = {
            left: "0% 50%",
            right: "100% 50%",
            top: "50% 0%",
            bottom: "50% 100%",
          }[r.attach];
          const slide = (1 - textIn) * 6 * u * (r.attach === "right" ? -1 : 1);
          return (
            <div key={`${c.title}-${c.x}-${c.y}`}>
              <div
                style={{
                  position: "absolute",
                  left: targets[i].x,
                  top: targets[i].y,
                }}
              >
                <Ring
                  local={local}
                  accent={accent}
                  dark={dark}
                  u={u}
                  fps={fps}
                  rest={fold}
                />
              </div>
              {wipe > 0.001 && fold < 0.999 && (
                <div
                  style={{
                    position: "absolute",
                    left: r.card.x,
                    top: side ? r.end.y : r.card.y,
                    width: r.card.w,
                    transform: side ? "translateY(-50%)" : undefined,
                    clipPath: wipeClip(
                      r.attach,
                      Math.min(1, wipe),
                      pill ? 22 * u : cardR,
                    ),
                  }}
                >
                  <div
                    style={{
                      opacity:
                        (pill ? textIn : 1) * (1 - clamp(fold * 3, 0, 1)),
                      transformOrigin: origin,
                      transform: `translateX(${slide}px) scale(${1 - 0.08 * fold})`,
                    }}
                  >
                    {pill ? pillEl(c, r.attach) : cardEl(c, i, textIn)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

type MockTheme = "light" | "dark";
type Status = "progress" | "todo" | "backlog" | "done";
const MOCK_W = 1440;
const MOCK_H = 900;
const SB = 232;

const PAL_KEYS = [
  "app",
  "panel",
  "border",
  "hair",
  "group",
  "text",
  "sub",
  "faint",
  "active",
  "chip",
] as const;
type Pal = Record<(typeof PAL_KEYS)[number], string>;
const pal = (hexes: string) =>
  Object.fromEntries(hexes.split(" ").map((h, i) => [PAL_KEYS[i], h])) as Pal;
const MOCK_COLORS: Record<MockTheme, Pal> = {
  light: pal(
    "#F4F4F5 #FFFFFF #E5E5E8 #F1F1F3 #F7F7F8 #1B1C1F #62656D #A1A4AB #E7E7EA #E3E3E6",
  ),
  dark: pal(
    "#0E0E10 #161618 #252528 #1E1E21 #1C1C1F #E6E6E8 #8D9098 #5F626A #222226 #2C2C30",
  ),
};
const row = { display: "flex", alignItems: "center" } as const;
const center = { ...row, justifyContent: "center" } as const;

const GLYPHS: Record<string, string> = {
  inbox: "M2.5 9.5h3l1 1.5h3l1-1.5h3M4 3.5h8l1.5 6V13h-11V9.5z",
  user: "M8 8.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM3 13.5c.9-2.2 2.8-3.2 5-3.2s4.1 1 5 3.2",
  cube: "M8 1.8l5.5 3v6.4L8 14.2l-5.5-3V4.8zM2.5 4.8L8 7.8l5.5-3M8 7.8v6.4",
  layers: "M8 2l6 3-6 3-6-3zM2 8.2l6 3 6-3M2 11.2l6 3 6-3",
  more: "M3.5 8h.01M8 8h.01M12.5 8h.01",
  issues: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM5.6 8l1.7 1.7 3.1-3.3",
  cycle: "M13 8a5 5 0 1 1-1.6-3.7M13.2 2.6v2.6h-2.6",
  download: "M8 2.5v7.5M5 7l3 3 3-3M3 12.5h10",
  invite:
    "M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13.5c.6-2 2.3-3 4.5-3s3.9 1 4.5 3M12.5 5v4M10.5 7h4",
  link: "M6.8 9.2l2.4-2.4M7.2 4.6l1-1a2.6 2.6 0 0 1 3.7 3.7l-1 1M8.8 11.4l-1 1a2.6 2.6 0 0 1-3.7-3.7l1-1",
  search: "M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.4 10.4L14 14",
  compose: "M7.5 2.5H3.5v10h10v-4M12.2 2.3l1.5 1.5-5.6 5.6-2 .5.5-2z",
  filter: "M2.5 4.5h11M4.5 8h7M6.5 11.5h3",
  display: "M2.5 5h6M11.5 5h2M2.5 11h2M7.5 11h6M10 3.5v3M6 9.5v3",
  chevron: "M5 6.5l3 3 3-3",
  plus: "M8 3.5v9M3.5 8h9",
  sun: "M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1",
  moon: "M13.2 9.6A5.5 5.5 0 0 1 6.4 2.8a5.5 5.5 0 1 0 6.8 6.8z",
};

function Glyph({
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
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d={GLYPHS[name]}
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusIcon({
  status,
  accent,
  c,
}: {
  status: Status;
  accent: string;
  c: Pal;
}) {
  const col = {
    progress: "#E8B100",
    todo: c.faint,
    backlog: c.faint,
    done: accent,
  }[status];
  const done = status === "done";
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      <circle
        cx={7}
        cy={7}
        r={done ? 6.5 : 5.8}
        fill={done ? col : "none"}
        stroke={done ? "none" : col}
        strokeWidth={1.5}
        strokeDasharray={status === "backlog" ? "1.4 1.6" : undefined}
      />
      {done && (
        <path
          d="M4.3 7.2l1.8 1.8 3.6-3.8"
          stroke="#fff"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {status === "progress" && (
        <path d="M7 3.6A3.4 3.4 0 0 1 7 10.4Z" fill={col} />
      )}
    </svg>
  );
}

function PriorityIcon({ p, c }: { p: number; c: Pal }) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      {p === 4 && (
        <rect x={0.5} y={0.5} width={13} height={13} rx={3} fill="#F2683C" />
      )}
      {p === 4 && (
        <path
          d="M7 3.5v4.2M7 10.2v.1"
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      )}
      {p === 0 &&
        [2.5, 7, 11.5].map((x) => (
          <circle key={x} cx={x} cy={7} r={1.1} fill={c.faint} />
        ))}
      {p > 0 &&
        p < 4 &&
        [0, 1, 2].map((i) => (
          <rect
            key={i}
            x={1.5 + i * 4}
            y={9 - i * 3}
            width={3}
            height={4 + i * 3}
            rx={0.8}
            fill={i < p ? c.sub : c.chip}
          />
        ))}
    </svg>
  );
}

const TINTS = [
  "#E0795B",
  "#5B8DEF",
  "#9B6BDF",
  "#3FA47A",
  "#D9A23B",
  "#D9608F",
];

function Avatar({ name, size = 20 }: { name?: string; size?: number }) {
  const tint = name
    ? TINTS[(name.charCodeAt(0) + name.length) % TINTS.length]
    : "";
  return (
    <div
      style={{
        ...center,
        width: size,
        height: size,
        flexShrink: 0,
        boxSizing: "border-box",
        borderRadius: size,
        border: name ? undefined : "1.3px dashed #9A9DA4",
        background: name
          ? `linear-gradient(140deg, ${tint}, ${tint}B0)`
          : undefined,
        color: "#fff",
        fontSize: size * 0.42,
        fontWeight: 400,
      }}
    >
      {name?.split(" ").map((w) => w[0])}
    </div>
  );
}

const LABEL_COLORS: Record<string, string> = Object.fromEntries(
  "Feature:#8B5CF6 Bug:#EF4444 Motion:#0EA5E9 Docs:#3B82F6 Infra:#F97316 Captions:#EC4899 Marketing:#22C55E Research:#A1A1AA"
    .split(" ")
    .map((kv) => kv.split(":")),
);

const ISSUE_DATA = `
#progress|In Progress|4
REM-142|4|Spring presets for page transitions|Feature,Motion|v1.4 Launch|Maya Chen|Oct 28
REM-139|3|Fix flicker in zoom-blur at 60fps|Bug|Transitions|Leo Park|Oct 26
REM-137|2|Docs: theme-flip props and examples|Docs|v1.4 Launch|Priya Raman|Oct 30
REM-131|1|Render queue retries for long templates|Infra||Jonah Reyes|Nov 2
#todo|Todo|5
REM-148|3|Caption timing editor in Studio|Feature,Captions|Captions|Maya Chen|Nov 4
REM-146|1|Add Lumen and Fernway to the logo wall|Marketing||Ava Kim|Nov 5
REM-145|2|Export presets for 9:16 and 1:1|Feature|v1.4 Launch|Leo Park|Nov 6
REM-144|2|Audit spring damping across primitives|Motion||Priya Raman|Nov 8
#backlog|Backlog|3
REM-151|0|Lottie import for the icon set|Research|||
REM-150|1|Keyboard shortcuts cheat sheet|Docs||Ava Kim|
REM-149|0|Audio-reactive backgrounds|Research,Motion|||
#done|Done|17
REM-128|3|Ship captions tab with 31 styles|Feature,Captions|Captions|Maya Chen|Oct 21
REM-127|2|Build registry artifacts in CI|Infra||Jonah Reyes|Oct 20
REM-125|1|Sponsors page with tiers|Marketing||Ava Kim|Oct 18
REM-121|2|Zoom blur transition|Motion|Transitions|Leo Park|Oct 15
REM-119|3|Agent-readable docs for every component|Docs||Priya Raman|Oct 12
REM-117|2|Remotion Studio integration|Feature||Leo Park|Oct 9`;

const MOCK_GROUPS = ISSUE_DATA.trim()
  .split("#")
  .filter(Boolean)
  .map((block) => {
    const [head, ...lines] = block.trim().split("\n");
    const [status, name, count] = head.split("|");
    const issues = lines.map((l) => {
      const [id, p, title, labels, project, who, date] = l.split("|");
      return {
        id,
        p: Number(p),
        title,
        labels: labels ? labels.split(",") : [],
        project,
        who,
        date,
      };
    });
    return { status: status as Status, name, count, issues };
  });

const NAV =
  "inbox:Inbox:3|user:My issues|-Workspace|cube:Projects|layers:Views|more:More|-Your teams|=Engineering|>*issues:Issues|>cycle:Cycles|>cube:Projects|>layers:Views|-Try|download:Import issues|invite:Invite people|link:Connect GitHub";

function NavItem({ spec, c }: { spec: string; c: Pal }) {
  if (spec.startsWith("-"))
    return (
      <div
        style={{
          ...row,
          height: 24,
          marginTop: 16,
          padding: "0 16px",
          gap: 4,
          color: c.faint,
          fontSize: 12,
        }}
      >
        {spec.slice(1)}
        <Glyph name="chevron" size={12} color={c.faint} />
      </div>
    );
  const team = spec.startsWith("=");
  const nested = spec.startsWith(">");
  const active = spec.includes("*");
  const [icon, label, badge] = spec.replace(/^[=>]?\*?/, "").split(":");
  return (
    <div
      style={{
        ...row,
        height: 28,
        margin: "0 8px",
        padding: `0 8px 0 ${nested ? 24 : 8}px`,
        gap: 9,
        borderRadius: 6,
        background: active ? c.active : "transparent",
        color: active || team ? c.text : c.sub,
        fontSize: 13,
        fontWeight: 400,
      }}
    >
      {team ? (
        <div
          style={{
            ...center,
            width: 15,
            height: 15,
            borderRadius: 4,
            background: "#1FA463",
            color: "#fff",
            fontSize: 9,
          }}
        >
          E
        </div>
      ) : (
        <Glyph name={icon} size={15} color={active ? c.text : c.sub} />
      )}
      <span style={{ flex: team ? undefined : 1 }}>{team ? icon : label}</span>
      {team && <Glyph name="chevron" size={12} color={c.faint} />}
      {badge && <span style={{ fontSize: 11.5, color: c.faint }}>{badge}</span>}
    </div>
  );
}

type MockIssue = (typeof MOCK_GROUPS)[number]["issues"][number];

function IssueRow({
  issue,
  status,
  accent,
  c,
}: {
  issue: MockIssue;
  status: Status;
  accent: string;
  c: Pal;
}) {
  const chip = {
    ...row,
    height: 22,
    padding: "0 9px",
    gap: 6,
    borderRadius: 11,
    border: `1px solid ${c.chip}`,
    fontSize: 12,
  };
  return (
    <div
      style={{
        ...row,
        height: 40,
        boxSizing: "border-box",
        padding: "0 20px",
        borderBottom: `1px solid ${c.hair}`,
      }}
    >
      <PriorityIcon p={issue.p} c={c} />
      <span style={{ width: 70, marginLeft: 14, color: c.sub, fontSize: 13 }}>
        {issue.id}
      </span>
      <StatusIcon status={status} accent={accent} c={c} />
      <span
        style={{
          marginLeft: 10,
          flex: 1,
          fontSize: 13,
          fontWeight: 400,
          whiteSpace: "nowrap",
        }}
      >
        {issue.title}
      </span>
      <div style={{ ...row, gap: 6, color: c.sub }}>
        {issue.labels.map((l) => (
          <span key={l} style={chip}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: LABEL_COLORS[l],
              }}
            />
            {l}
          </span>
        ))}
        {issue.project && (
          <span style={chip}>
            <Glyph name="cube" size={12} color={c.sub} />
            {issue.project}
          </span>
        )}
      </div>
      <div style={{ width: 20, marginLeft: 12 }}>
        <Avatar name={issue.who || undefined} />
      </div>
      <span
        style={{
          width: 56,
          marginLeft: 12,
          textAlign: "right",
          color: c.sub,
          fontSize: 12.5,
        }}
      >
        {issue.date}
      </span>
    </div>
  );
}

interface IssuesMockProps {
  theme?: MockTheme;
  accent?: string;
  width?: number;
  height?: number;
  headerExtra?: React.ReactNode;
}

function IssuesMock({
  theme = "light",
  accent = "#3B5BFD",
  width = MOCK_W,
  height = MOCK_H,
  headerExtra,
}: IssuesMockProps) {
  const c = MOCK_COLORS[theme];
  const box = (size: number) => ({
    ...center,
    width: size,
    height: size,
    borderRadius: 7,
    border: `1px solid ${c.border}`,
  });
  return (
    <div
      style={{
        width,
        height,
        background: c.app,
        display: "flex",
        fontFamily,
        color: c.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: SB,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            ...row,
            height: 44,
            marginTop: 4,
            marginBottom: 4,
            padding: "0 12px 0 16px",
            gap: 8,
          }}
        >
          <div
            style={{
              ...center,
              width: 20,
              height: 20,
              borderRadius: 5,
              background: accent,
            }}
          >
            <svg viewBox="0 0 124.06 134.26" height={10} aria-hidden>
              <path fill="#FFFFFF" d={REMOCN_R_PATH} />
            </svg>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 400 }}>remocn</span>
          <Glyph name="chevron" size={12} color={c.sub} />
          <div style={{ flex: 1 }} />
          <Glyph name="search" size={15} color={c.sub} />
          <div style={{ ...box(28), background: c.panel }}>
            <Glyph name="compose" size={15} color={c.text} />
          </div>
        </div>
        {NAV.split("|").map((spec) => (
          <NavItem key={spec} spec={spec} c={c} />
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            margin: 10,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: c.panel,
          }}
        >
          <div style={{ fontSize: 11.5, color: c.sub }}>What’s new</div>
          <div style={{ fontSize: 12.5, fontWeight: 400, marginTop: 3 }}>
            Captions in Studio
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: `8px 8px 8px ${SB}px`,
          background: c.panel,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...row,
            height: 48,
            boxSizing: "border-box",
            padding: "0 12px 0 14px",
            gap: 4,
            borderBottom: `1px solid ${c.hair}`,
          }}
        >
          {["All issues", "Active", "Backlog"].map((t, i) => (
            <span
              key={t}
              style={{
                ...row,
                height: 26,
                padding: "0 10px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 400,
                color: i === 0 ? c.text : c.sub,
                background: i === 0 ? c.active : "transparent",
              }}
            >
              {t}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          {headerExtra}
          {["filter", "display"].map((g) => (
            <div key={g} style={{ ...box(28), marginLeft: 4, borderRadius: 6 }}>
              <Glyph name={g} size={15} color={c.sub} />
            </div>
          ))}
        </div>
        {MOCK_GROUPS.map((g) => (
          <div key={g.name}>
            <div
              style={{
                ...row,
                height: 36,
                boxSizing: "border-box",
                padding: "0 20px",
                gap: 10,
                background: c.group,
                fontSize: 13,
              }}
            >
              <Glyph name="chevron" size={12} color={c.faint} />
              <StatusIcon status={g.status} accent={accent} c={c} />
              <span>{g.name}</span>
              <span style={{ color: c.faint, flex: 1 }}>{g.count}</span>
              <Glyph name="plus" size={15} color={c.faint} />
            </div>
            {g.issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                status={g.status}
                accent={accent}
                c={c}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
