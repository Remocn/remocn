"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
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
  DEFAULT_URL,
  type UrlBarCtaElementId,
  urlBarCtaTimeline,
} from "./timeline";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface UrlBarCtaProps {
  url?: string;
  children?: React.ReactNode;
  typingSpeed?: number;
  showCursor?: boolean;
  suggestionTitle?: string;
  headline?: string;
  body?: string;
  cta?: string;
  command?: string;
  image?: string;
  clipName?: string;
  /** Links in the built-in page's nav bar. */
  navLinks?: string[];
  /** Button at the right of the built-in page's nav bar. */
  navCta?: string;
  theme?: "light" | "dark";
  accent?: string;
  /** Text color of the typed URL and the headline; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Replaces the remocn wordmark in the built-in page's nav bar. */
  logo?: React.ReactNode;
  /** Size of the foreground around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the bar, single keys, the suggestions, the
   * Enter press, the dock, the page and the camera push, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<UrlBarCtaElementId>;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);

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

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A layout shift as a transform, or nothing once it is under a thousandth. */
const shift = (dx: number, dy: number) =>
  Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3
    ? undefined
    : `translate(${dx}px, ${dy}px)`;

interface Pal {
  dark: boolean;
  window: string;
  chrome: string;
  bar: string;
  docked: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  rowSel: string;
  keyTop: string;
  keyEdge: string;
  elevated: string;
  float: string;
  imageEdge: string;
  ground: { preset?: GshPresetId; params?: Partial<GradientParams> };
  groundOffset: number;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        dark: true,
        window: "#0f1013",
        chrome: "#0b0c0e",
        bar: "#16171b",
        docked: "#1b1c21",
        text: "#f2f2f3",
        muted: "#9a9ca5",
        faint: "#62646c",
        line: "rgba(255,255,255,0.07)",
        rowSel: "rgba(255,255,255,0.06)",
        keyTop: "#202127",
        keyEdge: "#08090b",
        elevated:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.09), 0 8px 20px -6px rgba(0,0,0,0.5), 0 32px 80px -16px rgba(0,0,0,0.75)",
        float:
          "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.1), 0 6px 16px -4px rgba(0,0,0,0.5), 0 24px 60px -12px rgba(0,0,0,0.65)",
        imageEdge: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        ground: { preset: "earthshine" },
        groundOffset: 3,
      }
    : {
        dark: false,
        window: "#ffffff",
        chrome: "#f6f6f4",
        bar: "#ffffff",
        docked: "#ebebe8",
        text: "#16171b",
        muted: "#5f616b",
        faint: "#9a9ca4",
        line: "rgba(20,20,30,0.08)",
        rowSel: "rgba(20,20,30,0.05)",
        keyTop: "#ffffff",
        keyEdge: "#cfd0d4",
        elevated:
          "0 0 0 1px rgba(20,20,30,0.07), 0 2px 4px rgba(20,20,30,0.05), 0 28px 64px -18px rgba(30,30,60,0.28)",
        float:
          "0 0 0 1px rgba(20,20,30,0.08), 0 2px 6px rgba(20,20,30,0.06), 0 22px 50px -14px rgba(30,30,60,0.26)",
        imageEdge: "inset 0 0 0 1px rgba(0,0,0,0.1)",
        ground: { preset: "glasswork" },
        groundOffset: 2,
      };
}

function Glyph({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON = {
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  lock: "M7.5 10.5V8a4.5 4.5 0 019 0v2.5M6.5 10.5h11v9h-11z",
  clock: "M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17zM12 7.5V12l3 2",
  arrowL: "M14.5 6l-6 6 6 6",
  arrowR: "M9.5 6l6 6-6 6",
  reload: "M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4.5H15",
  share: "M12 3.5v11M8.5 7L12 3.5 15.5 7M6 12.5v7h12v-7",
  enter: "M19 5.5v6a3 3 0 01-3 3H5.5M9 10.5l-4 4 4 4",
};

function Favicon({ size, accent }: { size: number; accent: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: size * 0.5, width: "auto" }}
        aria-hidden
      >
        <path fill="#ffffff" d={REMOCN_R_PATH} />
      </svg>
    </div>
  );
}

