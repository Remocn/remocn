"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

export interface ThemeFlipProps {
  /** Custom "before" / "after" UI. Fallback: the built-in mock in light and dark. */
  from?: React.ReactNode;
  to?: React.ReactNode;
  fromSrc?: string;
  toSrc?: string;
  /** Theme the built-in mock starts in. */
  startTheme?: "light" | "dark";
  /** Click point and flood center, in screenshot pixels. Defaults to the mock's toggle. */
  origin?: { x: number; y: number };
  /** Draw a floating toggle at `origin` over custom content. */
  showToggle?: boolean;
  showCursor?: boolean;
  /** Flip back to the first theme after a hold. */
  reverse?: boolean;
  screenshotWidth?: number;
  screenshotHeight?: number;
  accent?: string;
  speed?: number;
  /** Camera zoom on the toggle around the click (1 = no push-in). */
  zoom?: number;
  /** gradients.sh preset for the ground. Defaults to "charcoal-satin". */
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SEG = 80;
const TOGGLE_RIGHT = 1431 - 12 - 64 - 6;
const DEFAULT_ORIGIN = { x: TOGGLE_RIGHT - 2 - SEG / 2, y: 33 };

const CLICK = 36;
const FLOOD = 26;
const REV = 92;
const ZOOM = 2.1;
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const WIPE = Easing.bezier(0.83, 0, 0.17, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const ramp = (frame: number, from: number, len: number, curve = MOVE) =>
  curve(clamp((frame - from) / len, 0, 1));

function ThemeToggle({
  theme,
  k,
  hover,
  press,
}: {
  theme: MockTheme;
  k: number;
  hover: number;
  press: number;
}) {
  const c = MOCK_COLORS[theme];
  const dark = theme === "dark";
  const segs = [
    { icon: "sun", label: "Light", on: 1 - clamp(k, 0, 1) },
    { icon: "moon", label: "Dark", on: clamp(k, 0, 1) },
  ];
  const target = k < 0.5 ? 1 : 0;
  return (
    <div
      style={{
        position: "relative",
        width: SEG * 2 + 4,
        height: 32,
        boxSizing: "border-box",
        borderRadius: 9,
        padding: 2,
        marginRight: 6,
        background: dark ? "#0B0B0D" : "#EDEDF0",
        boxShadow: dark
          ? "inset 0 0 0 1px rgba(255,255,255,0.06)"
          : "inset 0 0 0 1px rgba(16,24,40,0.05)",
        display: "flex",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 2 + k * SEG,
          top: 2,
          width: SEG,
          height: 28,
          borderRadius: 7,
          background: dark ? "#26272B" : "#FFFFFF",
          boxShadow: dark
            ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.06)"
            : "0 0 0 1px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.08)",
        }}
      />
      {segs.map((sg, i) => {
        const lit = sg.on > 0.5;
        const hot = i === target ? hover : 0;
        return (
          <div
            key={sg.label}
            style={{
              position: "relative",
              width: SEG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 400,
              color: lit || hot > 0.5 ? c.text : c.sub,
              borderRadius: 7,
              transform: `scale(${i === target ? 1 - 0.04 * press : 1})`,
            }}
          >
            <Glyph name={sg.icon} size={14} color={lit ? c.text : c.sub} />
            {sg.label}
          </div>
        );
      })}
    </div>
  );
}

function Cursor({ size, press }: { size: number; press: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 20 24"
      style={{
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.04 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeFlip({
  from,
  to,
  fromSrc,
  toSrc,
  startTheme = "light",
  origin,
  showToggle = true,
  showCursor = true,
  reverse = false,
  screenshotWidth = MOCK_W,
  screenshotHeight = MOCK_H,
  accent = "#3B5BFD",
  speed = 1,
  zoom = ZOOM,
  ground,
  groundParams,
}: ThemeFlipProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W * 1.2;
  const u = Math.min(W / 1280, H / 720);
  const sw = screenshotWidth;
  const sh = screenshotHeight;
  const themes: [MockTheme, MockTheme] =
    startTheme === "dark" ? ["dark", "light"] : ["light", "dark"];
  const custom = Boolean(from || to || fromSrc || toSrc);
  const o = origin ?? DEFAULT_ORIGIN;
  const back = startTheme === "dark" ? 1 : -1;

  const s = tall ? (W * 0.9) / sw : (W * 0.76) / sw;
  const left = (W - sw * s) / 2;
  const enter = spring({ frame: frame + 2, fps, config: HEAVY });
  const top = (tall ? H * 0.47 : H * 0.13) + (1 - enter) * 0.06 * H;
  const toStage = (x: number, y: number) => ({
    x: left + x * s,
    y: top + y * s,
  });
  const flipPt = toStage(o.x, o.y);
  const backPt = toStage(o.x + back * SEG, o.y);
  const focus = toStage(o.x + (back * SEG) / 2, o.y);

  const REV_CLICK = REV + 24;
  const fwd = spring({ frame: frame - CLICK - 1, fps, config: CARD });
  const bwd = reverse
    ? spring({ frame: frame - REV_CLICK - 1, fps, config: CARD })
    : 0;
  const knob = fwd - bwd;
  const k = startTheme === "dark" ? 1 - knob : knob;
  const hover =
    ramp(frame, CLICK - 6, 4, ENTER) * (1 - ramp(frame, CLICK + 2, 3)) +
    (reverse
      ? ramp(frame, REV_CLICK - 6, 4, ENTER) *
        (1 - ramp(frame, REV_CLICK + 2, 3))
      : 0);
  const pressAt = (at: number) =>
    spring({ frame: frame - (at - 2), fps, config: CHIP }) -
    spring({ frame: frame - (at + 2), fps, config: CHIP });
  const press = pressAt(CLICK) + (reverse ? pressAt(REV_CLICK) : 0);

  const winR = { x0: left, y0: top, x1: left + sw * s, y1: top + sh * s };
  const maxR =
    Math.max(
      ...[
        [winR.x0, winR.y0],
        [winR.x1, winR.y0],
        [winR.x0, winR.y1],
        [winR.x1, winR.y1],
      ].map(([x, y]) => Math.hypot(x - flipPt.x, y - flipPt.y)),
    ) * 1.02;
  const p1 = WIPE(clamp((frame - CLICK - 2) / FLOOD, 0, 1));
  const p2 = reverse ? WIPE(clamp((frame - REV_CLICK - 2) / FLOOD, 0, 1)) : 0;

  const z =
    ramp(frame, 2, 28, CAMERA) -
    ramp(frame, CLICK + 6, 32, CAMERA) +
    (reverse
      ? ramp(frame, REV, 22, CAMERA) - ramp(frame, REV_CLICK + 6, 32, CAMERA)
      : 0);
  const Z = 1 + (zoom - 1) * z;
  const aim = tall ? { x: W * 0.62, y: H * 0.5 } : { x: W * 0.6, y: H * 0.32 };
  const shot = {
    x: focus.x + (aim.x - focus.x) * z,
    y: focus.y + (aim.y - focus.y) * z,
  };
  const camera = `translate(${shot.x - focus.x * Z}px, ${shot.y - focus.y * Z}px) scale(${Z})`;

  const startPt = { x: W * 0.74, y: tall ? H * 0.82 : H * 0.92 };
  const park = { x: flipPt.x + 70 * u, y: flipPt.y + 90 * u };
  const m1 = ramp(frame, 6, CLICK - 10, ENTER);
  const arc = Math.sin(Math.PI * m1) * 46 * u;
  let cur = {
    x: startPt.x + (flipPt.x - startPt.x) * m1 + arc,
    y: startPt.y + (flipPt.y - startPt.y) * m1 + arc * 0.3,
  };
  const away = ramp(frame, CLICK + 8, 22);
  cur = {
    x: cur.x + (park.x - flipPt.x) * away,
    y: cur.y + (park.y - flipPt.y) * away,
  };
  if (reverse) {
    const m2 = ramp(frame, REV + 2, 18, ENTER);
    const arc2 = Math.sin(Math.PI * m2) * 20 * u;
    cur = {
      x: park.x + (backPt.x - park.x) * m2,
      y: park.y + (backPt.y - park.y) * m2 + arc2,
    };
    const away2 = ramp(frame, REV_CLICK + 8, 22);
    cur = { x: cur.x - away2 * 30 * u, y: cur.y + away2 * 70 * u };
  }

  const shown = clamp(p1 - p2, 0, 1);
  const word = (idx: 0 | 1) =>
    themes[idx] === "dark" ? "Dark mode" : "Light mode";

  const windowLayer = (theme: MockTheme, idx: 0 | 1) => {
    const src = idx === 0 ? fromSrc : toSrc;
    const node = idx === 0 ? from : to;
    const toggle = (
      <ThemeToggle theme={theme} k={k} hover={hover} press={press} />
    );
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: sw,
          height: sh,
        }}
      >
        {src ? (
          <Img
            src={src}
            style={{
              width: sw,
              height: sh,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : custom ? (
          node
        ) : (
          <IssuesMock
            theme={theme}
            accent={accent}
            width={sw}
            height={sh}
            headerExtra={toggle}
          />
        )}
        {custom && showToggle && (
          <div
            style={{
              position: "absolute",
              left: o.x - 2 - SEG * 1.5,
              top: o.y - 16,
            }}
          >
            {toggle}
          </div>
        )}
      </div>
    );
  };

  const local = (p: { x: number; y: number }) => ({
    x: (p.x - left) / s,
    y: (p.y - top) / s,
  });
  const fp = local(flipPt);
  const bp = local(backPt);
  const darkNow = themes[shown > 0.5 ? 1 : 0] === "dark";

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        background: "#050506",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${1.04 + 0.04 * z})` }}>
        <GshGround
          preset={ground ?? "charcoal-satin"}
          params={groundParams}
          timeOffset={6}
          timeScale={0.45}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(5,5,6,0.38)" }} />
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: camera }}>
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: sw,
            height: sh,
            transformOrigin: "0 0",
            transform: `scale(${s})`,
            borderRadius: 14,
            overflow: "hidden",
            opacity: interpolate(enter, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            }),
            boxShadow: darkNow
              ? "0 0 0 1px rgba(255,255,255,0.12), 0 40px 90px -20px rgba(0,0,0,0.85)"
              : "0 0 0 1px rgba(255,255,255,0.3), 0 40px 90px -20px rgba(0,0,0,0.7)",
          }}
        >
          {windowLayer(themes[0], 0)}
          {p1 > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `circle(${(p1 * maxR) / s}px at ${fp.x}px ${fp.y}px)`,
              }}
            >
              {windowLayer(themes[1], 1)}
            </div>
          )}
          {p2 > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `circle(${(p2 * maxR) / s}px at ${bp.x}px ${bp.y}px)`,
              }}
            >
              {windowLayer(themes[0], 0)}
            </div>
          )}
        </div>
        {showCursor && (
          <div
            style={{
              position: "absolute",
              left: cur.x - 2 * u,
              top: cur.y - 2 * u,
              opacity: interpolate(frame, [6, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Cursor size={17 * u} press={press} />
          </div>
        )}
      </AbsoluteFill>
      {tall ? (
        <div
          style={{
            position: "absolute",
            left: W * 0.08,
            top: H * 0.2,
            right: W * 0.08,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 0.022 * H,
              letterSpacing: "0.04em",
              color: "rgba(244,244,245,0.55)",
            }}
          >
            Appearance
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 0.02 * H,
              height: 0.08 * H,
              fontSize: 0.07 * H,
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#F4F4F5",
              whiteSpace: "nowrap",
            }}
          >
            {[0, 1].map((idx) => {
              const vis = idx === 0 ? 1 - shown : shown;
              return (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    opacity: vis,
                    transform: `translateY(${(1 - vis) * (idx === 1 ? 1 : -1) * (shown > 0.5 === (idx === 1) ? 1 : 0.6) * 0.03 * H}px)`,
                    filter: `blur(${(1 - vis) * 8}px)`,
                  }}
                >
                  {word(idx as 0 | 1)}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
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
        strokeWidth={1.5}
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
  "#B86A52",
  "#4F6FA8",
  "#7A63A8",
  "#3F8466",
  "#A8823C",
  "#A85878",
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
        background: name ? tint : undefined,
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
  accent = "#5E6AD2",
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
            <svg viewBox="0 0 124.06 134.26" height={11} aria-hidden>
              <path fill="#fff" d={REMOCN_R_PATH} />
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
              <span style={{ fontWeight: 400 }}>{g.name}</span>
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
