"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface FlankRollSwapProps {
  from?: [string, string];
  to?: [string, string];
  accentWord?: string;
  images?: string[];
  /** Frame the left words start to roll; the right side follows 6 frames later. */
  swapAt?: number;
  /** Frames between letters as a word rolls. */
  stagger?: number;
  accent?: string;
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the words. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Size of the words and card, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#f1ece2",
  colors: ["#fbf3dc", "#f4dfae", "#efd0c8", "#e6e2ea"],
  blur: 0.85,
  warp: 0.3,
  seed: 9,
  grain: 0.16,
};

const THEMES = {
  dark: {
    ink: "#f6f1ea",
    accent: "#ffb27a",
    ground: "hearth" as GshPresetId | undefined,
    groundParams: { scale: 1 } as Partial<GradientParams> | undefined,
    groundParamsTall: { scale: 1.7 } as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "10,6,4",
    scrimAlpha: 0.5,
    border: "rgba(255,255,255,0.14)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.18)",
    shadow:
      "0 1px 2px rgba(6,3,1,0.45), 0 14px 30px rgba(6,3,1,0.45), 0 44px 90px rgba(6,3,1,0.55)",
  },
  light: {
    ink: "#1b1814",
    accent: "#3B5BFD",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundParamsTall: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "246,241,232",
    scrimAlpha: 0.45,
    border: "rgba(40,28,10,0.10)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.4)",
    shadow:
      "0 1px 2px rgba(60,40,10,0.12), 0 12px 26px rgba(60,40,10,0.14), 0 36px 72px rgba(60,40,10,0.16)",
  },
};

const DEFAULT_IMAGES = [
  "templates/launch-anything/desk.jpg",
  "reel/reel-4.jpg",
  "templates/product-showcase/sculpture.jpg",
  "templates/launch-anything/horizon.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-2.jpg",
  "templates/product-showcase/courtyard.jpg",
  "templates/brand-guidelines/chair.jpg",
];

const BEAT = {
  leftIn: 6,
  rightIn: 9,
  slide: 15,
  leftRoll: 48,
  rightGap: 6,
  stagger: 1.2,
  roll: 9,
  accentLag: 3,
  hold: 42,
  fastFrom: 42,
};