function Keycap({
  label,
  pal,
  size,
}: {
  label: string;
  pal: Pal;
  size: number;
}) {
  return (
    <span
      style={{
        fontFamily: mono.fontFamily,
        fontSize: size,
        lineHeight: 1,
        color: pal.muted,
        padding: `${size * 0.28}px ${size * 0.45}px`,
        borderRadius: size * 0.36,
        boxShadow: `0 0 0 1px ${pal.line}`,
        background: pal.dark ? "rgba(255,255,255,0.03)" : "#ffffff",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function BuiltInHero({
  pal,
  accent,
  frame,
  start,
  beat,
  fps,
  u,
  portrait,
  headline,
  body,
  cta,
  command,
  image,
  clipName,
  navLinks,
  navCta,
  ink,
  fontFamily,
  logo,
}: {
  pal: Pal;
  accent: string;
  frame: number;
  start: number;
  /** The page element's beats: line stagger and rise, card, playhead. */
  beat: (name: string) => number;
  fps: number;
  u: number;
  portrait: boolean;
  headline: string;
  body: string;
  cta: string;
  command: string;
  image: string;
  clipName: string;
  navLinks: string[];
  navCta: string;
  ink: string;
  fontFamily: string;
  logo: React.ReactNode;
}) {
  const textIn = (i: number) =>
    interpolate(
      frame,
      [start + i * beat("stagger"), start + i * beat("stagger") + beat("rise")],
      [0, 1],
      {
        ...CLAMP,
        easing: TYPE_IN,
      },
    );
  const rise = (i: number) => {
    const p = textIn(i);
    return { opacity: p, transform: `translateY(${(1 - p) * 14 * u}px)` };
  };
  const card = spring({
    frame: frame - start - beat("card"),
    fps,
    config: CARD,
  });
  const cardOpacity = interpolate(
    frame,
    [start + beat("card"), start + beat("cardEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: TYPE_IN,
    },
  );
  const playhead = interpolate(
    frame,
    [start, start + beat("playhead")],
    [0.18, 0.86],
    {
      ...CLAMP,
    },
  );
  const clipSeconds = 6;
  const now = playhead * clipSeconds;
  const stamp = `0:${String(Math.floor(now)).padStart(2, "0")}`;
  const pad = (portrait ? 34 : 44) * u;

  const player = (
    <div
      style={{
        opacity: cardOpacity,
        transform: `translateY(${(1 - card) * 36 * u}px) scale(${0.96 + 0.04 * card})`,
        transformOrigin: "50% 100%",
        width: portrait ? "100%" : 430 * u,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: portrait ? "16 / 10.5" : "4 / 3.15",
          borderRadius: 12 * u,
          overflow: "hidden",
          background: pal.chrome,
        }}
      >
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1.08 - 0.06 * playhead})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            boxShadow: pal.imageEdge,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14 * u,
            right: 14 * u,
            bottom: 14 * u,
            height: 3 * u,
            borderRadius: 3 * u,
            background: "rgba(255,255,255,0.28)",
          }}
        >
          <div
            style={{
              width: `${playhead * 100}%`,
              height: "100%",
              borderRadius: "inherit",
              background: "#ffffff",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 14 * u,
          fontSize: 17 * u,
          color: pal.text,
        }}
      >
        <span>{clipName}</span>
        <span
          style={{
            fontFamily: mono.fontFamily,
            fontSize: 16 * u,
            color: pal.faint,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {stamp} / 0:{String(clipSeconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: pal.window,
        overflow: "hidden",
        fontFamily,
        fontWeight: 400,
      }}
    >
      <div
        style={{
          ...rise(0),
          height: 58 * u,
          padding: `0 ${pad}px`,
          display: "flex",
          alignItems: "center",
          gap: 30 * u,
          boxShadow: `inset 0 -1px 0 ${pal.line}`,
          fontSize: 16 * u,
          color: pal.muted,
        }}
      >
        {logo ?? <RemocnLogo fontSize={19 * u} color={pal.text} />}
        {portrait ? null : navLinks.map((l) => <span key={l}>{l}</span>)}
        <span
          style={{
            marginLeft: "auto",
            height: 34 * u,
            padding: `0 ${14 * u}px`,
            borderRadius: 8 * u,
            display: "inline-flex",
            alignItems: "center",
            background: pal.text,
            color: pal.window,
          }}
        >
          {navCta}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: portrait ? "stretch" : "center",
          gap: (portrait ? 44 : 40) * u,
          padding: `${(portrait ? 48 : 44) * u}px ${pad}px 0`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...rise(1),
              fontSize: (portrait ? 52 : 50) * u,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1.04,
              color: ink,
              textWrap: "balance",
              maxWidth: portrait ? "none" : 440 * u,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              ...rise(2),
              fontSize: 18 * u,
              lineHeight: 1.45,
              color: pal.muted,
              marginTop: 18 * u,
              maxWidth: 380 * u,
              textWrap: "pretty",
            }}
          >
            {body}
          </div>
          <div
            style={{
              ...rise(3),
              display: "flex",
              alignItems: "center",
              gap: 16 * u,
              marginTop: 28 * u,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                height: 42 * u,
                padding: `0 ${18 * u}px`,
                borderRadius: 9 * u,
                display: "inline-flex",
                alignItems: "center",
                gap: 8 * u,
                fontSize: 17 * u,
                background: accent,
                color: "#ffffff",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px ${withAlpha("#000000", 0.2)}`,
              }}
            >
              {cta}
              <Glyph
                d="M5 12h14M13.5 6.5L19 12l-5.5 5.5"
                size={16 * u}
                color="#ffffff"
              />
            </span>
          </div>
          <div
            style={{
              ...rise(4),
              marginTop: 18 * u,
              fontFamily: mono.fontFamily,
              fontSize: 16 * u,
              color: pal.faint,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: pal.muted }}>$</span> {command}
          </div>
        </div>
        {player}
      </div>
    </AbsoluteFill>
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

const NAV_LINKS = ["Components", "Templates", "Docs"];

export function UrlBarCta(props: UrlBarCtaProps) {
  const {
    url = DEFAULT_URL,
    children,
    showCursor = true,
    suggestionTitle = "Launch videos from components",
    headline = "Ship your launch video this afternoon.",
    body = "Remotion components you install with one command and own the code.",
    cta = "Browse components",
    command = "npx shadcn add remocn/zoom-blur",
    image,
    clipName = "Zoom Blur",
    navLinks = NAV_LINKS,
    navCta = "Get started",
    theme = "light",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = geist.fontFamily,
    logo,
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const raw = useSceneFrame();
  const frame = Math.max(0, raw - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    urlBarCtaTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const portrait = H > W;
  const u = portrait ? W / 760 : Math.min(W / 1280, H / 720);
  const pal = palette(theme);
  const fg = ink ?? pal.text;
  const src = image ?? staticFile("reel/reel-2.jpg");

  const times = Array.from(
    { length: url.length },
    (_, i) => tl.get(`key:${i}`).start,
  );
  const suggestEl = tl.get("suggest");
  const enterEl = tl.get("enter");
  const dockEl = tl.get("dock");
  const heroEl = tl.get("hero");
  const camera = tl.get("camera");
  const appearEl = tl.get("appear");
  // The caret blinks from the last key; with no key, from the first slot.
  const typeEnd = times[times.length - 1] ?? suggestEl.start;
  const keyIn = tl.get("hint").start;
  const enter = enterEl.start;
  const dock = dockEl.start;

  const typed = times.filter((t) => frame >= t).length;
  const typedText = url.slice(0, typed);
  const completion = typed >= 3 && typed < url.length ? url.slice(typed) : "";

  const appear = spring({ frame: frame - appearEl.start, fps, config: CARD });
  const appearO = interpolate(frame, [appearEl.start, appearEl.end], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });
  const suggestOpen = spring({
    frame: frame - suggestEl.start,
    fps,
    config: CARD,
  });
  const suggestClose = interpolate(
    frame,
    [enter + enterEl.beat("close"), dock + dockEl.beat("closeEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: EXIT,
    },
  );
  const suggest = Math.max(0, suggestOpen * (1 - suggestClose));

  const pressDown = spring({ frame: frame - enter, fps, config: CHIP });
  const pressUp = spring({
    frame: frame - enter - enterEl.beat("release"),
    fps,
    config: CHIP,
  });
  const press = Math.max(0, pressDown - pressUp);
  const keyShow = spring({ frame: frame - keyIn, fps, config: CHIP });
  const keyHide = interpolate(
    frame,
    [enter + enterEl.beat("hide"), enter + enterEl.beat("hideEnd")],
    [0, 1],
    {
      ...CLAMP,
      easing: EXIT,
    },
  );

  const dockAt = (f: number) =>
    spring({
      frame: f - dock,
      fps,
      config: MORPH,
      durationInFrames: dockEl.length,
    });
  const d = dockAt(frame);
  const docking =
    Math.abs(dockAt(frame + speed) - d) > 1e-6 ||
    Math.abs(d - dockAt(frame - speed)) > 1e-6;
  const load = interpolate(frame, [dock, dock + dockEl.beat("load")], [0, 1], {
    ...CLAMP,
    easing: MOVE,
  });
  const loadFade = interpolate(
    frame,
    [dock + dockEl.beat("load"), dock + dockEl.beat("loadFade")],
    [1, 0],
    {
      ...CLAMP,
      easing: EXIT,
    },
  );
  const pushAt = (r: number) =>
    interpolate(
      Math.max(0, r - delay) * speed,
      [camera.start, camera.end],
      [1, 1.03],
      CLAMP,
    );
  const push = pushAt(raw);
  // The push carries the bar, the window and the key, so its tilt covers
  // every piece of text riding inside them.
  const pushMoving = pushAt(raw + 1) !== push || pushAt(raw - 1) !== push;

  const barW0 = Math.min(640 * u, W * 0.86);
  const barH0 = 62 * u;
  const barX0 = (W - barW0) / 2;
  const barY0 = H * (portrait ? 0.34 : 0.3) - barH0 / 2;

  const winW = W * (portrait ? 0.86 : 0.76);
  const winX = (W - winW) / 2;
  const winY = H * (portrait ? 0.17 : 0.11);
  const winH = H * (portrait ? 0.9 : 0.98);
  const toolbarH = 46 * u;

  const barX1 = winX + 112 * u;
  const barW1 = winW - 112 * u * 2;
  const barH1 = 30 * u;
  const barY1 = winY + (toolbarH - barH1) / 2;

  const bx = lerp(barX0, barX1, d);
  const by = lerp(barY0, barY1, d);
  const bw = lerp(barW0, barW1, d);
  const bh = lerp(barH0, barH1, d);
  const fontSize = lerp(26 * u, 16 * u, d);
  const radius = lerp(16 * u, 8 * u, d);
  // A font size that eases moves the baseline inside the field by layout,
  // which rounds it to whole pixels. While it docks the field is laid out at
  // its docked size and scaled up to the live one about its left middle,
  // nudged so the url keeps its live x; at rest it is plain layout.
  const fieldK = docking ? fontSize / (16 * u) : 1;
  const field = docking
    ? { h: barH1, font: 16 * u, gap: 8 * u, pad: 12 * u, icon: 14 * u }
    : {
        h: bh,
        font: fontSize,
        gap: lerp(14, 8, d) * u,
        pad: lerp(20, 12, d) * u,
        icon: lerp(22, 14, d) * u,
      };
  const fieldDx =
    (lerp(20, 12, d) + lerp(22, 14, d) + lerp(14, 8, d)) * u -
    fieldK * (field.pad + field.icon + field.gap);

  const ww = lerp(barW0, winW, d);
  const wh = lerp(barH0, winH, d);
  const winOpacity = interpolate(d, [0, 0.12], [0, 1], CLAMP);

  const rowH = 48 * u;
  const listPad = 6 * u;
  const rows = 3;
  const popupExtra = (rowH * rows + listPad * 2 + 1) * suggest;

  const caretOn =
    showCursor &&
    (frame < typeEnd + 2 || Math.floor((frame - typeEnd) / 9) % 2 === 1);
  const caretVisible = caretOn && d < 0.4;

  const suggestions = [
    { icon: "fav", main: url, sub: suggestionTitle, hint: "Enter" },
    {
      icon: "search",
      main: `${url.split(".")[0]} transitions`,
      sub: "",
      hint: "Search",
    },
    {
      icon: "clock",
      main: `${url}/docs/zoom-blur`,
      sub: "",
      hint: "2d ago",
    },
  ];

  const preset = ground ?? (groundParams ? undefined : pal.ground.preset);
  const gParams = groundParams ?? (ground ? undefined : pal.ground.params);

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <GshGround
          preset={preset}
          params={gParams}
          timeOffset={pal.groundOffset}
          timeScale={0.5}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${push})${glide(pushMoving)}`,
            transformOrigin: "50% 40%",
          }}
        >
          <div
            style={{
              // Laid out where the window docks; the morph out of the bar
              // travels by transform, since layout rounds a box and a
              // baseline to whole pixels and the window would click along.
              position: "absolute",
              left: winX,
              top: winY,
              transform: shift(
                (barX0 - winX) * (1 - d),
                (barY0 - winY) * (1 - d),
              ),
              width: ww,
              height: wh,
              opacity: winOpacity,
              borderRadius: lerp(16 * u, 14 * u, d),
              background: pal.window,
              overflow: "hidden",
              boxShadow: pal.elevated,
            }}
          >
            <div
              style={{
                height: toolbarH,
                background: pal.chrome,
                boxShadow: `inset 0 -1px 0 ${pal.line}`,
                display: "flex",
                alignItems: "center",
                padding: `0 ${16 * u}px`,
                gap: 7 * u,
                position: "relative",
                opacity: interpolate(d, [0.3, 0.8], [0, 1], CLAMP),
              }}
            >
              {[0, 1, 2].map((k) => (
                <span
                  key={k}
                  style={{
                    width: 11 * u,
                    height: 11 * u,
                    borderRadius: 99,
                    background: pal.dark
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(20,20,30,0.14)",
                  }}
                />
              ))}
              <span style={{ width: 12 * u }} />
              <Glyph d={ICON.arrowL} size={17 * u} color={pal.muted} />
              <Glyph d={ICON.arrowR} size={17 * u} color={pal.faint} />
              {/* Pushed right by an auto margin, the icons would follow the
                  window's widening edge by layout, pixel by pixel. While it
                  docks, a margin holds them at their docked place and a
                  transform carries the difference. */}
              <div
                style={{
                  marginLeft: "auto",
                  marginRight: docking ? ww - winW : undefined,
                  transform: docking ? `translateX(${ww - winW}px)` : undefined,
                  display: "flex",
                  gap: 14 * u,
                }}
              >
                <Glyph d={ICON.reload} size={16 * u} color={pal.muted} />
                <Glyph d={ICON.share} size={16 * u} color={pal.muted} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: 2 * u,
                  width: `${load * 100}%`,
                  background: accent,
                  opacity: loadFade * (load > 0 ? 1 : 0),
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                width: winW,
                top: toolbarH,
                transform: shift((ww - winW) / 2, 0),
                height: winH - toolbarH,
                opacity: interpolate(d, [0.15, 0.45], [0, 1], CLAMP),
              }}
            >
              {children ?? (
                <BuiltInHero
                  pal={pal}
                  accent={accent}
                  frame={frame}
                  start={heroEl.start}
                  beat={heroEl.beat}
                  fps={fps}
                  u={u}
                  portrait={portrait}
                  headline={headline}
                  body={body}
                  cta={cta}
                  command={command}
                  image={src}
                  clipName={clipName}
                  navLinks={navLinks}
                  navCta={navCta}
                  ink={fg}
                  fontFamily={fontFamily}
                  logo={logo}
                />
              )}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              // Laid out where it is typed into; the dock is a transform,
              // for the same reason as the window's.
              left: barX0,
              top: barY0,
              width: bw,
              height: bh + popupExtra,
              borderRadius: radius,
              background: d > 0.6 ? pal.docked : pal.bar,
              boxShadow: d > 0.6 ? "none" : pal.float,
              overflow: "hidden",
              opacity: appearO,
              transform: `translate(${bx - barX0}px, ${by - barY0 + (1 - appear) * 18 * u}px) scale(${0.97 + 0.03 * appear})`,
              transformOrigin: "50% 0%",
            }}
          >
            <div
              style={{
                height: field.h,
                display: "flex",
                alignItems: "center",
                gap: field.gap,
                padding: `0 ${field.pad}px`,
                fontSize: field.font,
                color: fg,
                letterSpacing: "-0.015em",
                transform: docking
                  ? `translate(${fieldDx}px, ${(bh - field.h) / 2}px) scale(${fieldK})`
                  : undefined,
                transformOrigin: docking ? "0 50%" : undefined,
              }}
            >
              <Glyph
                d={d > 0.5 ? ICON.lock : ICON.search}
                size={field.icon}
                color={pal.faint}
              />
              <span
                style={{
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span>{typedText}</span>
                <span
                  style={{
                    width: 2 * u,
                    height: field.font * 1.1,
                    background: accent,
                    marginLeft: 1 / fieldK,
                    opacity: caretVisible ? 1 : 0,
                  }}
                />
                {completion ? (
                  <span
                    style={{
                      background: withAlpha(accent, pal.dark ? 0.38 : 0.2),
                      borderRadius: 3 * u,
                    }}
                  >
                    {completion}
                  </span>
                ) : null}
              </span>
            </div>
            {/* The list sits under the field as typed into; as the field
                shrinks into the dock the list rides up by transform, not
                by reflow, which would click it up pixel by pixel. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: barH0,
                transform: shift(0, bh - barH0),
              }}
            >
              <div
                style={{ height: 1, background: pal.line, opacity: suggest }}
              />
              <div style={{ padding: listPad, opacity: suggest }}>
                {suggestions.map((s, i) => {
                  const a = interpolate(
                    suggestOpen * 3 - i * 0.6,
                    [0, 1],
                    [0, 1],
                    CLAMP,
                  );
                  return (
                    <div
                      key={s.main}
                      style={{
                        height: rowH,
                        borderRadius: radius - listPad,
                        display: "flex",
                        alignItems: "center",
                        gap: 14 * u,
                        padding: `0 ${14 * u}px`,
                        background: i === 0 ? pal.rowSel : "transparent",
                        fontSize: 17 * u,
                        opacity: a,
                        transform: `translateY(${(1 - a) * -6 * u}px)`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.icon === "fav" ? (
                        <Favicon size={20 * u} accent={accent} />
                      ) : (
                        <span style={{ width: 20 * u, display: "flex" }}>
                          <Glyph
                            d={s.icon === "search" ? ICON.search : ICON.clock}
                            size={18 * u}
                            color={pal.faint}
                          />
                        </span>
                      )}
                      <span style={{ color: pal.text }}>{s.main}</span>
                      {s.sub ? (
                        <span
                          style={{
                            color: pal.muted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                          }}
                        >
                          {s.sub}
                        </span>
                      ) : null}
                      <span
                        style={{
                          marginLeft: "auto",
                          // Held where the bar was typed into while it docks,
                          // for the same reason as the toolbar icons.
                          marginRight: docking ? bw - barW0 : undefined,
                          transform: docking
                            ? `translateX(${bw - barW0}px)`
                            : undefined,
                          display: "flex",
                        }}
                      >
                        {i === 0 ? (
                          <Keycap label={s.hint} pal={pal} size={14 * u} />
                        ) : (
                          <span
                            style={{
                              fontFamily: mono.fontFamily,
                              fontSize: 15 * u,
                              color: pal.faint,
                            }}
                          >
                            {s.hint}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: W / 2 - 70 * u,
              top: H * (portrait ? 0.66 : 0.78) - 30 * u,
              width: 140 * u,
              height: 60 * u,
              opacity: Math.min(1, keyShow * 1.4) * (1 - keyHide),
              transform: `translateY(${(1 - keyShow) * 20 * u + press * 5 * u + keyHide * 14 * u}px) scale(${(0.9 + 0.1 * keyShow) * (1 - 0.04 * press)})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14 * u,
                background: pal.keyTop,
                boxShadow: `inset 0 1px 0 ${pal.dark ? "rgba(255,255,255,0.08)" : "#ffffff"}, 0 0 0 1px ${pal.line}, 0 ${(6 - 5 * press) * u}px 0 ${pal.keyEdge}, 0 ${(18 - 10 * press) * u}px ${(34 - 16 * press) * u}px rgba(0,0,0,${pal.dark ? 0.5 : 0.16})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10 * u,
                color: pal.text,
                fontSize: 19 * u,
              }}
            >
              <Glyph
                d={ICON.enter}
                size={22 * u}
                color={press > 0.2 ? accent : pal.muted}
              />
              Enter
            </div>
          </div>
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
