"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/** gradients.sh "swirl" palette, light core to deep rim. */
const SWIRL = ["#ffe2c4", "#ff9a4d", "#d2456b", "#3a1f6b"] as const;

function mixHex(a: string, b: string, k: number) {
  const ch = (h: string, o: number) => Number.parseInt(h.slice(o, o + 2), 16);
  const m = (o: number) => Math.round(ch(a, o) + (ch(b, o) - ch(a, o)) * k);
  return `rgb(${m(1)}, ${m(3)}, ${m(5)})`;
}

export interface BubbleItem {
  label: string;
  value: number;
}

export interface BubblePackProps {
  items?: BubbleItem[];
  highlight?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ITEMS: BubbleItem[] = [
  { label: "Launch videos", value: 420 },
  { label: "Demos", value: 180 },
  { label: "Changelogs", value: 150 },
  { label: "Social clips", value: 130 },
  { label: "Onboarding", value: 96 },
  { label: "Ads", value: 84 },
  { label: "Tutorials", value: 70 },
  { label: "Recaps", value: 58 },
  { label: "Teasers", value: 46 },
  { label: "Pitches", value: 38 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#9A999F",
    ramp: ["#3A3A40", "#222226"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    ramp: ["#D2D0CA", "#E7E5E0"],
    grain: 0.045,
  },
} as const;

const GROW_IN = 4;
const STAGGER = 3;
const ACC_START = 46;
const ACC_END = 86;
const SUB = 3;
const SQUASH = 2.1;

interface V {
  x: number;
  y: number;
}

function tangents(
  a: V & { r: number },
  b: V & { r: number },
  r: number,
  gap: number,
) {
  const da = a.r + r + gap;
  const db = b.r + r + gap;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d > da + db || d < Math.abs(da - db) || d === 0) return [];
  const along = (da * da - db * db + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, da * da - along * along));
  const mx = a.x + (dx * along) / d;
  const my = a.y + (dy * along) / d;
  return [
    { x: mx + (h * dy) / d, y: my - (h * dx) / d },
    { x: mx - (h * dy) / d, y: my + (h * dx) / d },
  ];
}

function place(placed: (V & { r: number })[], r: number, gap: number): V {
  if (placed.length === 0) return { x: 0, y: 0 };
  if (placed.length === 1)
    return { x: placed[0].x + placed[0].r + r + gap, y: 0 };
  let best: V = { x: 0, y: 0 };
  let score = Number.POSITIVE_INFINITY;
  const o = placed[0];
  for (const side of [-1, 1]) {
    const c = { x: o.x + side * (o.r + r + gap), y: o.y };
    const ok = placed.every(
      (q) => Math.hypot(q.x - c.x, q.y - c.y) >= q.r + r + gap - 0.01,
    );
    const sc = c.x * c.x + 1;
    if (ok && sc < score) {
      score = sc;
      best = c;
    }
  }
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      for (const c of tangents(placed[i], placed[j], r, gap)) {
        const ok = placed.every(
          (q) => Math.hypot(q.x - c.x, q.y - c.y) >= q.r + r + gap - 0.01,
        );
        if (!ok) continue;
        const s = c.x * c.x + (c.y * SQUASH) ** 2;
        if (s < score) {
          score = s;
          best = c;
        }
      }
    }
  }
  return best;
}

