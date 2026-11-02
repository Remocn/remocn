"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
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
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["600"], subsets: ["latin"] });

export interface StatusIncident {
  day: number;
  level?: "degraded" | "outage";
  title?: string;
  minutes?: number;
  date?: string;
}

export interface StatusComponent {
  name: string;
  uptime: number;
  incidents?: StatusIncident[];
}

export interface StatusPageProps {
  brand?: string;
  url?: string;
  components?: StatusComponent[];
  hover?: { component: number; day: number };
  year?: number;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_COMPONENTS: StatusComponent[] = [
  {
    name: "API",
    uptime: 99.98,
    incidents: [
      {
        day: 69,
        level: "degraded",
        title: "Elevated latency",
        minutes: 12,
        date: "Oct 3",
      },
    ],
  },
  {
    name: "Studio",
    uptime: 99.99,
    incidents: [{ day: 41, level: "degraded", minutes: 6, date: "Sep 5" }],
  },
  {
    name: "Render farm",
    uptime: 99.91,
    incidents: [
      {
        day: 23,
        level: "outage",
        title: "Partial outage",
        minutes: 47,
        date: "Aug 18",
      },
      { day: 69, level: "degraded", minutes: 18, date: "Oct 3" },
    ],
  },
  { name: "Registry CDN", uptime: 100 },
  {
    name: "Docs",
    uptime: 99.99,
    incidents: [{ day: 55, level: "degraded", minutes: 4, date: "Sep 19" }],
  },
];

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const DAYS = 90;

const B = {
  card: 0,
  bars: 8,
  resolve: 54,
  cursor: 64,
  pushIn: 70,
  hoverA: 92,
  moveB: 134,
  hoverB: 156,
  leave: 196,
  pullOut: 198,
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tw = (f: number, a: number, b: number, e = ENTER) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing: e });

const LIGHT = {
  card: "#FFFFFF",
  text: "#15171C",
  muted: "#5D626C",
  faint: "#9599A2",
  empty: "#E7E9ED",
  line: "rgba(21,23,28,0.07)",
  green: "#1E9E5A",
  amber: "#D88A12",
  red: "#D5463F",
  tip: "#15171C",
  tipText: "#F4F5F6",
  tipMuted: "rgba(244,245,246,0.6)",
  shadow:
    "0 0 0 1px rgba(21,23,28,0.06), 0 2px 4px rgba(21,23,28,0.04), 0 32px 80px -24px rgba(21,23,28,0.28)",
};
const DARK: typeof LIGHT = {
  card: "#0D0F10",
  text: "#ECEEF0",
  muted: "#959BA3",
  faint: "#5F656D",
  empty: "#202427",
  line: "rgba(255,255,255,0.07)",
  green: "#3DD68C",
  amber: "#F2B544",
  red: "#FF6A63",
  tip: "#202427",
  tipText: "#F4F5F6",
  tipMuted: "rgba(244,245,246,0.58)",
  shadow:
    "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 48px 120px -24px rgba(0,0,0,0.85)",
};
type Pal = typeof LIGHT;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
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
        filter:
          "drop-shadow(0 1px 1px rgba(0,0,0,0.25)) drop-shadow(0 6px 10px rgba(0,0,0,0.2))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#15171C"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function layoutFor(portrait: boolean) {
  if (portrait) {
    const card = { x: 36, y: 140, w: 648, h: 1000 };
    const pad = 32;
    return {
      stageW: 720,
      stageH: 1280,
      card,
      pad,
      headY: 32,
      bannerY: 104,
      bannerSize: 54,
      bannerTwoLine: true,
      listY: 300,
      rowH: 128,
      nameSize: 22,
      barTop: 56,
      barH: 48,
      gap: 2.2,
      logo: 28,
      tipW: 320,
    };
  }
  const card = { x: 80, y: 40, w: 1120, h: 640 };
  return {
    stageW: 1280,
    stageH: 720,
    card,
    pad: 40,
    headY: 32,
    bannerY: 104,
    bannerSize: 38,
    bannerTwoLine: false,
    listY: 200,
    rowH: 72,
    nameSize: 19,
    barTop: 36,
    barH: 26,
    gap: 3,
    logo: 26,
    tipW: 300,
  };
}

function levelColor(c: Pal, level?: StatusIncident["level"]) {
  return level === "outage" ? c.red : c.amber;
}

