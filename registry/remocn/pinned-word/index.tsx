"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadSans } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const sans = loadSans("normal", { weights: ["500"], subsets: ["latin"] });
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface PinnedWordProps {
  lines?: string[];
  word?: string;
  hold?: number;
  /** Frames each flick to the next line takes. */
  flick?: number;
  accent?: string;
  /** Text color of the lines; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Schibsted Grotesk by default. */
  fontFamily?: string;
  /** Italic typeface for the pinned word. Load it yourself; Instrument Serif by default. */
  accentFont?: string;
  /** Size of the lines and pinned word, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
}

const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    word: (a: string) =>
      `linear-gradient(100deg, ${MESH[0]} 0%, ${MESH[1]} 22%, color-mix(in oklab, ${a} 80%, ${MESH[1]}) 40%, ${MESH[0]} 50%, ${MESH[1]} 62%, color-mix(in oklab, ${a} 80%, ${MESH[1]}) 80%, ${MESH[0]} 100%)`,
    ground: [
      `radial-gradient(60% 50% at 50% 118%, color-mix(in oklab, ${MESH[2]} 38%, transparent) 0%, color-mix(in oklab, ${MESH[3]} 55%, transparent) 50%, transparent 80%)`,
    ].join(", "),
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    word: (a: string) =>
      `linear-gradient(100deg, ${MESH[3]} 0%, ${MESH[2]} 22%, ${a} 40%, #7f6bd6 50%, ${MESH[2]} 62%, ${a} 80%, ${MESH[3]} 100%)`,
    ground: `radial-gradient(60% 46% at 50% 120%, color-mix(in oklab, ${MESH[1]} 26%, transparent) 0%, transparent 78%)`,
    grain: 0.035,
  },
} as const;

const SANS_TRACK = -0.025;
const PIN_SCALE = 1.8;

const INTRO_WORD = 0;
const INTRO_LINE = 8;
const FIRST_FLICK = 40;
const FLICK = 18;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FLICK = Easing.bezier(0.3, 0, 0.08, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Split {
  left: string;
  token: string;
  right: string;
  found: boolean;
}

function split(line: string, word: string): Split {
  const at = word ? line.toLowerCase().indexOf(word.toLowerCase()) : -1;
  if (at < 0) return { left: line, token: "", right: "", found: false };
  return {
    left: line.slice(0, at),
    token: line.slice(at, at + word.length),
    right: line.slice(at + word.length),
    found: true,
  };
}

interface Widths {
  left: number;
  token: number;
  right: number;
}

function measure(
  parts: Split[],
  sansFamily: string,
  serifFamily: string,
): Widths[] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) {
    return parts.map((p) => ({
      left: p.left.length * 0.5,
      token: p.token.length * 0.45 * PIN_SCALE,
      right: p.right.length * 0.5,
    }));
  }
  const sansW = (s: string) => {
    if (!s) return 0;
    ctx.font = `500 100px "${sansFamily}"`;
    return ctx.measureText(s).width / 100 + SANS_TRACK * Array.from(s).length;
  };
  const serifW = (s: string) => {
    if (!s) return 0;
    ctx.font = `italic 400 100px "${serifFamily}"`;
    return (ctx.measureText(s).width / 100) * PIN_SCALE;
  };
  return parts.map((p) => ({
    left: sansW(p.left),
    token: serifW(p.token),
    right: sansW(p.right),
  }));
}

function useWidths(parts: Split[], sansFamily: string, serifFamily: string) {
  const key = JSON.stringify([parts, sansFamily, serifFamily]);
  const [state, setState] = useState<{ key: string; w: Widths[] } | null>(null);
  const [handle] = useState(() => delayRender("pinned-word: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      sans.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(`500 100px "${sansFamily}"`),
      document.fonts.load(`italic 400 100px "${serifFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [p, sf, rf] = JSON.parse(key) as [Split[], string, string];
        setState({ key, w: measure(p, sf, rf) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, sansFamily, serifFamily]);
  return state && state.key === key ? state.w : null;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `pw${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={9}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

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

export function PinnedWord({
  lines = [
    "Ship a video tonight.",
    "Write the video in code.",
    "Own every video frame.",
  ],
  word = "video",
  hold = 36,
  flick = FLICK,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans.fontFamily,
  accentFont = serif.fontFamily,
  scale = 1,
  delay = 0,
  grain = true,
  speed = 1,
  theme = "dark",
}: PinnedWordProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const blurId = `pwb${uid}`;
  const list = lines.length > 0 ? lines : [word];
  const parts = useMemo(() => list.map((l) => split(l, word)), [list, word]);
  const widths = useWidths(parts, fontFamily, accentFont);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!widths) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);
  const pinned = word ? (widths.find((_, i) => parts[i].found)?.token ?? 0) : 0;

  const maxL = Math.max(
    0,
    ...widths.map((w, i) => (parts[i].found ? w.left : 0)),
  );
  const maxR = Math.max(
    0,
    ...widths.map((w, i) => (parts[i].found ? w.right : 0)),
  );
  const loose = Math.max(
    0,
    ...widths.map((w, i) => (parts[i].found ? 0 : w.left)),
  );
  const fStack = Math.min(
    (portrait ? 120 : 84) * s,
    (W * 0.86) / Math.max(0.1, maxL, maxR, pinned, loose),
    (H * 0.8) / (PIN_SCALE + 2.6 * 1.3),
  );
  const fInline = Math.min(
    H * 0.13,
    (W * 0.45) / Math.max(0.1, Math.max(maxL, maxR) + pinned / 2),
    (W * 0.9) / Math.max(0.1, loose),
  );
  const stacked = portrait || fInline < H * 0.075;
  const F = stacked ? fStack : fInline;
  const pinW = pinned * F;
  const pinX = W / 2 - pinW / 2;
  const clipGap = F * 0.14;
  const baseY = H / 2 + F * PIN_SCALE * 0.3;
  const rowGap = F * 1.3;

  const n = list.length;
  const STEP = Math.max(flick + 6, hold);
  const flickAt = (k: number) => FIRST_FLICK + (k - 1) * STEP;
  const posAt = (f: number) => {
    let p = 0;
    for (let k = 1; k < n; k++) {
      p += interpolate(f, [flickAt(k), flickAt(k) + flick], [0, 1], {
        ...CLAMP,
        easing: EASE_FLICK,
      });
    }
    return p;
  };
  const pos = posAt(t);
  const vel = Math.abs(pos - posAt(t - 1));
  const pitch = stacked ? H * 0.5 : H * 0.62;
  const blurY = Math.min(F * 0.5, vel * pitch * 0.3);

  const wordIn = interpolate(t, [INTRO_WORD, INTRO_WORD + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const openAt = (f: number, from: number) =>
    interpolate(f, [from, from + 20], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const openL = openAt(t, INTRO_LINE);
  const openR = openAt(t, INTRO_LINE + 3);
  // Whether the rows' transforms change on this frame: a flick, or the
  // intro's rise of the first row.
  const rowsMoving = [t - speed, t + speed].some(
    (f) =>
      posAt(f) !== pos ||
      openAt(f, INTRO_LINE) !== openL ||
      openAt(f, INTRO_LINE + 3) !== openR,
  );

  const nearest = Math.min(n - 1, Math.max(0, Math.round(pos)));
  const pinVisible = parts[nearest].found ? 1 : 0;

  let sheen = -1;
  for (let k = 0; k < n; k++) {
    const at = k === 0 ? INTRO_LINE + 4 : flickAt(k) + flick * 0.4;
    const p = interpolate(t, [at, at + 24], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    if (p > 0 && p < 1) sheen = p;
  }
  const bgShift = sheen < 0 ? 0 : sheen * pinW;

  const sansStyle: React.CSSProperties = {
    position: "absolute",
    whiteSpace: "pre",
    fontFamily,
    fontWeight: 500,
    fontSize: F,
    lineHeight: 1,
    letterSpacing: `${SANS_TRACK}em`,
    color: fg,
  };
  const serifStyle = (w: number): React.CSSProperties => ({
    position: "absolute",
    whiteSpace: "pre",
    fontFamily: accentFont,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: F * PIN_SCALE,
    lineHeight: 1,
    backgroundImage: c.word(accent),
    backgroundSize: `${(w * 2).toFixed(1)}px 100%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  });
  const sansTop = (base: number) => base - F * 0.8;
  const serifTop = (base: number) => base - F * PIN_SCALE * 0.78;

  // Layout rounds a baseline to whole pixels, so a row flicked by `top`
  // steps along. Every row is laid out where it rests on the pin and the
  // flick (and the intro's rise) is a transform, exactly 0 at rest; it stays
  // on at rest, so the row is never handed back to layout.
  const ride = (dy: number) => `translateY(${dy}px)${glide(rowsMoving)}`;
  const rows = list.map((_, i) => {
    const d = i - pos;
    if (Math.abs(d) > 1.05) return null;
    const base = baseY;
    const dy = d * pitch;
    const p = parts[i];
    const w = widths[i];
    const o = Math.max(0, (1 - Math.min(1, Math.abs(d))) * 1.15 - 0.15);
    const copyO = Math.min(1, Math.abs(d) * 4) * o;
    const kl = i === 0 ? openL : 1;
    const kr = i === 0 ? openR : 1;

    if (!p.found) {
      return (
        <div
          key={`r${i}`}
          style={{
            ...sansStyle,
            left: W / 2 - (w.left * F) / 2,
            top: sansTop(base),
            transform: ride(dy),
            opacity: o,
          }}
        >
          {p.left}
        </div>
      );
    }

    if (stacked) {
      const rp = p.right.trimStart();
      const punct = /^[.,;:!?\u2026]+/.exec(rp)?.[0] ?? "";
      const rest = rp.slice(punct.length).trim();
      const left = p.left.trimEnd();
      const centred: React.CSSProperties = {
        ...sansStyle,
        left: 0,
        width: W,
        textAlign: "center",
      };
      return (
        <div key={`r${i}`}>
          {left ? (
            <div
              style={{
                ...centred,
                top: sansTop(base - rowGap * PIN_SCALE),
                transform: ride(dy + (1 - kl) * F * 0.4),
                opacity: o * kl,
              }}
            >
              {left}
            </div>
          ) : null}
          <div
            style={{
              ...serifStyle(pinW),
              left: pinX + (pinW - w.token * F) / 2,
              top: serifTop(base),
              transform: ride(dy),
              opacity: copyO * 0.55,
            }}
          >
            {p.token}
          </div>
          {punct ? (
            <div
              style={{
                ...sansStyle,
                left: pinX + pinW + F * 0.04,
                top: sansTop(base),
                transform: ride(dy),
                opacity: o * kr,
              }}
            >
              {punct}
            </div>
          ) : null}
          {rest ? (
            <div
              style={{
                ...centred,
                top: sansTop(base + rowGap),
                transform: ride(dy - (1 - kr) * F * 0.4),
                opacity: o * kr,
              }}
            >
              {rest}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div key={`r${i}`}>
        {p.left ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: pinX - clipGap,
              height: H,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...sansStyle,
                left: pinX - w.left * F + (1 - kl) * w.left * F,
                top: sansTop(base),
                transform: ride(dy),
                opacity: o * Math.min(1, kl * 1.6),
              }}
            >
              {p.left}
            </div>
          </div>
        ) : null}
        <div
          style={{
            ...serifStyle(pinW),
            left: pinX + (pinW - w.token * F) / 2,
            top: serifTop(base),
            transform: ride(dy),
            opacity: copyO * 0.55,
          }}
        >
          {p.token}
        </div>
        {p.right ? (
          <div
            style={{
              position: "absolute",
              left: pinX + pinW + clipGap,
              top: 0,
              width: W - pinX - pinW - clipGap,
              height: H,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...sansStyle,
                left: -clipGap - (1 - kr) * w.right * F,
                top: sansTop(base),
                transform: ride(dy),
                opacity: o * Math.min(1, kr * 1.6),
              }}
            >
              {p.right}
            </div>
          </div>
        ) : null}
      </div>
    );
  });

  const pinToken = parts.find((p) => p.found)?.token ?? word;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {transparent ? null : (
        <div style={{ position: "absolute", inset: 0, background: c.ground }} />
      )}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={blurId} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation={`0 ${blurY.toFixed(2)}`} />
        </filter>
      </svg>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: blurY > 0.3 ? `url(#${blurId})` : undefined,
          }}
        >
          {rows}
        </div>
        {word ? (
          <div
            style={{
              ...serifStyle(pinW),
              left: pinX,
              top: serifTop(baseY),
              opacity: wordIn * pinVisible,
              filter:
                wordIn < 1
                  ? `blur(${((1 - wordIn) * 12 * s).toFixed(2)}px)`
                  : undefined,
              transform: `scale(${0.94 + 0.06 * wordIn})${glide(wordIn > 0 && wordIn < 1)}`,
              backgroundPosition: `${bgShift.toFixed(2)}px 0`,
            }}
          >
            {pinToken}
          </div>
        ) : null}
      </ScaleLayer>
      {transparent || !grain ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
