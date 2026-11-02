"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const figtree = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface ListRow {
  title: string;
  meta: string;
  src?: string;
}

export interface TiltSettleListProps {
  title?: string;
  accentWord?: number;
  heroTitle?: string;
  heroMeta?: string;
  heroSrc?: string;
  lines?: string[];
  rows?: ListRow[];
  theme?: "dark" | "light";
  accent?: string;
  ink?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#eefaf5",
    sub: "rgba(238,250,245,0.56)",
    faint: "rgba(238,250,245,0.34)",
    accent: "#6ff0c0",
    ground: "polar" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    card: "linear-gradient(180deg, rgba(30,36,38,0.94) 0%, rgba(15,19,21,0.94) 100%)",
    cardLine: "rgba(255,255,255,0.07)",
    cardTop: "rgba(255,255,255,0.08)",
    track: "rgba(255,255,255,0.14)",
    divider: "rgba(255,255,255,0.1)",
    play: "#f4fbf8",
    playIcon: "#0b1512",
    shadowRgb: "0,6,6",
    shadowK: 1,
  },
  light: {
    ink: "#13151c",
    sub: "rgba(19,21,28,0.56)",
    faint: "rgba(19,21,28,0.3)",
    accent: "#3552ff",
    ground: "glasswork" as GshPresetId | undefined,
    groundParams: { seed: 3 } as Partial<GradientParams> | undefined,
    card: "linear-gradient(180deg, #ffffff 0%, #f7f8fb 100%)",
    cardLine: "rgba(19,21,40,0.07)",
    cardTop: "rgba(255,255,255,1)",
    track: "rgba(19,21,40,0.1)",
    divider: "rgba(19,21,40,0.08)",
    play: "#13151c",
    playIcon: "#ffffff",
    shadowRgb: "30,36,80",
    shadowK: 0.45,
  },
};

const DEFAULT_LINES = [
  "Open on the product",
  "Type the headline",
  "Zoom blur to the demo",
  "Show the editor",
  "Cut to pricing",
  "Fan the formats",
  "Land the logo",
  "Fade to the URL",
];
const DEFAULT_ROWS: ListRow[] = [
  {
    title: "Text Reveal",
    meta: "1.2k renders",
    src: "templates/brand-guidelines/ceramics.jpg",
  },
  {
    title: "Logo Orbit",
    meta: "980 renders",
    src: "templates/launch-anything/earth.jpg",
  },
  { title: "Card Fan", meta: "740 renders", src: "reel/reel-2.jpg" },
];

const BEATS = [
  { id: "title", at: -6 },
  { id: "card", at: -2 },
  { id: "lines", at: 10 },
  { id: "rows", at: 30 },
  { id: "step", at: 24 },
  { id: "end", at: 126 },
] as const;
const beat = (id: (typeof BEATS)[number]["id"]) =>
  BEATS.find((b) => b.id === id)?.at ?? 0;