const FONT_PX = 200;
const TRACK = -0.02;
const LINE = 1.3;
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const ROLL = Easing.bezier(0.65, 0, 0.35, 1);
const PUSH = Easing.bezier(0.87, 0, 0.13, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

function buildMetrics(_version: number, fontFamily: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  const font = `400 ${FONT_PX}px "${fontFamily}"`;
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = font;
      cache[s] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useMetrics(fontFamily: string) {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("flank-roll-swap: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      hanken.waitUntilDone(),
      document.fonts.load(`400 ${FONT_PX}px "${fontFamily}"`),
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
  }, [handle, fontFamily]);
  return useMemo(
    () => buildMetrics(version, fontFamily),
    [version, fontFamily],
  );
}

const rollEnd = (
  start: number,
  a: string,
  b: string,
  stagger: number = BEAT.stagger,
) => start + Math.max(a.length, b.length) * stagger + BEAT.roll;

export const flankRollSwapLength = (
  from: [string, string] = ["Remocn", "Studio"],
  to: [string, string] = ["Out now", "on remocn.dev"],
) => {
  const leftEnd = rollEnd(BEAT.leftRoll, from[0], to[0]);
  const rightEnd = rollEnd(BEAT.leftRoll + BEAT.rightGap, from[1], to[1]);
  return Math.ceil(Math.max(leftEnd, rightEnd) / 6) * 6 + BEAT.hold;
};

const cutIndex = (frame: number, swapEnd: number) => {
  let t = 0;
  let k = 0;
  while (t <= frame) {
    const step = t < BEAT.fastFrom ? 6 : t < swapEnd ? 4 : 9;
    t += step;
    if (t <= frame) k++;
  }
  return k;
};

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function FlankRollSwap({
  from = ["Remocn", "Studio"],
  to = ["Out now", "on remocn.dev"],
  accentWord = "remocn.dev",
  images,
  swapAt = BEAT.leftRoll,
  stagger = BEAT.stagger,
  accent,
  ink,
  background,
  fontFamily = hanken.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: FlankRollSwapProps) {
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const portrait = H > W * 1.1;
  const gParams =
    groundParams ??
    (ground ? undefined : portrait ? c.groundParamsTall : c.groundParams);
  const bg = gshParams(preset, gParams).background;
  const u = Math.min(W, H) / 720;
  const measure = useMetrics(fontFamily);
  const pics = (images ?? DEFAULT_IMAGES.map((p) => staticFile(p))).filter(
    Boolean,
  );

  const leftStart = swapAt;
  const rightStart = swapAt + BEAT.rightGap;
  const leftEnd = rollEnd(leftStart, from[0], to[0], stagger);
  const rightEnd = rollEnd(rightStart, from[1], to[1], stagger);
  const swapEnd = Math.max(leftEnd, rightEnd);

  const geo = useMemo(() => {
    if (portrait) {
      const widest = Math.max(
        measure(from[0]),
        measure(from[1]),
        measure(to[0]),
        measure(to[1]),
      );
      const cardW = W * 0.74;
      const cardH = cardW * 1.18;
      const F = Math.min((W * 0.8) / widest, cardH * 0.24);
      return { cardW, cardH, F, gap: F * 0.18, cx: W / 2 };
    }
    const leftMax = Math.max(measure(from[0]), measure(to[0]));
    const rightMax = Math.max(measure(from[1]), measure(to[1]));
    const gapEm = 0.42;
    const sumEm = leftMax + rightMax + 2 * gapEm;
    const cardW = W * Math.min(0.3, Math.max(0.2, 0.86 / (1 + 0.16 * sumEm)));
    const cardH = cardW / 1.9;
    const F = Math.min((W * 0.86 - cardW) / sumEm, cardH * 0.42);
    const cx = W / 2 + ((measure(to[0]) - measure(to[1])) * F) / 2;
    return { cardW, cardH, F, gap: F * gapEm, cx };
  }, [measure, from, to, portrait, W]);

  const { cardW, cardH, F, gap, cx } = geo;
  const cy = H / 2;

  const pop = spring({ frame, fps, config: CARD });
  const punch = interpolate(
    frame,
    [leftStart, leftStart + 2, leftStart + 7],
    [0, 1, 0],
    CLAMP,
  );
  const pushAt = (f: number) =>
    1 +
    0.035 *
      interpolate(f, [0, swapEnd + BEAT.hold - 12], [0, 1], {
        ...CLAMP,
        easing: PUSH,
      });
  const push = pushAt(frame);
  // The push is a very flat in-out ease, so it counts as moving while the
  // frame's far edge still travels more than a thousandth of a pixel.
  const reach = Math.hypot(W, H) / 2;
  const pushMoving =
    Math.abs(pushAt(frame + 1) - push) * reach > 1e-3 ||
    Math.abs(push - pushAt(frame - 1)) * reach > 1e-3;
  const cardScale = (0.55 + 0.45 * pop) * (1 + 0.035 * punch);
  const tilt = (1 - pop) * 14;
  const cut = cutIndex(frame, swapEnd);
  const pic = pics[cut % Math.max(1, pics.length)];
  let cutStart = 0;
  {
    let t = 0;
    while (t <= frame) {
      cutStart = t;
      t += t < BEAT.fastFrom ? 6 : t < swapEnd ? 4 : 9;
    }
  }
  const kb =
    1.08 -
    0.08 *
      interpolate(frame - cutStart, [0, 9], [0, 1], {
        ...CLAMP,
        easing: TYPE_IN,
      });

  const accentAt = (word: string) => {
    const i = accentWord ? word.indexOf(accentWord) : -1;
    return i < 0 ? [-1, -1] : [i, i + accentWord.length];
  };

  const renderRow = (
    text: string,
    phase: "old" | "new",
    side: "a" | "b",
    start: number,
    landed: number,
  ) => {
    const chars = Array.from(text);
    const n = chars.length;
    const [a0, a1] = phase === "new" ? accentAt(text) : [-1, -1];
    const accentP =
      a0 >= 0
        ? interpolate(frame, [landed, landed + 9], [0, 1], {
            ...CLAMP,
            easing: TYPE_IN,
          })
        : 0;
    return chars.map((ch, i) => {
      const fromCard = portrait ? i : side === "a" ? n - 1 - i : i;
      const t0 = start + fromCard * stagger;
      const p = interpolate(frame, [t0, t0 + BEAT.roll], [0, 1], {
        ...CLAMP,
        easing: ROLL,
      });
      const y = phase === "old" ? -p * 105 : (1 - p) * 105;
      const op =
        phase === "old"
          ? interpolate(p, [0.4, 1], [1, 0], CLAMP)
          : interpolate(p, [0, 0.6], [0, 1], CLAMP);
      const isAccent = i >= a0 && i < a1;
      const color =
        isAccent && accentP > 0
          ? accentP >= 1
            ? hi
            : `color-mix(in oklab, ${hi} ${accentP * 100}%, ${inkC})`
          : inkC;
      const velocity = Math.abs(
        p -
          interpolate(frame - 1, [t0, t0 + BEAT.roll], [0, 1], {
            ...CLAMP,
            easing: ROLL,
          }),
      );
      const blur = Math.min(4, velocity * 14) * u;
      return (
        <span
          key={`${phase}-${i}-${ch}`}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            transform: `translateY(${y}%)`,
            opacity: op,
            color,
            filter: blur > 0.2 ? `blur(${blur * 0.4}px)` : undefined,
          }}
        >
          {ch}
        </span>
      );
    });
  };

  const renderSide = (side: "a" | "b") => {
    const idx = side === "a" ? 0 : 1;
    const inAt = side === "a" ? BEAT.leftIn : BEAT.rightIn;
    const rollAt = side === "a" ? leftStart : rightStart;
    const landed = side === "a" ? leftEnd : rightEnd;
    const slide = interpolate(frame, [inAt, inAt + BEAT.slide], [0, 1], {
      ...CLAMP,
      easing: TYPE_IN,
    });
    const lineH = F * LINE;
    const justify = portrait
      ? "center"
      : side === "a"
        ? "flex-end"
        : "flex-start";
    const textStyle = {
      position: "absolute" as const,
      inset: 0,
      display: "flex",
      justifyContent: justify,
      fontFamily,
      fontWeight: 400,
      fontSize: F,
      letterSpacing: `${TRACK}em`,
      lineHeight: `${lineH}px`,
      whiteSpace: "pre" as const,
    };
    const rows = (
      <>
        <div style={textStyle}>
          {renderRow(from[idx], "old", side, rollAt, landed)}
        </div>
        <div style={textStyle}>
          {renderRow(to[idx], "new", side, rollAt + 1, landed)}
        </div>
      </>
    );
    if (portrait) {
      const top = side === "a";
      const edge = (cardH / 2) * Math.min(1, cardScale);
      const travel = (1 - slide) * (lineH + gap + cardH / 2 - edge);
      const clipTop = top ? 0 : cy + edge;
      const rowTop = top
        ? cy - cardH / 2 - gap - lineH
        : cy + cardH / 2 + gap - clipTop;
      return (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: clipTop,
            width: W,
            height: top ? cy - edge : H - clipTop,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: rowTop + (top ? travel : -travel),
              height: lineH,
              overflow: "hidden",
            }}
          >
            {rows}
          </div>
        </div>
      );
    }
    const left = side === "a";
    const edge = (cardW / 2) * Math.min(1, cardScale);
    const shift =
      (1 - slide) * (measure(from[idx]) * F + gap + cardW / 2 - edge);
    const inner = cardW / 2 + gap - shift - edge;
    return (
      <div
        style={{
          position: "absolute",
          top: cy - lineH / 2,
          height: lineH,
          left: left ? 0 : cx + edge,
          width: left ? cx - edge : W - cx - edge,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            height: lineH,
            width: W * 0.6,
            ...(left ? { right: inner } : { left: inner }),
          }}
        >
          {rows}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? bg
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={preset}
            params={gParams}
            timeOffset={c.groundOffset}
            timeScale={0.5}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(${portrait ? "95% 50%" : "70% 60%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
            }}
          />
        </>
      ) : null}
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${push})${glide(pushMoving)}`,
            transformOrigin: "50% 50%",
          }}
        >
          {renderSide("a")}
          {renderSide("b")}
          <div
            style={{
              position: "absolute",
              left: cx - cardW / 2,
              top: cy - cardH / 2,
              width: cardW,
              height: cardH,
              perspective: 1200 * u,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: Math.max(6, cardW * (portrait ? 0.045 : 0.035)),
                overflow: "hidden",
                boxShadow: `${c.highlight}, ${c.shadow}`,
                border: `1px solid ${c.border}`,
                transform: `scale(${cardScale}) rotateX(${tilt}deg)`,
                background: "#111",
              }}
            >
              {pic ? (
                <Img
                  src={pic}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${kb})`,
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow: c.highlight,
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default FlankRollSwap;
