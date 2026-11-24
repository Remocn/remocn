"use client";

import { loadFont } from "@remotion/google-fonts/Afacad";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type OvernightElementId, overnightTimeline } from "./timeline";

const afacad = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StoryBeat {
  slug: string;
  line: string;
}

export interface OvernightProps {
  evening?: StoryBeat;
  night?: StoryBeat;
  morning?: StoryBeat;
  /** Frame the night panel starts to come down, at a 180-frame length. */
  nightAt?: number;
  /** Frame the morning panel starts to rise, at a 180-frame length. */
  morningAt?: number;
  accent?: string;
  /** Evening ground under the panels; "transparent" drops it. */
  background?: string;
  /** Typeface for the slugs and lines. Load it yourself; Afacad by default. */
  fontFamily?: string;
  /** Size of the text, around the frame's center; the panels stay put. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the evening text and the two panels, by the
   * ids in `./timeline`. Frames on the scene timeline, after `delay` and
   * `speed`.
   */
  timing?: Timing<OvernightElementId>;
}

const THEMES = {
  dark: {
    evening: "#3A1F1A",
    eveningInk: "#FBF3EA",
    night: "#160B09",
    nightInk: "#E9DCCF",
    morningInk: "#3A1F1A",
    accent: "#F2B544",
  },
  light: {
    evening: "#FBF6EE",
    eveningInk: "#3B2414",
    night: "#2E1D14",
    nightInk: "#F3E8DA",
    morningInk: "#3B2414",
    accent: "#B07A00",
  },
} as const;

const DEFAULT_EVENING: StoryBeat = {
  slug: "Thursday, 6:00 PM",
  line: "Priya’s launch was at nine the next morning.",
};
const DEFAULT_NIGHT: StoryBeat = {
  slug: "Friday, 12:50 AM",
  line: "The demo video was still a blank file.",
};
const DEFAULT_MORNING: StoryBeat = {
  slug: "Friday, 8:55 AM",
  line: "The demo went up before the launch post did.",
};

