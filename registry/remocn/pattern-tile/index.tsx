"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PatternTileProps {
  steps?: [string, string, string, string];
  unit?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// gradients.sh "fluted" palette, laid across the whole wall in grid space so
// every quarter-disc is a slice of one continuous field.
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const COLS = 12;
const ROWS = 6;
const HERO: [number, number] = [4, 2];
const MIRROR_X = 6;

const ROT = [32, 43, 54];
const ROT_LEN = 11;
const MIRROR: [number, number] = [68, 92];
const SLIDE_H: [number, number] = [98, 116];
const SLIDE_V: [number, number] = [116, 134];
const FOCUS = 140;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TURN = Easing.bezier(0.55, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.04)",
    surface: "#141416",
    disc: "#E6E5E1",
    bar: "#8E8C88",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    edge: "rgba(255,255,255,0.16)",
    dim: 0.6,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.85)",
    surface: "#EAE8E2",
    disc: "#18181A",
    bar: "#8A8882",
    fg: "#121214",
    muted: "#6E6C67",
    edge: "rgba(18,18,20,0.18)",
    dim: 0.55,
    grain: 0.045,
  },
} as const;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function pie(r: number, a: number, bleed: number) {
  if (a >= Math.PI / 2 - 1e-6) {
    const b = bleed.toFixed(3);
    const rr = r.toFixed(3);
    return `M-${b} -${b} L${rr} -${b} L${rr} 0 A${rr} ${rr} 0 0 1 0 ${rr} L-${b} ${rr} Z`;
  }
  const ex = r * Math.cos(a);
  const ey = r * Math.sin(a);
  return `M0 0 L${r.toFixed(3)} 0 A${r.toFixed(3)} ${r.toFixed(3)} 0 0 1 ${ex.toFixed(3)} ${ey.toFixed(3)} Z`;
}

interface Look {
  disc: string;
  bar: string;
  motif: number;
}

interface TileInst {
  key: string;
  tf: string;
  sweep: number;
  grow: number;
}

interface Group {
  key: string;
  tf: string;
  tiles: TileInst[];
}

function Motif({
  T,
  look,
  sweep,
  grow,
  bleed,
  part = "both",
}: {
  T: number;
  look: Look;
  sweep: number;
  grow: number;
  bleed: number;
  part?: "both" | "disc" | "bar";
}) {
  return (
    <g opacity={look.motif}>
      {sweep > 0 && part !== "bar" ? (
        <path
          d={pie(0.6 * T, (Math.PI / 2) * Math.min(1, sweep), bleed)}
          fill={look.disc}
        />
      ) : null}
      {grow > 0 && part !== "disc" ? (
        <rect
          x={0.72 * T}
          y={0.12 * T}
          width={0.16 * T}
          height={0.5 * T * grow}
          fill={look.bar}
        />
      ) : null}
    </g>
  );
}

function GroupView({
  group,
  T,
  surface,
  look,
  bleed,
  field,
  maskId,
}: {
  group: Group;
  T: number;
  surface: string;
  look: Look;
  bleed: number;
  field: string;
  maskId: string;
}) {
  const box = {
    x: -COLS * T,
    y: -ROWS * T,
    width: COLS * T * 3,
    height: ROWS * T * 3,
  };
  const white: Look = { disc: "#FFFFFF", bar: "#FFFFFF", motif: 1 };
  return (
    <g>
      <g transform={group.tf || undefined}>
        {group.tiles.map((tile) => (
          <rect
            key={`s${tile.key}`}
            transform={tile.tf}
            x={0}
            y={0}
            width={T}
            height={T}
            fill={surface}
            stroke={surface}
            strokeWidth={0.8}
          />
        ))}
        {group.tiles.map((tile) => (
          <g key={`b${tile.key}`} transform={tile.tf}>
            <Motif
              T={T}
              look={look}
              sweep={tile.sweep}
              grow={tile.grow}
              bleed={bleed}
              part="bar"
            />
          </g>
        ))}
      </g>
      <mask id={maskId} maskUnits="userSpaceOnUse" {...box}>
        <g transform={group.tf || undefined}>
          {group.tiles.map((tile) => (
            <g key={`m${tile.key}`} transform={tile.tf}>
              <Motif
                T={T}
                look={white}
                sweep={tile.sweep}
                grow={tile.grow}
                bleed={bleed}
                part="disc"
              />
            </g>
          ))}
        </g>
      </mask>
      <rect
        {...box}
        fill={field}
        mask={`url(#${maskId})`}
        opacity={look.motif}
      />
    </g>
  );
}

