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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

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
  theme?: "dark" | "light";
  accent?: string;
  panel?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
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

const BEATS = [
  { name: "open", at: 0 },
  { name: "dolly", at: 18 },
  { name: "split1", at: 30 },
  { name: "split2", at: 54 },
  { name: "reflow", at: 72 },
  { name: "payoff", at: 96 },
  { name: "end", at: 144 },
] as const;
type BeatName = (typeof BEATS)[number]["name"];
const beat = (n: BeatName) => BEATS.find((b) => b.name === n)?.at ?? 0;

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
  ink,
}: {
  left: ReactNode;
  right: ReactNode;
  size: number;
  pad: number;
  w?: number;
  ink: string;
}) {
  const fit =
    w === undefined ? 1 : Math.max(0, Math.min(1, (w - size * 9) / (size * 5)));
  return (
    <div
      style={{
        position: "absolute",
        left: pad,
        right: pad,
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
      <span style={{ opacity: fit }}>{right}</span>
    </div>
  );
}

export function PanelSplit({
  images,
  name = "Mara Okafor",
  role = "Motion designer",
  headline = ["Driven by motion,", "obsessed with", "the seamless."],
  question = "What if every launch felt this good?",
  body = "A studio practice built on timing, rhythm and the frames in between.",
  caption = "Horizon, brand film",
  labels = ["Portfolio", "Case 01", "Notes", "Reel"],
  theme = "dark",
  accent = "#3B5BFD",
  panel,
  ground,
  groundParams,
}: PanelSplitProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
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

  const s1 = sp(beat("split1"), HEAVY);
  const s2 = sp(beat("split2"), HEAVY);
  const s2b = sp(beat("split2") + 3, HEAVY);
  const s3 = sp(beat("reflow"), HEAVY);
  const F = portrait
    ? { c1: 0.58, c3: 0.52, l2: 0.66, l3: 0.58, r2: 0.5, r3: 0.42 }
    : { c1: 0.6, c3: 0.44, l2: 0.64, l3: 0.56, r2: 0.5, r3: 0.62 };
  const c = 1 - (1 - F.c1) * s1 - (F.c1 - F.c3) * s3;
  const rL = 1 - (1 - F.l2) * s2 - (F.l2 - F.l3) * s3;
  const rR = 1 - (1 - F.r2) * s2b - (F.r2 - F.r3) * s3;
  const gc = G * Math.min(1, s1 * 1.6);
  const gl = G * Math.min(1, s2 * 1.6);
  const gr = G * Math.min(1, s2b * 1.6);

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
  const P1 = toRect(0, 0, c, rL, 0, gc / 2, 0, gl / 2);
  const P2 = toRect(c, 0, 1, rR, gc / 2, 0, 0, gr / 2);
  const P3 = toRect(0, rL, c, 1, 0, gc / 2, gl / 2, 0);
  const P4 = toRect(c, rR, 1, 1, gc / 2, 0, gr / 2, 0);

  const openIn = sp(-10, HEAVY);
  const cam =
    (0.84 + 0.16 * sp(beat("dolly"), HEAVY)) *
    interpolate(frame, [0, beat("end")], [1, 1.025]);
  const payPunch = interpolate(
    frame,
    [beat("payoff"), beat("payoff") + 3, beat("payoff") + 12],
    [0, 1, 0],
    { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
  );

  const label = 16 * u;
  const pad = 24 * u;
  const preset = ground ?? (groundParams ? undefined : t.preset);
  const gParams = groundParams ?? (ground ? undefined : t.groundParams);

  const panelStyle = (r: Rect, extra?: React.CSSProperties) =>
    ({
      position: "absolute",
      left: r.x,
      top: r.y,
      width: Math.max(0, r.w),
      height: Math.max(0, r.h),
      borderRadius: radius,
      overflow: "hidden",
      backgroundColor: panelBg,
      boxShadow: `${t.edge}, 0 ${2 * u}px ${6 * u}px ${shadow(0.5)}, 0 ${30 * u}px ${70 * u}px ${shadow(0.55)}`,
      ...extra,
    }) as React.CSSProperties;

  const k1 = 0.62 + 0.38 * Math.min(P1.w / R.w, P1.h / R.h);
  const heroFont = (portrait ? 46 : 44) * u;
  const lineIn = (i: number) =>
    interpolate(frame, [-12 + i * 3, 1 + i * 3], [0, 1], {
      ...CLAMP,
      easing: TYPE_IN,
    });
  const tile = Math.min((P1.h / k1) * 0.4, 200 * u);
  const tileIn = sp(-4, CARD);

  const p2In = sp(beat("split1") + 6, CARD);
  const p3In = sp(beat("split2") + 8, CARD);
  const p4In = (i: number) => sp(beat("split2") + 10 + i * 3, CARD);

  const floodR = interpolate(
    frame,
    [beat("payoff"), beat("payoff") + 14],
    [0, 1],
    { ...CLAMP, easing: BURST },
  );
  const playX = pad;
  const playY = P4.h - pad - 40 * u;
  const floodMax = Math.hypot(P4.w, P4.h) * 1.05;
  const pillPop = sp(beat("payoff") - 2, CHIP);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={t.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${cam}) translateY(${(1 - openIn) * H * 0.06}px)`,
          opacity: Math.min(1, openIn * 1.6),
        }}
      >
        <div style={panelStyle(P1)}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: P1.w / k1,
              height: P1.h / k1,
              transform: `scale(${k1})`,
              transformOrigin: "0 0",
              fontFamily: sans.fontFamily,
              fontWeight: 400,
              color: `rgb(${t.ink})`,
            }}
          >
            <Header
              ink={t.ink}
              size={label}
              pad={pad}
              left={<span>{labels[0]}</span>}
              right={<span>Lisbon</span>}
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
                bottom: pad * 1.1,
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
                      color: `rgba(${t.ink},${[1, 0.62, 0.42][i] ?? 0.42})`,
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
                right: pad + (P1.w / k1) * 0.16 * (1 - s1),
                top: pad * 0.8 + label * 2.4,
                width: tile,
                height: tile,
                borderRadius: tile * 0.22,
                overflow: "hidden",
                transform: `scale(${0.7 + 0.3 * tileIn}) rotate(${(1 - tileIn) * -6}deg)`,
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
          <div style={panelStyle(P2)}>
            <Header
              ink={t.ink}
              size={label}
              pad={pad}
              w={P2.w}
              left={<span>{labels[1]}</span>}
              right={
                <span style={{ display: "flex" }}>
                  <ArrowIcon size={label * 1.3} color={`rgba(${t.ink},0.7)`} />
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
                bottom: pad * 0.9,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: sans.fontFamily,
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
          <div style={panelStyle(P3)}>
            <Header
              ink={t.ink}
              size={label}
              pad={pad}
              w={P3.w}
              left={<span>{labels[2]}</span>}
              right={<span>02</span>}
            />
            <div
              style={{
                position: "absolute",
                left: pad,
                right: pad,
                bottom: pad * 1.1,
                transform: `translateY(${(1 - p3In) * P3.h * 0.5}px)`,
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
                  color: `rgb(${t.ink})`,
                  maxWidth: "12em",
                  textWrap: "balance",
                }}
              >
                {question}
              </div>
              <div
                style={{
                  marginTop: label * 0.9,
                  fontFamily: sans.fontFamily,
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
            style={panelStyle(P4, {
              transform: `scale(${1 + payPunch * 0.025})`,
            })}
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
              const fan = sp(beat("payoff") + 2 + i * 2, CARD);
              const cw = Math.min(P4.w * 0.36, P4.h * 0.6);
              const ch = cw * 1.28;
              const off = [-1, 1, 0][i] as number;
              const x =
                P4.w * 0.56 +
                off * cw * (0.42 + 0.2 * fan) +
                (1 - e) * P4.w * 0.6;
              const y = P4.h * 0.5 + (i === 2 ? -ch * 0.04 : ch * 0.04);
              const rot = off * (5 + 4 * fan) + (1 - e) * 14;
              return (
                <div
                  key={`c-${ii}`}
                  style={{
                    position: "absolute",
                    left: x - cw / 2,
                    top: y - ch / 2,
                    width: cw,
                    height: ch,
                    borderRadius: cw * 0.07,
                    overflow: "hidden",
                    transform: `rotate(${rot}deg) scale(${i === 2 ? 1.06 + 0.04 * fan : 1})`,
                    opacity: Math.min(1, e * 1.5),
                    zIndex: i === 2 ? 2 : 1,
                    boxShadow: `0 ${4 * u}px ${10 * u}px rgba(0,0,20,0.28), 0 ${22 * u}px ${44 * u}px rgba(0,0,20,0.3)`,
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
                top: playY,
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
                fontFamily: sans.fontFamily,
                fontSize: label * 1.04,
                color: floodR > 0.05 ? "#0c0c10" : `rgba(${t.ink},0.9)`,
                transform: `scale(${0.9 + 0.1 * pillPop})`,
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
              Play reel
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default PanelSplit;