const LINE_TRACK = -0.022;
const SLUG_TRACK = 0.09;
const LH = 1.02;
const PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_DUSK = Easing.bezier(0.7, 0, 0.25, 1);
const EASE_DAWN = Easing.bezier(0.6, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function useWidths(strings: string[], family: string) {
  const key = `${family}\u0002${strings.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("overnight: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      afacad.waitUntilDone(),
      document.fonts.load(`400 ${PX}px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `400 ${PX}px "${family}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / PX : s.length * 0.45;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key ? state.w : null;
}

function lineCount(ws: number[], space: number, max: number) {
  let lines = 1;
  let x = 0;
  ws.forEach((w, i) => {
    if (i > 0 && x + space + w > max) {
      lines++;
      x = w;
    } else {
      x += (i > 0 ? space : 0) + w;
    }
  });
  return lines;
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

export function Overnight(props: OvernightProps) {
  const {
    evening = DEFAULT_EVENING,
    night = DEFAULT_NIGHT,
    morning = DEFAULT_MORNING,
    accent,
    background,
    fontFamily = afacad.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const t = frame * speed;
  const { width: W, height: H, durationInFrames: T } = useSceneConfig();
  // The panels scale with the clip length, without `speed`.
  const tl = useTimeline(overnightTimeline, props, T, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const ground =
    background === "transparent" ? undefined : (background ?? c.evening);
  const morningBg =
    theme === "dark"
      ? hi
      : `color-mix(in oklab, ${accent ?? THEMES.dark.accent} 42%, #FFFFFF)`;

  const beats = [evening, night, morning];
  const tokens = beats.map((b) => b.line.split(/\s+/).filter(Boolean));
  const strings = Array.from(new Set([" ", ...tokens.flat()]));
  const w = useWidths(strings, fontFamily);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: ground }} />
    );
  }

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginB = H * (portrait ? 0.1 : 0.12);
  const measure = W * (portrait ? 0.84 : 0.66);
  const maxLines = portrait ? 5 : 3;
  const space = w[" "] ?? 0.22;
  const adv = (s: string) => (w[s] ?? 0) + LINE_TRACK * Array.from(s).length;

  let F = portrait ? W * 0.13 : H * 0.15;
  for (let k = 0; k < 60; k++) {
    const ok = tokens.every(
      (ws) => lineCount(ws.map(adv), space, measure / F) <= maxLines,
    );
    if (ok) break;
    F *= 0.96;
  }
  const S = Math.max(14, Math.min(F * 0.27, unit * 0.034));

  const eveningEl = tl.get("evening");
  const dusk = tl.get("dusk");
  const dawn = tl.get("dawn");
  const duskA = dusk.start;
  const duskB = dusk.end;
  const dawnA = dawn.start;
  const dawnB = dawn.end;

  const down = interpolate(t, [duskA, duskB], [0, 1], {
    ...CLAMP,
    easing: EASE_DUSK,
  });
  const up = interpolate(t, [dawnA, dawnB], [0, 1], {
    ...CLAMP,
    easing: EASE_DAWN,
  });

  const slugH = S * 1.2 + S * 1.1;
  const blockH = (i: number) =>
    slugH + lineCount(tokens[i].map(adv), space, measure / F) * F * LH;
  const restTop = (i: number) => H - marginB - blockH(i);
  const gap = unit * 0.04;
  const duskEdge = H * down;
  const dawnEdge = H - H * up;

  const tops = [
    Math.max(restTop(0), duskEdge + gap),
    Math.min(restTop(1), dawnEdge - blockH(1) - gap),
    restTop(2),
  ];
  const inks = [c.eveningInk, c.nightInk, c.morningInk];
  const nightSlug = theme === "light" && !accent ? THEMES.dark.accent : hi;
  const slugInks = [hi, nightSlug, c.morningInk];
  const downAt = (f: number) =>
    interpolate(f, [duskA, duskB], [0, 1], { ...CLAMP, easing: EASE_DUSK });
  const upAt = (f: number) =>
    interpolate(f, [dawnA, dawnB], [0, 1], { ...CLAMP, easing: EASE_DAWN });
  const firstFrame = (ok: (f: number) => boolean, from: number, to: number) => {
    for (let f = Math.floor(from); f <= Math.ceil(to); f++) {
      if (ok(f)) return f;
    }
    return to;
  };
  const nightCover = firstFrame(
    (f) => H * downAt(f) >= restTop(1) + blockH(1) + gap,
    duskA,
    duskB,
  );
  const dawnCover = firstFrame(
    (f) => H - H * upAt(f) <= restTop(2) - gap,
    dawnA,
    dawnB,
  );
  const rise = (from: number, len: number) =>
    interpolate(t, [from, from + len], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const enter = [
    rise(eveningEl.start + eveningEl.beat("lineAt"), eveningEl.beat("line")),
    rise(nightCover + dusk.beat("lineLag"), dusk.beat("line")),
    rise(dawnCover + dawn.beat("lineLag"), dawn.beat("line")),
  ];
  const slugEnter = [
    rise(eveningEl.start, eveningEl.beat("slug")),
    rise(nightCover, dusk.beat("slug")),
    rise(dawnCover, dawn.beat("slug")),
  ];

  const text = (i: number) => {
    if (tops[i] >= H || tops[i] + blockH(i) <= 0) return null;
    const e = enter[i];
    const se = slugEnter[i];
    if (e <= 0.001 && se <= 0.001) return null;
    return (
      <div
        key={`text${i}`}
        style={{
          position: "absolute",
          left: marginX,
          top: tops[i],
          width: measure,
        }}
      >
        <div
          style={{
            fontSize: S,
            fontWeight: 500,
            letterSpacing: `${SLUG_TRACK}em`,
            textTransform: "uppercase",
            color: slugInks[i],
            lineHeight: 1.2,
            marginBottom: S * 1.1,
            whiteSpace: "nowrap",
            opacity: se,
            transform: `translateY(${((1 - se) * S).toFixed(2)}px)${glide(se > 0 && se < 1)}`,
          }}
        >
          {beats[i].slug}
        </div>
        <div
          style={{
            fontSize: F,
            fontWeight: 400,
            letterSpacing: `${LINE_TRACK}em`,
            lineHeight: LH,
            color: inks[i],
            textWrap: "balance",
            opacity: e,
            transform: `translateY(${((1 - e) * F * 0.32).toFixed(2)}px)${glide(e > 0 && e < 1)}`,
          }}
        >
          {beats[i].line}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background: ground,
        overflow: "hidden",
        fontFamily,
      }}
    >
      <ScaleLayer scale={scale}>{text(0)}</ScaleLayer>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: duskEdge,
          background: c.night,
        }}
      />
      <ScaleLayer scale={scale}>{text(1)}</ScaleLayer>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: dawnEdge,
          width: W,
          height: H - dawnEdge,
          background: morningBg,
        }}
      />
      <ScaleLayer scale={scale}>{text(2)}</ScaleLayer>
    </AbsoluteFill>
  );
}
