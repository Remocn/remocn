"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import { useId, useMemo } from "react";
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

const figtree = loadFigtree("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SUCK = Easing.bezier(0.55, 0, 1, 0.45);
const DIVE = Easing.bezier(0.7, 0, 0.84, 0);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const MAP_SIZE = 256;
const H_MAX = 0.25 * 0.75 ** 3;

function pinchMap(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = MAP_SIZE;
  canvas.height = MAP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  for (let j = 0; j < MAP_SIZE; j++) {
    for (let i = 0; i < MAP_SIZE; i++) {
      const u = ((i + 0.5) / MAP_SIZE) * 2 - 1;
      const v = ((j + 0.5) / MAP_SIZE) * 2 - 1;
      const d = Math.hypot(u, v);
      const k = (j * MAP_SIZE + i) * 4;
      let r = 0.5;
      let g = 0.5;
      if (d > 1e-4 && d < 1) {
        const h = (d * (1 - d) ** 3) / H_MAX;
        r = 0.5 + 0.5 * (u / d) * h;
        g = 0.5 + 0.5 * (v / d) * h;
      }
      img.data[k] = Math.round(r * 255);
      img.data[k + 1] = Math.round(g * 255);
      img.data[k + 2] = 128;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export type PressWarpDiveProps = {
  point?: [number, number];
  buttonRadius?: number;
  reach?: number;
  pinch?: number;
  dive?: number;
  orb?: string;
  rim?: string;
};

export const pressWarpDiveDefaults: Required<PressWarpDiveProps> = {
  point: [0.5, 0.5],
  buttonRadius: 0.028,
  reach: 0.8,
  pinch: 1,
  dive: 3.2,
  orb: "#3b5bfd",
  rim: "rgba(255,255,255,0.55)",
};

function diveState(
  p: number,
  W: number,
  H: number,
  o: Required<PressWarpDiveProps>,
) {
  const m = Math.min(W, H);
  const px = o.point[0] * W;
  const py = o.point[1] * H;
  const pinch = interpolate(p, [0, 0.62], [0, 1], { ...CLAMP, easing: SUCK });
  const dive = interpolate(p, [0, 0.8], [0, 1], { ...CLAMP, easing: DIVE });
  const s = o.dive ** dive;
  const reach = Math.hypot(Math.max(px, W - px), Math.max(py, H - py));
  const grow = interpolate(p, [0.42, 0.84], [0, 1], { ...CLAMP, easing: DIVE });
  const orbR = mix(o.buttonRadius * m * 0.75, reach * 1.04, grow);
  return {
    px,
    py,
    s,
    pinch,
    rp: o.reach * m,
    orbOn: p >= 0.42,
    orbR,
    tint: interpolate(p, [0.56, 0.92], [1, 0], { ...CLAMP, easing: MOVE }),
    shade: interpolate(grow, [0.55, 1], [1, 0], CLAMP),
    blur: interpolate(dive, [0.4, 1], [0, 4], CLAMP),
  };
}

const PressWarpDivePresentation: React.FC<
  TransitionPresentationComponentProps<PressWarpDiveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = { ...pressWarpDiveDefaults, ...passedProps };
  const st = diveState(presentationProgress, W, H, o);
  const map = useMemo(() => pinchMap(), []);
  const filterId = `press-warp-${useId().replace(/:/g, "")}`;

  if (presentationDirection === "exiting") {
    const warp = st.pinch > 0.002 && map !== "";
    const scale = 0.8 * st.rp * o.pinch * st.pinch;
    return (
      <AbsoluteFill
        style={{
          transformOrigin: `${st.px}px ${st.py}px`,
          transform: `scale(${st.s.toFixed(4)})`,
          filter: st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px)` : undefined,
        }}
      >
        {warp ? (
          <svg
            width={0}
            height={0}
            style={{ position: "absolute" }}
            aria-hidden
          >
            <defs>
              <filter
                id={filterId}
                x={0}
                y={0}
                width={W}
                height={H}
                filterUnits="userSpaceOnUse"
                primitiveUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodColor="rgb(128,128,128)" result="flat" />
                <feImage
                  href={map}
                  x={st.px - st.rp}
                  y={st.py - st.rp}
                  width={st.rp * 2}
                  height={st.rp * 2}
                  preserveAspectRatio="none"
                  result="map"
                />
                <feComposite
                  in="map"
                  in2="flat"
                  operator="over"
                  result="field"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="field"
                  scale={scale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>
        ) : null}
        <AbsoluteFill
          style={{ filter: warp ? `url(#${filterId})` : undefined }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const clip = `circle(${st.orbR.toFixed(2)}px at ${st.px.toFixed(2)}px ${st.py.toFixed(2)}px)`;
  return (
    <AbsoluteFill style={{ opacity: st.orbOn ? 1 : 0 }}>
      <AbsoluteFill style={{ clipPath: clip, WebkitClipPath: clip }}>
        {children}
        <AbsoluteFill
          style={{
            background: `linear-gradient(150deg, transparent 8%, ${o.orb} 78%)`,
            opacity: st.tint,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: st.px - st.orbR,
          top: st.py - st.orbR,
          width: st.orbR * 2,
          height: st.orbR * 2,
          borderRadius: "50%",
          opacity: st.shade,
          boxShadow: `inset 0 0 0 1.5px ${o.rim}, inset 0 ${(-st.orbR * 0.18).toFixed(1)}px ${(st.orbR * 0.32).toFixed(1)}px rgba(0,0,0,0.3), inset 0 ${(st.orbR * 0.1).toFixed(1)}px ${(st.orbR * 0.18).toFixed(1)}px rgba(255,255,255,0.28)`,
        }}
      />
    </AbsoluteFill>
  );
};

export function pressWarpDive(
  props: PressWarpDiveProps = {},
): TransitionPresentation<PressWarpDiveProps> {
  return { component: PressWarpDivePresentation, props };
}

type Palette = {
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  panel: string;
  row: string;
  hairline: string;
  highlight: string;
  shadow: string;
  cursor: string;
  cursorEdge: string;
  rim: string;
  backdrop: string;
  groundA: Partial<GradientParams>;
  groundB: Partial<GradientParams>;
  headB: string;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    ink: "#f2f4fb",
    muted: "rgba(226,230,245,0.62)",
    faint: "rgba(226,230,245,0.36)",
    accent: "#3b5bfd",
    panel: "rgba(14,16,26,0.9)",
    row: "rgba(255,255,255,0.06)",
    hairline: "rgba(255,255,255,0.1)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.07)",
    shadow: "0,2,14",
    cursor: "#ffffff",
    cursorEdge: "#0b0d16",
    rim: "rgba(255,255,255,0.5)",
    backdrop: "#03040a",
    headB: "#ffffff",
    groundA: {
      kind: "mist",
      colors: ["#2a3a8c", "#141d52", "#080b22", "#020308"],
      background: "#020308",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.8,
      warp: 0.35,
      blur: 0.8,
      grain: 0.12,
      seed: 21,
    },
    groundB: {
      kind: "mesh",
      colors: ["#dfe5ff", "#7b8cff", "#3b5bfd", "#7d4dff"],
      background: "#1d2bb8",
      speed: 1.1,
      loopSeconds: 14,
      scale: 1,
      warp: 0.5,
      blur: 0.7,
      grain: 0.1,
      seed: 6,
    },
  },
  light: {
    ink: "#14161d",
    muted: "rgba(20,22,29,0.56)",
    faint: "rgba(20,22,29,0.34)",
    accent: "#2f4ff0",
    panel: "rgba(255,255,255,0.96)",
    row: "rgba(24,30,60,0.05)",
    hairline: "rgba(20,24,40,0.09)",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.95)",
    shadow: "60,58,50",
    cursor: "#14161d",
    cursorEdge: "#ffffff",
    rim: "rgba(255,255,255,0.7)",
    backdrop: "#f1efea",
    headB: "#0f1440",
    groundA: {
      kind: "mist",
      colors: ["#e9e4da", "#f6f3ee", "#dcd6cb", "#c9cfee"],
      background: "#f2efe9",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.8,
      warp: 0.35,
      blur: 0.75,
      grain: 0.22,
      seed: 12,
    },
    groundB: {
      kind: "mesh",
      colors: ["#ffffff", "#b4c2ff", "#6f88ff", "#dcd0ff"],
      background: "#cfd8ff",
      speed: 1.1,
      loopSeconds: 14,
      scale: 1,
      warp: 0.5,
      blur: 0.7,
      grain: 0.16,
      seed: 6,
    },
  },
};

const A_LEN = 78;
const B_LEN = 90;
const T_LEN = 30;
export const PRESS_WARP_DIVE_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = {
  head: -6,
  card: -4,
  suggest: 6,
  type: 6,
  typeEnd: 30,
  cursor: 18,
  press: 42,
  release: 48,
} as const;
const B_BEATS = { emerge: 27, head: 34, rows: 38, play: 50 } as const;

type Rect = [number, number, number, number];

function layout(W: number, H: number) {
  const tall = H > W * 1.1;
  const u = tall ? W / 600 : H / 720;
  const card: Rect = tall
    ? [0.06 * W, 0.335 * H, 0.88 * W, 0.17 * H]
    : [0.21 * W, 0.42 * H, 0.58 * W, 0.28 * H];
  const pad = 18 * u;
  const br = 21 * u;
  const button = {
    x: card[0] + card[2] - pad - br,
    y: card[1] + card[3] - pad - br,
    r: br,
  };
  return {
    tall,
    u,
    card,
    pad,
    button,
    headY: tall ? 0.275 * H : 0.3 * H,
    suggY: tall ? 0.535 * H : 0.765 * H,
    headFs: tall ? W * 0.078 : W * 0.042,
  };
}

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  plus: "M12 5v14M5 12h14",
  chevron: "M7 10l5 5 5-5",
  wave: "M5 10v4M9 7v10M13 9v6M17 6v12M21 10v4",
  send: "M12 19V5M6 11l6-6 6 6",
  play: "M9 7l9 5-9 5z",
  share: "M12 4v11M7.5 8.5L12 4l4.5 4.5M5 13v5.5h14V13",
  film: "M4 6.5h16v11H4zM8 6.5v11M16 6.5v11",
  spark: "M12 4l1.8 4.6L18.5 10l-4.7 1.6L12 16l-1.8-4.4L5.5 10l4.7-1.4z",
  notes: "M6 4.5h12v15H6zM9 9h6M9 12.5h6M9 16h3.5",
  phone:
    "M8 3.5h8a1.5 1.5 0 011.5 1.5v14a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 19V5A1.5 1.5 0 018 3.5zM11 17.5h2",
  arrow: "M9 6l6 6-6 6",
};

const SUGGESTIONS = [
  { icon: ICONS.spark, label: "Feature walkthrough" },
  { icon: ICONS.notes, label: "Release notes" },
  { icon: ICONS.phone, label: "Teaser for socials" },
];

function Cursor({
  size,
  fill,
  edge,
}: {
  size: number;
  fill: string;
  edge: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M4 2.5l15 8.6-6.6 1.6-3 6.4z"
        fill={fill}
        stroke={edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Headline({
  text,
  y,
  fs,
  color,
  appear,
}: {
  text: string;
  y: number;
  fs: number;
  color: string;
  appear: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        paddingBottom: fs * 0.2,
      }}
    >
      <div
        style={{
          fontFamily: figtree.fontFamily,
          fontWeight: 300,
          fontSize: fs,
          letterSpacing: "-0.03em",
          lineHeight: 1.12,
          color,
          transform: `translateY(${((1 - appear) * 105).toFixed(2)}%)`,
          filter:
            appear < 0.99
              ? `blur(${((1 - appear) * 6).toFixed(2)}px)`
              : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SceneA({
  palette,
  heading,
  prompt,
  ground,
  groundParams,
}: {
  palette: Palette;
  heading: string;
  prompt: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const L = layout(W, H);
  const { u } = L;
  const [cx, cy, cw, ch] = L.card;
  const head = interpolate(frame, [A_BEATS.head, A_BEATS.head + 14], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const card = spring({ frame: frame - A_BEATS.card, fps, config: CARD });
  const typed = Math.floor(
    interpolate(
      frame,
      [A_BEATS.type, A_BEATS.typeEnd],
      [0, prompt.length],
      CLAMP,
    ),
  );
  const done = typed >= prompt.length;
  const caret = !done || Math.floor((frame - A_BEATS.typeEnd) / 7) % 2 === 0;
  const travel = spring({ frame: frame - A_BEATS.cursor, fps, config: HEAVY });
  const pressDown = interpolate(
    frame,
    [A_BEATS.press, A_BEATS.press + 4],
    [0, 1],
    {
      ...CLAMP,
      easing: MOVE,
    },
  );
  const pressUp = spring({
    frame: frame - A_BEATS.release + 2,
    fps,
    config: CHIP,
  });
  const press = pressDown * (1 - pressUp);
  const btn = L.button;
  const startX = L.tall ? W * 0.84 : W * 0.9;
  const startY = L.tall ? H * 0.86 : H * 0.94;
  const curX = mix(startX, btn.x + btn.r * 0.1, travel);
  const curY = mix(startY, btn.y + btn.r * 0.15, travel);
  const curSize = 30 * u;
  const push = interpolate(frame, [0, A_LEN], [1, 1.04], CLAMP);
  const fs = (L.tall ? 25 : 21) * u;
  const small = (L.tall ? 21 : 16.5) * u;

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundA, ...groundParams }}
        timeOffset={6}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transformOrigin: `${btn.x}px ${btn.y}px`,
          transform: `scale(${push.toFixed(4)})`,
        }}
      >
        <Headline
          text={heading}
          y={L.headY}
          fs={L.headFs}
          color={palette.ink}
          appear={head}
        />
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            width: cw,
            height: ch,
            borderRadius: 22 * u,
            backgroundColor: palette.panel,
            boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 2px 4px rgba(${palette.shadow},0.12), 0 16px 36px rgba(${palette.shadow},0.2), 0 40px 90px rgba(${palette.shadow},0.26)`,
            fontFamily: figtree.fontFamily,
            color: palette.ink,
            opacity: interpolate(card, [0, 0.3], [0, 1], CLAMP),
            transform: `translateY(${((1 - card) * 26 * u).toFixed(2)}px) scale(${(0.97 + 0.03 * card).toFixed(4)})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: L.pad + 4 * u,
              right: L.pad + 4 * u,
              top: L.pad + 2 * u,
              fontSize: fs,
              fontWeight: 300,
              letterSpacing: "-0.01em",
              lineHeight: 1.32,
              color: typed > 0 ? palette.ink : palette.faint,
            }}
          >
            {typed > 0 ? prompt.slice(0, typed) : "Describe your launch film"}
            <span
              style={{
                display: "inline-block",
                width: Math.max(2, 2 * u),
                height: fs * 1.05,
                marginLeft: 2 * u,
                verticalAlign: "-0.18em",
                backgroundColor: palette.accent,
                opacity: caret ? 1 : 0,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: L.pad,
              bottom: L.pad,
              height: btn.r * 2,
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              fontSize: small,
              color: palette.muted,
            }}
          >
            <div
              style={{
                width: 36 * u,
                height: 36 * u,
                borderRadius: 99,
                boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.plus} size={17 * u} color={palette.muted} />
            </div>
            {["Film", "16:9"].map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4 * u,
                  padding: `${7 * u}px ${12 * u}px`,
                  borderRadius: 99,
                  backgroundColor: palette.row,
                  boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                }}
              >
                {c}
                <Icon d={ICONS.chevron} size={14 * u} color={palette.faint} />
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              right: L.pad + btn.r * 2 + 12 * u,
              bottom: L.pad + btn.r - 10 * u,
            }}
          >
            <Icon d={ICONS.wave} size={20 * u} color={palette.muted} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: L.tall ? cx : 0,
            width: L.tall ? cw : W,
            top: L.suggY,
            display: "flex",
            flexDirection: L.tall ? "column" : "row",
            justifyContent: "center",
            gap: (L.tall ? 12 : 10) * u,
            fontFamily: figtree.fontFamily,
            fontSize: small,
            color: palette.muted,
          }}
        >
          {SUGGESTIONS.map((sg, i) => {
            const k = spring({
              frame: frame - A_BEATS.suggest - i * 3,
              fps,
              config: CARD,
            });
            return (
              <div
                key={sg.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  padding: L.tall
                    ? `${16 * u}px ${18 * u}px`
                    : `${9 * u}px ${15 * u}px`,
                  borderRadius: L.tall ? 16 * u : 99,
                  backgroundColor: palette.panel,
                  boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 8px 22px rgba(${palette.shadow},0.16)`,
                  opacity: interpolate(k, [0, 0.4], [0, 1], CLAMP),
                  transform: `translateY(${((1 - k) * 14 * u).toFixed(2)}px)`,
                }}
              >
                <Icon d={sg.icon} size={18 * u} color={palette.muted} />
                <span style={{ flex: L.tall ? 1 : undefined }}>{sg.label}</span>
                {L.tall ? (
                  <Icon d={ICONS.arrow} size={16 * u} color={palette.faint} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: btn.x - btn.r,
            top: btn.y - btn.r + (1 - card) * 26 * u,
            width: btn.r * 2,
            height: btn.r * 2,
            borderRadius: 99,
            backgroundColor: done ? palette.accent : palette.row,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(card, [0, 0.3], [0, 1], CLAMP),
            transform: `scale(${(1 - 0.12 * press).toFixed(4)})`,
            boxShadow: done
              ? `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(${palette.shadow},0.25)`
              : `inset 0 0 0 1px ${palette.hairline}`,
          }}
        >
          <Icon
            d={ICONS.send}
            size={19 * u}
            color={done ? "#ffffff" : palette.faint}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: curX - curSize * 0.16,
            top: curY - curSize * 0.1,
            transform: `scale(${(1 - 0.14 * press).toFixed(4)})`,
            transformOrigin: "16% 10%",
            filter: `drop-shadow(0 ${3 * u}px ${5 * u}px rgba(0,0,0,0.28))`,
            opacity: interpolate(travel, [0, 0.15], [0, 1], CLAMP),
          }}
        >
          <Cursor
            size={curSize}
            fill={palette.cursor}
            edge={palette.cursorEdge}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneB({
  palette,
  heading,
  title,
  image,
  ground,
  groundParams,
}: {
  palette: Palette;
  heading: string;
  title: string;
  image: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W * 1.1;
  const u = tall ? W / 600 : H / 720;
  const emerge = spring({ frame: frame - B_BEATS.emerge, fps, config: HEAVY });
  const head = interpolate(frame, [B_BEATS.head, B_BEATS.head + 14], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const play = interpolate(frame, [B_BEATS.play, B_LEN], [0, 0.42], CLAMP);
  const cardW = tall ? W * 0.88 : W * 0.5;
  const thumbH = (cardW - 20 * u) * (9 / 16);
  const cardTop = tall ? H * 0.36 : H * 0.29;
  const fs = (tall ? 22 : 18) * u;
  const small = (tall ? 19 : 15) * u;
  const secs = Math.floor(play * 30);
  const push = interpolate(frame, [B_BEATS.emerge, B_LEN], [1, 1.03], CLAMP);
  const rowIn = (i: number) =>
    spring({ frame: frame - B_BEATS.rows - i * 3, fps, config: CARD });

  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundB, ...groundParams }}
        timeOffset={2}
        timeScale={0.8}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${(push * mix(1.45, 1, emerge)).toFixed(4)})`,
          opacity: interpolate(emerge, [0, 0.25], [0, 1], CLAMP),
          filter:
            emerge < 0.98
              ? `blur(${((1 - emerge) * 12).toFixed(2)}px)`
              : undefined,
        }}
      >
        <Headline
          text={heading}
          y={tall ? H * 0.28 : H * 0.17}
          fs={tall ? W * 0.075 : W * 0.04}
          color={palette.headB}
          appear={head}
        />
        <div
          style={{
            position: "absolute",
            left: (W - cardW) / 2,
            top: cardTop,
            width: cardW,
            padding: 10 * u,
            borderRadius: 24 * u,
            backgroundColor: palette.panel,
            boxShadow: `inset 0 0 0 1px ${palette.hairline}, ${palette.highlight}, 0 2px 4px rgba(${palette.shadow},0.14), 0 18px 40px rgba(${palette.shadow},0.24), 0 44px 100px rgba(${palette.shadow},0.3)`,
            fontFamily: figtree.fontFamily,
            color: palette.ink,
          }}
        >
          <div
            style={{
              position: "relative",
              height: thumbH,
              borderRadius: 15 * u,
              overflow: "hidden",
            }}
          >
            <Img
              src={image}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${(1.06 - play * 0.08).toFixed(4)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 58 * u,
                height: 58 * u,
                marginLeft: -29 * u,
                marginTop: -29 * u,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                transform: `scale(${(0.6 + 0.4 * rowIn(0)).toFixed(4)})`,
                opacity: rowIn(0),
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={26 * u}
                height={26 * u}
                aria-hidden
              >
                <path d={ICONS.play} fill="#14161d" />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                left: 14 * u,
                right: 14 * u,
                bottom: 12 * u,
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                fontSize: small,
                color: "#ffffff",
                opacity: rowIn(1),
              }}
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                0:{secs.toString().padStart(2, "0")}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 4 * u,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.35)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(play * 100).toFixed(2)}%`,
                    height: "100%",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
              <span>0:30</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              padding: `${14 * u}px ${8 * u}px ${6 * u}px`,
              opacity: interpolate(rowIn(2), [0, 0.4], [0, 1], CLAMP),
              transform: `translateY(${((1 - rowIn(2)) * 10 * u).toFixed(2)}px)`,
            }}
          >
            <div
              style={{
                width: 38 * u,
                height: 38 * u,
                borderRadius: 10 * u,
                backgroundColor: palette.row,
                boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.film} size={19 * u} color={palette.ink} />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2 * u,
              }}
            >
              <span
                style={{
                  fontSize: fs,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </span>
              <span style={{ fontSize: small, color: palette.muted }}>
                30 s · 1080p · 3 formats
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6 * u,
                padding: `${9 * u}px ${16 * u}px`,
                borderRadius: 99,
                backgroundColor: palette.accent,
                color: "#ffffff",
                fontSize: small,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Icon d={ICONS.share} size={16 * u} color="#ffffff" />
              Share
            </div>
          </div>
        </div>
        {tall ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: H * 0.765,
              display: "flex",
              justifyContent: "center",
              gap: 10 * u,
              fontFamily: figtree.fontFamily,
              fontSize: small,
              color: palette.headB,
            }}
          >
            {["16:9", "9:16", "1:1"].map((f, i) => {
              const k = rowIn(3 + i);
              return (
                <div
                  key={f}
                  style={{
                    padding: `${10 * u}px ${20 * u}px`,
                    borderRadius: 99,
                    backgroundColor: palette.panel,
                    color: palette.ink,
                    boxShadow: `inset 0 0 0 1px ${palette.hairline}, 0 8px 22px rgba(${palette.shadow},0.2)`,
                    opacity: interpolate(k, [0, 0.4], [0, 1], CLAMP),
                    transform: `translateY(${((1 - k) * 12 * u).toFixed(2)}px)`,
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export interface PressWarpDiveDemoProps {
  theme?: "dark" | "light";
  accent?: string;
  heading?: string;
  prompt?: string;
  headingB?: string;
  title?: string;
  image?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
  transition?: PressWarpDiveProps;
}

export function PressWarpDiveDemo({
  theme = "dark",
  accent,
  heading = "What are we launching?",
  prompt = "A 30-second launch film for our new editor",
  headingB = "Your film is ready",
  title = "Launch film, v2",
  image = staticFile("reel/reel-5.jpg"),
  ground,
  groundParams,
  groundB,
  groundParamsB,
  transition,
}: PressWarpDiveDemoProps) {
  const { width: W, height: H } = useVideoConfig();
  const base = THEMES[theme];
  const palette = accent ? { ...base, accent } : base;
  const L = layout(W, H);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.backdrop }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            palette={palette}
            heading={heading}
            prompt={prompt}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={pressWarpDive({
            point: [L.button.x / W, L.button.y / H],
            buttonRadius: L.button.r / Math.min(W, H),
            orb: palette.accent,
            rim: palette.rim,
            ...transition,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            palette={palette}
            heading={headingB}
            title={title}
            image={image}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
