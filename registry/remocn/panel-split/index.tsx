"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type { ReactNode } from "react";
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
  DEFAULT_HEADLINE,
  type PanelSplitElementId,
  panelSplitTimeline,
} from "./timeline";

const sans = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface PanelSplitProps {
  images?: string[];
  name?: string;
  role?: string;
  headline?: string[];
  question?: string;
  body?: string;
  caption?: string;
  labels?: string[];
  /** City in the first panel's header. */
  location?: string;
  /** Label of the play button in the last panel. */
  ctaLabel?: string;
  theme?: "dark" | "light";
  accent?: string;
  panel?: string;
  /** Text color of the name, first headline line and question; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Instrument Sans by default. */
  fontFamily?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /** Size of the panels, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the copy, the camera, each split, the panels
   * and cards and the payoff, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PanelSplitElementId>;
}

const THEMES = {
  dark: {
    preset: "ember" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 2.5,
    panel: "#0e0e11",
    ink: "244,244,246",
    imgEdge: "rgba(255,255,255,0.1)",
    edge: "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
    shadow: "0,0,6",
    shadowAlpha: 0.6,
  },
  light: {
    preset: "paper-crease" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 2.5,
    panel: "#fbfaf7",
    ink: "22,22,26",
    imgEdge: "rgba(0,0,0,0.1)",
    edge: "0 0 0 1px rgba(20,20,30,0.07)",
    shadow: "40,40,70",
    shadowAlpha: 0.3,
  },
};

const DEFAULT_IMAGES = [
  "reel/reel-4.jpg",
  "templates/launch-anything/horizon.jpg",
  "templates/product-showcase/gallery.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "templates/product-showcase/courtyard.jpg",
];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const BURST = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Rect = { x: number; y: number; w: number; h: number };

// Layout rounds a box and a baseline to whole pixels, so anything eased by
// `left`/`top` steps along pixel by pixel. Moves are laid out at the resting
// place and carried by this translate, which is dropped once it is spent.
const shift = (dx: number, dy: number) =>
  Math.abs(dx) > 1e-3 || Math.abs(dy) > 1e-3
    ? `translate(${dx}px, ${dy}px) `
    : "";

function ArrowIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7.5 16.5 L16.5 7.5 M9.5 7.5 H16.5 V14.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8.5 6.6 L17.5 12 L8.5 17.4 Z"
        fill={color}
        strokeLinejoin="round"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Header({
  left,
  right,
  size,
  pad,
  w,
  dw = 0,
  ink,
}: {
  left: ReactNode;
  right: ReactNode;
  size: number;
  pad: number;
  w?: number;
  /** How far the panel is wider than where it settles. */
  dw?: number;
  ink: string;
}) {
  const fit =
    w === undefined ? 1 : Math.max(0, Math.min(1, (w - size * 9) / (size * 5)));
  return (
    <div
      style={{
        position: "absolute",
        left: pad,
        // Laid out at the settled width; the right label rides the panel's
        // change of width as a transform, not as a reflow.
        right: pad + dw,
        top: pad * 0.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: mono.fontFamily,
        fontSize: size,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: `rgba(${ink},0.5)`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          opacity: Math.max(
            0,
            Math.min(1, w === undefined ? 1 : (w - size * 3) / (size * 4)),
          ),
        }}
      >
        {left}
      </span>
      <span
        style={{
          opacity: fit,
          transform: Math.abs(dw) > 1e-3 ? `translateX(${dw}px)` : undefined,
        }}
      >
        {right}
      </span>
    </div>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function PanelSplit(props: PanelSplitProps) {
  const {
    images,
    name = "Mara Okafor",
    role = "Motion designer",
    headline = DEFAULT_HEADLINE,
    question = "What if every launch felt this good?",
    body = "A studio practice built on timing, rhythm and the frames in between.",
    caption = "Horizon, brand film",
    labels = ["Portfolio", "Case 01", "Notes", "Reel"],
    location = "Lisbon",
    ctaLabel = "Play reel",
    theme = "dark",
    accent = "#3B5BFD",
    panel,
    ink,
    background,
    fontFamily = sans.fontFamily,
    ground,
    groundParams,
    scale = 1,
    delay = 0,
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    panelSplitTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const split1 = tl.get("split:1");
  const split2 = tl.get("split:2");
  const pay = tl.get("payoff");
  const push = tl.get("push");
  const t = THEMES[theme];
  const portrait = H > W;
  const srcs =
    images && images.length > 0 ? images : DEFAULT_IMAGES.map(staticFile);
  const img = (i: number) => srcs[i % srcs.length] as string;
  const panelBg = panel ?? t.panel;
  const shadow = (a: number) => `rgba(${t.shadow},${a * t.shadowAlpha})`;
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });

  const R: Rect = portrait
    ? { x: W * 0.07, y: H * 0.08, w: W * 0.86, h: H * 0.84 }
    : { x: W * 0.11, y: H * 0.1, w: W * 0.78, h: H * 0.8 };
  const u = portrait ? (W / 1080) * 1.45 : W / 1280;
  const G = portrait ? W * 0.022 : W * 0.011;
  const radius = portrait ? W * 0.03 : W * 0.014;

  const s1 = sp(split1.start, HEAVY);
  const s2 = sp(split2.start, HEAVY);
  const s2b = sp(split2.start + split2.beat("second"), HEAVY);
  const s3 = sp(tl.get("reflow").start, HEAVY);
  const F = portrait
    ? { c1: 0.58, c3: 0.52, l2: 0.66, l3: 0.58, r2: 0.5, r3: 0.42 }
    : { c1: 0.6, c3: 0.44, l2: 0.64, l3: 0.56, r2: 0.5, r3: 0.62 };

  const UL = portrait ? R.h : R.w;
  const VL = portrait ? R.w : R.h;
  const toRect = (
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    iu0: number,
    iu1: number,
    iv0: number,
    iv1: number,
  ): Rect => {
    const a0 = u0 * UL + iu0;
    const a1 = u1 * UL - iu1;
    const b0 = v0 * VL + iv0;
    const b1 = v1 * VL - iv1;
    return portrait
      ? { x: R.x + b0, y: R.y + a0, w: b1 - b0, h: a1 - a0 }
      : { x: R.x + a0, y: R.y + b0, w: a1 - a0, h: b1 - b0 };
  };
  const panelsAt = (s1: number, s2: number, s2b: number, s3: number) => {
    const c = 1 - (1 - F.c1) * s1 - (F.c1 - F.c3) * s3;
    const rL = 1 - (1 - F.l2) * s2 - (F.l2 - F.l3) * s3;
    const rR = 1 - (1 - F.r2) * s2b - (F.r2 - F.r3) * s3;
    const gc = G * Math.min(1, s1 * 1.6);
    const gl = G * Math.min(1, s2 * 1.6);
    const gr = G * Math.min(1, s2b * 1.6);
    return [
      toRect(0, 0, c, rL, 0, gc / 2, 0, gl / 2),
      toRect(c, 0, 1, rR, gc / 2, 0, 0, gr / 2),
      toRect(0, rL, c, 1, 0, gc / 2, gl / 2, 0),
      toRect(c, rR, 1, 1, gc / 2, 0, gr / 2, 0),
    ];
  };
  const [P1, P2, P3, P4] = panelsAt(s1, s2, s2b, s3);
  // Where the split settles; the panels are laid out there.
  const rest = panelsAt(1, 1, 1, 1);

  const openIn = sp(tl.get("open").start, HEAVY);
  const cam =
    (0.84 + 0.16 * sp(tl.get("dolly").start, HEAVY)) *
    interpolate(frame, [push.start, push.end], [1, 1.025]);
  // The camera never stops pushing in, and it carries every panel, so one
  // tilt on it covers all the text that scales or rises inside them.
  const camMoving = frame < push.end;
  const payPunch = interpolate(
    frame,
    [pay.start, pay.start + pay.beat("peak"), pay.start + pay.beat("punch")],
    [0, 1, 0],
    { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
  );

  const label = 16 * u;
  const pad = 24 * u;
  const preset = ground ?? (groundParams ? undefined : t.preset);
  const gParams = groundParams ?? (ground ? undefined : t.groundParams);

  const panelStyle = (
    r: Rect,
    at: Rect,
    extra?: React.CSSProperties,
    then = "",
  ) =>
    ({
      position: "absolute",
      left: at.x,
      top: at.y,
      transform: `${shift(r.x - at.x, r.y - at.y)}${then}`.trim() || undefined,
      width: Math.max(0, r.w),
      height: Math.max(0, r.h),
      borderRadius: radius,
      overflow: "hidden",
      backgroundColor: panelBg,
      boxShadow: `${t.edge}, 0 ${2 * u}px ${6 * u}px ${shadow(0.5)}, 0 ${30 * u}px ${70 * u}px ${shadow(0.55)}`,
      ...extra,
    }) as React.CSSProperties;

  const k1Of = (r: Rect) => 0.62 + 0.38 * Math.min(r.w / R.w, r.h / R.h);
  const k1 = k1Of(P1);
  // The first panel's content box grows and shrinks with the split. Its
  // bottom- and right-anchored children are laid out against the settled box
  // and ride the difference as a transform, so layout never rounds the move.
  const innerW = P1.w / k1;
  const innerH = P1.h / k1;
  const innerWRest = rest[0].w / k1Of(rest[0]);
  const innerHRest = rest[0].h / k1Of(rest[0]);
  const dH1 = innerH - innerHRest;
  const heroFont = (portrait ? 46 : 44) * u;
  const lineIn = (i: number) => {
    const e = tl.get(i === 0 ? "name" : `line:${i - 1}`);
    return interpolate(frame, [e.start, e.end], [0, 1], {
      ...CLAMP,
      easing: TYPE_IN,
    });
  };
  const tile = Math.min((P1.h / k1) * 0.4, 200 * u);
  const tileRest = Math.min(innerHRest * 0.4, 200 * u);
  const tileLeft = innerWRest - pad - tileRest;
  const tileDx = innerW - pad - innerW * 0.16 * (1 - s1) - tile - tileLeft;
  const tileIn = sp(tl.get("tile").start, CARD);

  const p2In = sp(tl.get("panel:2").start, CARD);
  const p3In = sp(tl.get("panel:3").start, CARD);
  const p4In = (i: number) => sp(tl.get(`card:${i}`).start, CARD);

  const floodR = interpolate(frame, [pay.start, pay.end], [0, 1], {
    ...CLAMP,
    easing: BURST,
  });
  const playX = pad;
  const playY = P4.h - pad - 40 * u;
  const playYRest = rest[3].h - pad - 40 * u;
  const dH2 = P2.h - rest[1].h;
  const dH3 = P3.h - rest[2].h;
  const floodMax = Math.hypot(P4.w, P4.h) * 1.05;
  const pillPop = sp(pay.start + pay.beat("pill"), CHIP);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {background === undefined ? (
        <GshGround
          preset={preset}
          params={gParams}
          timeOffset={t.groundOffset}
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
            transform: `scale(${cam}) translateY(${(1 - openIn) * H * 0.06}px)${glide(camMoving)}`,
            opacity: Math.min(1, openIn * 1.6),
          }}
        >
          <div style={panelStyle(P1, rest[0])}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: P1.w / k1,
                height: P1.h / k1,
                transform: `scale(${k1})`,
                transformOrigin: "0 0",
                fontFamily,
                fontWeight: 400,
                color: ink ?? `rgb(${t.ink})`,
              }}
            >
              <Header
                ink={t.ink}
                size={label}
                pad={pad}
                left={<span>{labels[0]}</span>}
                right={<span>{location}</span>}
              />
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  top: pad * 0.8 + label * 2.4,
                  fontSize: label * 1.5,
                  lineHeight: 1.22,
                  letterSpacing: "-0.01em",
                  opacity: lineIn(0),
                  transform: `translateY(${(1 - lineIn(0)) * label}px)`,
                }}
              >
                <div>{name}</div>
                <div style={{ color: `rgba(${t.ink},0.5)` }}>{role}</div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  bottom: pad * 1.1 + dH1,
                  transform: shift(0, dH1).trim() || undefined,
                  fontSize: heroFont,
                  lineHeight: 1.06,
                  letterSpacing: "-0.035em",
                  whiteSpace: "nowrap",
                }}
              >
                {headline.map((line, i) => (
                  <div
                    key={`${line}-${i}`}
                    style={{
                      overflow: "hidden",
                      paddingBottom: "0.08em",
                      marginBottom: "-0.08em",
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(${(1 - lineIn(i + 1)) * 105}%)`,
                        color:
                          ink !== undefined && i === 0
                            ? ink
                            : `rgba(${t.ink},${[1, 0.62, 0.42][i] ?? 0.42})`,
                      }}
                    >
                      {line}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: tileLeft,
                  top: pad * 0.8 + label * 2.4,
                  width: tile,
                  height: tile,
                  borderRadius: tile * 0.22,
                  overflow: "hidden",
                  transform: `${shift(tileDx, 0)}scale(${0.7 + 0.3 * tileIn}) rotate(${(1 - tileIn) * -6}deg)`,
                  opacity: Math.min(1, tileIn * 1.5),
                  boxShadow: `0 ${10 * u}px ${30 * u}px ${shadow(0.6)}`,
                }}
              >
                <Img
                  src={img(0)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    boxShadow: `inset 0 0 0 1px ${t.imgEdge}`,
                  }}
                />
              </div>
            </div>
          </div>
          {P2.w > 2 && P2.h > 2 ? (
            <div style={panelStyle(P2, rest[1])}>
              <Header
                ink={t.ink}
                size={label}
                pad={pad}
                w={P2.w}
                dw={P2.w - rest[1].w}
                left={<span>{labels[1]}</span>}
                right={
                  <span style={{ display: "flex" }}>
                    <ArrowIcon
                      size={label * 1.3}
                      color={`rgba(${t.ink},0.7)`}
                    />
                  </span>
                }
              />
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  right: pad,
                  top: pad * 0.8 + label * 2.6,
                  bottom: pad + label * 2.2,
                  borderRadius: Math.max(4, radius - pad * 0.5),
                  overflow: "hidden",
                  transform: `translateY(${(1 - p2In) * P2.h * 0.4}px)`,
                  opacity: Math.min(1, p2In * 1.4),
                  outline: `1px solid ${t.imgEdge}`,
                  outlineOffset: -1,
                }}
              >
                <Img
                  src={img(1)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${1.18 - 0.12 * p2In - 0.04 * s3})`,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  right: pad,
                  bottom: pad * 0.9 + dH2,
                  transform: shift(0, dH2).trim() || undefined,
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily,
                  fontSize: label * 1.08,
                  color: `rgba(${t.ink},0.88)`,
                  whiteSpace: "nowrap",
                  opacity: interpolate(p2In, [0.4, 1], [0, 1], CLAMP),
                }}
              >
                <span>{caption}</span>
                <span
                  style={{
                    fontFamily: mono.fontFamily,
                    fontSize: label * 0.95,
                    fontVariantNumeric: "tabular-nums",
                    color: `rgba(${t.ink},0.45)`,
                    opacity: interpolate(
                      P2.w,
                      [label * 22, label * 26],
                      [0, 1],
                      CLAMP,
                    ),
                  }}
                >
                  2026
                </span>
              </div>
            </div>
          ) : null}
          {P3.w > 2 && P3.h > 2 ? (
            <div style={panelStyle(P3, rest[2])}>
              <Header
                ink={t.ink}
                size={label}
                pad={pad}
                w={P3.w}
                dw={P3.w - rest[2].w}
                left={<span>{labels[2]}</span>}
                right={<span>02</span>}
              />
              <div
                style={{
                  position: "absolute",
                  left: pad,
                  right: pad,
                  bottom: pad * 1.1 + dH3,
                  transform: `${shift(0, dH3)}translateY(${(1 - p3In) * P3.h * 0.5}px)`,
                  opacity: Math.min(1, p3In * 1.4),
                }}
              >
                <div
                  style={{
                    fontFamily: serif.fontFamily,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: (portrait ? 33 : 34) * u,
                    lineHeight: 1.04,
                    letterSpacing: "-0.01em",
                    color: ink ?? `rgb(${t.ink})`,
                    maxWidth: "12em",
                    textWrap: "balance",
                  }}
                >
                  {question}
                </div>
                <div
                  style={{
                    marginTop: label * 0.9,
                    fontFamily,
                    fontSize: label * 1.04,
                    lineHeight: 1.4,
                    color: `rgba(${t.ink},0.55)`,
                    maxWidth: "26em",
                    opacity: interpolate(
                      P3.w,
                      [label * 22, label * 27],
                      [0, 1],
                      CLAMP,
                    ),
                  }}
                >
                  {body}
                </div>
              </div>
            </div>
          ) : null}
          {P4.w > 2 && P4.h > 2 ? (
            <div
              style={panelStyle(
                P4,
                rest[3],
                undefined,
                `scale(${1 + payPunch * 0.025})`,
              )}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: accent,
                  clipPath: `circle(${floodR * floodMax}px at ${playX + 20 * u}px ${playY + 20 * u}px)`,
                }}
              />
              <Header
                ink={t.ink}
                size={label}
                pad={pad}
                w={P4.w}
                dw={P4.w - rest[3].w}
                left={
                  <span
                    style={{
                      color: floodR > 0.5 ? "rgba(255,255,255,0.8)" : undefined,
                    }}
                  >
                    {labels[3]}
                  </span>
                }
                right={
                  <span
                    style={{
                      color: floodR > 0.5 ? "rgba(255,255,255,0.8)" : undefined,
                    }}
                  >
                    0:42
                  </span>
                }
              />
              {[2, 4, 3].map((ii, i) => {
                const e = p4In(i);
                const fan = sp(pay.start + pay.beat("fan") + i * 2, CARD);
                const cw = Math.min(P4.w * 0.36, P4.h * 0.6);
                const ch = cw * 1.28;
                const off = [-1, 1, 0][i] as number;
                const lift = i === 2 ? -0.04 : 0.04;
                // Laid out where the fan settles in the settled panel; the
                // slide in, the fan out and the panel's own resize are a
                // transform, since layout rounds a box's edges to whole
                // pixels and the card would step along.
                const R4 = rest[3];
                const cwR = Math.min(R4.w * 0.36, R4.h * 0.6);
                const chR = cwR * 1.28;
                const xRest = R4.w * 0.56 + off * cwR * 0.62;
                const yRest = R4.h * 0.5 + chR * lift;
                const dx =
                  (P4.w - R4.w) * 0.56 +
                  off * (cw * (0.42 + 0.2 * fan) - cwR * 0.62) +
                  (1 - e) * P4.w * 0.6;
                const dy = (P4.h - R4.h) * 0.5 + (ch - chR) * lift;
                const kRaw = cw / cwR;
                const k = Math.abs(kRaw - 1) > 1e-6 ? kRaw : 1;
                const rot = off * (5 + 4 * fan) + (1 - e) * 14;
                return (
                  <div
                    key={`c-${ii}`}
                    style={{
                      position: "absolute",
                      left: xRest - cwR / 2,
                      top: yRest - chR / 2,
                      width: cwR,
                      height: chR,
                      borderRadius: cwR * 0.07,
                      overflow: "hidden",
                      transform: `${shift(dx, dy)}rotate(${rot}deg) scale(${(i === 2 ? 1.06 + 0.04 * fan : 1) * k})`,
                      opacity: Math.min(1, e * 1.5),
                      zIndex: i === 2 ? 2 : 1,
                      // The shadow is drawn inside the scale; undo it there.
                      boxShadow: `0 ${(4 * u) / k}px ${(10 * u) / k}px rgba(0,0,20,0.28), 0 ${(22 * u) / k}px ${(44 * u) / k}px rgba(0,0,20,0.3)`,
                    }}
                  >
                    <Img
                      src={img(ii)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: playX,
                  top: playYRest,
                  height: 40 * u,
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  padding: `0 ${16 * u}px 0 ${4 * u}px`,
                  borderRadius: 40 * u,
                  backgroundColor:
                    floodR > 0.05
                      ? "rgba(255,255,255,0.96)"
                      : `rgba(${t.ink},0.08)`,
                  boxShadow:
                    floodR > 0.05
                      ? "0 6px 18px rgba(0,0,40,0.3)"
                      : `0 0 0 1px rgba(${t.ink},0.14)`,
                  fontFamily,
                  fontSize: label * 1.04,
                  color: floodR > 0.05 ? "#0c0c10" : `rgba(${t.ink},0.9)`,
                  transform: `${shift(0, playY - playYRest)}scale(${0.9 + 0.1 * pillPop})`,
                  transformOrigin: "20% 50%",
                  opacity: Math.min(1, p4In(0) * 1.4),
                  zIndex: 3,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 32 * u,
                    height: 32 * u,
                    borderRadius: "50%",
                    backgroundColor:
                      floodR > 0.05 ? accent : `rgba(${t.ink},0.5)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlayGlyph size={16 * u} color="#ffffff" />
                </span>
                {ctaLabel}
              </div>
            </div>
          ) : null}
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default PanelSplit;