export function StatusPage({
  brand = "remocn",
  url = "status.remocn.dev",
  components = DEFAULT_COMPONENTS,
  hover,
  year = 2026,
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: StatusPageProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width;
  const L = layoutFor(portrait);
  const s = Math.min(width / L.stageW, height / L.stageH);
  const dark = theme === "dark";
  const c = dark ? DARK : LIGHT;
  const sp = (at: number, config: typeof CARD | typeof MORPH = CARD) =>
    spring({ frame: frame - at, fps, config });

  const innerW = L.card.w - L.pad * 2;
  const barW = (innerW - L.gap * (DAYS - 1)) / DAYS;

  const all = components.flatMap((comp, i) =>
    (comp.incidents ?? []).map((inc) => ({ component: i, inc })),
  );
  const first =
    hover ??
    (() => {
      const pick = all.find((x) => x.inc.level === "outage") ?? all[0];
      return pick
        ? { component: pick.component, day: pick.inc.day }
        : { component: 0, day: 60 };
    })();
  const secondPick =
    all.find(
      (x) =>
        x.inc.title &&
        !(x.component === first.component && x.inc.day === first.day),
    ) ??
    all.find(
      (x) => !(x.component === first.component && x.inc.day === first.day),
    );
  const second = secondPick
    ? { component: secondPick.component, day: secondPick.inc.day }
    : first;
  const targets = [first, second];

  const barCenter = (t: { component: number; day: number }) => ({
    x: L.card.x + L.pad + t.day * (barW + L.gap) + barW / 2,
    y: L.card.y + L.listY + 40 + t.component * L.rowH + L.barTop + L.barH / 2,
  });
  const pA = barCenter(first);
  const pB = barCenter(second);

  const toB = sp(B.moveB, { mass: 0.9, damping: 24, stiffness: 140 });
  const active = toB > 0.5 ? 1 : 0;
  const swap = tw(frame, B.moveB + 4, B.moveB + 14, SOFT);

  const curStart = { x: L.stageW * 0.86, y: L.stageH * 0.94 };
  const curExit = { x: L.stageW * 0.9, y: L.stageH * 0.78 };
  const arcPt = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    p: number,
    bend: number,
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.sin(clamp(p) * Math.PI) * Math.min(bend, d * 0.18);
    return {
      x: lerp(a.x, b.x, p) - (dy / d) * k,
      y: lerp(a.y, b.y, p) + (dx / d) * k,
    };
  };
  const toA = sp(B.cursor, { mass: 0.9, damping: 24, stiffness: 110 });
  const toOut = sp(B.leave, { mass: 0.9, damping: 24, stiffness: 140 });
  let cur = arcPt(curStart, { x: pA.x + 2, y: pA.y + 4 }, toA, 60);
  if (frame >= B.moveB)
    cur = arcPt(
      { x: pA.x + 2, y: pA.y + 4 },
      { x: pB.x + 2, y: pB.y + 4 },
      toB,
      40,
    );
  if (frame >= B.leave)
    cur = arcPt({ x: pB.x + 2, y: pB.y + 4 }, curExit, toOut, 50);
  const cursorO =
    tw(frame, B.cursor, B.cursor + 8) *
    (1 - tw(frame, B.leave + 10, B.leave + 18, EXIT));
  const click = (at: number) =>
    spring({ frame: frame - at + 3, fps, config: CHIP }) -
    spring({ frame: frame - at, fps, config: CHIP });
  const press = Math.max(0, click(B.hoverA), click(B.hoverB));

  const tipIn = sp(B.hoverA);
  const tipOut = tw(frame, B.leave, B.leave + 7, EXIT);
  const tip = clamp(tipIn) * (1 - tipOut);
  const tipPos = {
    x: lerp(pA.x, pB.x, toB),
    y: lerp(pA.y, pB.y, toB),
  };
  const tipTarget = targets[active];

  const push =
    tw(frame, B.pushIn, B.hoverA + 6, CAM) *
    (1 - tw(frame, B.pullOut, B.pullOut + 22, CAM));
  const zoom = portrait ? 1.06 : 1.1;
  const camS = lerp(1, zoom, push) * (1 + 0.02 * (frame / 240));
  const focus = {
    x: L.stageW / 2,
    y: lerp(L.stageH / 2, lerp(tipPos.y - 60, L.stageH / 2, 0.45), push),
  };

  const cardIn = sp(B.card, HEAVY);
  const cardO = tw(frame, B.card, B.card + 12);
  const resolved = frame >= B.resolve;
  const flip = clamp(sp(B.resolve, CHIP));
  const lineSwap = tw(frame, B.resolve, B.resolve + 12);

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "kiruna" : "paper-crease");
  const resolvedParams =
    groundParams ??
    (dark
      ? { grain: 0.06 }
      : {
          kind: "mist" as const,
          colors: ["#9fd8b8", "#d9eee0", "#f5f3ee", "#6cbf95"],
          background: "#f2f1ec",
        });

  const tipArrow = L.tipW * (tipTarget.day < DAYS / 2 ? 0.22 : 0.78);

  const mLabel: React.CSSProperties = {
    fontFamily: mono.fontFamily,
    fontSize: 16,
    color: c.muted,
    letterSpacing: "0.01em",
  };

  return (
    <AbsoluteFill style={{ fontFamily: geist.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={6}
        timeScale={0.35}
      />
      <div
        style={{
          position: "absolute",
          left: (width - L.stageW * s) / 2,
          top: (height - L.stageH * s) / 2,
          width: L.stageW,
          height: L.stageH,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "0 0",
            transform: `translate(${L.stageW / 2 - focus.x * camS}px, ${L.stageH / 2 - focus.y * camS}px) scale(${camS})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: L.card.x,
              top: L.card.y,
              width: L.card.w,
              height: L.card.h,
              borderRadius: 24,
              background: c.card,
              boxShadow: c.shadow,
              overflow: "hidden",
              color: c.text,
              opacity: cardO,
              transform: `translateY(${(1 - cardIn) * 48}px) scale(${0.96 + 0.04 * cardIn})`,
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: L.pad,
                right: L.pad,
                top: L.headY,
                height: 40,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {brand === "remocn" ? (
                <RemocnLogo fontSize={L.logo} color={c.text} />
              ) : (
                <span
                  style={{
                    fontSize: L.logo,
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {brand}
                </span>
              )}
              <span
                style={{
                  fontSize: L.logo,
                  fontWeight: 300,
                  color: c.faint,
                  letterSpacing: "-0.03em",
                }}
              >
                status
              </span>
              <div style={{ flex: 1 }} />
              {portrait ? null : (
                <span style={{ ...mLabel, color: c.faint }}>{url}</span>
              )}
              <div
                style={{
                  height: 40,
                  padding: "0 16px",
                  marginLeft: 12,
                  borderRadius: 10,
                  background: accent,
                  color: "#fff",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                Subscribe
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: L.pad,
                right: L.pad,
                top: L.bannerY,
                display: "flex",
                alignItems: L.bannerTwoLine ? "flex-start" : "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  marginTop: L.bannerTwoLine ? 10 : 0,
                }}
              >
                <svg
                  width={34}
                  height={34}
                  viewBox="0 0 34 34"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 1 - flip,
                    transform: `rotate(${frame * 9}deg)`,
                  }}
                >
                  <circle
                    cx={17}
                    cy={17}
                    r={13}
                    fill="none"
                    stroke={c.empty}
                    strokeWidth={2}
                  />
                  <path
                    d="M17 4a13 13 0 0 1 13 13"
                    fill="none"
                    stroke={c.muted}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
                {resolved ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 17,
                      background: c.green,
                      transform: `scale(${flip})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width={18} height={18} viewBox="0 0 18 18">
                      <path
                        d="M4 9.4l3.2 3.1L14 5.6"
                        fill="none"
                        stroke="#fff"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={
                          1 - tw(frame, B.resolve + 3, B.resolve + 12, SOFT)
                        }
                      />
                    </svg>
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: L.bannerTwoLine ? 132 : 46,
                }}
              >
                {[0, 1].map((k) => {
                  const o = k === 0 ? 1 - lineSwap : lineSwap;
                  return (
                    <div
                      key={k}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        fontSize: L.bannerSize,
                        fontWeight: 300,
                        letterSpacing: "-0.035em",
                        lineHeight: 1.18,
                        color: k === 0 ? c.muted : c.text,
                        opacity: k === 1 && !resolved ? 0 : o,
                        transform: `translateY(${(k === 0 ? -1 : 1) * (1 - o) * 14}px)`,
                        filter: `blur(${(1 - o) * 4}px)`,
                        whiteSpace: L.bannerTwoLine ? "normal" : "nowrap",
                        width: L.bannerTwoLine ? 400 : undefined,
                      }}
                    >
                      {k === 0
                        ? `Checking ${components.length} services`
                        : "All systems operational"}
                    </div>
                  );
                })}
              </div>
              {portrait ? null : (
                <span
                  style={{
                    ...mLabel,
                    opacity: lineSwap,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Updated 14:02 UTC
                </span>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: L.pad,
                right: L.pad,
                top: L.listY,
                height: 40,
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${c.line}`,
                ...mLabel,
                color: c.faint,
              }}
            >
              <span>Services</span>
              <span style={{ marginLeft: "auto" }}>90 days ago → today</span>
            </div>

            {components.map((comp, r) => {
              const start = B.bars + r * 5;
              const settle = tw(frame, start + 2, start + 40, SOFT);
              const pct = comp.uptime - (1 - settle) * 0.42;
              const rowIn = tw(frame, start - 2, start + 10);
              const byDay = new Map(
                (comp.incidents ?? []).map((i) => [i.day, i]),
              );
              const rowHovered = targets[active].component === r && tip > 0.01;
              return (
                <div
                  key={comp.name}
                  style={{
                    position: "absolute",
                    left: L.pad,
                    right: L.pad,
                    top: L.listY + 40 + r * L.rowH,
                    height: L.rowH,
                    borderBottom:
                      r === components.length - 1
                        ? "none"
                        : `1px solid ${c.line}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: portrait ? 18 : 9,
                      display: "flex",
                      alignItems: "baseline",
                      fontSize: L.nameSize,
                      opacity: rowIn,
                      transform: `translateY(${(1 - rowIn) * 8}px)`,
                    }}
                  >
                    <span style={{ fontWeight: 400, letterSpacing: "-0.01em" }}>
                      {comp.name}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: mono.fontFamily,
                        fontSize: 17,
                        color: c.text,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {pct.toFixed(2)}%
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: L.barTop,
                      height: L.barH,
                      width: innerW,
                    }}
                  >
                    {Array.from({ length: DAYS }, (_, j) => {
                      const at = start + j * 0.32;
                      const v = spring({
                        frame: frame - at,
                        fps,
                        config: CHIP,
                      });
                      const inc = byDay.get(j);
                      const base = inc ? levelColor(c, inc.level) : c.green;
                      const color = interpolateColors(
                        tw(frame, at, at + 8),
                        [0, 1],
                        [c.empty, base],
                      );
                      const hovered = rowHovered && targets[active].day === j;
                      const dim = rowHovered && !hovered ? 1 - tip * 0.45 : 1;
                      return (
                        <div
                          key={j}
                          style={{
                            position: "absolute",
                            left: j * (barW + L.gap),
                            bottom: 0,
                            width: barW,
                            height: L.barH,
                            borderRadius: 2,
                            background: color,
                            opacity: (frame >= at ? 1 : 0) * dim,
                            transformOrigin: "50% 100%",
                            transform: `scaleY(${Math.max(0, v) * (hovered ? 1 + 0.18 * tip : 1)})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {tip > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: tipPos.x - tipArrow,
                top: tipPos.y - L.barH / 2 - 14 - 104,
                width: L.tipW,
                height: 104,
                boxSizing: "border-box",
                padding: "14px 16px",
                borderRadius: 14,
                background: c.tip,
                color: c.tipText,
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px -8px rgba(0,0,0,0.7)"
                  : "0 2px 4px rgba(0,0,0,0.08), 0 18px 40px -10px rgba(0,0,0,0.38)",
                opacity: clamp(tip * 1.6),
                transformOrigin: `${tipArrow}px 100%`,
                transform: `translateY(${(1 - tip) * 10}px) scale(${0.92 + 0.08 * tip})`,
              }}
            >
              <div style={{ position: "relative", height: "100%" }}>
                {targets.map((t, k) => {
                  const comp = components[t.component] ?? components[0];
                  const inc = comp?.incidents?.find((i) => i.day === t.day);
                  const o = k === 0 ? 1 - swap : swap;
                  if (o <= 0.01 || (k === 1 && frame < B.moveB)) return null;
                  const col = levelColor(c, inc?.level);
                  const label =
                    inc?.title ??
                    (inc?.level === "outage"
                      ? "Partial outage"
                      : "Degraded performance");
                  return (
                    <div
                      key={`${t.component}-${t.day}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: o,
                        transform: `translateY(${(k === 0 ? -1 : 1) * (1 - o) * 8}px)`,
                      }}
                    >
                      <div style={{ ...mLabel, color: c.tipMuted }}>
                        {inc?.date ?? `${DAYS - 1 - t.day} days ago`}, {year}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 10,
                          fontSize: 18,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            background: col,
                          }}
                        />
                        {label}
                        <span
                          style={{
                            marginLeft: "auto",
                            fontFamily: mono.fontFamily,
                            fontSize: 16,
                            color: c.tipMuted,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {inc?.minutes ?? 10} min
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          color: c.tipMuted,
                          marginTop: 8,
                        }}
                      >
                        Resolved · {comp?.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: tipArrow - 7,
                  bottom: -6,
                  width: 14,
                  height: 14,
                  background: c.tip,
                  transform: "rotate(45deg)",
                  borderRadius: 2,
                }}
              />
            </div>
          ) : null}

          {cursorO > 0.01 ? (
            <div style={{ opacity: cursorO }}>
              <Cursor x={cur.x} y={cur.y} press={press} />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
