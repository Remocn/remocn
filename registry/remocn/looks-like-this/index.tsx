"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Onest";
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
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LEAD,
  type LooksLikeThisElementId,
  leadWords,
  looksLikeThisTimeline,
} from "./timeline";

const onest = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface LooksLikeThisProps {
  lead?: string;
  word?: string;
  end?: string;
  src?: string;
  aspect?: number;
  duration?: string;
  /** Frames between lead words appearing, at the default 150-frame length. */
  stagger?: number;
  /** Corner radius of the grown video, in px at 1280 wide. */
  radius?: number;
  accent?: string;
  /** Text color of the lead; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lead. Load it yourself; Onest by default. */
  fontFamily?: string;
  /** Size of the line and video, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the lead words, the chip, its growth into the
   * video and the player chrome, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<LooksLikeThisElementId>;
}

const THEMES = {
  dark: {
    ink: "#F4F3EF",
    accent: "#B4C3FF",
    well: "#101218",
    preset: "velvet-hour" as GshPresetId,
    groundOffset: 6,
    edge: "rgba(255,255,255,0.1)",
    lift: "0 2px 6px rgba(0,0,0,0.35), 0 40px 90px -24px rgba(0,0,0,0.75)",
  },
  light: {
    ink: "#141519",
    accent: "#2D46D6",
    well: "#dfe2e8",
    preset: "glasswork" as GshPresetId,
    groundOffset: 3,
    edge: "rgba(0,0,0,0.1)",
    lift: "0 2px 6px rgba(30,30,60,0.08), 0 40px 90px -24px rgba(30,30,70,0.32)",
  },
} as const;

const WGHT = 400;
const TRACK = -0.035;
const SERIF_TRACK = -0.01;
const PX = 200;
const CHIP_H = 0.74;
const CHIP_GAP = 0.14;

const TYPE_IN = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = { sans: (s: string) => number; serif: (s: string) => number };

function buildMetrics(_version: number, fontFamily: string): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const make = (font: string, track: number) => {
    const cache: Record<string, number> = {};
    return (s: string) => {
      if (cache[s] === undefined) {
        if (!ctx) return s.length * 0.5;
        ctx.font = font;
        cache[s] = ctx.measureText(s).width / PX + track * Array.from(s).length;
      }
      return cache[s];
    };
  };
  return {
    sans: make(`${WGHT} ${PX}px "${fontFamily}"`, TRACK),
    serif: make(`italic 400 ${PX}px "${serif.fontFamily}"`, SERIF_TRACK),
  };
}

function useMetrics(fontFamily: string) {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("looks-like-this: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      onest.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${fontFamily}"`),
      document.fonts.load(`italic 400 100px "${serif.fontFamily}"`),
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

interface Token {
  w: number;
  gap: number;
  glue?: boolean;
}

interface Placed {
  x: number;
  y: number;
}

function layout(
  tokens: Token[],
  size: number,
  maxW: number,
  centerX: number,
  topY: number,
  leading: number,
) {
  const lines: number[][] = [[]];
  let run = 0;
  tokens.forEach((t, i) => {
    const line = lines[lines.length - 1];
    const add = (line.length > 0 ? t.gap : 0) + t.w;
    if (line.length > 0 && (run + add) * size > maxW) {
      if (t.glue && line.length > 1) {
        const prev = line.pop() as number;
        lines.push([prev, i]);
        run = tokens[prev].w + t.gap + t.w;
      } else {
        lines.push([i]);
        run = t.w;
      }
    } else {
      line.push(i);
      run += add;
    }
  });
  const placed: Placed[] = new Array(tokens.length);
  lines.forEach((line, li) => {
    const total = line.reduce(
      (acc, i, k) => acc + tokens[i].w + (k > 0 ? tokens[i].gap : 0),
      0,
    );
    let x = centerX - (total * size) / 2;
    line.forEach((i, k) => {
      if (k > 0) x += tokens[i].gap * size;
      placed[i] = { x, y: topY + li * leading * size };
      x += tokens[i].w * size;
    });
  });
  return { placed, lines: lines.length };
}

function PlayGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8 5.8 L18 12 L8 18.2 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function LooksLikeThis(props: LooksLikeThisProps) {
  const {
    lead = DEFAULT_LEAD,
    word = "this",
    end = ".",
    src,
    aspect = 16 / 9,
    duration = "0:30",
    radius: radiusPx = 16,
    accent,
    ink,
    background,
    fontFamily = onest.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const now = useSceneFrame();
  const frame = Math.max(0, now - delay);
  const { width: W, height: H, fps, durationInFrames: D } = useSceneConfig();
  // The scene scales its beats by the clip length without `speed`.
  const tl = useTimeline(looksLikeThisTimeline, props, D, timing);
  const chipEl = tl.get("chip");
  const grow = tl.get("grow");
  const chromeEl = tl.get("chrome");
  const playEl = tl.get("play");
  const punct = tl.get("punct");
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const image = src ?? staticFile("hero.png");
  const m = useMetrics(fontFamily);

  const words = leadWords(lead);
  const t = frame * speed;
  const tAt = (n: number) => Math.max(0, n - delay) * speed;
  /** Whether a value in px, as a function of time, moves on this frame. */
  const stirs = (v: (t: number) => number) => {
    const here = v(t);
    return (
      Math.abs(v(tAt(now + 1)) - here) > 1e-3 ||
      Math.abs(here - v(tAt(now - 1))) > 1e-3
    );
  };
  const portrait = H > W * 1.1;
  const u = portrait ? W / 1080 : W / 1280;
  const sp = m.sans(" ");
  const chipW = CHIP_H * aspect;
  const leading = 1.08;
  const wordW = m.serif(word);
  const endW = m.sans(end);

  const tokensA: Token[] = [
    ...words.map((wd) => ({ w: m.sans(wd), gap: sp })),
    { w: chipW + CHIP_GAP * 2 + endW, gap: sp - CHIP_GAP, glue: true },
  ];
  const tokensB: Token[] = [
    ...words.map((wd) => ({ w: m.sans(wd), gap: sp })),
    { w: wordW + endW, gap: sp, glue: true },
  ];

  const maxW = W * (portrait ? 0.84 : 0.8);
  const lineA = tokensA.reduce(
    (acc, tk, i) => acc + tk.w + (i > 0 ? tk.gap : 0),
    0,
  );
  const sizeA = Math.max(
    portrait ? W * 0.095 : H * 0.075,
    Math.min(portrait ? W * 0.12 : H * 0.12, maxW / lineA),
  );
  const sizeB = portrait ? W * 0.085 : H * 0.074;

  const probeA = layout(tokensA, sizeA, maxW, W / 2, 0, leading);
  const blockA = (probeA.lines - 1) * leading * sizeA + sizeA;
  const A = layout(tokensA, sizeA, maxW, W / 2, (H - blockA) / 2, leading);

  const probeB = layout(tokensB, sizeB, maxW, W / 2, 0, leading);
  const blockB = (probeB.lines - 1) * leading * sizeB + sizeB;
  const gapB = H * (portrait ? 0.035 : 0.05);
  const heroMaxW = W * (portrait ? 0.86 : 0.72);
  const heroAspect = portrait ? Math.min(aspect, 1) : aspect;
  const heroRoom = H * (portrait ? 0.78 : 0.8) - blockB - gapB;
  const heroH = Math.min(heroRoom, heroMaxW / heroAspect);
  const heroW = heroH * heroAspect;
  const topB = portrait ? (H - (blockB + gapB + heroH)) / 2 : H * 0.085;
  const B = layout(tokensB, sizeB, maxW, W / 2, topB, leading);
  const hero = {
    x: (W - heroW) / 2,
    y: topB + blockB + gapB,
    w: heroW,
    h: heroH,
  };

  const pAt = (t: number) =>
    interpolate(t, [grow.start, grow.end], [0, 1], {
      ...CLAMP,
      easing: MOVE,
    });
  const p = pAt(t);
  const pChipAt = (t: number) =>
    spring({
      frame: t - grow.start - grow.beat("chipDelay"),
      fps,
      config: MORPH,
      durationInFrames: grow.beat("chip"),
    });
  const pChip = pChipAt(t);
  const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
  const size = lerp(sizeA, sizeB, p);

  const last = words.length;
  const slotA = A.placed[last];
  const chipRect0 = {
    x: slotA.x + CHIP_GAP * sizeA,
    y: slotA.y + sizeA * (0.6 - CHIP_H / 2),
    w: chipW * sizeA,
    h: CHIP_H * sizeA,
  };
  const chipOpen = spring({ frame: t - chipEl.start, fps, config: CARD });
  const chipAt = (pChip: number, p: number) => {
    const chipY = lerp(chipRect0.y, hero.y, pChip);
    const lineFloor =
      lerp(slotA.y, B.placed[words.length].y, p) + lerp(sizeA, sizeB, p) * 1.14;
    const leave = interpolate(pChip, [0, 0.14], [0, 1], CLAMP);
    return {
      x: lerp(chipRect0.x, hero.x, pChip),
      y: lerp(chipY, Math.max(chipY, lineFloor), leave),
      w: lerp(chipRect0.w, hero.w, pChip),
      h: lerp(chipRect0.h, hero.h, pChip),
    };
  };
  const chip = chipAt(pChip, p);
  const radius = lerp(sizeA * 0.12, radiusPx * u, pChip);
  const settle = interpolate(t, [playEl.start, playEl.end], [1.04, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });
  const imgScale = lerp(1.2, settle, pChip);

  const endA = {
    x: slotA.x + (CHIP_GAP * 2 + chipW) * sizeA,
    y: slotA.y,
  };
  const slotB = B.placed[last];
  const endB = { x: slotB.x + wordW * sizeB, y: slotB.y };
  const endY = lerp(endA.y, endB.y, p);

  const wordIn = interpolate(
    t,
    [grow.start + grow.beat("word"), grow.end + grow.beat("wordEnd")],
    [0, 1],
    { ...CLAMP, easing: TYPE_IN },
  );

  const prevA = A.placed[last - 1];
  const prevB = B.placed[last - 1];
  const wordX =
    last > 0
      ? lerp(prevA.x, prevB.x, p) + (m.sans(words[last - 1]) + sp) * size
      : lerp(slotA.x, slotB.x, p);

  const endX = lerp(
    endA.x,
    wordX + wordW * size,
    interpolate(p, [0, 0.55], [0, 1], { ...CLAMP, easing: TYPE_IN }),
  );

  const chrome = interpolate(t, [chromeEl.start, chromeEl.end], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });
  const play = interpolate(t, [playEl.start, playEl.end], [0.04, 0.32], CLAMP);
  const totalSec = (() => {
    const [mm, ss] = duration.split(":").map((v) => Number.parseInt(v, 10));
    return (mm || 0) * 60 + (ss || 0);
  })();
  const nowSec = Math.floor(play * totalSec);
  const stamp = `${Math.floor(nowSec / 60)}:${String(nowSec % 60).padStart(2, "0")}`;
  const label = Math.max(17 * u, H * 0.024);
  const flat = background !== undefined;

  // A font size that eases moves each baseline inside its own box by layout,
  // which rounds it to whole pixels whatever transform sits on top. While it
  // eases, the text is laid out at its final size and scaled to the live one;
  // at rest it is the plain layout again.
  const sizing = midway(p);
  const fit = sizing ? ` scale(${size / sizeB})` : "";
  const textStyle = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    fontFamily,
    fontWeight: WGHT,
    fontSize: sizing ? sizeB : size,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
    color: fg,
  };

  const open = 0.12 + 0.88 * Math.min(1, chipOpen);
  const visW = chip.w * open;
  // The chip flies to the hero by transform, laid out at the nearer of its two
  // resting places: layout rounds a box and a baseline to whole pixels, so a
  // chip eased by `left`/`top` clicks along pixel by pixel. Its size still
  // animates by layout, so the control bar pinned to its bottom rides a layer
  // of the resting height, moved by the height change.
  const chipRest = chipAt(Math.round(pChip), Math.round(p));
  const chipLeft = (q: { x: number; w: number }) =>
    q.x + (q.w * (1 - open)) / 2;
  const chipDx = chipLeft(chip) - chipLeft(chipRest);
  const chipDy = chip.y - chipRest.y;
  const chipMoving =
    stirs((t) => chipAt(pChipAt(t), pAt(t)).y) ||
    stirs((t) => chipAt(pChipAt(t), pAt(t)).x);
  const chipShift =
    Math.abs(chipDx) < 1e-3 && Math.abs(chipDy) < 1e-3
      ? undefined
      : `translate(${chipDx}px, ${chipDy}px)${glide(chipMoving)}`;
  const barDy = chip.h - chipRest.h;
  const chromeAt = (t: number) =>
    interpolate(t, [chromeEl.start, chromeEl.end], [0, 1], {
      ...CLAMP,
      easing: TYPE_IN,
    });
  const barMoving =
    stirs((t) => chipAt(pChipAt(t), pAt(t)).h) ||
    stirs((t) => (1 - chromeAt(t)) * label * 0.6);

  return (
    <AbsoluteFill
      style={{
        background:
          flat && background !== "transparent" ? background : undefined,
        overflow: "hidden",
      }}
    >
      {flat ? null : (
        <GshGround
          preset={ground ?? (groundParams ? undefined : c.preset)}
          params={groundParams}
          timeOffset={c.groundOffset}
          timeScale={0.4}
        />
      )}
      <ScaleLayer scale={scale}>
        {words.map((wd, i) => {
          const a = A.placed[i];
          const b = B.placed[i];
          const w = tl.get(`word:${i}`);
          const enter = interpolate(t, [w.start, w.end], [0, 1], {
            ...CLAMP,
            easing: TYPE_IN,
          });
          const x = lerp(a.x, b.x, p);
          const y = lerp(a.y, b.y, p) + (1 - enter) * size * 0.32;
          const yAt = (t: number) => {
            const q = pAt(t);
            const e = interpolate(t, [w.start, w.end], [0, 1], {
              ...CLAMP,
              easing: TYPE_IN,
            });
            return lerp(a.y, b.y, q) + (1 - e) * lerp(sizeA, sizeB, q) * 0.32;
          };
          return (
            <span
              key={`${wd}-${i.toString()}`}
              style={{
                ...textStyle,
                transform: `translate(${x}px, ${y}px)${fit}${glide(sizing || stirs(yAt))}`,
                opacity: enter,
              }}
            >
              {wd}
            </span>
          );
        })}
        <span
          style={{
            ...textStyle,
            transform: `translate(${endX}px, ${endY}px)${fit}${glide(midway(p))}`,
            opacity: interpolate(t, [punct.start, punct.end], [0, 1], {
              ...CLAMP,
              easing: TYPE_IN,
            }),
          }}
        >
          {end}
        </span>
        <span
          style={{
            ...textStyle,
            fontFamily: serif.fontFamily,
            fontStyle: "italic",
            fontWeight: 400,
            letterSpacing: `${SERIF_TRACK}em`,
            color: hi,
            transform: `translate(${wordX}px, ${lerp(slotA.y, slotB.y, p) + (1 - wordIn) * size * 0.3}px)${fit}${glide(midway(p) || midway(wordIn))}`,
            opacity: wordIn,
          }}
        >
          {word}
        </span>
        <div
          style={{
            position: "absolute",
            left: chipLeft(chipRest),
            top: chipRest.y,
            width: visW,
            height: chip.h,
            borderRadius: radius,
            overflow: "hidden",
            background: c.well,
            boxShadow: pChip > 0.3 ? c.lift : "none",
            opacity: interpolate(chipOpen, [0, 0.25], [0, 1], CLAMP),
            transform: chipShift,
          }}
        >
          <Img
            src={image}
            style={{
              position: "absolute",
              left: -(chip.w - visW) / 2,
              top: 0,
              width: chip.w,
              height: chip.h,
              objectFit: "cover",
              transform: `scale(${imgScale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "34%",
              backgroundImage:
                "linear-gradient(180deg, rgba(6,7,10,0) 0%, rgba(6,7,10,0.18) 40%, rgba(6,7,10,0.55) 100%)",
              opacity: chrome,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: chipRest.h,
              transform:
                Math.abs(barDy) < 1e-3
                  ? undefined
                  : `translateY(${barDy}px)${glide(barMoving && !chipMoving)}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: label * 1.1,
                right: label * 1.1,
                bottom: label * 0.95,
                display: "flex",
                alignItems: "center",
                gap: label * 0.8,
                opacity: chrome,
                transform: `translateY(${(1 - chrome) * label * 0.6}px)${glide(barMoving && !chipMoving && Math.abs(barDy) < 1e-3)}`,
                color: "#ffffff",
                fontFamily: mono.fontFamily,
                fontSize: label,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              <PlayGlyph size={label * 1.05} color="#ffffff" />
              <div
                style={{
                  flex: 1,
                  height: Math.max(2, label * 0.14),
                  borderRadius: label,
                  background: "rgba(255,255,255,0.3)",
                }}
              >
                <div
                  style={{
                    width: `${play * 100}%`,
                    height: "100%",
                    borderRadius: "inherit",
                    background: "#ffffff",
                  }}
                />
              </div>
              <span>
                {stamp} / {duration}
              </span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              boxShadow: `inset 0 0 0 1px ${c.edge}`,
            }}
          />
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
