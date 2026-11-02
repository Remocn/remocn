"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const B = {
  pan: 0,
  cursor: 6,
  hover: 30,
  press: 36,
  busy: 40,
  live: 60,
  url: 64,
  pull: 72,
  title: 84,
  toast: 102,
  end: 150,
};

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

type IconName =
  | "plus"
  | "frame"
  | "text"
  | "pen"
  | "play"
  | "chevron"
  | "page"
  | "check"
  | "arrowUpRight"
  | "layers"
  | "dots";

function Icon({
  name,
  size,
  color,
  stroke = 1.5,
}: {
  name: IconName;
  size: number;
  color: string;
  stroke?: number;
}) {
  const p = {
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const d: Record<IconName, React.ReactNode> = {
    plus: <path {...p} d="M12 5v14M5 12h14" />,
    frame: <path {...p} d="M8 3v18M16 3v18M3 8h18M3 16h18" />,
    text: <path {...p} d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" />,
    pen: <path {...p} d="m4 20 4-1 11-11-3-3L5 16l-1 4ZM14 7l3 3" />,
    play: <path {...p} d="M8 5.5v13l10-6.5-10-6.5Z" />,
    chevron: <path {...p} d="m7 10 5 5 5-5" />,
    page: <path {...p} d="M7 3h7l4 4v14H7V3ZM14 3v4h4" />,
    check: <path {...p} d="m5.5 12.5 4 4 9-9" />,
    arrowUpRight: <path {...p} d="M7 17 17 7M9 7h8v8" />,
    layers: (
      <path {...p} d="m12 4 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4" />
    ),
    dots: (
      <>
        <circle cx="6" cy="12" r="1.3" fill={color} />
        <circle cx="12" cy="12" r="1.3" fill={color} />
        <circle cx="18" cy="12" r="1.3" fill={color} />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      {d[name]}
    </svg>
  );
}

function Pointer({ size, dark }: { size: number; dark: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: "block",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
      }}
      aria-hidden
    >
      <path
        d="M5 3.2v16.2l4.3-4.1 2.8 6.3 2.6-1.1-2.8-6.2h6z"
        fill={dark ? "#ffffff" : "#0d0f16"}
        stroke={dark ? "#0d0f16" : "#ffffff"}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

type WindowState = {
  hover: number;
  pressScale: number;
  busy: number;
  live: number;
  url: number;
  spin: number;
};

export interface MacroClickProps {
  theme?: "dark" | "light";
  accent?: string;
  title?: string;
  docTitle?: string;
  publishLabel?: string;
  busyLabel?: string;
  liveLabel?: string;
  url?: string;
  toast?: string;
  pages?: string[];
  heroLine?: string;
  src?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function MacroClick({
  theme = "dark",
  accent = "#3B5BFD",
  title = "One click. It's live.",
  docTitle = "Launch site",
  publishLabel = "Publish",
  busyLabel = "Publishing",
  liveLabel = "Live",
  url = "remocn.dev/launch",
  toast = "Your site is live",
  pages = ["Home", "Pricing", "Changelog", "Docs"],
  heroLine = "Ship the launch today.",
  src = staticFile("templates/launch-anything/horizon.jpg"),
  ground,
  groundParams,
}: MacroClickProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const s = width / stageW;

  const ink = dark ? "#eef0f6" : "#101219";
  const soft = dark ? "rgba(230,233,244,0.68)" : "rgba(16,18,25,0.64)";
  const muted = dark ? "rgba(230,233,244,0.42)" : "rgba(16,18,25,0.42)";
  const hair = dark ? "rgba(255,255,255,0.08)" : "rgba(16,18,25,0.09)";
  const chrome = dark ? "#15161c" : "#ffffff";
  const panel = dark ? "#121318" : "#fbfbfc";
  const canvas = dark ? "#0b0c10" : "#eeeef1";
  const green = "#2fcf86";

  const W = 1120;
  const H = 640;
  const barH = 52;
  const sideW = 220;
  const rightW = 236;
  const btnW = 96;
  const btnH = 32;
  const btnX = W - 12 - btnW;
  const btnY = (barH - btnH) / 2;
  const target = { x: btnX + btnW / 2, y: btnY + btnH / 2 };

  const pressDip = spring({ frame: frame - B.press, fps, config: CHIP });
  const pressUp = spring({ frame: frame - B.press - 4, fps, config: CHIP });
  const st: WindowState = {
    hover: ramp(frame, B.hover - 3, 6),
    pressScale: 1 - 0.07 * pressDip + 0.07 * pressUp,
    busy: ramp(frame, B.busy, 6) * (1 - ramp(frame, B.live, 6)),
    live: spring({ frame: frame - B.live, fps, config: CHIP }),
    url: spring({ frame: frame - B.url, fps, config: CARD }),
    spin: frame * 22,
  };

  const pull = ramp(frame, B.pull, 36, CAM);
  const pullPrev = ramp(frame - 1, B.pull, 36, CAM);
  const settle = spring({ frame: frame - B.pull - 10, fps, config: HEAVY });
  const zEnd = portrait ? 0.88 : 1;
  const zStart = portrait ? 3.6 : 3.3;
  const breath =
    0.02 * ramp(frame, B.pull + 36, B.end - B.pull - 36, Easing.linear);
  const Z =
    mix(zStart, zEnd, pull) *
    (1 + breath) *
    (1 + 0.03 * ramp(frame, 0, B.pull, Easing.linear) * (1 - pull));

  const panFocus = {
    x: mix(target.x - 210, target.x - 20, ramp(frame, B.pan, 34, MOVE)),
    y: target.y + 6,
  };
  const screenFocus = { x: stageW / 2, y: portrait ? 900 : 380 };
  const centerScreen = { x: stageW / 2, y: portrait ? 1130 : 372 };
  const finalFocus = {
    x: centerScreen.x + (target.x - W / 2) * zEnd,
    y: centerScreen.y + (target.y - H / 2) * zEnd,
  };
  const fx = mix(panFocus.x, target.x, pull);
  const fy = mix(panFocus.y, target.y, pull);
  const px = mix(screenFocus.x, finalFocus.x, pull);
  const py = mix(screenFocus.y, finalFocus.y, pull);
  const winLeft = px - fx * Z;
  const winTop = py - fy * Z;
  const pullBlur = Math.min(4, Math.abs(pull - pullPrev) * 30);

  const rotX = mix(10, 0, pull) + mix(0, 3, settle) * pull;
  const rotY = mix(-14, 0, pull) + mix(0, -4, settle) * pull;

  const dof = 1 - pull;
  const focusR = mix(70, 900, pull);

  const cursorStart = { x: target.x + 160, y: target.y + 150 };
  const cursorEnd = { x: target.x + 8, y: target.y + 6 };
  const cP = ramp(frame, B.cursor, 24, MOVE);
  const cPrev = ramp(frame - 1, B.cursor, 24, MOVE);
  const cX =
    mix(cursorStart.x, cursorEnd.x, cP) +
    30 * ramp(frame, B.live + 6, 18, MOVE);
  const cY =
    mix(cursorStart.y, cursorEnd.y, cP) -
    Math.sin(Math.PI * cP) * 30 +
    24 * ramp(frame, B.live + 6, 18, MOVE);
  const cBlur = Math.min(3, Math.abs(cP - cPrev) * 220 * 0.04);
  const cScale = 1 - 0.14 * pressDip + 0.14 * pressUp;

  const toastIn = spring({ frame: frame - B.toast, fps, config: CHIP });
  const titleIn = ramp(frame, B.title, 15);

  const renderWindow = (sharp: boolean) => {
    const pubBg = dark ? "#f4f5f8" : "#0f1015";
    const pubInk = dark ? "#0f1015" : "#ffffff";
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          overflow: "hidden",
          background: canvas,
          boxShadow: sharp
            ? dark
              ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3), 0 30px 60px rgba(0,0,0,0.45), 0 80px 140px rgba(0,0,0,0.5)"
              : "0 1px 2px rgba(20,24,40,0.06), 0 24px 50px rgba(20,24,40,0.1), 0 70px 130px rgba(20,24,40,0.14)"
            : undefined,
          border: `1px solid ${hair}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: barH,
            background: chrome,
            borderBottom: `1px solid ${hair}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 6,
          }}
        >
          <div
            style={{
              height: 32,
              padding: "0 8px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: dark
                ? "rgba(255,255,255,0.05)"
                : "rgba(16,18,25,0.04)",
            }}
          >
            <svg viewBox="0 0 124.06 134.26" height={15} width={14} aria-hidden>
              <path fill={ink} d={REMOCN_R_PATH} />
            </svg>
            <Icon name="chevron" size={14} color={muted} />
          </div>
          <div
            style={{ width: 1, height: 20, background: hair, margin: "0 6px" }}
          />
          {(["plus", "frame", "text", "pen"] as IconName[]).map((n) => (
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
              <Icon name={n} size={18} color={soft} />
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: barH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 15,
              color: ink,
              pointerEvents: "none",
            }}
          >
            {docTitle}
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 12,
                color: muted,
                padding: "2px 7px",
                borderRadius: 6,
                border: `1px solid ${hair}`,
              }}
            >
              main
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              height: 30,
              padding: "0 10px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontFamily: mono.fontFamily,
              fontSize: 13,
              color: soft,
              marginRight: 10,
              opacity: st.url,
              transform: `translateX(${mix(18, 0, st.url)}px)`,
              border: `1px solid ${hair}`,
            }}
          >
            {url}
            <Icon name="arrowUpRight" size={13} color={muted} />
          </div>
          <div style={{ display: "flex", marginRight: 6 }}>
            {[
              { t: "AK", c: "#e0703b" },
              { t: "JM", c: "#5a7bff" },
            ].map((a, i) => (
              <div
                key={a.t}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: a.c,
                  color: "#fff",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: i ? -7 : 0,
                  boxShadow: `0 0 0 2px ${chrome}`,
                }}
              >
                {a.t}
              </div>
            ))}
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="play" size={16} color={soft} />
          </div>
          <div
            style={{
              height: btnH,
              padding: "0 12px",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              fontSize: 14,
              color: ink,
              background: dark
                ? "rgba(255,255,255,0.06)"
                : "rgba(16,18,25,0.05)",
              marginRight: 6 + btnW,
            }}
          >
            Invite
          </div>
          <div
            style={{
              position: "absolute",
              left: btnX,
              top: btnY,
              width: btnW,
              height: btnH,
              borderRadius: 9,
              transform: `scale(${st.pressScale})`,
              background: pubBg,
              boxShadow: dark
                ? `inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 ${3 * st.hover}px rgba(255,255,255,0.12)`
                : `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 ${3 * st.hover}px rgba(16,18,25,0.1)`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `color-mix(in oklab, ${green} ${dark ? 22 : 16}%, ${chrome})`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${green} 45%, transparent)`,
                borderRadius: 9,
                opacity: Math.min(1, st.live),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: pubInk,
                opacity: 1 - Math.max(st.busy, Math.min(1, st.live)),
              }}
            >
              {publishLabel}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 13,
                color: pubInk,
                opacity: st.busy,
              }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                aria-hidden
                style={{ transform: `rotate(${st.spin}deg)` }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke={pubInk}
                  strokeOpacity={0.25}
                  strokeWidth={2.5}
                />
                <path
                  d="M12 3a9 9 0 0 1 9 9"
                  fill="none"
                  stroke={pubInk}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </svg>
              {busyLabel}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                fontSize: 14,
                color: ink,
                opacity: Math.min(1, st.live),
                transform: `translateY(${mix(8, 0, Math.min(1, st.live))}px)`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: green,
                  boxShadow: `0 0 0 3px color-mix(in oklab, ${green} 30%, transparent)`,
                  transform: `scale(${st.live})`,
                }}
              />
              {liveLabel}
              <Icon name="check" size={14} color={green} stroke={2} />
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: barH,
            bottom: 0,
            width: sideW,
            background: panel,
            borderRight: `1px solid ${hair}`,
            padding: "14px 10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: "0 8px 12px",
              fontSize: 14,
            }}
          >
            <span style={{ color: ink }}>Pages</span>
            <span style={{ color: muted }}>Layers</span>
            <span style={{ color: muted }}>Assets</span>
          </div>
          {pages.map((pg, i) => (
            <div
              key={pg}
              style={{
                height: 34,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 10px",
                fontSize: 14,
                color: i === 0 ? ink : soft,
                background:
                  i === 0
                    ? dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(16,18,25,0.05)"
                    : "transparent",
              }}
            >
              <Icon name="page" size={16} color={i === 0 ? soft : muted} />
              {i === 0 ? pg : `/${pg.toLowerCase()}`}
            </div>
          ))}
          <div style={{ height: 1, background: hair, margin: "12px 6px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 10px",
              fontSize: 14,
              color: muted,
              height: 30,
            }}
          >
            <Icon name="layers" size={16} color={muted} />
            Components
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            top: barH,
            bottom: 0,
            width: rightW,
            background: panel,
            borderLeft: `1px solid ${hair}`,
            padding: 16,
            boxSizing: "border-box",
            fontSize: 13,
            color: muted,
          }}
        >
          <div
            style={{ display: "flex", gap: 14, fontSize: 14, marginBottom: 16 }}
          >
            <span style={{ color: ink }}>Design</span>
            <span>Prototype</span>
          </div>
          {[
            ["Position", "Relative"],
            ["Width", "1200 Fill"],
            ["Height", "Fit content"],
            ["Gap", "24"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", height: 34 }}
            >
              <span style={{ width: 74 }}>{k}</span>
              <span
                style={{
                  flex: 1,
                  height: 26,
                  borderRadius: 6,
                  background: dark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(16,18,25,0.04)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px",
                  color: soft,
                  fontFamily: mono.fontFamily,
                  fontSize: 12,
                }}
              >
                {v}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: hair, margin: "12px 0" }} />
          <div style={{ marginBottom: 10 }}>Fill</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[accent, dark ? "#f4f5f8" : "#101219", "#e0703b", green].map(
              (c) => (
                <span
                  key={c}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: c,
                    boxShadow: `inset 0 0 0 1px ${hair}`,
                  }}
                />
              ),
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: sideW + 48,
            right: rightW + 48,
            top: barH + 44,
            bottom: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -24,
              fontSize: 12,
              color: muted,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span>Desktop</span>
            <span style={{ fontFamily: mono.fontFamily }}>1200</span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: green,
                opacity: Math.min(1, st.live),
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: green,
                }}
              />
              {liveLabel}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "8px 8px 0 0",
              background: dark ? "#16171d" : "#ffffff",
              boxShadow: `0 0 0 1px ${hair}, 0 10px 30px rgba(0,0,0,${dark ? 0.35 : 0.06})`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 22px",
                gap: 18,
                fontSize: 12,
                color: soft,
              }}
            >
              <svg
                viewBox="0 0 124.06 134.26"
                height={14}
                width={13}
                aria-hidden
              >
                <path fill={ink} d={REMOCN_R_PATH} />
              </svg>
              <div style={{ flex: 1 }} />
              <span>Product</span>
              <span>Pricing</span>
              <span>Docs</span>
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  background: ink,
                  color: dark ? "#111" : "#fff",
                }}
              >
                Start free
              </span>
            </div>
            <div
              style={{
                padding: "26px 22px 0",
                fontSize: 38,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                fontWeight: 300,
                color: ink,
                maxWidth: 300,
              }}
            >
              {heroLine}
            </div>
            <div
              style={{
                padding: "12px 22px",
                fontSize: 12,
                color: muted,
                maxWidth: 260,
                lineHeight: 1.45,
              }}
            >
              Write the brief, pick the beats and render the film before lunch.
            </div>
            <div
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                bottom: 0,
                height: 170,
                borderRadius: "10px 10px 0 0",
                overflow: "hidden",
              }}
            >
              <Img
                src={src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "velvet-hour" : "paper-crease");
  const resolvedParams =
    groundParams ??
    (dark
      ? undefined
      : {
          kind: "mist",
          colors: ["#c9cfe6", "#e7e3f3", "#f4f1ec", "#8a90b8"],
          background: "#f1f0ed",
        });

  const sharpMask =
    dof > 0.01
      ? `radial-gradient(circle at ${fx}px ${fy}px, #000 ${focusR}px, transparent ${focusR * 2.4}px)`
      : undefined;

  return (
    <AbsoluteFill style={{ fontFamily: geist.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={6}
        timeScale={0.6}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
          perspective: 2400,
        }}
      >
        {portrait ? (
          <div
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: 560,
              overflow: "hidden",
              paddingBottom: 12,
              opacity: pull > 0.3 ? 1 : 0,
            }}
          >
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.02,
                letterSpacing: "-0.045em",
                fontWeight: 300,
                color: ink,
                transform: `translateY(${mix(110, 0, titleIn)}%)`,
              }}
            >
              {title}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: winLeft,
            top: winTop,
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform: `scale(${Z})`,
            filter: pullBlur > 0.3 ? `blur(${pullBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transformOrigin: `${fx}px ${fy}px`,
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            {dof > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: `blur(${2.4 * dof}px)`,
                }}
              >
                {renderWindow(false)}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: sharpMask,
                maskImage: sharpMask,
              }}
            >
              {renderWindow(true)}
            </div>
            <div
              style={{
                position: "absolute",
                left: cX,
                top: cY,
                opacity:
                  ramp(frame, B.cursor, 4) * (1 - ramp(frame, B.pull + 18, 9)),
                transform: `scale(${cScale})`,
                transformOrigin: "20% 15%",
                filter: cBlur > 0.3 ? `blur(${cBlur}px)` : undefined,
              }}
            >
              <Pointer size={24} dark={dark} />
            </div>
            <div
              style={{
                position: "absolute",
                left: W / 2,
                bottom: 26,
                transform: `translateX(-50%) translateY(${mix(30, 0, toastIn)}px) scale(${mix(0.86, 1, toastIn)})`,
                opacity: Math.min(1, toastIn * 1.4),
                display: frame >= B.toast ? "flex" : "none",
                alignItems: "center",
                gap: 12,
                height: 46,
                padding: "0 8px 0 16px",
                borderRadius: 14,
                background: dark ? "rgba(28,30,38,0.96)" : "#ffffff",
                boxShadow: dark
                  ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 6px rgba(0,0,0,0.3), 0 18px 40px rgba(0,0,0,0.45)"
                  : "0 1px 2px rgba(20,24,40,0.08), 0 14px 36px rgba(20,24,40,0.16)",
                border: `1px solid ${hair}`,
                fontSize: 16,
                color: ink,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" size={14} color="#fff" stroke={2.2} />
              </span>
              {toast}
              <span
                style={{
                  height: 30,
                  padding: "0 10px",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: mono.fontFamily,
                  fontSize: 13,
                  color: dark ? "#fff" : accent,
                  background: dark
                    ? `color-mix(in oklab, ${accent} 70%, transparent)`
                    : `color-mix(in oklab, ${accent} 10%, white)`,
                }}
              >
                {url}
                <Icon
                  name="arrowUpRight"
                  size={13}
                  color={dark ? "#fff" : accent}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default MacroClick;
