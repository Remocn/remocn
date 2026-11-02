"use client";

import { loadFont } from "@remotion/google-fonts/InterTight";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

const inter = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface FocusPanTextProps {
  lines?: string[];
  accentWord?: string;
  meta?: string;
  accent?: string;
  ink?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  firstHold?: number;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#efeeeb",
  colors: ["#ffffff", "#f5f4f1", "#dfe0e6", "#c3c8d6"],
  blur: 0.8,
  warp: 0.3,
  seed: 5,
  grain: 0.16,
};

const THEMES = {
  dark: {
    ink: "#f2f1f6",
    muted: "rgba(242,241,246,0.5)",
    accent: "#7c90ff",
    ground: "europa" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 6,
    scrim: "3,5,10",
    scrimAlpha: 0.5,
  },
  light: {
    ink: "#141418",
    muted: "rgba(20,20,24,0.46)",
    accent: "#3B5BFD",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "248,247,244",
    scrimAlpha: 0.4,
  },
};

const BEAT = {
  decay: 0.8,
  minHold: 18,
  move: 14,
  payoffMove: 24,
  wordIn: 12,
  wordStagger: 3,
  accent: 20,
  meta: 24,
  hold: 48,
};

const TRACK = -0.022;
const FONT_PX = 200;
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const COLOR = Easing.bezier(0.83, 0, 0.17, 1);
const PUSH = Easing.bezier(0.33, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_LINES = [
  "The security scan is clean.",
  "All 48 checks passed.",
  "Your domain is live.",
  "You're ready to launch.",
];

const holdOf = (i: number, first: number) =>
  Math.max(BEAT.minHold, Math.round(first * BEAT.decay ** i));

export const focusPanTextLength = (
  lines: string[] = DEFAULT_LINES,
  firstHold = 30,
) => {
  let t = 0;
  for (let i = 0; i < lines.length - 1; i++) t += holdOf(i, firstHold);
  return t + BEAT.payoffMove + BEAT.meta + BEAT.hold;
};

function buildMeasure(_version: number): (s: string) => number {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.5;
      ctx.font = `400 ${FONT_PX}px "${inter.fontFamily}"`;
      cache[s] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("focus-pan-text: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`400 ${FONT_PX}px "${inter.fontFamily}"`),
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
  return useMemo(() => buildMeasure(version), [version]);
}

function Icon({
  size,
  color,
  children,
}: {
  size: number;
  color: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

interface Row {
  words: string[];
  line: number;
  first: number;
}

export function FocusPanText({
  lines = DEFAULT_LINES,
  accentWord,
  meta = "Just now",
  accent,
  ink,
  theme = "dark",
  ground,
  groundParams,
  firstHold = 30,
}: FocusPanTextProps) {
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
  const m = useMeasure();

  const safeLines = lines.length > 0 ? lines : DEFAULT_LINES;
  const last = safeLines.length - 1;
  const widest = m ? Math.max(...safeLines.map((l) => m(l))) : 10;
  const F = portrait ? W * 0.1 : Math.min(H * 0.16, (W * 1.12) / widest);
  const LH = F * 1.3;
  const maxW = portrait ? W * 0.86 : Number.POSITIVE_INFINITY;

  const rows = useMemo(() => {
    if (!m) return [] as Row[];
    const out: Row[] = [];
    safeLines.forEach((ln, li) => {
      const words = ln.split(/\s+/).filter(Boolean);
      let cur: string[] = [];
      let first = 0;
      words.forEach((w, wi) => {
        const next = [...cur, w].join(" ");
        if (cur.length > 0 && m(next) * F > maxW) {
          out.push({ words: cur, line: li, first });
          cur = [w];
          first = wi;
        } else {
          cur.push(w);
        }
      });
      if (cur.length) out.push({ words: cur, line: li, first });
    });
    return out;
  }, [m, safeLines, F, maxW]);

  const lineCenter = (li: number) => {
    const idx = rows
      .map((r, i) => (r.line === li ? i : -1))
      .filter((i) => i >= 0);
    if (!idx.length) return li;
    return (idx[0] + idx[idx.length - 1]) / 2;
  };

  const moves = useMemo(() => {
    const out: { at: number; len: number; line: number }[] = [];
    let t = 0;
    for (let i = 1; i <= last; i++) {
      t += holdOf(i - 1, firstHold);
      out.push({
        at: t,
        len: i === last ? BEAT.payoffMove : BEAT.move,
        line: i,
      });
    }
    return out;
  }, [last, firstHold]);
  const payoffAt = moves.length ? moves[moves.length - 1].at : 0;

  if (!m || rows.length === 0) {
    return <AbsoluteFill style={{ background: bg }} />;
  }

  const focusAt = (t: number) => {
    let f = lineCenter(0);
    for (const mv of moves) {
      const from = f;
      const to = lineCenter(mv.line) + (mv.line === last ? 0.24 : 0);
      let p: number;
      if (mv.line === last) {
        p = spring({
          frame: t - mv.at,
          fps,
          config: { mass: 1, damping: 26, stiffness: 120 },
          durationInFrames: mv.len,
        });
      } else {
        p = MOVE(Math.min(1, Math.max(0, (t - mv.at) / mv.len)));
      }
      f = from + (to - from) * p;
    }
    return f;
  };
  const f = focusAt(frame);
  const vel = Math.abs(f - focusAt(frame - 1));
  const motionBlur = Math.min(4 * u, vel * 9 * u);

  const settle = interpolate(frame, [payoffAt, payoffAt + 40], [0, 1], {
    ...CLAMP,
    easing: MOVE,
  });
  const push = interpolate(
    frame,
    [0, payoffAt + BEAT.payoffMove + BEAT.meta + BEAT.hold],
    [0, 1],
    { ...CLAMP, easing: PUSH },
  );
  const rx = 14 - 6 * settle;
  const ry = 16 - 7 * settle;
  const rz = -2.4 + 1.2 * settle;
  const panX = -(f / Math.max(1, rows.length - 1)) * F * 0.28;
  const hinge = W * (portrait ? 0.1 : 0.085);
  const scale = 1 + 0.045 * push;

  const payoffWords = safeLines[last].split(/\s+/).filter(Boolean);
  const accentIdx = (() => {
    if (accentWord) {
      const i = payoffWords.findIndex((w) =>
        w.toLowerCase().startsWith(accentWord.toLowerCase()),
      );
      if (i >= 0) return i;
    }
    return payoffWords.length - 1;
  })();
  const colorHit = interpolate(
    frame,
    [payoffAt + BEAT.accent, payoffAt + BEAT.accent + 10],
    [0, 1],
    { ...CLAMP, easing: COLOR },
  );
  const accentPunch = spring({
    frame: frame - payoffAt - BEAT.accent,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const metaIn = spring({
    frame: frame - payoffAt - BEAT.meta,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });

  const mix = (a: string, b: string, t: number) =>
    t <= 0 ? a : t >= 1 ? b : `color-mix(in oklab, ${b} ${t * 100}%, ${a})`;

  const lastRowIdx = rows.length - 1;
  const metaSize = F * 0.44;

  const renderPlane = (key: string) => (
    <AbsoluteFill
      key={key}
      style={{ perspective: `${(portrait ? 1500 : 1100) * u}px` }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transformOrigin: `${hinge}px 50%`,
          transform: `scale(${scale}) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: hinge + panX,
            top: H * 0.5 - (f + 0.5) * LH,
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: F,
            lineHeight: `${LH}px`,
            letterSpacing: `${TRACK}em`,
            color: inkC,
            whiteSpace: "nowrap",
          }}
        >
          {rows.map((r, ri) => {
            const isPayoff = r.line === last;
            const dist = Math.abs(ri - f);
            const fade = 1 - 0.3 * Math.min(1, Math.max(0, dist - 0.6) / 2);
            return (
              <div
                key={`${r.line}-${r.first}`}
                style={{ height: LH, opacity: fade }}
              >
                {r.words.map((w, wi) => {
                  const gi = r.first + wi;
                  const space = wi < r.words.length - 1 ? " " : "";
                  if (!isPayoff) {
                    return (
                      <span key={`${gi}-${w}`}>
                        {w}
                        {space}
                      </span>
                    );
                  }
                  const start = payoffAt + gi * BEAT.wordStagger;
                  const p = TYPE_IN(
                    Math.min(1, Math.max(0, (frame - start) / BEAT.wordIn)),
                  );
                  const isAccent = gi === accentIdx;
                  const punch = isAccent
                    ? 1 + 0.05 * Math.sin(Math.min(1, accentPunch) * Math.PI)
                    : 1;
                  return (
                    <span key={`${gi}-${w}`}>
                      <span
                        style={{
                          display: "inline-block",
                          opacity: p,
                          transform: `translateY(${(1 - p) * F * 0.42}px) scale(${punch})`,
                          transformOrigin: "50% 80%",
                          filter:
                            p < 1 ? `blur(${(1 - p) * 6 * u}px)` : undefined,
                          color: isAccent ? mix(inkC, hi, colorHit) : inkC,
                        }}
                      >
                        {w}
                      </span>
                      {space}
                    </span>
                  );
                })}
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: metaSize * 0.9,
              marginTop: LH * 0.12,
              fontSize: metaSize,
              lineHeight: 1,
              letterSpacing: "-0.005em",
              color: c.muted,
              opacity: Math.min(1, metaIn * 1.4) * (lastRowIdx >= 0 ? 1 : 0),
              transform: `translateY(${(1 - metaIn) * metaSize * 0.9}px)`,
            }}
          >
            <span>{meta}</span>
            <Icon size={metaSize * 1.05} color={c.muted}>
              <rect x="8" y="8" width="12" height="12" rx="2.5" />
              <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
            </Icon>
            <Icon size={metaSize * 1.05} color={c.muted}>
              <path d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11H7Z" />
              <path d="M7 11l3.6-7.2A2 2 0 0 1 14.4 5l-.6 4h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.6 20H7" />
            </Icon>
            <Icon size={metaSize * 1.05} color={c.muted}>
              <circle cx="5" cy="12" r="0.6" />
              <circle cx="12" cy="12" r="0.6" />
              <circle cx="19" cy="12" r="0.6" />
            </Icon>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );

  const band = portrait ? [36, 44, 56, 64] : [28, 40, 60, 72];
  const sharpMask = `linear-gradient(178deg, transparent ${band[0]}%, #000 ${band[1]}%, #000 ${band[2]}%, transparent ${band[3]}%)`;
  const softMask = `linear-gradient(178deg, rgba(0,0,0,0.45) 0%, #000 ${band[0]}%, transparent ${band[1]}%, transparent ${band[2]}%, #000 ${band[3]}%, rgba(0,0,0,0.45) 100%)`;
  const vBlur = motionBlur > 0.1 ? `blur(${motionBlur}px)` : "";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "95% 55%" : "75% 70%"} at 42% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          filter: `blur(${7 * u + motionBlur}px)`,
          WebkitMaskImage: softMask,
          maskImage: softMask,
        }}
      >
        {renderPlane("soft")}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: vBlur || undefined,
          WebkitMaskImage: sharpMask,
          maskImage: sharpMask,
        }}
      >
        {renderPlane("sharp")}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default FocusPanText;
