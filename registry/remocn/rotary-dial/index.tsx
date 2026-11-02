"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface RotaryDialProps {
  from?: number;
  to?: number;
  unit?: string;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const BEATS = {
  label: 6,
  value: 12,
  grab: 18,
  turn: 24,
  land: 72,
} as const;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const THEMES = {
  dark: {
    fg: "#F3F2EF",
    muted: "rgba(243,242,239,0.56)",
    lit: "#9DC2FF",
    tick: "rgba(255,255,255,0.2)",
    scrim: "4,6,12",
    scrimFrom: 0.86,
    scrimTo: 0.4,
    collar: "#0E0F13",
    collarLip: "rgba(255,255,255,0.09)",
    knurl: ["#17181C", "#34353B"],
    metal: { mid: "#3E3F45", lo: "#27282C", hi: "#7C7D85", hi2: "#5A5B62" },
    chamfer: ["rgba(255,255,255,0.4)", "rgba(0,0,0,0.6)"],
    shadow: "0,0,0",
    shadowA: 0.8,
  },
  light: {
    fg: "#141413",
    muted: "rgba(20,20,19,0.52)",
    lit: "",
    tick: "rgba(30,26,20,0.2)",
    scrim: "244,243,239",
    scrimFrom: 0.88,
    scrimTo: 0.36,
    collar: "#DEDBD3",
    collarLip: "rgba(255,255,255,0.95)",
    knurl: ["#8F8E92", "#C9C8CC"],
    metal: { mid: "#C4C4C8", lo: "#A5A5AA", hi: "#F4F4F6", hi2: "#DCDCE0" },
    chamfer: ["rgba(255,255,255,0.95)", "rgba(40,36,30,0.35)"],
    shadow: "48,40,28",
    shadowA: 0.36,
  },
} as const;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function niceStep(range: number) {
  const raw = range / 9;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const k = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return k * pow;
}

