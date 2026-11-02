"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface MacroLetterPanProps {
  line?: string;
  word?: string;
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  firstShot?: number;
  maxShots?: number;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#e9e8e4",
  colors: ["#ffffff", "#f6f5f2", "#d8d9df", "#b9bdc9"],
  blur: 0.75,
  warp: 0.35,
  seed: 11,
  grain: 0.18,
};

const THEMES = {
  dark: {
    ink: "#f3f2f7",
    muted: "rgba(243,242,247,0.46)",
    accent: "#6f86ff",
    ground: "nightfold" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 4,
    scrim: "5,4,12",
    scrimAlpha: 0.5,
  },
  light: {
    ink: "#111114",
    muted: "rgba(17,17,20,0.4)",
    accent: "#3B5BFD",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "246,245,242",
    scrimAlpha: 0.55,
  },
};

const BEAT = {
  decay: 0.8,
  minShot: 6,
  settle: 3,
  pullLen: 30,
  accentAt: 16,
  hold: 42,
};

const TRACK = -0.035;
const FONT_PX = 200;
const DRIFT = Easing.bezier(0.45, 0, 0.55, 1);
const HOLD = Easing.bezier(0.33, 0, 0.2, 1);
const COLOR = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  width: (s: string) => number;
  cap: number;
  asc: number;
  xh: number;
}

function buildMetrics(_version: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const font = `400 ${FONT_PX}px "${geist.fontFamily}"`;
  const box = (s: string) => {
    if (!ctx) return 0.7;
    ctx.font = font;
    return ctx.measureText(s).actualBoundingBoxAscent / FONT_PX;
  };
  const cache: Record<string, number> = {};
  return {
    width: (s: string) => {
      if (cache[s] === undefined) {
        if (!ctx) return s.length * 0.55;
        ctx.font = font;
        cache[s] =
          ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
      }
      return cache[s];
    },
    cap: box("H"),
    asc: box("l"),
    xh: box("x"),
  };
}

function useMetrics() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("macro-letter-pan: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(`400 ${FONT_PX}px "${geist.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildMetrics(version), [version]);
}

export const macroLetterPanLength = (
  word = "launch",
  firstShot = 15,
  maxShots = 6,
  portrait = false,
) => {
  const unit = portrait ? 1 : 2;
  const n = Math.max(1, Math.min(maxShots, word.length - unit + 1));
  let total = 0;
  for (let k = 0; k < n; k++) {
    total += Math.max(BEAT.minShot, Math.round(firstShot * BEAT.decay ** k));
  }
  return total + BEAT.pullLen + BEAT.hold;
};

