"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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
  DEFAULT_SLIDES,
  type WhatsNewModalElementId,
  whatsNewModalTimeline,
} from "./timeline";

const { fontFamily: figtree } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface WhatsNewSlide {
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  /** Custom header art. Falls back to `src`, then to a built-in illustration. */
  illustration?: React.ReactNode;
  src?: string;
}

export interface WhatsNewModalProps {
  slides?: WhatsNewSlide[];
  brand?: string;
  userName?: string;
  /** Your own app behind the modal. Falls back to `src`, then to a dashboard mock. */
  children?: React.ReactNode;
  src?: string;
  /** Pictures used by the built-in art and the dashboard mock. */
  images?: string[];
  /** Label of the button for the next slide (a slide's own `cta` wins). */
  nextLabel?: string;
  /** Label of the quiet button left of the CTA. */
  skipLabel?: string;
  /** Frames each slide stays up before the next swipe. */
  dwell?: number;
  theme?: "light" | "dark";
  accent?: string;
  /** Text color of the slide titles; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Size of the app and modal, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the app, the modal, each slide, the camera and
   * the cursor's press, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<WhatsNewModalElementId>;
}

const DEFAULT_IMAGES = [1, 4, 5, 6].map((i) =>
  staticFile(`reel/reel-${i}.jpg`),
);

const SPR = {
  heavy: { mass: 1, damping: 26, stiffness: 120 },
  card: { mass: 0.8, damping: 18, stiffness: 160 },
  chip: { mass: 0.5, damping: 12, stiffness: 200 },
  morph: { damping: 200 },
};
const EASE = {
  enter: Easing.bezier(0.32, 0.72, 0, 1),
  soft: Easing.bezier(0.22, 1, 0.36, 1),
  move: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  camera: Easing.bezier(0.87, 0, 0.13, 1),
};
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const tween = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number,
) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing });

const ART_H = 272;

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Pal {
  dark: boolean;
  win: string;
  modal: string;
  art: string;
  surface: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  tint: string;
  winShadow: string;
  modalShadow: string;
  raised: string;
}
function palette(dark: boolean): Pal {
  return dark
    ? {
        dark,
        win: "#0F1012",
        modal: "#17181B",
        art: "#1D1E22",
        surface: "#26272C",
        line: "rgba(255,255,255,0.07)",
        text: "#EDEDEF",
        muted: "#8E9097",
        faint: "#55575E",
        tint: "rgba(255,255,255,0.05)",
        winShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 40px 90px -30px rgba(0,0,0,0.7)",
        modalShadow:
          "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 36px 80px -20px rgba(0,0,0,0.75)",
        raised:
          "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px -10px rgba(0,0,0,0.6)",
      }
    : {
        dark,
        win: "#FCFCFB",
        modal: "#FFFFFF",
        art: "#F4F4F2",
        surface: "#FFFFFF",
        line: "rgba(24,24,27,0.08)",
        text: "#18181B",
        muted: "#71717A",
        faint: "#A1A1AA",
        tint: "rgba(24,24,27,0.045)",
        winShadow:
          "0 0 0 1px rgba(24,24,27,0.06), 0 40px 90px -30px rgba(24,24,40,0.35)",
        modalShadow:
          "0 0 0 1px rgba(24,24,27,0.06), 0 2px 4px rgba(24,24,27,0.04), 0 36px 80px -20px rgba(24,24,40,0.35)",
        raised:
          "0 0 0 1px rgba(24,24,27,0.06), 0 1px 2px rgba(24,24,27,0.04), 0 12px 28px -10px rgba(24,24,40,0.22)",
      };
}

function Icon({
  d,
  size = 18,
  color,
}: {
  d: string;
  size?: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

const ICON = {
  caption: "M4 6.5h16v11H4zM7.5 14h4M13.5 14h3M7.5 11h9",
  chart: "M5 19V11M10 19V6M15 19v-5M20 19V9",
  window: "M4 5.5h16v13H4zM4 9.5h16",
  film: "M4 5.5h16v13H4zM8 5.5v13M16 5.5v13M4 12h4M16 12h4",
  link: "M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1",
  check: "M5.5 12.5l4 4 9-9.5",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  arrow: "M5 12h13M13 7l5 5-5 5",
};

function Art({
  variant,
  t,
  frame,
  w,
  accent,
  pal,
  images,
}: {
  variant: number;
  t: number;
  frame: number;
  w: number;
  accent: string;
  pal: Pal;
  images: string[];
}) {
  const pop = (d: number, config = SPR.card) =>
    spring({ frame: t - d, fps: 30, config });
  const cx = w / 2;
  if (variant === 0) {
    const chips: [keyof typeof ICON, string][] = [
      ["window", "Product UI"],
      ["chart", "Bar chart"],
      ["caption", "Captions"],
    ];
    const pw = 292;
    const ph = 164;
    const left = cx - (pw + 24 + 168) / 2;
    const p = pop(0);
    const play = ((frame * 0.8) % 120) / 120;
    return (
      <>
        <div
          style={{
            position: "absolute",
            left,
            top: (ART_H - ph) / 2,
            width: pw,
            height: ph,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: pal.raised,
            opacity: clamp01(p * 2),
            transform: `translateY(${(1 - p) * 16}px) scale(${0.96 + 0.04 * p})`,
          }}
        >
          <Img
            src={images[0]}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 18,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Launch day
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 9,
              height: 2,
              borderRadius: 1,
              background: "rgba(255,255,255,0.3)",
            }}
          >
            <div
              style={{
                width: `${play * 100}%`,
                height: 2,
                background: "#FFFFFF",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          />
        </div>
        {chips.map(([icon, label], i) => {
          const c = pop(8 + i * 4, SPR.chip);
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: left + pw + 24,
                top: ART_H / 2 - 74 + i * 52,
                width: 168,
                height: 42,
                borderRadius: 21,
                background: pal.surface,
                boxShadow: pal.raised,
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 14px",
                boxSizing: "border-box",
                fontSize: 16,
                color: pal.text,
                opacity: clamp01(c * 2),
                transform: `translateX(${(1 - c) * 24}px) scale(${0.9 + 0.1 * c})`,
              }}
            >
              <Icon
                d={ICON[icon]}
                size={18}
                color={i === 0 ? accent : pal.muted}
              />
              {label}
            </div>
          );
        })}
      </>
    );
  }
  if (variant === 1) {
    const pw = Math.min(w - 56, 470);
    const left = cx - pw / 2;
    const p = pop(0);
    const stretch = spring({ frame: t - 22, fps: 30, config: SPR.morph });
    const HEAD_END = 0.86;
    const head = interpolate(t, [6, 60], [0.08, HEAD_END], {
      ...CL,
      easing: EASE.move,
    });
    const scale = (pw - 32) / 15;
    const rowsAt = (s: number): [string, number, number, boolean][][] => [
      [
        ["Intro", 0, 2.6, false],
        ["Product UI", 2.8, 4.6 + 1.2 * s, true],
        ["Pricing", 7.6 + 1.2 * s, 3.4, false],
      ],
      [["Voiceover", 0.6, 9.4 + 1.2 * s, false]],
      [["Music", 0, 14.6, false]],
    ];
    const rows = rowsAt(stretch);
    // Clips pushed along by the stretch are laid out where it leaves them and
    // ride there by transform: layout would round their edges to whole pixels.
    const settled = rowsAt(1);
    return (
      <div
        style={{
          position: "absolute",
          left,
          top: 36,
          width: pw,
          height: ART_H - 72,
          borderRadius: 14,
          background: pal.surface,
          boxShadow: pal.raised,
          opacity: clamp01(p * 2),
          transform: `translateY(${(1 - p) * 16}px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 12,
            right: 16,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: mono.fontFamily,
            fontSize: 15,
            color: pal.faint,
          }}
        >
          {["0:00", "0:05", "0:10", "0:15"].map((tc) => (
            <span key={tc}>{tc}</span>
          ))}
        </div>
        {rows.map((row, r) =>
          row.map(([label, x, len, hero], i) => {
            const grow = pop(4 + r * 3 + i * 2, SPR.card);
            const home = settled[r][i][1];
            const ride = settle((x - home) * scale);
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 16 + home * scale,
                  top: 46 + r * 46,
                  transform: ride ? `translateX(${ride}px)` : undefined,
                  width: Math.max(0, len * scale * clamp01(grow) - 4),
                  height: 36,
                  borderRadius: 8,
                  background: hero
                    ? accent
                    : r === 0
                      ? withAlpha(accent, pal.dark ? 0.28 : 0.14)
                      : pal.tint,
                  boxShadow: hero
                    ? "inset 0 1px 0 rgba(255,255,255,0.16)"
                    : `inset 0 0 0 1px ${pal.line}`,
                  color: hero ? "#FFFFFF" : pal.text,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {label}
              </div>
            );
          }),
        )}
        <div
          style={{
            position: "absolute",
            // Laid out where it stops and moved by transform: layout rounds
            // the playhead's edges to whole pixels, so `left` stepped it.
            left: 16 + HEAD_END * (pw - 32),
            transform: settle((head - HEAD_END) * (pw - 32))
              ? `translateX(${(head - HEAD_END) * (pw - 32)}px)`
              : undefined,
            top: 36,
            width: 1.5,
            bottom: 10,
            background: pal.text,
            opacity: 0.8,
          }}
        />
      </div>
    );
  }
  const prog = interpolate(t, [8, 46], [0, 1], { ...CL, easing: EASE.move });
  const done = spring({ frame: t - 47, fps: 30, config: SPR.chip });
  const link = pop(52);
  const pw = Math.min(w - 64, 440);
  const left = cx - pw / 2;
  const p = pop(0);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: 40,
          width: pw,
          height: 104,
          borderRadius: 14,
          background: pal.surface,
          boxShadow: pal.raised,
          opacity: clamp01(p * 2),
          transform: `translateY(${(1 - p) * 16}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: withAlpha(accent, pal.dark ? 0.2 : 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon d={ICON.film} size={20} color={accent} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 15,
            fontSize: 17,
            color: pal.text,
          }}
        >
          launch-video.mp4
        </div>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 38,
            fontFamily: mono.fontFamily,
            fontSize: 15,
            color: pal.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          3840×2160 · 0:42 · {Math.round(prog * 100)}%
        </div>
        <div
          style={{
            position: "absolute",
            right: 18,
            top: 22,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${done})`,
          }}
        >
          <Icon d={ICON.check} size={16} color="#FFFFFF" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 18,
            height: 3,
            borderRadius: 2,
            background: pal.tint,
            overflow: "hidden",
          }}
        >
          <div
            style={{ width: `${prog * 100}%`, height: 3, background: accent }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: left + 28,
          top: 164,
          width: pw - 56,
          height: 52,
          borderRadius: 26,
          background: pal.surface,
          boxShadow: pal.raised,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 6px 0 18px",
          boxSizing: "border-box",
          fontSize: 16,
          color: pal.text,
          opacity: clamp01(link * 2),
          transform: `translateY(${(1 - link) * 14}px) scale(${0.96 + 0.04 * link})`,
        }}
      >
        <Icon d={ICON.link} size={18} color={pal.muted} />
        <span style={{ flex: 1 }}>remocn.dev/v/launch</span>
        <span
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 20,
            background: pal.dark ? "#EDEDEF" : "#18181B",
            color: pal.dark ? "#141518" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            fontSize: 16,
          }}
        >
          Copy
        </span>
      </div>
    </>
  );
}

function DashboardMock({
  pal,
  brand,
  userName,
  images,
  tall,
}: {
  pal: Pal;
  brand: string;
  userName: string;
  images: string[];
  tall: boolean;
}) {
  const stats = [
    ["Renders this week", "128"],
    ["Minutes exported", "46.2"],
    ["Components used", "312"],
  ];
  const videos = ["Product tour", "Changelog 42", "Pricing teaser"];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: pal.win,
        padding: tall ? "36px 28px" : "40px 44px",
      }}
    >
      <div style={{ fontSize: 16, color: pal.muted }}>
        {brand} · Thursday, October 23
      </div>
      <div
        style={{
          fontSize: 34,
          letterSpacing: "-0.025em",
          color: pal.text,
          marginTop: 6,
        }}
      >
        Good afternoon, {userName.split(" ")[0]}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tall ? 2 : 3}, 1fr)`,
          gap: 16,
          marginTop: 30,
        }}
      >
        {stats.slice(0, tall ? 2 : 3).map(([l, v]) => (
          <div
            key={l}
            style={{
              height: 112,
              borderRadius: 14,
              padding: 18,
              boxSizing: "border-box",
              boxShadow: `inset 0 0 0 1px ${pal.line}`,
            }}
          >
            <div style={{ fontSize: 16, color: pal.muted }}>{l}</div>
            <div
              style={{
                fontSize: 36,
                letterSpacing: "-0.02em",
                color: pal.text,
                marginTop: 14,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 18, color: pal.text, marginTop: 30 }}>
        Recent videos
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tall ? 2 : 3}, 1fr)`,
          gap: 16,
          marginTop: 14,
        }}
      >
        {videos.slice(0, tall ? 2 : 3).map((v, i) => (
          <div key={v}>
            <div
              style={{
                height: tall ? 140 : 150,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Img
                src={images[(i + 1) % images.length]}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ fontSize: 17, color: pal.text, marginTop: 10 }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Whether `px(f)`, a value in pixels, moves at frame `f`. */
const stirs = (px: (f: number) => number, f: number) =>
  Math.abs(px(f + 1) - px(f)) > 1e-3 || Math.abs(px(f) - px(f - 1)) > 1e-3;
/** A leftover offset under a thousandth of a pixel is rest. */
const settle = (v: number) => (Math.abs(v) < 1e-3 ? 0 : v);

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

export function WhatsNewModal(props: WhatsNewModalProps) {
  const {
    slides = DEFAULT_SLIDES as WhatsNewSlide[],
    brand = "remocn",
    userName = "Maya Chen",
    children,
    src,
    images = DEFAULT_IMAGES,
    nextLabel = "Next",
    skipLabel = "Skip",
    theme = "light",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = figtree,
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    whatsNewModalTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const tall = height > width;
  const SW = tall ? 600 : 1280;
  const SH = tall ? (600 * height) / width : 720;
  const k = width / SW;
  const dark = theme === "dark";
  const pal = palette(dark);
  const fg = ink ?? pal.text;
  const spAt = (f: number, at: number, config: Record<string, number>) =>
    spring({ frame: f - at, fps, config });
  const sp = (at: number, config: Record<string, number>) =>
    spAt(frame, at, config);

  const n = Math.max(1, slides.length);
  const slideEls = tl.lane("Slides");
  const swipeAt = slideEls.map((e) => e.start);
  const appEl = tl.get("app");
  const dimEl = tl.get("dim");
  const modalEl = tl.get("modal");
  const camera = tl.get("camera");
  const cursorEl = tl.get("cursor");
  const pressEl = tl.get("press");
  const endAt = cursorEl.start;
  const PRESS = pressEl.start;
  const pos = swipeAt.slice(1).reduce((acc, t) => acc + sp(t, SPR.heavy), 0);
  const active = Math.min(n - 1, swipeAt.filter((t) => frame >= t).length - 1);

  const MW = tall ? SW - 88 : 540;
  const MH = 584;
  const mx = (SW - MW) / 2;
  const my = (SH - MH) / 2;
  const WIN = tall
    ? { x: 20, y: 56, w: SW - 40, h: SH }
    : { x: 120, y: 56, w: SW - 240, h: 608 };

  const winIn = sp(appEl.start, SPR.heavy);
  const winOp = tween(frame, appEl.start, appEl.length, EASE.enter);
  const dim = tween(frame, dimEl.start, dimEl.length, EASE.soft);
  const modalIn = sp(modalEl.start, SPR.card);
  const modalOp = tween(frame, modalEl.start, modalEl.length, EASE.enter);
  const fan = sp(tl.get("fan").start, SPR.card);
  const kick = slideEls
    .slice(1)
    .reduce(
      (acc, e) =>
        acc + Math.sin(clamp01((frame - e.start) / e.beat("kick")) * Math.PI),
      0,
    );
  const camAt = (f: number) =>
    1 + 0.03 * tween(f, camera.start, camera.length, EASE.camera);
  const cam = camAt(frame);
  // The camera carries the window and the modal, so its tilt covers their
  // text; each of them tilts on its own only while the camera holds still.
  const camMoving = stirs((f) => camAt(f) * 1000, frame);
  const winMoving =
    !camMoving && stirs((f) => spAt(f, appEl.start, SPR.heavy) * 36, frame);
  const modalMoving =
    !camMoving &&
    stirs((f) => spAt(f, modalEl.start, SPR.card) * (20 + 0.04 * MH), frame);
  // Layout rounds a box to whole pixels, so slides swiped by `left` click
  // sideways; they are laid out on the nearest stop and the swipe there is a
  // transform.
  const stop = Math.round(pos);
  const swipe = settle((stop - pos) * (MW - 16));

  const ctaW = slides[n - 1]?.cta ? 148 : 112;
  const ctaPt = { x: mx + MW - 28 - ctaW / 2 + 6, y: my + MH - 46 };
  const start = tall ? { x: 660, y: 1120 } : { x: 1360, y: 800 };
  const legP = sp(endAt, SPR.heavy);
  const dxx = ctaPt.x - start.x;
  const dyy = ctaPt.y - start.y;
  const len = Math.hypot(dxx, dyy) || 1;
  const bend = Math.sin(clamp01(legP) * Math.PI) * Math.min(70, len * 0.15);
  const cur = {
    x: start.x + dxx * legP + (dyy / len) * bend,
    y: start.y + dyy * legP - (dxx / len) * bend,
  };
  const press = clamp01(
    sp(PRESS + pressEl.beat("down"), SPR.chip) -
      sp(PRESS + pressEl.beat("up"), SPR.chip),
  );
  const pressed = frame >= PRESS;
  const hoverCta = tween(
    frame,
    PRESS + pressEl.beat("hover"),
    pressEl.beat("hoverIn"),
    EASE.enter,
  );
  const cursorOp = tween(frame, endAt, cursorEl.beat("fade"), EASE.enter);
  const cta = slides[active]?.cta ?? nextLabel;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {background === undefined ? (
        <GshGround
          preset={ground ?? (dark ? "projector" : "glasswork")}
          params={groundParams}
          timeOffset={3}
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
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SW,
            height: SH,
            transformOrigin: "0 0",
            transform: `scale(${k})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${cam})${glide(camMoving)}`,
              transformOrigin: `${SW / 2}px ${SH / 2}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: WIN.x,
                top: WIN.y,
                width: WIN.w,
                height: WIN.h,
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: pal.winShadow,
                opacity: winOp,
                transform: `translateY(${(1 - winIn) * 36}px) scale(${1 - 0.015 * dim})${glide(winMoving)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: `blur(${3 * dim}px)`,
                }}
              >
                {children ??
                  (src ? (
                    <Img
                      src={src}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <DashboardMock
                      pal={pal}
                      brand={brand}
                      userName={userName}
                      images={images}
                      tall={tall}
                    />
                  ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: dark ? "rgba(0,0,0,0.45)" : "rgba(24,24,27,0.18)",
                  opacity: dim,
                }}
              />
            </div>
            {[-1, 1].map((side) => {
              const off = (26 + 10 * kick) * fan;
              return (
                <div
                  key={side}
                  style={{
                    position: "absolute",
                    left: mx,
                    top: my + 26,
                    width: MW,
                    height: MH - 52,
                    borderRadius: 24,
                    background: pal.dark ? "#1E1F23" : "#F7F7F5",
                    boxShadow: pal.raised,
                    opacity: clamp01(fan * 1.5) * modalOp,
                    transform: `translateX(${side * off}px) rotate(${side * (2.6 + 1.2 * kick) * fan}deg) scale(0.94)`,
                  }}
                />
              );
            })}
            <div
              style={{
                position: "absolute",
                left: mx,
                top: my,
                width: MW,
                height: MH,
                borderRadius: 24,
                overflow: "hidden",
                background: pal.modal,
                boxShadow: pal.modalShadow,
                opacity: modalOp,
                transform: `translateY(${(1 - modalIn) * 20}px) scale(${0.96 + 0.04 * modalIn})${glide(modalMoving)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  top: 8,
                  width: MW - 16,
                  height: ART_H,
                  borderRadius: 16,
                  background: pal.art,
                  overflow: "hidden",
                }}
              >
                {slides.map((s, i) => {
                  const x = (i - pos) * (MW - 16);
                  if (Math.abs(x) > MW + 10) return null;
                  const t =
                    frame - (slideEls[i].start + slideEls[i].beat("art"));
                  return (
                    <div
                      key={s.title}
                      style={{
                        position: "absolute",
                        left: (i - stop) * (MW - 16),
                        top: 0,
                        transform: swipe ? `translateX(${swipe}px)` : undefined,
                        width: MW - 16,
                        height: ART_H,
                      }}
                    >
                      {s.illustration ??
                        (s.src ? (
                          <Img
                            src={s.src}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Art
                            variant={i % 3}
                            t={t}
                            frame={frame}
                            w={MW - 16}
                            accent={accent}
                            pal={pal}
                            images={images}
                          />
                        ))}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  top: 20,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: pal.dark
                    ? "rgba(23,24,27,0.7)"
                    : "rgba(255,255,255,0.85)",
                  boxShadow: `0 0 0 1px ${pal.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon d={ICON.close} size={16} color={pal.muted} />
              </div>
              {slides.map((s, i) => {
                const el = slideEls[i];
                const inAt = el.start + el.beat("text");
                const tin = tween(frame, inAt, el.beat("line"), EASE.enter);
                const tout =
                  i < n - 1
                    ? tween(frame, swipeAt[i + 1], el.beat("exit"), EASE.exit)
                    : 0;
                if (tout >= 1 || tin <= 0) return null;
                const line = (k: number) => {
                  const p = tween(
                    frame,
                    inAt + k * el.beat("stagger"),
                    el.beat("line"),
                    EASE.enter,
                  );
                  return {
                    opacity: p * (1 - tout),
                    transform: `translateX(${(1 - p) * 26 - tout * 22}px)`,
                  };
                };
                return (
                  <div
                    key={`t-${s.title}`}
                    style={{
                      position: "absolute",
                      left: 32,
                      top: ART_H + 36,
                      width: MW - 64,
                    }}
                  >
                    <div style={{ fontSize: 16, color: pal.muted, ...line(0) }}>
                      {s.eyebrow}
                    </div>
                    <div
                      style={{
                        fontSize: 31,
                        lineHeight: 1.12,
                        letterSpacing: "-0.025em",
                        color: fg,
                        textWrap: "balance",
                        marginTop: 10,
                        ...line(1),
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        lineHeight: 1.5,
                        color: pal.muted,
                        textWrap: "pretty",
                        marginTop: 12,
                        ...line(2),
                      }}
                    >
                      {s.body}
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  bottom: 42,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {slides.map((s, i) => {
                  const a = clamp01(1 - Math.abs(pos - i));
                  const fill =
                    i < active
                      ? 1
                      : interpolate(
                          frame,
                          [
                            swipeAt[i],
                            slideEls[i].end - slideEls[i].beat("fillGap"),
                          ],
                          [0, 1],
                          CL,
                        );
                  return (
                    <div
                      key={`d-${s.title}`}
                      style={{
                        width: 8 + 24 * a,
                        height: 8,
                        borderRadius: 4,
                        background: pal.dark
                          ? "rgba(255,255,255,0.16)"
                          : "rgba(24,24,27,0.12)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${fill * 100}%`,
                          height: "100%",
                          background: fg,
                          opacity: a,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 28,
                  bottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    height: 44,
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 16,
                    color: pal.muted,
                  }}
                >
                  {skipLabel}
                </div>
                <div
                  style={{
                    height: 44,
                    width: ctaW,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    background: pressed
                      ? `linear-gradient(rgba(0,0,0,0.14), rgba(0,0,0,0.14)), ${accent}`
                      : accent,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 16,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                    transform: `scale(${1 - 0.04 * press})`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {cta}
                  <div style={{ transform: `translateX(${2 * hoverCta}px)` }}>
                    <Icon d={ICON.arrow} size={16} color="#FFFFFF" />
                  </div>
                </div>
              </div>
            </div>
            <svg
              width={24}
              height={28}
              viewBox="0 0 20 24"
              aria-hidden
              style={{
                position: "absolute",
                // Laid out where it comes to rest; the travel there is a
                // transform, for the same reason as the slides.
                left: ctaPt.x - 2,
                top: ctaPt.y - 2,
                opacity: cursorOp,
                transformOrigin: "2px 2px",
                transform: `translate(${settle(cur.x - ctaPt.x)}px, ${settle(cur.y - ctaPt.y)}px) scale(${1 - 0.04 * press})`,
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
                overflow: "visible",
              }}
            >
              <path
                d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
                fill="#FFFFFF"
                stroke="#16171A"
                strokeWidth={1.1}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
