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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
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
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_SLIDES: WhatsNewSlide[] = [
  {
    eyebrow: "New in 2.0",
    title: "Launch videos, built from components",
    body: "Drop product UI, charts and captions into a scene. Every piece is a React component you own.",
  },
  {
    eyebrow: "Timeline",
    title: "Retime every beat in one place",
    body: "Trim, reorder and stretch scenes. Springs stay in sync at any length.",
  },
  {
    eyebrow: "Cloud render",
    title: "Render in 4K, share in one click",
    body: "Export from the browser and send a review link before your coffee gets cold.",
    cta: "Try it now",
  },
];
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

const FIRST = 10;
const DWELL = 66;
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
    const head = interpolate(t, [6, 60], [0.08, 0.86], {
      ...CL,
      easing: EASE.move,
    });
    const scale = (pw - 32) / 15;
    const rows: [string, number, number, boolean][][] = [
      [
        ["Intro", 0, 2.6, false],
        ["Product UI", 2.8, 4.6 + 1.2 * stretch, true],
        ["Pricing", 7.6 + 1.2 * stretch, 3.4, false],
      ],
      [["Voiceover", 0.6, 9.4 + 1.2 * stretch, false]],
      [["Music", 0, 14.6, false]],
    ];
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
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 16 + x * scale,
                  top: 46 + r * 46,
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
            left: 16 + head * (pw - 32),
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

export function WhatsNewModal({
  slides = DEFAULT_SLIDES,
  brand = "remocn",
  userName = "Maya Chen",
  children,
  src,
  images = DEFAULT_IMAGES,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: WhatsNewModalProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 600 : 1280;
  const SH = tall ? (600 * height) / width : 720;
  const k = width / SW;
  const dark = theme === "dark";
  const pal = palette(dark);
  const sp = (at: number, config: Record<string, number>) =>
    spring({ frame: frame - at, fps, config });

  const n = Math.max(1, slides.length);
  const swipeAt = Array.from({ length: n }, (_, i) => FIRST + i * DWELL);
  const endAt = swipeAt[n - 1] + DWELL - 10;
  const PRESS = endAt + 20;
  const pos = swipeAt.slice(1).reduce((acc, t) => acc + sp(t, SPR.heavy), 0);
  const active = Math.min(n - 1, swipeAt.filter((t) => frame >= t).length - 1);

  const MW = tall ? SW - 88 : 540;
  const MH = 584;
  const mx = (SW - MW) / 2;
  const my = (SH - MH) / 2;
  const WIN = tall
    ? { x: 20, y: 56, w: SW - 40, h: SH }
    : { x: 120, y: 56, w: SW - 240, h: 608 };

  const winIn = sp(0, SPR.heavy);
  const winOp = tween(frame, 0, 10, EASE.enter);
  const dim = tween(frame, 4, 14, EASE.soft);
  const modalIn = sp(6, SPR.card);
  const modalOp = tween(frame, 6, 8, EASE.enter);
  const fan = sp(12, SPR.card);
  const kick = swipeAt
    .slice(1)
    .reduce((acc, t) => acc + Math.sin(clamp01((frame - t) / 16) * Math.PI), 0);
  const cam = 1 + 0.03 * tween(frame, 6, PRESS, EASE.camera);

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
  const press = clamp01(sp(PRESS - 2, SPR.chip) - sp(PRESS + 3, SPR.chip));
  const pressed = frame >= PRESS;
  const hoverCta = tween(frame, PRESS - 8, 6, EASE.enter);
  const cursorOp = tween(frame, endAt, 6, EASE.enter);
  const cta = slides[active]?.cta ?? "Next";

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (dark ? "projector" : "glasswork")}
        params={groundParams}
        timeOffset={3}
        timeScale={0.5}
      />
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
            transform: `scale(${cam})`,
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
              transform: `translateY(${(1 - winIn) * 36}px) scale(${1 - 0.015 * dim})`,
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
              transform: `translateY(${(1 - modalIn) * 20}px) scale(${0.96 + 0.04 * modalIn})`,
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
                const t = frame - (i === 0 ? FIRST : swipeAt[i] - 2);
                return (
                  <div
                    key={s.title}
                    style={{
                      position: "absolute",
                      left: x,
                      top: 0,
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
              const inAt = i === 0 ? FIRST + 2 : swipeAt[i] + 4;
              const tin = tween(frame, inAt, 14, EASE.enter);
              const tout =
                i < n - 1 ? tween(frame, swipeAt[i + 1], 6, EASE.exit) : 0;
              if (tout >= 1 || tin <= 0) return null;
              const line = (d: number) => {
                const p = tween(frame, inAt + d, 14, EASE.enter);
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
                      color: pal.text,
                      textWrap: "balance",
                      marginTop: 10,
                      ...line(2),
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
                      ...line(4),
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
                        [swipeAt[i], swipeAt[i] + DWELL - 4],
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
                        background: pal.text,
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
                Skip
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
              left: cur.x - 2,
              top: cur.y - 2,
              opacity: cursorOp,
              transformOrigin: "2px 2px",
              transform: `scale(${1 - 0.04 * press})`,
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
    </AbsoluteFill>
  );
}