export function PatternTile({
  steps = ["tile", "rotate 90°", "mirror", "translate"],
  unit = "tiles",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PatternTileProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const labelF = 18 * u;
  const labelGap = 30 * u;
  const T = Math.min((W * 0.84) / COLS, (H * 0.66) / ROWS);
  const gridW = T * COLS;
  const gridH = T * ROWS;
  const blockTop = (H - (gridH + labelGap + labelF)) / 2;
  const pcx = W / 2;
  const pcy = blockTop + gridH / 2;

  const camAt = (k: number[], v: number[]) =>
    interpolate(t, k, v, { ...CLAMP, easing: EASE_IO });
  const camK = [24, 64, 66, 94, 96, 124];
  const logS = camAt(camK, [
    Math.log(2.8),
    Math.log(2.05),
    Math.log(2.05),
    Math.log(1.45),
    Math.log(1.45),
    0,
  ]);
  const S = Math.exp(logS);
  const camX = camAt(camK, [4.5, 5, 5, 6, 6, 6]);
  const camY = camAt(camK, [2.5, 3, 3, 3, 3, 3]);

  const appear = interpolate(t, [0, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sweep = interpolate(t, [6, 24], [0, 1], { ...CLAMP, easing: EASE_IO });
  const grow = interpolate(t, [14, 28], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const edgeDraw = interpolate(t, [0, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const edgeFade = interpolate(t, [28, 44], [1, 0], CLAMP);

  const rotP = ROT.map((s) =>
    interpolate(t, [s, s + ROT_LEN], [0, 1], { ...CLAMP, easing: EASE_TURN }),
  );
  const flip = interpolate(t, MIRROR, [1, -1], { ...CLAMP, easing: EASE_IO });
  const slideH = interpolate(t, SLIDE_H, [0, 1], { ...CLAMP, easing: EASE_IO });
  const slideV = interpolate(t, SLIDE_V, [0, 1], { ...CLAMP, easing: EASE_IO });
  const focus = interpolate(t, [FOCUS, FOCUS + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const look: Look = {
    disc: c.disc,
    bar: c.bar,
    motif: 1 - (1 - c.dim) * focus,
  };
  const heroTf = `translate(${HERO[0] * T} ${HERO[1] * T})`;
  const rotTf = (angle: number) =>
    `${heroTf} rotate(${angle.toFixed(3)} ${T} ${T})`;
  const mirTf = (sx: number) =>
    `translate(${MIRROR_X * T} 0) scale(${sx.toFixed(4)} 1) translate(${-MIRROR_X * T} 0)`;
  const tile = (key: string, tf: string, sw = 1, gr = 1): TileInst => ({
    key,
    tf,
    sweep: sw,
    grow: gr,
  });
  const rosette = (prefix: string, pre = ""): TileInst[] =>
    [0, 90, 180, 270].map((ang) =>
      tile(`${prefix}${ang}`, `${pre} ${rotTf(ang)}`.trim()),
    );
  const blockTiles = (prefix: string, pre = ""): TileInst[] => [
    ...rosette(`${prefix}a`, pre),
    ...rosette(`${prefix}m`, `${pre} ${mirTf(-1)}`.trim()),
  ];

  const still: TileInst[] = [tile("hero", rotTf(0), sweep, grow)];
  const under: Group[] = [];
  const over: Group[] = [];
  rotP.forEach((p, k) => {
    if (p >= 1) still.push(tile(`r${k}`, rotTf(90 * (k + 1))));
    else if (p > 0)
      over.push({
        key: `rot${k}`,
        tf: "",
        tiles: [tile(`r${k}`, rotTf(90 * k + 90 * p))],
      });
  });
  if (t >= MIRROR[1]) still.push(...rosette("m", mirTf(-1)));
  else if (t >= MIRROR[0])
    under.push({ key: "mir", tf: mirTf(flip), tiles: rosette("m") });
  for (const dx of [-4, 4]) {
    if (t >= SLIDE_H[1])
      still.push(...blockTiles(`h${dx}`, `translate(${dx * T} 0)`));
    else if (t >= SLIDE_H[0])
      over.push({
        key: `h${dx}`,
        tf: `translate(${(dx * T * slideH).toFixed(3)} 0)`,
        tiles: blockTiles(`h${dx}`),
      });
  }
  for (const dy of [-2, 2]) {
    for (const dx of [-4, 0, 4]) {
      const pre = `translate(${dx * T} 0)`;
      if (t >= SLIDE_V[1])
        still.push(
          ...blockTiles(`v${dx}${dy}`, `translate(${dx * T} ${dy * T})`),
        );
      else if (t >= SLIDE_V[0])
        over.push({
          key: `v${dx}${dy}`,
          tf: `translate(0 ${(dy * T * slideV).toFixed(3)})`,
          tiles: blockTiles(`v${dx}${dy}`, pre),
        });
    }
  }
  const stillGroup: Group = { key: "still", tf: "", tiles: still };
  const heroLook: Look = { disc: c.fg, bar: c.fg, motif: 1 };
  const gid = `pt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const field = `url(#${gid}f)`;
  const fdx = Math.sin(t / 48) * 0.35 * T;

  const pivotO =
    interpolate(t, [ROT[0] - 4, ROT[0] + 2], [0, 1], CLAMP) *
    interpolate(t, [ROT[2] + ROT_LEN, ROT[2] + ROT_LEN + 8], [1, 0], CLAMP);
  const axisO =
    interpolate(t, [MIRROR[0] - 4, MIRROR[0] + 4], [0, 1], CLAMP) *
    interpolate(t, [MIRROR[1], MIRROR[1] + 8], [1, 0], CLAMP);
  const axisGrow = interpolate(t, [MIRROR[0] - 4, MIRROR[0] + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const tiles =
    t < ROT[0] + ROT_LEN
      ? 1
      : t < ROT[1] + ROT_LEN
        ? 2
        : t < ROT[2] + ROT_LEN
          ? 3
          : t < MIRROR[1]
            ? 4
            : t < SLIDE_H[1]
              ? 8
              : t < SLIDE_V[1]
                ? 24
                : 72;

  const phase =
    t < ROT[0] ? 0 : t < MIRROR[0] - 2 ? 1 : t < SLIDE_H[0] - 2 ? 2 : 3;
  const allDone = t >= FOCUS;

  const tx = pcx - camX * T * S;
  const ty = pcy - camY * T * S;
  const edgeLen = 4 * T;
  const labelIn = interpolate(t, [4, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 45% 35%, ${c.key}, transparent 70%)`,
        }}
      />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <g
          transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${S.toFixed(5)})`}
          opacity={appear}
        >
          <defs>
            <linearGradient
              id={`${gid}f`}
              gradientUnits="userSpaceOnUse"
              x1={fdx}
              y1={0}
              x2={COLS * T + fdx}
              y2={ROWS * T}
            >
              <stop offset={0.04} stopColor={FLUTED[0]} />
              <stop offset={0.36} stopColor={FLUTED[1]} />
              <stop offset={0.68} stopColor={FLUTED[2]} />
              <stop offset={0.96} stopColor={FLUTED[3]} />
            </linearGradient>
          </defs>
          {under.map((g) => (
            <GroupView
              key={g.key}
              group={g}
              T={T}
              surface={c.surface}
              bleed={0.6 / S}
              look={look}
              field={field}
              maskId={`${gid}${g.key}`}
            />
          ))}
          <GroupView
            group={stillGroup}
            T={T}
            surface={c.surface}
            look={look}
            bleed={0.6 / S}
            field={field}
            maskId={`${gid}still`}
          />
          {over.map((g) => (
            <GroupView
              key={g.key}
              group={g}
              T={T}
              surface={c.surface}
              bleed={0.6 / S}
              look={look}
              field={field}
              maskId={`${gid}${g.key}`}
            />
          ))}
          {focus > 0 ? (
            <g transform={heroTf} opacity={focus}>
              <Motif T={T} look={heroLook} sweep={1} grow={1} bleed={0} />
            </g>
          ) : null}
          {pivotO > 0 ? (
            <circle
              cx={(HERO[0] + 1) * T}
              cy={(HERO[1] + 1) * T}
              r={(5 * u) / S}
              fill={accent}
              opacity={pivotO}
            />
          ) : null}
          {axisO > 0 ? (
            <rect
              x={MIRROR_X * T - (0.75 * u) / S}
              y={(HERO[1] + 1) * T - 1.25 * T * axisGrow}
              width={(1.5 * u) / S}
              height={2.5 * T * axisGrow}
              fill={accent}
              opacity={axisO}
            />
          ) : null}
          {edgeFade > 0 ? (
            <rect
              x={HERO[0] * T}
              y={HERO[1] * T}
              width={T}
              height={T}
              fill="none"
              stroke={c.edge}
              strokeWidth={1.2 / S}
              strokeDasharray={`${edgeLen * edgeDraw} ${edgeLen}`}
              opacity={edgeFade}
            />
          ) : null}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: pcx - gridW / 2,
          width: gridW,
          top: blockTop + gridH + labelGap,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: labelF,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          opacity: labelIn,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 * u }}>
          {steps.map((s, i) => {
            const active = i === phase && !allDone;
            const done = i < phase || allDone;
            return (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 14 * u }}
              >
                {i > 0 ? (
                  <span style={{ color: c.muted, opacity: 0.5 }}>→</span>
                ) : null}
                <span
                  style={{
                    color: active ? c.fg : c.muted,
                    opacity: active || done ? 1 : 0.45,
                  }}
                >
                  {s}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            color: c.fg,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span
            style={{
              width: 10 * u,
              height: 10 * u,
              background: accent,
              opacity: focus,
            }}
          />
          <span>
            {tiles}{" "}
            <span style={{ color: c.muted, fontWeight: 400 }}>
              {tiles === 1 ? unit.replace(/s$/, "") : unit}
            </span>
          </span>
        </div>
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