export function MacroLetterPan({
  line = "Ready to launch.",
  word = "launch",
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  firstShot = 15,
  maxShots = 6,
}: MacroLetterPanProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const portrait = H > W * 1.1;
  const u = Math.min(W, H) / 720;
  const m = useMetrics();

  const found = word ? line.indexOf(word) : -1;
  const text = found >= 0 ? line : word || line;
  const ws = found >= 0 ? found : 0;
  const we = ws + (word ? word.length : text.length);
  const before = text.slice(0, ws);
  const target = text.slice(ws, we);
  const after = text.slice(we);
  const period = /[.!?]$/.test(after) ? after.slice(-1) : "";
  const tail = period ? after.slice(0, -1) : after;

  const unit = portrait ? 1 : 2;
  const nShots = Math.max(1, Math.min(maxShots, target.length - unit + 1));
  const shots = useMemo(() => {
    const out: { start: number; len: number; from: number }[] = [];
    let t = 0;
    const span = Math.max(0, target.length - unit);
    for (let k = 0; k < nShots; k++) {
      const len = Math.max(
        BEAT.minShot,
        Math.round(firstShot * BEAT.decay ** k),
      );
      const from = nShots === 1 ? 0 : Math.round((k * span) / (nShots - 1));
      out.push({ start: t, len, from });
      t += len;
    }
    return out;
  }, [nShots, target.length, unit, firstShot]);
  const pullStart = shots[shots.length - 1].start + shots[shots.length - 1].len;

  const layout = useMemo(() => {
    if (!m) return null;
    const rows =
      portrait && before.trim()
        ? [
            { text: before.trimEnd(), offset: 0 },
            { text: text.slice(ws), offset: ws },
          ]
        : [{ text, offset: 0 }];
    const widest = Math.max(...rows.map((r) => m.width(r.text)));
    const F = Math.min(
      (W * (portrait ? 0.84 : 0.78)) / widest,
      (H * (portrait ? 0.22 : 0.2)) / m.cap,
    );
    const lh = F * 1.04;
    const blockH = m.cap * F + lh * (rows.length - 1);
    const top = (H - blockH) / 2 + m.cap * F;
    const placed = rows.map((r, i) => ({
      ...r,
      x: (W - m.width(r.text) * F) / 2,
      y: top + i * lh,
    }));
    const rowOf = placed[placed.length - 1];
    const charX = (i: number) =>
      rowOf.x + m.width(text.slice(rowOf.offset, i)) * F;
    return { F, rows: placed, base: rowOf.y, charX };
  }, [m, portrait, before, text, ws, W, H]);

  if (!m || !layout) {
    return <AbsoluteFill style={{ background: bg }} />;
  }
  const { F, rows, base, charX } = layout;

  const camAt = (t: number) => {
    let k = 0;
    for (let i = 0; i < shots.length; i++) if (t >= shots[i].start) k = i;
    const s = shots[k];
    const a = ws + s.from;
    const b = a + unit;
    const x0 = charX(a);
    const x1 = charX(b) - TRACK * F;
    const pairW = x1 - x0;
    const scale = Math.min(
      (W * (portrait ? 0.84 : 0.86)) / pairW,
      (H * (portrait ? 0.46 : 0.96)) / (m.xh * F),
    );
    const p = DRIFT(Math.min(1, Math.max(0, (t - s.start) / s.len)));
    const cx = (x0 + x1) / 2 + pairW * (-0.09 + 0.18 * p);
    const cy = base - m.xh * F * 0.56;
    return { cx, cy, scale: scale * (1 + 0.035 * p), k };
  };

  const lastEnd = camAt(pullStart - 0.001);
  const pull = spring({
    frame: frame - pullStart,
    fps,
    config: { mass: 1, damping: 26, stiffness: 120 },
    durationInFrames: BEAT.pullLen,
  });
  const pullPrev = spring({
    frame: frame - 1 - pullStart,
    fps,
    config: { mass: 1, damping: 26, stiffness: 120 },
    durationInFrames: BEAT.pullLen,
  });
  const hold = interpolate(
    frame,
    [pullStart + BEAT.pullLen - 6, pullStart + BEAT.pullLen + BEAT.hold],
    [0, 1],
    { ...CLAMP, easing: HOLD },
  );

  let scale: number;
  let ox: number;
  let oy: number;
  let blur = 0;
  if (frame < pullStart) {
    const cam = camAt(frame);
    scale = cam.scale;
    ox = W / 2 - cam.cx * scale;
    oy = H / 2 - cam.cy * scale;
    const s = shots[cam.k];
    blur =
      cam.k > 0
        ? interpolate(frame - s.start, [0, BEAT.settle], [5 * u, 0], CLAMP)
        : 0;
  } else {
    const s0 = lastEnd.scale;
    const s1 = 1 + 0.025 * hold;
    const cx1 = W / 2;
    const cy1 = H / 2;
    const px = (lastEnd.cx * s0 - cx1 * 1) / (s0 - 1);
    const py = (lastEnd.cy * s0 - cy1 * 1) / (s0 - 1);
    const sx = W / 2 + (px - lastEnd.cx) * s0;
    const sy = H / 2 + (py - lastEnd.cy) * s0;
    const sPull = Math.exp(Math.log(s0) * (1 - pull));
    scale = sPull * s1;
    ox = sx - px * sPull;
    oy = sy - py * sPull;
    ox = W / 2 + (ox - W / 2) * s1;
    oy = H / 2 + (oy - H / 2) * s1;
    const v = Math.abs(pull - pullPrev) * Math.log(s0);
    blur = Math.min(7 * u, v * 26 * u);
  }

  const dof = interpolate(frame, [pullStart, pullStart + 16], [1, 0], {
    ...CLAMP,
    easing: COLOR,
  });
  const reveal = interpolate(frame, [pullStart + 4, pullStart + 20], [0, 1], {
    ...CLAMP,
    easing: COLOR,
  });
  const colorHit = interpolate(
    frame,
    [pullStart + BEAT.accentAt, pullStart + BEAT.accentAt + 9],
    [0, 1],
    { ...CLAMP, easing: COLOR },
  );
  const dot = spring({
    frame: frame - pullStart - BEAT.accentAt - 3,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });

  const mix = (a: string, b: string, t: number) =>
    t <= 0 ? a : t >= 1 ? b : `color-mix(in oklab, ${b} ${t * 100}%, ${a})`;
  const wordFill = mix(inkC, hi, colorHit);
  const mutedFill = mix(inkC, c.muted, reveal);

  const fs = F * scale;
  const toX = (x: number) => ox + x * scale;
  const toY = (y: number) => oy + y * scale;
  const periodX = charX(we + tail.length);

  const renderText = (key: string) => (
    <svg
      key={key}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
      aria-hidden
    >
      {rows.map((r, ri) => {
        const isLast = ri === rows.length - 1;
        const segs = isLast
          ? [
              ...(r.offset === 0 && before
                ? [{ t: before, fill: mutedFill }]
                : []),
              { t: target, fill: wordFill },
              { t: tail, fill: mutedFill },
            ]
          : [{ t: r.text, fill: mutedFill }];
        return (
          <text
            key={r.offset}
            x={toX(r.x)}
            y={toY(r.y)}
            fontFamily={geist.fontFamily}
            fontWeight={400}
            fontSize={fs}
            letterSpacing={`${TRACK}em`}
            style={{ fontKerning: "normal" }}
          >
            {segs.map((sg) => (
              <tspan key={sg.t + sg.fill} fill={sg.fill}>
                {sg.t}
              </tspan>
            ))}
          </text>
        );
      })}
      {period ? (
        <g
          transform={`translate(${toX(periodX + m.width(period) * F * 0.32)} ${toY(base)}) scale(${0.35 + 0.65 * dot}) translate(${-m.width(period) * fs * 0.32} 0)`}
        >
          <text
            x={0}
            y={0}
            fontFamily={geist.fontFamily}
            fontWeight={400}
            fontSize={fs}
            fill={mix(inkC, hi, colorHit)}
            opacity={interpolate(dot, [0, 0.3], [0, 1], CLAMP)}
          >
            {period}
          </text>
        </g>
      ) : null}
    </svg>
  );

  const ell = portrait ? "62% 34%" : "46% 62%";
  const sharpMask = `radial-gradient(${ell} at 50% 48%, #000 ${44 + 56 * (1 - dof)}%, transparent 100%)`;
  const softMask = `radial-gradient(${ell} at 50% 48%, transparent ${44 + 56 * (1 - dof)}%, #000 100%)`;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.55}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "92% 50%" : "70% 66%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          filter: `blur(${16 * dof * u + blur}px)`,
          opacity: dof > 0.001 ? 1 : 0,
          WebkitMaskImage: softMask,
          maskImage: softMask,
        }}
      >
        {renderText("soft")}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          WebkitMaskImage: dof > 0.001 ? sharpMask : undefined,
          maskImage: dof > 0.001 ? sharpMask : undefined,
        }}
      >
        {renderText("sharp")}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default MacroLetterPan;