function bounds(cs: (V & { r: number })[]) {
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  for (const c of cs) {
    x0 = Math.min(x0, c.x - c.r);
    y0 = Math.min(y0, c.y - c.r);
    x1 = Math.max(x1, c.x + c.r);
    y1 = Math.max(y1, c.y + c.r);
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

function accentRadius(frame: number, seed: number, full: number) {
  const k = interpolate(frame, [ACC_START, ACC_END], [0, 1], {
    ...CLAMP,
    easing: EASE_GROW,
  });
  return seed + (full - seed) * k;
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function formatValue(v: number) {
  return Math.round(v).toLocaleString("en-US");
}

export function BubblePack({
  items = DEFAULT_ITEMS,
  highlight = 0,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BubblePackProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const model = useMemo(() => {
    const src = items.slice(0, 16).map((it, i) => ({
      ...it,
      i,
      value: Math.max(0, it.value),
    }));
    const hlIdx = Math.min(Math.max(0, Math.round(highlight)), src.length - 1);
    const vmax = Math.max(1, ...src.map((s) => s.value));
    const Rmax = 172 * u;
    const gap = 6 * u;
    const rad = (v: number) => Math.max(10 * u, Rmax * Math.sqrt(v / vmax));
    const hero = src[hlIdx];
    const grays = src
      .filter((s) => s.i !== hlIdx)
      .sort((a, b) => b.value - a.value)
      .map((s, rank) => ({ ...s, r: rad(s.value), rank }));

    const seedR = 14 * u;
    const RA = rad(hero?.value ?? vmax);
    const S: V = { x: 0, y: 0 };
    const finals: (V & { r: number })[] = [{ ...S, r: RA }];
    for (const g of grays) {
      const c = place(finals, g.r, gap);
      finals.push({ ...c, r: g.r });
    }

    const back: V[][] = [];
    const pos = finals.slice(1).map((c) => ({ x: c.x, y: c.y }));
    back.push(pos.map((q) => ({ x: q.x, y: q.y })));
    for (let f = ACC_END - 1; f >= ACC_START; f--) {
      for (let s = 0; s < SUB; s++) {
        const ff = f + 1 - (s + 1) / SUB;
        const ra = accentRadius(ff, seedR, RA);
        const pull = 0.04;
        for (const q of pos) {
          q.x += (S.x - q.x) * pull;
          q.y += (S.y - q.y) * Math.min(0.5, pull * SQUASH);
        }
        for (let it = 0; it < 5; it++) {
          for (let i = 0; i < pos.length; i++) {
            const a = pos[i];
            const ri = grays[i].r;
            let dx = a.x - S.x;
            let dy = a.y - S.y;
            let d = Math.hypot(dx, dy);
            const minA = ri + ra + gap;
            if (d < minA) {
              if (d < 1e-6) {
                dx = Math.cos(i);
                dy = Math.sin(i);
                d = 1;
              }
              const o = minA - d;
              a.x += (dx / d) * o;
              a.y += (dy / d) * o;
            }
            for (let j = i + 1; j < pos.length; j++) {
              const b = pos[j];
              const rj = grays[j].r;
              let ex = b.x - a.x;
              let ey = b.y - a.y;
              let e = Math.hypot(ex, ey);
              const min = ri + rj + gap;
              if (e >= min) continue;
              if (e < 1e-6) {
                ex = Math.cos(i + j);
                ey = Math.sin(i + j);
                e = 1;
              }
              const o = min - e;
              const wa = (rj * rj) / (ri * ri + rj * rj);
              a.x -= (ex / e) * o * wa;
              a.y -= (ey / e) * o * wa;
              b.x += (ex / e) * o * (1 - wa);
              b.y += (ey / e) * o * (1 - wa);
            }
          }
        }
      }
      back.push(pos.map((q) => ({ x: q.x, y: q.y })));
    }
    const frames = back.reverse();
    const placed = frames[0].map((q, i) => ({ ...q, r: grays[i].r }));
    const pb = bounds(placed);
    const order = placed
      .map((q, i) => ({ i, d: Math.hypot(q.x - pb.cx, (q.y - pb.cy) * 1.3) }))
      .sort((a, b) => a.d - b.d);
    const seq = new Array<number>(placed.length);
    order.forEach((o, k) => {
      seq[o.i] = k;
    });

    const availW = width * 0.84;
    const availH = height * 0.8;
    const fit = (cs: (V & { r: number })[]) => {
      const b = bounds(cs);
      return {
        cx: b.cx,
        cy: b.cy,
        s: Math.min(1.18, availW / b.w, availH / b.h),
      };
    };
    const camA = fit(placed);
    const raw = frames.map((fr, k) =>
      fit([
        ...fr.map((q, i) => ({ ...q, r: grays[i].r })),
        { ...S, r: accentRadius(ACC_START + k, seedR, RA) },
      ]),
    );
    const W = 7;
    const cams = raw.map((_, k) => {
      let cx = 0;
      let cy = 0;
      let sc = 0;
      let n = 0;
      for (let j = k - W; j <= k + W; j++) {
        const c = j < 0 ? camA : raw[Math.min(j, raw.length - 1)];
        cx += c.cx;
        cy += c.cy;
        sc += c.s;
        n++;
      }
      return { cx: cx / n, cy: cy / n, s: Math.min(sc / n, raw[k].s * 1.01) };
    });
    return { grays, hero, placed, frames, S, seedR, RA, camA, cams, seq };
  }, [items, highlight, u, width, height]);

  const { grays, hero, placed, frames, S, seedR, RA, camA, cams, seq } = model;

  const sample = (i: number) => {
    if (t <= ACC_START) return placed[i];
    const k = Math.min(t - ACC_START, frames.length - 1);
    const f0 = Math.floor(k);
    const f1 = Math.min(f0 + 1, frames.length - 1);
    const w = k - f0;
    return {
      x: frames[f0][i].x * (1 - w) + frames[f1][i].x * w,
      y: frames[f0][i].y * (1 - w) + frames[f1][i].y * w,
    };
  };

  const camAt = (() => {
    if (t <= ACC_START) return camA;
    const k = Math.min(t - ACC_START, cams.length - 1);
    const f0 = Math.floor(k);
    const f1 = Math.min(f0 + 1, cams.length - 1);
    const w = k - f0;
    return {
      cx: cams[f0].cx * (1 - w) + cams[f1].cx * w,
      cy: cams[f0].cy * (1 - w) + cams[f1].cy * w,
      s: cams[f0].s * (1 - w) + cams[f1].s * w,
    };
  })();
  const ccx = camAt.cx;
  const ccy = camAt.cy;
  const drift = interpolate(t, [0, ACC_END + 60], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const cs = camAt.s * (0.985 + 0.015 * drift);
  const toScreen = (q: V) => ({
    x: width / 2 + (q.x - ccx) * cs,
    y: height / 2 + (q.y - ccy) * cs,
  });

  const ra = accentRadius(t, seedR, RA);
  const accOpacity = interpolate(
    t,
    [ACC_START - 2, ACC_START + 6],
    [0, 1],
    CLAMP,
  );
  const heroIn = interpolate(t, [ACC_END - 8, ACC_END + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const heroLab = interpolate(t, [ACC_END - 2, ACC_END + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [ACC_END - 8, ACC_END + 22], [0.5, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const quiet = interpolate(t, [ACC_START, ACC_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const nG = Math.max(1, grays.length - 1);
  const shade = (rank: number) => {
    const k = rank / nG;
    const a = p.ramp[0];
    const b = p.ramp[1];
    const ch = (s: string, o: number) => Number.parseInt(s.slice(o, o + 2), 16);
    const mix = (o: number) => Math.round(ch(a, o) + (ch(b, o) - ch(a, o)) * k);
    return `rgb(${mix(1)}, ${mix(3)}, ${mix(5)})`;
  };

  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const sc = toScreen(S);
  const heroR = ra * cs;
  const heroFont = Math.min(136 * u, heroR * 0.68);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {grays.map((g, i) => {
          const start = GROW_IN + seq[i] * STAGGER;
          const k = spring({
            frame: t - start,
            fps,
            config: { damping: 15, stiffness: 120, mass: 0.7 },
          });
          const o = interpolate(t, [start, start + 6], [0, 1], CLAMP);
          const q = toScreen(sample(i));
          return (
            <circle
              key={g.label + g.i}
              cx={q.x}
              cy={q.y}
              r={Math.max(0, g.r * cs * (0.6 + 0.4 * k))}
              fill={shade(g.rank)}
              opacity={o}
            />
          );
        })}
        <defs>
          <linearGradient
            id={`${gid}h`}
            x1={0.15}
            y1={0}
            x2={0.85}
            y2={1}
            gradientTransform={`rotate(${-10 + 14 * drift} 0.5 0.5)`}
          >
            <stop offset={0} stopColor={SWIRL[0]} />
            <stop offset={0.22} stopColor={SWIRL[1]} />
            <stop offset={0.58} stopColor={SWIRL[2]} />
            <stop offset={1} stopColor={mixHex(SWIRL[3], accent, 0.25)} />
          </linearGradient>
        </defs>
        {hero ? (
          <circle
            cx={sc.x}
            cy={sc.y}
            r={heroR}
            fill={`url(#${gid}h)`}
            opacity={accOpacity}
          />
        ) : null}
      </svg>

      {grays.map((g, i) => {
        const rs = g.r * cs;
        const nameSize = 16 * u;
        const fits =
          rs >= 44 * u && g.label.length * nameSize * 0.56 <= rs * 1.6;
        if (!fits) return null;
        const start = GROW_IN + seq[i] * STAGGER + 8;
        const a = interpolate(t, [start, start + 12], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const q = toScreen(sample(i));
        return (
          <div
            key={g.label + g.i}
            style={{
              position: "absolute",
              left: q.x,
              top: q.y,
              transform: `translate(-50%, -50%) translateY(${(1 - a) * 5 * u}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2 * u,
              opacity: a * (1 - 0.25 * quiet),
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: nameSize,
                letterSpacing: "-0.01em",
                color: p.fg,
              }}
            >
              {g.label}
            </span>
            <span
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 15 * u,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatValue(g.value)}
            </span>
          </div>
        );
      })}

      {hero ? (
        <div
          style={{
            position: "absolute",
            left: sc.x,
            top: sc.y,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: heroFont,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
              opacity: heroIn,
              filter:
                heroIn < 0.99 ? `blur(${(1 - heroIn) * 8 * u}px)` : undefined,
              transform: `translateY(${(1 - heroIn) * 16 * u}px)`,
            }}
          >
            {formatValue(hero.value * count)}
          </span>
          <span
            style={{
              marginTop: 8 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 25 * u,
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.92)",
              opacity: heroLab,
              transform: `translateY(${(1 - heroLab) * 8 * u}px)`,
            }}
          >
            {hero.label}
          </span>
        </div>
      ) : null}

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
