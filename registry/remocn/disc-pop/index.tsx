"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const figtree = loadFigtree("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type DiscGlyph =
  | "play"
  | "spark"
  | "plus"
  | "arrow"
  | "note"
  | "cursor"
  | "check"
  | "wave";

export type DiscPopProps = {
  colors?: string[];
  glyphColors?: string[];
  glyphs?: DiscGlyph[];
  cell?: number;
  seed?: string;
  swap?: number;
};

export const discPopDefaults: Required<DiscPopProps> = {
  colors: ["#FF5A1F", "#B7A6FF", "#2F6BFF", "#F2EDE4"],
  glyphColors: ["#9E2A06", "#5A44C4", "#0B2D8F", "#1A1814"],
  glyphs: ["play", "spark", "note", "arrow", "plus", "cursor", "wave", "check"],
  cell: 0.46,
  seed: "disc",
  swap: 0.46,
};

const GLYPH_PATHS: Record<DiscGlyph, React.ReactNode> = {
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  spark: (
    <path
      d="M12 2.5c.8 5.6 3.3 8.1 9 9-5.7.9-8.2 3.4-9 9-.8-5.6-3.3-8.1-9-9 5.7-.9 8.2-3.4 9-9z"
      fill="currentColor"
    />
  ),
  plus: (
    <path
      d="M12 4v16M4 12h16"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
  ),
  arrow: (
    <path
      d="M7 17L17 7M9 7h8v8"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  note: (
    <path
      d="M9 17.5V5.5l10-2v12M9 17.5a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0zM19 15.5a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      fill="none"
    />
  ),
  cursor: (
    <path
      d="M5.5 3.5l13 7.2-5.8 1.6-2.6 5.6z"
      fill="currentColor"
      strokeLinejoin="round"
    />
  ),
  check: (
    <path
      d="M4.5 12.5l5 5 10-11"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  wave: (
    <path
      d="M3 12h2.5M7.5 8v8M11.5 4.5v15M15.5 8.5v7M19.5 11v2"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      fill="none"
    />
  ),
};

type Disc = {
  x: number;
  y: number;
  r: number;
  color: number;
  glyph: number;
  inAt: number;
  outRank: number;
  tilt: number;
};

function layoutDiscs(W: number, H: number, props: Required<DiscPopProps>) {
  const target = Math.min(W, H) * props.cell;
  const cols = Math.max(2, Math.round(W / target));
  const rows = Math.max(2, Math.round(H / target));
  const cw = W / cols;
  const ch = H / rows;
  const half = Math.hypot(cw, ch) / 2;
  const jx = cw * 0.14;
  const jy = ch * 0.14;
  const discs: Disc[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const ox = (random(`${props.seed}-x-${i}`) - 0.5) * 2 * jx;
      const oy = (random(`${props.seed}-y-${i}`) - 0.5) * 2 * jy;
      discs.push({
        x: (c + 0.5) * cw + ox,
        y: (r + 0.5) * ch + oy,
        r:
          (half + Math.hypot(jx, jy)) *
          (1.04 + random(`${props.seed}-r-${i}`) * 0.2),
        color: (i * 3 + r) % props.colors.length,
        glyph: i % props.glyphs.length,
        inAt: random(`${props.seed}-o-${i}`),
        outRank: 0,
        tilt: (random(`${props.seed}-t-${i}`) - 0.5) * 40,
      });
    }
  }
  const byIn = [...discs].sort((a, b) => a.inAt - b.inAt);
  byIn.forEach((d, k) => {
    d.inAt = k;
  });
  const byOut = [...discs].sort(
    (a, b) =>
      Math.hypot(a.x - W / 2, a.y - H / 2) -
      Math.hypot(b.x - W / 2, b.y - H / 2),
  );
  byOut.forEach((d, k) => {
    d.outRank = k;
  });
  return byIn;
}

const POP = { mass: 0.5, damping: 12, stiffness: 200 };
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);

