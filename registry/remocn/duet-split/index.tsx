"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const { fontFamily: sans } = loadSans("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

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

export interface DuetRow {
  before: string;
  after: string;
}

export interface DuetSplitProps {
  beforeLabel?: string;
  afterLabel?: string;
  rows?: DuetRow[];
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const LABEL_AT = 6;
const ROW_AT = 18;
const ROW_GAP = 16;
const TRICKLE = 3;
const GLYPH_LEN = 14;
const PUSH_DELAY = 24;
const PUSH_LEN = 16;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    ground: "film-blue" as GshPresetId,
    base: "#03070F",
    slab: "#161618",
    seam: "rgba(255,255,255,0.10)",
    ink: "#F4F5F8",
    muted: "rgba(244,245,248,0.62)",
    grey: "#6B6A70",
    greyLabel: "#7E7D83",
    scrim: "3,7,15",
    scrimA: 0.5,
    shadow: "0 1px 18px rgba(3,7,15,0.45)",
  },
  light: {
    ground: "paper-crease" as GshPresetId,
    base: "#EEECE8",
    slab: "#D9D6CF",
    seam: "rgba(0,0,0,0.10)",
    ink: "#121318",
    muted: "rgba(18,19,24,0.6)",
    grey: "#A29F97",
    greyLabel: "#8D8A82",
    scrim: "238,236,232",
    scrimA: 0.45,
    shadow: "none",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

function Wobbly({
  text,
  at,
  t,
  fontSize,
  color,
  seed,
}: {
  text: string;
  at: number;
  t: number;
  fontSize: number;
  color: string;
  seed: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: serif,
        fontWeight: 400,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color,
        whiteSpace: "pre",
      }}
    >
      {[...text].map((ch, k) => {
        const p = MOVE(ramp(t, at + k * TRICKLE, GLYPH_LEN));
        const ph = seed * 2.3 + k * 1.1;
        const wy = Math.sin(t * 0.13 + ph) * 0.035 * fontSize;
        const rot = Math.sin(t * 0.09 + ph * 0.7) * 3;
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 0.35 * fontSize + wy}px) rotate(${rot * (0.4 + 0.6 * p)}deg)`,
              filter:
                p < 0.98 ? `blur(${(1 - p) * 0.05 * fontSize}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

function Label({
  text,
  fs,
  color,
  dot,
}: {
  text: string;
  fs: number;
  color: string;
  dot: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: fs * 0.5,
        fontFamily: sans,
        fontWeight: 400,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: "-0.005em",
        color,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: fs * 0.36,
          height: fs * 0.36,
          borderRadius: fs,
          background: dot,
        }}
      />
      {text}
    </div>
  );
}

export function DuetSplit({
  beforeLabel = "Before",
  afterLabel = "With remocn",
  rows = [
    { before: "3 weeks", after: "1 day" },
    { before: "an agency", after: "you" },
    { before: "$12K", after: "$0" },
  ],
  accent = "#3B5BFD",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: DuetSplitProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const tall = H > W;

  const sp = (at: number, config: object, durationInFrames?: number) =>
    spring({
      frame: t - at,
      fps,
      config,
      ...(durationInFrames ? { durationInFrames } : {}),
    });

  const open = sp(-5, HEAVY);
  const lastRowAt = ROW_AT + (rows.length - 1) * ROW_GAP;
  const pushAt = lastRowAt + PUSH_DELAY;
  const push = sp(pushAt, MORPH, PUSH_LEN);
  const logoAt = pushAt + PUSH_LEN - 4;
  const pLogo = sp(logoAt, CARD);

  const fs = tall ? 0.135 * W : 0.15 * H;
  const gap = fs * 1.18;
  const labelFs = tall ? 0.024 * H : 0.034 * H;
  const margin = tall ? 0.07 * W : 0.05 * W;

  const half = tall ? H / 2 : W / 2;
  const slabStyle = tall
    ? {
        left: 0,
        top: 0,
        width: W,
        height: H / 2,
        transform: `translateY(${-(1 - open) * half - push * half}px)`,
      }
    : {
        left: 0,
        top: 0,
        width: W / 2,
        height: H,
        transform: `translate(${-push * half}px, ${-(1 - open) * H}px)`,
      };

  const beforeC = tall
    ? { x: W / 2, y: H * 0.27 }
    : { x: W * 0.25, y: H * 0.54 };
  const afterStart = tall
    ? { x: W / 2, y: H * 0.77 }
    : { x: W * 0.75, y: H * 0.54 };
  const afterEnd = tall ? { x: W / 2, y: H * 0.46 } : { x: W / 2, y: H * 0.45 };
  const ac = {
    x: afterStart.x + (afterEnd.x - afterStart.x) * push,
    y: afterStart.y + (afterEnd.y - afterStart.y) * push,
  };
  const grow = 1 + (tall ? 0.16 : 0.2) * push;
  const rowY = (i: number) => (i - (rows.length - 1) / 2) * gap;

  const bump = Math.max(
    ...rows.map((_, i) => 0.6 * kick(t - ROW_AT - i * ROW_GAP - 3)),
    kick(t - pushAt - PUSH_LEN + 4),
  );
  const camScale =
    1 + 0.016 * bump + interpolate(t, [0, 160], [0, 0.02], CLAMP);

  const afterOpen = sp(2, HEAVY);
  const labelIn = ENTER(ramp(t, LABEL_AT, 12));
  const labelOut = EXIT(ramp(t, pushAt, 8));

  const crisp = (text: string, at: number) => {
    const p = sp(at, CHIP);
    return (
      <div
        style={{
          fontFamily: sans,
          fontWeight: 300,
          fontSize: fs,
          lineHeight: 1,
          letterSpacing: "-0.045em",
          whiteSpace: "nowrap",
          color: c.ink,
          textShadow: c.shadow,
          opacity: ENTER(ramp(t, at, 3)),
          transform: `translateY(${(1 - p) * 0.22 * fs}px) scale(${1.1 - 0.1 * p})`,
        }}
      >
        {text}
      </div>
    );
  };

  const place = (x: number, y: number, child: React.ReactNode, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {child}
    </div>
  );

  const afterLabelPos = tall
    ? { left: margin, top: H / 2 + margin }
    : { left: W / 2 + margin, top: margin * 1.2 };
  const scrimAt = tall
    ? `50% ${(ac.y / H) * 100}%`
    : `${(ac.x / W) * 100}% 54%`;

  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <GshGround
        preset={groundParams ? undefined : (ground ?? c.ground)}
        params={groundParams}
        timeOffset={theme === "dark" ? 4 : 6}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${tall ? "80% 34%" : "40% 60%"} at ${scrimAt}, rgba(${c.scrim},${c.scrimA}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${camScale})`, transformOrigin: "50% 50%" }}
      >
        <div
          style={{
            position: "absolute",
            ...afterLabelPos,
            opacity: labelIn * (1 - labelOut),
            transform: `translateY(${(1 - labelIn) * labelFs * 0.6}px)`,
          }}
        >
          <Label text={afterLabel} fs={labelFs} color={c.ink} dot={accent} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${ac.x}px ${ac.y}px`,
            transform: `translateY(${(1 - afterOpen) * 0.08 * H}px) scale(${grow})`,
          }}
        >
          {rows.map((r, i) => {
            const at = ROW_AT + i * ROW_GAP;
            return t >= at
              ? place(ac.x, ac.y + rowY(i), crisp(r.after, at), `a-${i}`)
              : null;
          })}
        </div>

        <div
          style={{
            position: "absolute",
            ...slabStyle,
            background: c.slab,
            boxShadow: tall
              ? `inset 0 -1px 0 ${c.seam}`
              : `inset -1px 0 0 ${c.seam}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: margin,
              top: tall ? margin : margin * 1.2,
              opacity: labelIn,
              transform: `translateY(${(1 - labelIn) * labelFs * 0.6}px)`,
            }}
          >
            <Label
              text={beforeLabel}
              fs={labelFs}
              color={c.greyLabel}
              dot={c.grey}
            />
          </div>
          {rows.map((r, i) =>
            place(
              tall ? W / 2 : W * 0.25,
              beforeC.y + rowY(i),
              <Wobbly
                text={r.before}
                at={ROW_AT + i * ROW_GAP}
                t={t}
                fontSize={fs * 1.04}
                color={c.grey}
                seed={i + 1}
              />,
              `b-${i}`,
            ),
          )}
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: tall ? 0.08 * H : 0.085 * H,
          display: "flex",
          justifyContent: "center",
          opacity: ENTER(ramp(t, logoAt, 6)),
          transform: `translateY(${(1 - pLogo) * 0.05 * H}px)`,
        }}
      >
        <RemocnLogo fontSize={tall ? 0.04 * H : 0.055 * H} color={c.ink} />
      </div>
    </AbsoluteFill>
  );
}