const STEP = 14;
const VISIBLE = 6;
const ROW_TIMES = [0, 6, 11];

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const SPRING_SWING = { mass: 1, damping: 17, stiffness: 110 };
const SPRING_HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function Reveal({
  frame,
  at,
  children,
}: {
  frame: number;
  at: number;
  children: React.ReactNode;
}) {
  const p = interpolate(frame, [at, at + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_ENTER,
  });
  return (
    <div
      style={{
        overflow: "hidden",
        padding: "0.04em 0.04em 0.16em",
        margin: "-0.04em -0.04em -0.16em",
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - p) * 140}%)`,
          filter: `blur(${(1 - p) * 4}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function TiltSettleList({
  title = "Your top scenes",
  accentWord = 1,
  heroTitle = "Zoom Blur",
  heroMeta = "Transition · 2.4k renders",
  heroSrc,
  lines = DEFAULT_LINES,
  rows,
  theme = "dark",
  accent,
  ink,
  ground,
  groundParams,
}: TiltSettleListProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const light = theme === "light";
  const fg = ink ?? t.ink;
  const acc = accent ?? t.accent;
  const preset = ground ?? (groundParams ? undefined : t.ground);
  const gParams = groundParams ?? (ground ? undefined : t.groundParams);
  const portrait = H > W;
  const S = Math.min(W, H);
  const k = t.shadowK;
  const cover = heroSrc ?? staticFile("templates/launch-anything/horizon.jpg");
  const list = (
    rows ?? DEFAULT_ROWS.map((r) => ({ ...r, src: staticFile(r.src ?? "") }))
  ).slice(0, 4);

  const titleSize = portrait ? W * 0.085 : W * 0.046;
  const titleY = portrait ? H * 0.09 : H * 0.115;

  const cardW = portrait ? W * 0.88 : W * 0.55;
  const cardH = portrait ? H * 0.42 : H * 0.66;
  const cardX = portrait ? W * 0.06 : W * 0.035;
  const cardY = portrait ? H * 0.16 : H * 0.235;
  const pad = S * 0.04;
  const coverS = portrait ? cardW * 0.42 : cardH * 0.56;
  const lineSize = portrait ? W * 0.036 : S * 0.04;
  const lineH = lineSize * 1.42;

  const swing = spring({
    frame: frame - beat("card"),
    fps,
    config: SPRING_SWING,
  });
  const swingPrev = spring({
    frame: frame - beat("card") - 1,
    fps,
    config: SPRING_SWING,
  });
  const fly = 1 - swing;
  const mb = Math.min(10, Math.abs(swing - swingPrev) * H * 0.5 * 0.1);
  const settleRY = portrait ? 0 : 12;
  const settleRX = portrait ? 6 : 3;
  const rz = -16 * fly;
  const rx = settleRX + 40 * fly;
  const ry = settleRY - 18 * fly;
  const ty = H * 0.5 * fly;
  const tx = -W * 0.06 * fly;
  const sc = 1 + 0.12 * fly;

  const push = interpolate(frame, [0, beat("end")], [1, 1.04], {
    ...CLAMP,
    easing: EASE_CAMERA,
  });
  const steps = Math.max(
    0,
    Math.min(lines.length - 1, Math.floor((frame - beat("step")) / STEP) + 1),
  );
  const scrollP = spring({
    frame: frame - (beat("step") + (steps - 1) * STEP),
    fps,
    config: SPRING_HEAVY,
  });
  const maxScroll = Math.max(0, lines.length - VISIBLE);
  const scrollTo = Math.min(maxScroll, Math.max(0, steps - 1));
  const scrollFrom = Math.min(maxScroll, Math.max(0, steps - 2));
  const scrollIdx = scrollFrom + (scrollTo - scrollFrom) * scrollP;
  const progress = interpolate(frame, [0, beat("end")], [0.08, 0.72], {
    ...CLAMP,
    easing: EASE_MOVE,
  });

  const listX = portrait ? W * 0.08 : W * 0.635;
  const listW = portrait ? W * 0.84 : W * 0.32;
  const listY = portrait ? H * 0.63 : H * 0.33;
  const rowH = portrait ? H * 0.085 : H * 0.15;
  const thumb = portrait ? W * 0.13 : S * 0.085;
  const rowTitle = portrait ? W * 0.045 : S * 0.033;
  const rowMeta = portrait ? W * 0.032 : S * 0.024;
  const rankW = portrait ? W * 0.07 : S * 0.05;
  const playS = portrait ? W * 0.085 : S * 0.056;

  const titleWords = title.split(" ");
  const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={light ? 2 : 4}
        timeScale={0.7}
      />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="tsl-mb" x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation={`${mb * 0.3} ${mb}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: titleY - titleSize * 0.55,
            display: "flex",
            justifyContent: "center",
            columnGap: "0.24em",
            fontFamily: figtree.fontFamily,
            fontWeight: 300,
            fontSize: titleSize,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: fg,
          }}
        >
          {titleWords.map((word, i) => {
            const s = beat("title") + i * 3;
            const p = interpolate(frame, [s, s + 12], [0, 1], {
              ...CLAMP,
              easing: EASE_ENTER,
            });
            return (
              <span
                key={`${word}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  padding: "0.04em 0.04em 0.16em",
                  margin: "-0.04em -0.04em -0.16em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 140}%)`,
                    filter: `blur(${(1 - p) * 6}px)`,
                    color: i === accentWord ? acc : undefined,
                    fontWeight: i === accentWord ? 400 : 300,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
        <AbsoluteFill style={{ perspective: portrait ? 2000 : 1300 }}>
          <div
            style={{
              position: "absolute",
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              borderRadius: S * 0.034,
              backgroundImage: t.card,
              boxShadow: `inset 0 1px 0 ${t.cardTop}, inset 0 0 0 1px ${t.cardLine}, 0 2px 6px rgba(${t.shadowRgb},${0.3 * k}), 0 ${S * 0.04}px ${S * 0.1}px rgba(${t.shadowRgb},${0.4 * k}), 0 ${S * 0.1}px ${S * 0.24}px rgba(${t.shadowRgb},${0.4 * k})`,
              transformOrigin: "30% 100%",
              transform: `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
              filter: mb > 0.4 ? "url(#tsl-mb)" : undefined,
              overflow: "hidden",
              fontFamily: figtree.fontFamily,
              color: fg,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: pad,
                top: pad,
                width: coverS,
                height: coverS,
                borderRadius: S * 0.016,
                overflow: "hidden",
                boxShadow: `0 ${S * 0.012}px ${S * 0.03}px rgba(${t.shadowRgb},${0.4 * k})`,
              }}
            >
              <Img
                src={cover}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: pad,
                top: pad + coverS + pad * 0.6,
                width: coverS,
              }}
            >
              <Reveal frame={frame} at={beat("lines") - 2}>
                <div
                  style={{
                    fontSize: lineSize * 1.12,
                    fontWeight: 400,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                  }}
                >
                  {heroTitle}
                </div>
              </Reveal>
              <Reveal frame={frame} at={beat("lines")}>
                <div
                  style={{
                    fontSize: lineSize * 0.74,
                    fontWeight: 300,
                    color: t.sub,
                    marginTop: lineSize * 0.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {heroMeta}
                </div>
              </Reveal>
            </div>
            <div
              style={{
                position: "absolute",
                left: pad * 2 + coverS,
                right: pad,
                top: pad,
                height: lineH * VISIBLE,
                overflow: "hidden",
                maskImage:
                  "linear-gradient(180deg, transparent 0%, #000 16%, #000 100%)",
              }}
            >
              <div
                style={{
                  transform: `translateY(${-scrollIdx * lineH}px)`,
                }}
              >
                {lines.map((line, i) => {
                  const on = interpolate(
                    frame,
                    [
                      beat("step") + (i - 1) * STEP,
                      beat("step") + (i - 1) * STEP + 6,
                      beat("step") + i * STEP,
                      beat("step") + i * STEP + 6,
                    ],
                    [0, 1, 1, i === lines.length - 1 ? 1 : 0],
                    { ...CLAMP, easing: EASE_MOVE },
                  );
                  return (
                    <div
                      key={line}
                      style={{
                        height: lineH,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Reveal frame={frame} at={beat("lines") + i * 2}>
                        <div
                          style={{
                            fontSize: lineSize,
                            fontWeight: 300,
                            letterSpacing: "-0.02em",
                            whiteSpace: "nowrap",
                            color: fg,
                            opacity: 0.34 + 0.66 * on,
                          }}
                        >
                          {line}
                        </div>
                      </Reveal>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: pad * 2 + coverS,
                right: pad,
                bottom: pad,
                fontFamily: mono.fontFamily,
                fontSize: Math.max(S * 0.022, lineSize * 0.6),
                color: t.sub,
              }}
            >
              <div
                style={{
                  height: Math.max(3, S * 0.005),
                  borderRadius: 99,
                  backgroundColor: t.track,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${progress * 100}%`,
                    borderRadius: 99,
                    backgroundColor: fg,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${progress * 100}%`,
                    top: "50%",
                    width: S * 0.016,
                    height: S * 0.016,
                    marginLeft: -S * 0.008,
                    marginTop: -S * 0.008,
                    borderRadius: 99,
                    backgroundColor: fg,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: S * 0.014,
                }}
              >
                <span>{fmt(progress * 6)}</span>
                <span>-{fmt(6 - progress * 6)}</span>
              </div>
            </div>
          </div>
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: listX,
            top: listY,
            width: listW,
            fontFamily: figtree.fontFamily,
            color: fg,
          }}
        >
          {list.map((row, i) => {
            const at = beat("rows") + (ROW_TIMES[i] ?? i * 5);
            const slide = spring({
              frame: frame - at,
              fps,
              config: SPRING_CARD,
            });
            const thumbP = spring({
              frame: frame - at - 2,
              fps,
              config: SPRING_CHIP,
            });
            const playP = spring({
              frame: frame - at - 6,
              fps,
              config: SPRING_CHIP,
            });
            const divider = interpolate(frame, [at + 4, at + 18], [0, 1], {
              ...CLAMP,
              easing: EASE_MOVE,
            });
            return (
              <div
                key={row.title}
                style={{
                  position: "relative",
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  gap: S * 0.022,
                  transform: `translateX(${(1 - slide) * S * 0.16}px)`,
                  opacity: Math.min(1, slide * 2.5),
                }}
              >
                <div
                  style={{
                    width: rankW,
                    flexShrink: 0,
                    fontFamily: mono.fontFamily,
                    fontSize: rowTitle,
                    color: t.sub,
                    textAlign: "right",
                  }}
                >
                  {i + 2}
                </div>
                <div
                  style={{
                    width: thumb,
                    height: thumb,
                    flexShrink: 0,
                    borderRadius: thumb * 0.16,
                    overflow: "hidden",
                    transform: `scale(${thumbP})`,
                    boxShadow: `0 ${thumb * 0.08}px ${thumb * 0.2}px rgba(${t.shadowRgb},${0.4 * k}), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                  }}
                >
                  <Img
                    src={row.src ?? cover}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Reveal frame={frame} at={at + 3}>
                    <div
                      style={{
                        fontSize: rowTitle,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.title}
                    </div>
                  </Reveal>
                  <Reveal frame={frame} at={at + 5}>
                    <div
                      style={{
                        fontSize: rowMeta,
                        fontWeight: 300,
                        color: t.sub,
                        marginTop: rowMeta * 0.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.meta}
                    </div>
                  </Reveal>
                </div>
                <div
                  style={{
                    width: playS,
                    height: playS,
                    flexShrink: 0,
                    borderRadius: 99,
                    backgroundColor: t.play,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${playP})`,
                    boxShadow: `0 ${playS * 0.1}px ${playS * 0.3}px rgba(${t.shadowRgb},${0.35 * k})`,
                  }}
                >
                  <svg
                    width={playS * 0.4}
                    height={playS * 0.4}
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M8 5.5v13l10.5-6.5z" fill={t.playIcon} />
                  </svg>
                </div>
                {i < list.length - 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: rankW + S * 0.022,
                      right: 0,
                      bottom: 0,
                      height: 1,
                      backgroundColor: t.divider,
                      transformOrigin: "0 50%",
                      transform: `scaleX(${divider})`,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default TiltSettleList;
