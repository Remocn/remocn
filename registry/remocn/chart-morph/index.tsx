"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ChartMorphDatum {
  label: string;
  value: number;
}

export interface ChartMorphProps {
  data?: ChartMorphDatum[];
  suffix?: string;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_DATA: ChartMorphDatum[] = [
  { label: "Jan", value: 12 },
  { label: "Feb", value: 18 },
  { label: "Mar", value: 23 },
  { label: "Apr", value: 31 },
  { label: "May", value: 46 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_DRAW = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    line: "#E9E8E4",
    hair: "rgba(255,255,255,0.14)",
    grays: ["#5C5B61", "#75747A", "#929197", "#B4B2AE"],
    grain: 0.06,
    // gradients.sh "limb": bg #030308, [#e9ecff, #8a8bff, #4b2bd6, #160c3a]
    limb: ["#4b2bd6", "#8a8bff", "#d4d7ff"],
    heroDot: "#d4d7ff",
    area: 1,
    areaStops: ["#4b2bd6", "#4b2bd6", "#8a8bff"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    line: "#1D1D20",
    hair: "rgba(18,18,20,0.16)",
    grays: ["#C9C7C1", "#AEACA6", "#8F8D88", "#6C6A66"],
    grain: 0.045,
    limb: ["#160c3a", "#4b2bd6", "#8a8bff"],
    heroDot: "#4b2bd6",
    area: 0.4,
    areaStops: ["#8a8bff", "#4b2bd6", "#8a8bff"],
  },
} as const;

const DRAW = [0, 24] as const;
const SPIN = [0, 30] as const;
const UNROLL = [30, 60] as const;
const TIP_START = 64;
const TIP_STAGGER = 3;
const TIP_DUR = 24;
const COLLAPSE_START = 100;
const COLLAPSE_STAGGER = 2;
const COLLAPSE_DUR = 22;
const LABEL_IN = 131;
const TAU = Math.PI * 2;
const SAMPLES = 40;

type Pt = { x: number; y: number };

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

function lerpPt(a: Pt, b: Pt, k: number): Pt {
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
}

function toPath(pts: Pt[]) {
  return `${pts
    .map((q, i) => `${i === 0 ? "M" : "L"} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`)
    .join(" ")} Z`;
}

function rotateAbout(q: Pt, c: Pt, a: number): Pt {
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const dx = q.x - c.x;
  const dy = q.y - c.y;
  return { x: c.x + cs * dx - sn * dy, y: c.y + sn * dx + cs * dy };
}

function unrollPoint(
  s: number,
  o: number,
  k: number,
  ax: number,
  ay: number,
): Pt {
  if (k < 1e-6) return { x: ax + s, y: ay + o };
  const f = s * k;
  const sn = Math.sin(f);
  const cs = Math.cos(f);
  return {
    x: ax + sn / k + o * sn,
    y: ay - (1 - cs) / k + o * cs,
  };
}

function bandPath(
  s0: number,
  s1: number,
  thick: number,
  k: number,
  ax: number,
  ay: number,
  spin: number,
  center: Pt,
) {
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let j = 0; j <= SAMPLES; j++) {
    const s = lerp(s0, s1, j / SAMPLES);
    top.push(unrollPoint(s, -thick / 2, k, ax, ay));
    bot.push(unrollPoint(s, thick / 2, k, ax, ay));
  }
  const pts = [...top, ...bot.reverse()];
  return toPath(spin ? pts.map((q) => rotateAbout(q, center, spin)) : pts);
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ChartMorph({
  data = DEFAULT_DATA,
  suffix = "k",
  caption,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ChartMorphProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const gid = `cm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const list = data.slice(0, 5).map((d) => ({
    ...d,
    value: Math.max(0, d.value),
  }));
  const n = list.length;
  const total = list.reduce((s, d) => s + d.value, 0) || 1;
  let hl = 0;
  list.forEach((d, i) => {
    if (d.value > list[hl].value) hl = i;
  });
  const last = list[n - 1];
  const endCaption = caption ?? `renders in ${last?.label ?? ""}`.trim();

  const cx = width / 2;
  const cy = height / 2;
  const center = { x: cx, y: cy };
  const ringR = height * 0.26;
  const ringT = height * 0.074;
  const barT = height * 0.084;
  const stackW = width * 0.74;
  const gap = 6 * u;
  const L0 = TAU * ringR;

  const heroFill = `url(#${gid}-hero)`;
  const colors = (() => {
    let g = 0;
    return list.map((_, i) =>
      i === hl ? heroFill : p.grays[Math.min(g++, p.grays.length - 1)],
    );
  })();

  let acc = 0;
  const fracs = list.map((d) => {
    const a = acc / total;
    acc += d.value;
    return { a, b: acc / total };
  });

  const segAt = (i: number, L: number) => ({
    s0: (fracs[i].a - 0.5) * L + gap / 2,
    s1: (fracs[i].b - 0.5) * L - gap / 2,
  });

  const stack = list.map((_, i) => {
    const { s0, s1 } = segAt(i, stackW);
    return { x0: cx + s0, x1: cx + s1, w: s1 - s0 };
  });
  const maxW = Math.max(...stack.map((s) => s.w), 1);
  const chartTop = (height - (maxW + 44 * u)) / 2 + 16 * u;
  const yB = chartTop + maxW;
  const spacing = width * 0.15;
  const colA = list.map((_, i) => cx + (i - (n - 1) / 2) * spacing);
  const fx0 = width * 0.12;
  const fx1 = width * 0.69;
  const colB = list.map((_, i) =>
    n > 1 ? lerp(fx0, fx1, i / (n - 1)) : (fx0 + fx1) / 2,
  );
  const P = list.map((_, i) => ({ x: colB[i], y: yB - stack[i].w }));

  const drawK = interpolate(t, [DRAW[0], DRAW[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_DRAW,
  });
  const spin = interpolate(t, [SPIN[0], SPIN[1]], [-0.42, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const un = interpolate(t, [UNROLL[0], UNROLL[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stageIn = interpolate(t, [0, 8], [0, 1], CLAMP);
  const drift = interpolate(t, [0, 182], [-1, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const tipK = list.map((_, i) =>
    interpolate(
      t,
      [TIP_START + i * TIP_STAGGER, TIP_START + i * TIP_STAGGER + TIP_DUR],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    ),
  );
  const colK = list.map((_, i) =>
    interpolate(
      t,
      [
        COLLAPSE_START + i * COLLAPSE_STAGGER,
        COLLAPSE_START + i * COLLAPSE_STAGGER + COLLAPSE_DUR,
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    ),
  );
  const shift = interpolate(
    t,
    [
      COLLAPSE_START,
      COLLAPSE_START + COLLAPSE_DUR + (n - 1) * COLLAPSE_STAGGER,
    ],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const colX = list.map((_, i) => lerp(colA[i], colB[i], shift));

  const lw = 5 * u;
  const chevron = (i: number) => {
    const Pi = P[i];
    const prev = i > 0 ? P[i - 1] : null;
    const next = i < n - 1 ? P[i + 1] : null;
    const dirTo = (a: Pt, b: Pt) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      return { x: dx / l, y: dy / l };
    };
    const dL = prev ? dirTo(prev, Pi) : next ? dirTo(Pi, next) : { x: 1, y: 0 };
    const dR = next ? dirTo(Pi, next) : dL;
    const nL = { x: -dL.y, y: dL.x };
    const nR = { x: -dR.y, y: dR.x };
    const ov = 0.8 * u;
    const mL = prev
      ? {
          x: (prev.x + Pi.x) / 2 - dL.x * ov,
          y: (prev.y + Pi.y) / 2 - dL.y * ov,
        }
      : Pi;
    const mR = next
      ? {
          x: (Pi.x + next.x) / 2 + dR.x * ov,
          y: (Pi.y + next.y) / 2 + dR.y * ov,
        }
      : Pi;
    const sum = { x: nL.x + nR.x, y: nL.y + nR.y };
    const sl = Math.hypot(sum.x, sum.y) || 1;
    const m = { x: sum.x / sl, y: sum.y / sl };
    const ml = Math.min(2, 1 / Math.max(0.3, m.x * nL.x + m.y * nL.y));
    const h = lw / 2;
    return [
      { x: mL.x + nL.x * h, y: mL.y + nL.y * h },
      { x: mL.x - nL.x * h, y: mL.y - nL.y * h },
      { x: Pi.x - m.x * h * ml, y: Pi.y - m.y * h * ml },
      { x: mR.x - nR.x * h, y: mR.y - nR.y * h },
      { x: mR.x + nR.x * h, y: mR.y + nR.y * h },
      { x: Pi.x + m.x * h * ml, y: Pi.y + m.y * h * ml },
    ];
  };

  const barPoly = (i: number) => {
    const xc = colA[i];
    const xl = xc - barT / 2;
    const xr = xc + barT / 2;
    const yT = yB - stack[i].w;
    return [
      { x: xl, y: yB },
      { x: xl, y: yT },
      { x: xc, y: yT },
      { x: xr, y: yT },
      { x: xr, y: yB },
      { x: xc, y: yB },
    ];
  };

  const shapes = list.map((d, i) => {
    if (t < TIP_START) {
      const L = lerp(L0, stackW, un);
      const k = (TAU / L) * (1 - un);
      const thick = lerp(ringT, barT, un);
      const ay = lerp(cy + ringR, cy, un);
      const seg = segAt(i, L);
      const revealFrom = L / 2 - drawK * L;
      const s0 = Math.max(seg.s0, revealFrom);
      if (s0 >= seg.s1)
        return { key: d.label, d: "", color: colors[i], split: undefined };
      return {
        key: d.label,
        d: bandPath(s0, seg.s1, thick, k, cx, ay, spin, center),
        color: colors[i],
        split: undefined,
      };
    }
    if (t < COLLAPSE_START) {
      const e = tipK[i];
      const s = stack[i];
      const pivot0 = { x: s.x0, y: cy + barT / 2 };
      const pivot1 = { x: colA[i] + barT / 2, y: yB };
      const drop = interpolate(e, [0.25, 1], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      const pvl = {
        x: lerp(pivot0.x, pivot1.x, e),
        y: lerp(pivot0.y, pivot1.y, drop),
      };
      const a = (-Math.PI / 2) * e;
      const corners = [
        { x: 0, y: 0 },
        { x: 0, y: -barT },
        { x: s.w, y: -barT },
        { x: s.w, y: 0 },
      ].map((q) => rotateAbout({ x: pvl.x + q.x, y: pvl.y + q.y }, pvl, a));
      return {
        key: d.label,
        d: toPath(corners),
        color: colors[i],
        split: undefined,
      };
    }
    const e = colK[i];
    const from = barPoly(i);
    const to = chevron(i);
    const pts = from.map((q, j) => lerpPt(q, to[j], e));
    const color =
      i === hl ? heroFill : interpolateColors(e, [0, 1], [colors[i], p.line]);
    const toward =
      i === hl
        ? heroFill
        : interpolateColors(
            e,
            [0, 1],
            [colors[i], i < hl ? p.limb[0] : p.limb[2]],
          );
    const split =
      i === hl - 1
        ? { x: pts[2].x, left: color, right: toward }
        : i === hl + 1
          ? { x: pts[2].x, left: toward, right: color }
          : undefined;
    return { key: d.label, d: toPath(pts), color, split };
  });

  const labelsIn = interpolate(t, [TIP_START + 22, TIP_START + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const baseIn = interpolate(t, [TIP_START + 14, TIP_START + 38], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const baseL = lerp(colA[0] - barT, colB[0], shift);
  const baseR = lerp(colA[n - 1] + barT, colB[n - 1], shift);

  const dotsIn = interpolate(t, [LABEL_IN - 6, LABEL_IN + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labIn = interpolate(t, [LABEL_IN, LABEL_IN + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [LABEL_IN + 6, LABEL_IN + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, LABEL_IN + 40], [1.03, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const end = P[n - 1];
  const areaIn = interpolate(t, [LABEL_IN - 6, LABEL_IN + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const areaRise = interpolate(areaIn, [0, 1], [0.4, 1]);
  const endColor = hl === n - 1 ? p.heroDot : p.line;
  const valueText = `${Math.round(last?.value ?? 0)}${suffix}`;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: stageIn }}
          aria-hidden
        >
          <line
            x1={baseL}
            x2={lerp(baseL, baseR, baseIn)}
            y1={yB + 0.5}
            y2={yB + 0.5}
            stroke={p.hair}
            strokeWidth={Math.max(1, u)}
            opacity={baseIn > 0 ? 1 : 0}
          />
          <defs>
            <linearGradient id={`${gid}-hero`} x1={0} y1={1} x2={1} y2={0}>
              <stop offset={0} stopColor={p.limb[0]} />
              <stop offset={0.55 + 0.1 * drift} stopColor={p.limb[1]} />
              <stop offset={1} stopColor={p.limb[2]} />
            </linearGradient>
            <linearGradient
              id={`${gid}-area`}
              gradientUnits="userSpaceOnUse"
              x1={P[0]?.x ?? 0}
              y1={yB}
              x2={end?.x ?? width}
              y2={end?.y ?? 0}
            >
              <stop offset={0} stopColor={p.areaStops[0]} stopOpacity={0.2} />
              <stop
                offset={0.6}
                stopColor={p.areaStops[1]}
                stopOpacity={0.55}
              />
              <stop offset={1} stopColor={p.areaStops[2]} stopOpacity={0.9} />
            </linearGradient>
            <linearGradient
              id={`${gid}-fade`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={end?.y ?? 0}
              x2={0}
              y2={yB}
            >
              <stop offset={0} stopColor="#fff" stopOpacity={1} />
              <stop offset={1} stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask id={`${gid}-mask`}>
              <rect width={width} height={height} fill={`url(#${gid}-fade)`} />
            </mask>
            {shapes.map((s, i) =>
              s.split ? (
                <linearGradient
                  key={s.key}
                  id={`${gid}-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={s.split.x - 0.5}
                  x2={s.split.x + 0.5}
                  y1={0}
                  y2={0}
                >
                  <stop offset="0" stopColor={s.split.left} />
                  <stop offset="0.5" stopColor={s.split.left} />
                  <stop offset="0.5" stopColor={s.split.right} />
                  <stop offset="1" stopColor={s.split.right} />
                </linearGradient>
              ) : null,
            )}
          </defs>
          {areaIn > 0 && n > 1 ? (
            <path
              d={`${P.map((q, i) => `${i ? "L" : "M"} ${q.x.toFixed(2)} ${(yB - (yB - q.y) * areaRise).toFixed(2)}`).join(" ")} L ${P[n - 1].x} ${yB} L ${P[0].x} ${yB} Z`}
              fill={`url(#${gid}-area)`}
              mask={`url(#${gid}-mask)`}
              opacity={areaIn * p.area}
            />
          ) : null}
          {shapes.map((s, i) =>
            s.d ? (
              <path
                key={s.key}
                d={s.d}
                fill={s.split ? `url(#${gid}-${i})` : s.color}
              />
            ) : null,
          )}
          {P.slice(0, n - 1).map((q, i) => (
            <circle
              key={list[i].label}
              cx={q.x}
              cy={q.y}
              r={(4 + 2 * dotsIn) * u}
              fill={p.bg}
              stroke={p.line}
              strokeWidth={2.5 * u}
              opacity={dotsIn}
            />
          ))}
          {end ? (
            <>
              <circle
                cx={end.x}
                cy={end.y}
                r={(10 + 6 * dotsIn) * u}
                fill="none"
                stroke={accent}
                strokeWidth={1.5 * u}
                opacity={0.7 * dotsIn}
              />
              <circle
                cx={end.x}
                cy={end.y}
                r={(5 + 3 * dotsIn) * u}
                fill={endColor}
                opacity={dotsIn}
              />
            </>
          ) : null}
        </svg>

        {list.map((d, i) => (
          <div
            key={d.label}
            style={{
              position: "absolute",
              left: colX[i],
              top: yB + 18 * u,
              transform: `translateX(-50%) translateY(${(1 - labelsIn) * 8 * u}px)`,
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 16 * u,
              letterSpacing: "0.01em",
              color: i === hl ? p.fg : p.muted,
              opacity: labelsIn,
              whiteSpace: "nowrap",
            }}
          >
            {d.label}
          </div>
        ))}

        {end ? (
          <div
            style={{
              position: "absolute",
              left: end.x + 34 * u,
              top: end.y,
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 116 * u,
                lineHeight: 0.92,
                letterSpacing: "-0.05em",
                color: p.fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: labIn,
                transform: `translateX(${(1 - labIn) * -18 * u}px)`,
                filter:
                  labIn < 0.99 ? `blur(${(1 - labIn) * 6 * u}px)` : undefined,
              }}
            >
              {valueText}
            </div>
            <div
              style={{
                marginTop: 10 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 21 * u,
                letterSpacing: "-0.01em",
                color: p.muted,
                whiteSpace: "nowrap",
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 6 * u}px)`,
              }}
            >
              {endCaption}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