function formatLabel(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function Odometer({
  value,
  decimals,
  size,
}: {
  value: number;
  decimals: number;
  size: number;
}) {
  const m = 10 ** decimals;
  const scaled = value * m;
  const k = Math.floor(scaled + 1e-6);
  const frac = Math.max(0, scaled - k);
  const r = interpolate(frac, [0.45, 1], [0, 1], { ...CLAMP, easing: MOVE });
  const fmt = (n: number) => {
    const s = String(Math.abs(n)).padStart(decimals + 1, "0");
    return decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
  };
  const a = fmt(k);
  const b = fmt(k + 1);
  const len = Math.max(a.length, b.length);
  const pa = a.padStart(len, " ");
  const pb = b.padStart(len, " ");
  const colW = 0.62 * size;
  const cols: React.ReactNode[] = [];
  for (let i = 0; i < len; i++) {
    const ca = pa[i];
    const cb = pb[i];
    const isDot = ca === "." || cb === ".";
    const w = isDot
      ? 0.28 * size
      : ca === " "
        ? colW * r
        : cb === " "
          ? colW * (1 - r)
          : colW;
    const rolling = ca !== cb;
    const blur = Math.sin(r * Math.PI) * size * 0.03;
    cols.push(
      <span
        key={i}
        style={{
          position: "relative",
          display: "inline-block",
          width: w,
          height: size,
          textAlign: "center",
        }}
      >
        {rolling ? (
          <>
            <span
              style={{
                position: "absolute",
                left: -0.2 * size,
                right: -0.2 * size,
                top: 0,
                transform: `translateY(${-r * size * 0.42}px)`,
                opacity: (1 - r) ** 2,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {ca}
            </span>
            <span
              style={{
                position: "absolute",
                left: -0.2 * size,
                right: -0.2 * size,
                top: 0,
                transform: `translateY(${(1 - r) * size * 0.42}px)`,
                opacity: r ** 1.5,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {cb}
            </span>
          </>
        ) : (
          <span
            style={{
              position: "absolute",
              left: -0.2 * size,
              right: -0.2 * size,
              top: 0,
            }}
          >
            {ca}
          </span>
        )}
      </span>,
    );
  }
  return <>{cols}</>;
}

export function RotaryDial({
  from = 1,
  to = 10,
  unit = "×",
  label = "Render speed",
  accent = "#3B5BFD",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: RotaryDialProps) {
  const t = useCurrentFrame() * speed;
  const { width: VW, height: VH, fps } = useVideoConfig();
  const tall = VH > VW;
  const u = tall ? VW / 760 : Math.min(VW / 1280, VH / 720);
  const p = THEMES[theme];
  const dark = theme === "dark";
  const acc = hexToRgb(accent);
  const lit = p.lit || accent;
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "earthshine" : "paper-crease");

  const range = to - from;
  const span = Math.abs(range) || 1;
  const step = niceStep(span);
  const decimals = span < 5 ? 1 : 0;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);

  const A0 = -135;
  const A1 = 135;
  const prog = (f: number) => {
    const move = interpolate(f, [BEATS.turn, BEATS.land], [0, 1.025], {
      ...CLAMP,
      easing: MOVE,
    });
    const detent = spring({ frame: f - BEATS.land, fps, config: CHIP });
    return move - 0.025 * Math.min(1, detent);
  };
  const k = prog(t);
  const kc = Math.min(1, k);
  const angle = A0 + (A1 - A0) * k;
  const angVel = Math.abs(prog(t + 0.5) - prog(t - 0.5)) * (A1 - A0);
  const value = Math.min(hi, Math.max(lo, from + range * kc));
  const rest = Math.min(1, angVel / 8);

  const grab = interpolate(
    t,
    [BEATS.grab, BEATS.turn, BEATS.land - 6, BEATS.land],
    [0, 1, 1, 0],
    { ...CLAMP, easing: MOVE },
  );
  const click = spring({ frame: t - BEATS.land, fps, config: CHIP });
  const clickPunch = Math.sin(Math.min(1, click) * Math.PI) * 0.025;
  const knobScale = 1 - grab * 0.03 + clickPunch;

  const R = (tall ? 190 : 140) * u;
  const rCollar = R + 12 * u;
  const rFace = R - 17 * u;
  const rTick = R + 32 * u;
  const rLabel = R + 66 * u;
  const box = (rLabel + 30 * u) * 2;

  const ticks: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  const minorPer = 5;
  const count = Math.round(span / step) * minorPer;
  for (let i = 0; i <= count; i++) {
    const frac = i / count;
    const a = A0 + (A1 - A0) * frac;
    const major = i % minorPer === 0;
    const behind = Math.min(angle, A1) - a;
    const on = interpolate(behind, [-1.2, 0.6], [0, 1], CLAMP);
    const flash = on * rest * Math.exp(-Math.max(0, behind) / 22);
    const len = (major ? 20 : 11) * u * (1 + flash * 0.3);
    const wid = (major ? 3 : 2) * u;
    ticks.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: box / 2 - wid / 2,
          top: box / 2 - rTick - len,
          width: wid,
          height: len,
          borderRadius: wid,
          transformOrigin: `50% ${rTick + len}px`,
          transform: `rotate(${a}deg)`,
          background: on > 0.01 ? lit : p.tick,
          opacity: on > 0.01 ? 0.5 + 0.5 * on : 1,
        }}
      />,
    );
    if (i === 0 || i === count) {
      const v = from + (range * i) / count;
      const rad = (a * Math.PI) / 180;
      const x = box / 2 + Math.sin(rad) * rLabel;
      const y = box / 2 - Math.cos(rad) * rLabel;
      labels.push(
        <div
          key={`l${i}`}
          style={{
            position: "absolute",
            left: x - 40 * u,
            top: y - 12 * u + 14 * u,
            width: 80 * u,
            height: 24 * u,
            lineHeight: `${24 * u}px`,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 18 * u,
            fontVariantNumeric: "tabular-nums",
            color: on > 0.5 ? p.fg : p.muted,
          }}
        >
          {formatLabel(v)}
          {unit}
        </div>,
      );
    }
  }

  const m = p.metal;
  const circle = (r: number): React.CSSProperties => ({
    position: "absolute",
    left: box / 2 - r,
    top: box / 2 - r,
    width: r * 2,
    height: r * 2,
    borderRadius: "50%",
  });
  const ridge = 3;

  const cam = spring({
    frame: t,
    fps,
    config: HEAVY,
    durationInFrames: 54,
  });
  const push = interpolate(t, [BEATS.land, BEATS.land + 60], [0, 1], {
    ...CLAMP,
    easing: MOVE,
  });
  const camK = interpolate(cam, [0, 1], [1.08, 1]) + push * 0.02;
  const light = interpolate(t, [BEATS.turn, BEATS.land + 6], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const scrim = interpolate(light, [0, 1], [p.scrimFrom, p.scrimTo]);
  const bloom = interpolate(
    t,
    [BEATS.land, BEATS.land + 4, BEATS.land + 40],
    [0, 1, 0.55],
    {
      ...CLAMP,
      easing: ENTER,
    },
  );

  const word = (start: number) =>
    interpolate(t, [start, start + 14], [0, 1], { ...CLAMP, easing: ENTER });
  const ink = (v: number): React.CSSProperties => ({
    opacity: v,
    transform: `translateY(${(1 - v) * 0.22}em)`,
    filter: v < 1 ? `blur(${(1 - v) * 6 * u}px)` : undefined,
  });
  const wLabel = word(BEATS.label);
  const wValue = word(BEATS.value);
  const numSize = (tall ? 168 : 150) * u;

  const dial = (
    <div
      style={{
        position: "relative",
        width: box,
        height: box,
        flexShrink: 0,
      }}
    >
      {ticks}
      {labels}
      <div
        style={{
          ...circle(rCollar),
          background: p.collar,
          boxShadow: [
            `inset 0 ${3 * u}px ${6 * u}px rgba(${p.shadow},${p.shadowA})`,
            `inset 0 ${-1.2 * u}px 0 ${p.collarLip}`,
            `0 0 ${70 * u}px ${-6 * u}px rgba(${acc},${0.5 * bloom})`,
          ].join(", "),
        }}
      />
      <div
        style={{
          ...circle(rCollar),
          transform: `scale(${knobScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: rCollar - R,
            top: rCollar - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            boxShadow: [
              `0 ${(16 - grab * 6) * u}px ${(30 - grab * 8) * u}px rgba(${p.shadow},${p.shadowA * 0.7})`,
              `0 ${3 * u}px ${6 * u}px rgba(${p.shadow},${p.shadowA * 0.6})`,
            ].join(", "),
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-conic-gradient(from ${angle}deg, ${p.knurl[0]} 0deg ${ridge / 2}deg, ${p.knurl[1]} ${ridge / 2}deg ${ridge}deg)`,
              filter: rest > 0.05 ? `blur(${rest * 1.6 * u}px)` : undefined,
              opacity: 1 - rest * 0.35,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.35) 78%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: rCollar - rFace - 3 * u,
            top: rCollar - rFace - 3 * u,
            width: (rFace + 3 * u) * 2,
            height: (rFace + 3 * u) * 2,
            borderRadius: "50%",
            background: `linear-gradient(180deg, ${p.chamfer[0]}, ${p.chamfer[1]})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: rCollar - rFace,
            top: rCollar - rFace,
            width: rFace * 2,
            height: rFace * 2,
            borderRadius: "50%",
            background: [
              `repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0 ${0.8 * u}px, rgba(0,0,0,0.04) ${0.8 * u}px ${1.7 * u}px)`,
              "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.06), transparent 60%)",
              `conic-gradient(from 0deg, ${m.mid} 0deg, ${m.lo} 62deg, ${m.mid} 108deg, ${m.hi2} 150deg, ${m.mid} 192deg, ${m.lo} 244deg, ${m.mid} 290deg, ${m.hi} 328deg, ${m.mid} 360deg)`,
            ].join(", "),
            boxShadow: `inset 0 ${1.5 * u}px ${2 * u}px rgba(0,0,0,0.35)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: rCollar - rFace,
            top: rCollar - rFace,
            width: rFace * 2,
            height: rFace * 2,
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: rFace - 3.5 * u,
              top: 12 * u,
              width: 7 * u,
              height: 40 * u,
              borderRadius: 4 * u,
              background: lit,
              boxShadow: `inset 0 ${1.5 * u}px ${2 * u}px rgba(0,0,0,0.35), 0 0 ${10 * u * bloom}px rgba(${acc},${0.6 * bloom})`,
            }}
          />
        </div>
      </div>
    </div>
  );

  const readout = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: tall ? "center" : "flex-start",
        gap: 4 * u,
        minWidth: tall ? undefined : 300 * u,
      }}
    >
      <div
        style={{
          ...ink(wLabel),
          fontFamily: sans,
          fontWeight: 400,
          fontSize: (tall ? 34 : 28) * u,
          letterSpacing: "-0.01em",
          color: p.muted,
          paddingLeft: tall ? 0 : 6 * u,
        }}
      >
        {label}
      </div>
      <div
        style={{
          ...ink(wValue),
          display: "flex",
          alignItems: "baseline",
          fontFamily: sans,
          fontWeight: 300,
          fontSize: numSize,
          lineHeight: `${numSize}px`,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          color: p.fg,
          whiteSpace: "nowrap",
        }}
      >
        <Odometer value={value} decimals={decimals} size={numSize} />
        <span
          style={{
            color: lit,
            fontSize: numSize * 0.6,
            lineHeight: `${numSize}px`,
            marginLeft: 0.06 * numSize,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{ overflow: "hidden", background: dark ? "#03050b" : "#eeece8" }}
    >
      <GshGround
        preset={resolvedGround}
        params={groundParams}
        timeOffset={dark ? 3 : 6}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 60% at 50% 45%, rgba(${p.scrim},${scrim}) 0%, rgba(${p.scrim},${Math.min(1, scrim + 0.12)}) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${camK})`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: tall ? "column" : "row",
            alignItems: "center",
            gap: (tall ? 40 : 40) * u,
            transform: tall ? `translateY(${-150 * u}px)` : undefined,
          }}
        >
          {dial}
          {readout}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