function Discs({
  p,
  duration,
  props,
}: {
  p: number;
  duration: number;
  props: Required<DiscPopProps>;
}) {
  const { width: W, height: H, fps } = useVideoConfig();
  const discs = layoutDiscs(W, H, props);
  const n = discs.length;
  const frame = p * duration;
  const swapFrame = props.swap * duration;
  const inWindow = Math.max(1, swapFrame - 5);
  const outStart = props.swap + 0.02;
  const outSpan = 0.97 - outStart;
  const outLen = 0.15;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {discs.map((d) => {
        const start = (d.inAt / Math.max(1, n - 1)) * inWindow;
        const s = spring({ frame: frame - start, fps, config: POP });
        const o0 =
          outStart + (d.outRank / Math.max(1, n - 1)) * (outSpan - outLen);
        const q = interpolate(p, [o0, o0 + outLen], [0, 1], CLAMP);
        const out =
          q < 0.25
            ? 1 + Math.sin((q / 0.25) * (Math.PI / 2)) * 0.05
            : 1.05 * (1 - EXIT((q - 0.25) / 0.75));
        const scale = s * (q > 0 ? out : 1);
        if (scale <= 0.001) return null;
        const size = d.r * 2;
        const glyphSize = d.r * 0.42;
        return (
          <div
            key={`${d.x}-${d.y}`}
            style={{
              position: "absolute",
              left: d.x - d.r,
              top: d.y - d.r,
              width: size,
              height: size,
              borderRadius: "50%",
              background: props.colors[d.color],
              transform: `scale(${scale})`,
              display: "grid",
              placeItems: "center",
              boxShadow: `0 ${glyphSize * 0.12}px ${glyphSize * 0.5}px rgba(0,0,0,0.18)`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={glyphSize}
              height={glyphSize}
              style={{
                color: props.glyphColors[d.color % props.glyphColors.length],
                transform: `rotate(${(d.tilt * (1 - Math.min(1, s))).toFixed(2)}deg)`,
              }}
              aria-hidden
            >
              {GLYPH_PATHS[props.glyphs[d.glyph]]}
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

const DiscPopPresentation: React.FC<
  TransitionPresentationComponentProps<DiscPopProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const props = { ...discPopDefaults, ...passedProps };
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    const shrink = interpolate(p, [0, props.swap], [1, 0.95], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    return (
      <AbsoluteFill
        style={{
          opacity: p < props.swap ? 1 : 0,
          transform: `scale(${shrink})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const settle = interpolate(p, [props.swap, 1], [1.05, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: p >= props.swap ? 1 : 0,
          transform: `scale(${settle})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {p > 0 && p < 1 ? (
        <Discs
          p={p}
          duration={Math.max(1, presentationDurationInFrames)}
          props={props}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export function discPop(
  props: DiscPopProps = {},
): TransitionPresentation<DiscPopProps> {
  return { component: DiscPopPresentation, props };
}

type Theme = "dark" | "light";

const T = {
  dark: {
    ink: "#F1F0F5",
    muted: "rgba(241,240,245,0.58)",
    faint: "rgba(241,240,245,0.34)",
    card: "rgba(20,19,26,0.86)",
    raised: "rgba(255,255,255,0.05)",
    line: "rgba(255,255,255,0.09)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.07)",
    shadow:
      "0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.35), 0 40px 80px rgba(0,0,0,0.3)",
    accent: "#FF5A1F",
    groundA: "nightfold" as GshPresetId,
    groundB: "europa" as GshPresetId,
  },
  light: {
    ink: "#18171C",
    muted: "rgba(24,23,28,0.56)",
    faint: "rgba(24,23,28,0.36)",
    card: "rgba(255,255,255,0.94)",
    raised: "rgba(24,23,28,0.04)",
    line: "rgba(24,23,28,0.09)",
    highlight: "inset 0 1px 0 rgba(255,255,255,1)",
    shadow:
      "0 1px 2px rgba(20,20,30,0.06), 0 10px 28px rgba(20,20,30,0.08), 0 32px 64px rgba(20,20,30,0.08)",
    accent: "#FF5A1F",
    groundA: "paper-crease" as GshPresetId,
    groundB: "glasswork" as GshPresetId,
  },
};

const A_BEATS = { greet: -5, card: 1, typeFrom: 10, typeCps: 3, send: 45 };
const B_BEATS = { toolbar: 12, title: 18, bar: 18 };

function Stroke({
  d,
  size,
  color,
  fill,
}: {
  d: string;
  size: number;
  color: string;
  fill?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color : "none"}
      stroke={fill ? "none" : color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const UI_ICONS = {
  plus: "M12 5v14M5 12h14",
  chevron: "M7 10l5 5 5-5",
  mic: "M12 4a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0112 4zM6.5 11a5.5 5.5 0 0011 0M12 16.5V20",
  send: "M12 19V5M6 11l6-6 6 6",
  file: "M7 3.5h6.5L18 8v12.5H7zM13.5 3.5V8H18",
  close: "M7 7l10 10M17 7L7 17",
  play: "M8 5.5v13l10.5-6.5z",
  volume: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 010 6",
  export: "M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v5.5h14V14",
  sliders: "M5 7h9M18 7h1M5 17h3M12 17h7M16 5v4M10 15v4",
};

function PromptScene({
  theme,
  greeting,
  prompt,
  ground,
  groundParams,
}: {
  theme: Theme;
  greeting: [string, string];
  prompt: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = T[theme];
  const tall = H > W;
  const u = tall ? W / 760 : H / 640;
  const cardW = tall ? W * 0.86 : Math.min(W * 0.58, 780 * u);
  const greet = spring({
    frame: frame - A_BEATS.greet,
    fps,
    config: { mass: 0.8, damping: 18, stiffness: 160 },
  });
  const card = spring({
    frame: frame - A_BEATS.card,
    fps,
    config: { mass: 1, damping: 26, stiffness: 120 },
  });
  const chars = Math.floor(
    Math.max(0, frame - A_BEATS.typeFrom) * A_BEATS.typeCps,
  );
  const typed = prompt.slice(0, chars);
  const caretOn = chars < prompt.length || Math.floor(frame / 8) % 2 === 0;
  const press = spring({
    frame: frame - A_BEATS.send,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const pressScale =
    frame < A_BEATS.send
      ? 1
      : 1 - Math.sin(Math.min(1, press) * Math.PI) * 0.12;
  const push = interpolate(frame, [0, durationInFrames], [1, 1.04], CLAMP);
  const text: React.CSSProperties = {
    fontFamily: figtree.fontFamily,
    fontWeight: 400,
    color: c.ink,
  };
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground ?? c.groundA}
        params={groundParams}
        timeOffset={3}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 34 * u,
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            ...text,
            fontWeight: 300,
            fontSize: (tall ? 64 : 54) * u,
            letterSpacing: "-0.035em",
            lineHeight: 1.06,
            textAlign: "center",
            transform: `translateY(${(1 - greet) * 24 * u}px)`,
            opacity: Math.min(1, greet * 1.4),
            filter: `blur(${(Math.max(0, 1 - greet) * 6).toFixed(2)}px)`,
          }}
        >
          {greeting[0]}
          <br />
          {greeting[1]}
          <span style={{ color: c.accent }}>.</span>
        </div>
        <div
          style={{
            width: cardW,
            borderRadius: 18 * u,
            background: c.card,
            border: `1px solid ${c.line}`,
            boxShadow: `${c.highlight}, ${c.shadow}`,
            padding: 16 * u,
            display: "flex",
            flexDirection: "column",
            gap: 14 * u,
            transform: `translateY(${(1 - card) * 40 * u}px) scale(${0.97 + card * 0.03})`,
            opacity: Math.min(1, card * 1.5),
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `${7 * u}px ${10 * u}px`,
              borderRadius: 10 * u,
              border: `1px solid ${c.line}`,
              background: c.raised,
            }}
          >
            <div
              style={{
                width: 30 * u,
                height: 30 * u,
                borderRadius: 7 * u,
                background: "linear-gradient(140deg, #ff8a4c, #ff5a1f)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Stroke d={UI_ICONS.file} size={16 * u} color="#fff" />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 2 * u }}
            >
              <span style={{ ...text, fontSize: 14 * u }}>brand-kit.zip</span>
              <span style={{ ...text, fontSize: 12 * u, color: c.faint }}>
                Logo, colours, 6 shots
              </span>
            </div>
            <Stroke d={UI_ICONS.close} size={14 * u} color={c.faint} />
          </div>
          <div
            style={{
              ...text,
              fontSize: 19 * u,
              lineHeight: 1.45,
              minHeight: 19 * u * 1.45 * 2,
              letterSpacing: "-0.005em",
            }}
          >
            {typed}
            <span
              style={{
                display: "inline-block",
                width: 2 * u,
                height: 19 * u * 1.15,
                marginLeft: 2 * u,
                verticalAlign: "text-bottom",
                background: c.accent,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 * u }}>
            <Stroke d={UI_ICONS.plus} size={18 * u} color={c.muted} />
            <span style={{ ...text, fontSize: 14 * u, color: c.muted }}>
              Model
            </span>
            <Stroke d={UI_ICONS.chevron} size={13 * u} color={c.faint} />
            <div style={{ flex: 1 }} />
            <span style={{ ...text, fontSize: 14 * u, color: c.muted }}>
              Film
            </span>
            <Stroke d={UI_ICONS.chevron} size={13 * u} color={c.faint} />
            <Stroke d={UI_ICONS.mic} size={18 * u} color={c.muted} />
            <div
              style={{
                width: 34 * u,
                height: 34 * u,
                borderRadius: 9 * u,
                background: c.accent,
                display: "grid",
                placeItems: "center",
                transform: `scale(${pressScale})`,
                boxShadow: "0 4px 14px rgba(255,90,31,0.35)",
              }}
            >
              <Stroke d={UI_ICONS.send} size={17 * u} color="#fff" />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function PlayerScene({
  theme,
  image,
  overline,
  title,
  ground,
  groundParams,
}: {
  theme: Theme;
  image: string;
  overline: string;
  title: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = T[theme];
  const tall = H > W;
  const u = tall ? W / 760 : H / 640;
  const cardW = tall ? W * 0.84 : Math.min(W * 0.62, H * 1.1);
  const cardH = tall ? H * 0.6 : cardW * 0.56;
  const bar = spring({
    frame: frame - B_BEATS.toolbar,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const words = title.split(" ");
  const progress = interpolate(
    frame,
    [B_BEATS.bar, durationInFrames],
    [0.04, 0.42],
    CLAMP,
  );
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);
  const imgDrift = interpolate(
    frame,
    [0, durationInFrames],
    [1.08, 1.0],
    CLAMP,
  );
  const text: React.CSSProperties = {
    fontFamily: figtree.fontFamily,
    fontWeight: 400,
    color: c.ink,
  };
  const chip: React.CSSProperties = {
    ...text,
    display: "flex",
    alignItems: "center",
    gap: 7 * u,
    fontSize: 14 * u,
    padding: `${7 * u}px ${12 * u}px`,
    borderRadius: 9 * u,
    border: `1px solid ${c.line}`,
    background: c.card,
    boxShadow: c.highlight,
  };
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground ?? c.groundB}
        params={groundParams}
        timeOffset={5}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 16 * u,
          transform: `scale(${push})`,
        }}
      >
        <div
          style={{
            width: cardW,
            display: "flex",
            gap: 10 * u,
            transform: `translateY(${(1 - bar) * 14 * u}px)`,
            opacity: Math.min(1, bar * 1.5),
          }}
        >
          <div style={chip}>16:9</div>
          <div style={chip}>
            <Stroke d={UI_ICONS.sliders} size={15 * u} color={c.muted} />
            Change details
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              ...chip,
              background: theme === "dark" ? "#F1F0F5" : "#18171C",
              color: theme === "dark" ? "#18171C" : "#F1F0F5",
              border: "none",
            }}
          >
            <Stroke
              d={UI_ICONS.export}
              size={15 * u}
              color={theme === "dark" ? "#18171C" : "#F1F0F5"}
            />
            Export
          </div>
        </div>
        <div
          style={{
            width: cardW,
            height: cardH,
            borderRadius: 16 * u,
            overflow: "hidden",
            position: "relative",
            boxShadow: `0 0 0 1px ${c.line}, ${c.shadow}`,
          }}
        >
          <Img
            src={image}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgDrift})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28 * u,
              right: 28 * u,
              bottom: 64 * u,
              display: "flex",
              flexDirection: "column",
              gap: 8 * u,
            }}
          >
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 13 * u,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {overline}
            </span>
            <div
              style={{
                fontFamily: serif.fontFamily,
                fontWeight: 400,
                fontSize: (tall ? 76 : 58) * u,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              {words.map((w, i) => {
                const s = spring({
                  frame: frame - B_BEATS.title - i * 3,
                  fps,
                  config: { mass: 0.8, damping: 18, stiffness: 160 },
                });
                return (
                  <span
                    key={`${w}-${i}`}
                    style={{
                      display: "inline-block",
                      overflow: "hidden",
                      paddingBottom: "0.1em",
                      marginBottom: "-0.1em",
                      verticalAlign: "bottom",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - s) * 100}%)`,
                      }}
                    >
                      {w}
                      {i < words.length - 1 ? " " : ""}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 24 * u,
              right: 24 * u,
              bottom: 18 * u,
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
            }}
          >
            <Stroke d={UI_ICONS.play} size={18 * u} color="#fff" fill />
            <Stroke d={UI_ICONS.volume} size={18 * u} color="#fff" />
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 13 * u,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              0:0{Math.min(9, Math.floor(progress * 12))} / 0:12
            </span>
            <div
              style={{
                flex: 1,
                height: 3 * u,
                borderRadius: 3 * u,
                background: "rgba(255,255,255,0.25)",
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
                  borderRadius: 3 * u,
                  background: "#fff",
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export type DiscPopDemoProps = {
  theme?: Theme;
  greeting?: [string, string];
  prompt?: string;
  image?: string;
  overline?: string;
  title?: string;
  discs?: DiscPopProps;
  groundA?: GshPresetId;
  groundAParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundBParams?: Partial<GradientParams>;
  sceneA?: number;
  sceneB?: number;
  transition?: number;
};

export const DISC_POP_DEMO = { sceneA: 84, sceneB: 84, transition: 30 };

const LIGHT_DISCS: DiscPopProps = {
  colors: ["#FF5A1F", "#C7B9FF", "#2F6BFF", "#18171C"],
  glyphColors: ["#FFE1D2", "#4B36B8", "#D9E4FF", "#F2EDE4"],
};

export function DiscPopDemo({
  theme = "dark",
  greeting = ["Hi there.", "What are you launching"],
  prompt = "Make a launch film for our piano app: bold title, three product shots, calm ending.",
  image = staticFile("templates/product-showcase/gallery.jpg"),
  overline = "LAUNCH FILM · 01",
  title = "Keys, in an afternoon.",
  discs,
  groundA,
  groundAParams,
  groundB,
  groundBParams,
  sceneA = DISC_POP_DEMO.sceneA,
  sceneB = DISC_POP_DEMO.sceneB,
  transition = DISC_POP_DEMO.transition,
}: DiscPopDemoProps) {
  const presentation = discPop({
    ...(theme === "light" ? LIGHT_DISCS : {}),
    ...discs,
  });
  return (
    <AbsoluteFill
      style={{ backgroundColor: theme === "light" ? "#eeece8" : "#07060c" }}
    >
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneA}>
          <PromptScene
            theme={theme}
            greeting={greeting}
            prompt={prompt}
            ground={groundA}
            groundParams={groundAParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={presentation}
          timing={linearTiming({ durationInFrames: transition })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneB}>
          <PlayerScene
            theme={theme}
            image={image}
            overline={overline}
            title={title}
            ground={groundB}
            groundParams={groundBParams}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
