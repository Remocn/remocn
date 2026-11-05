"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { type ReactNode, useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: geist } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

// gradients.sh "rise" palette
const RISE = {
  bg: "#030306",
  c: ["#fff1e2", "#ff8a3d", "#a3301a", "#2a0d0a"],
} as const;

export interface AbacusCountProps {
  value?: number;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const BEADS = 9;
const START = 16;
const TICK = 5;
const CARRY_DELAY = 3;
const MID = [0.37, 0.58, 0.46, 0.63, 0.52];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const BEAD_SPRING = { damping: 14, stiffness: 260, mass: 0.55 };

const THEMES = {
  dark: {
    bg: RISE.bg,
    fg: "#F3F2EF",
    muted: "#8B8A90",
    faint: "#2A2A30",
    bead: "#2E2E34",
    ground: 0.26,
    stops: [RISE.c[0], "#ffb47a", RISE.c[1], "#d4522a"],
    rod: "rgba(255,255,255,0.24)",
    post: "rgba(255,255,255,0.32)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#DAD8D2",
    bead: "#D6D4CE",
    ground: 0,
    stops: ["#ffb47a", RISE.c[1], "#d4522a", RISE.c[2]],
    rod: "rgba(18,18,20,0.26)",
    post: "rgba(18,18,20,0.34)",
    grain: 0.045,
  },
} as const;

function digitAt(v: number, place: number) {
  return Math.floor(v / 10 ** place) % 10;
}

function leadOf(v: number) {
  return v <= 0 ? -1 : Math.floor(Math.log10(v) + 1e-9);
}

function buildSteps(value: number, places: number) {
  const seq: number[] = [0];
  const add = (v: number) => {
    if (v > seq[seq.length - 1] && v <= value) seq.push(v);
  };
  for (const v of [3, 6, 9, 10]) add(v);
  for (let pl = 2; pl < places; pl++) {
    const top = 10 ** pl;
    add(Math.round(top * MID[pl % MID.length]));
    add(top - 1);
    add(top);
  }
  add(value);
  const times: number[] = [START];
  let clock = START;
  for (let k = 1; k < seq.length; k++) {
    const prog = (k - 1) / Math.max(1, seq.length - 2);
    let gap = interpolate(prog, [0, 1], [9, 5]);
    let carry = false;
    for (let pl = 0; pl < places; pl++) {
      if (digitAt(seq[k], pl) < digitAt(seq[k - 1], pl)) carry = true;
    }
    if (carry) gap += 4;
    if (k === seq.length - 1 && k > 1) gap += 6;
    clock += gap;
    times.push(clock);
  }
  return { seq, times };
}

interface Move {
  at: number;
  from: number;
  to: number;
}

function buildMoves(seq: number[], times: number[], places: number) {
  const moves: Move[][][] = [];
  for (let pl = 0; pl < places; pl++) {
    const rod: Move[][] = Array.from({ length: BEADS }, () => []);
    for (let k = 1; k < seq.length; k++) {
      const d0 = digitAt(seq[k - 1], pl);
      const d1 = digitAt(seq[k], pl);
      if (d0 === d1) continue;
      let lowerReset = false;
      for (let q = 0; q < pl; q++) {
        if (digitAt(seq[k], q) < digitAt(seq[k - 1], q)) lowerReset = true;
      }
      const delay = d1 > d0 && lowerReset ? CARRY_DELAY : 0;
      for (let i = 0; i < BEADS; i++) {
        const c0 = i >= BEADS - d0 ? 1 : 0;
        const c1 = i >= BEADS - d1 ? 1 : 0;
        if (c0 === c1) continue;
        const order = c1 > c0 ? BEADS - d0 - 1 - i : i - (BEADS - d0);
        rod[i].push({ at: times[k] + delay + order * 0.7, from: c0, to: c1 });
      }
    }
    moves.push(rod);
  }
  return moves;
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

export function AbacusCount({
  value = 48216,
  label = "renders this week",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: AbacusCountProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const target = Math.max(0, Math.min(999999, Math.round(value)));
  const places = Math.max(3, String(target).length);
  const { seq, times } = useMemo(
    () => buildSteps(target, places),
    [target, places],
  );
  const moves = useMemo(
    () => buildMoves(seq, times, places),
    [seq, times, places],
  );

  let kNow = 0;
  for (let k = 0; k < times.length; k++) if (t >= times[k]) kNow = k;
  const lead = leadOf(seq[kNow]);
  const lastAt = times[times.length - 1];

  const cx = width / 2;
  const cy = height / 2;
  const D = 32 * u;
  const rodGap = 58 * u;
  const pad = 6 * u;
  const travel = 5.5 * D;
  const rodLen = BEADS * D + travel + 2 * pad;
  const postW = 5 * u;
  const numSize = 132 * u;
  const cell = numSize * 0.58;
  const commaW = numSize * 0.28;
  const commas = Math.floor((places - 1) / 3);
  const readW = places * cell + commas * commaW;
  const gapX = 88 * u;
  const totalW = rodLen + 2 * postW + gapX + readW;
  const x0 = cx - totalW / 2 + postW;
  const x1 = x0 + rodLen;
  const readX = x1 + postW + gapX;
  const abH = (places - 1) * rodGap;
  const rodY = (row: number) => cy - abH / 2 + row * rodGap;
  const postTop = rodY(0) - D / 2 - 18 * u;
  const postBot = rodY(places - 1) + D / 2 + 18 * u;

  const restX = (i: number) => x0 + pad + i * D + D / 2;
  const countX = (i: number) => x1 - pad - (BEADS - 1 - i) * D - D / 2;

  const frameIn = interpolate(t, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, lastAt + 40], [0.985, 1.01], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const gradId = `ab${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drift = interpolate(t, [0, lastAt + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const leadGrad = `linear-gradient(${165 - 10 * drift}deg, ${p.stops[0]} 0%, ${p.stops[1]} 30%, ${p.stops[2]} 66%, ${p.stops[3]} 100%)`;

  const rodsEls: ReactNode[] = [];
  const beadEls: ReactNode[] = [];
  for (let row = 0; row < places; row++) {
    const pl = places - 1 - row;
    const y = rodY(row);
    const rodK = interpolate(t, [2 + row * 2, 18 + row * 2], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    rodsEls.push(
      <line
        key={`r${pl}`}
        x1={x0}
        y1={y}
        x2={x0 + rodLen * rodK}
        y2={y}
        stroke={p.rod}
        strokeWidth={Math.max(1, 1.5 * u)}
      />,
    );
    const xs: number[] = [];
    const states: number[] = [];
    for (let i = 0; i < BEADS; i++) {
      let st = i >= BEADS - digitAt(seq[0], pl) ? 1 : 0;
      for (const m of moves[pl][i]) {
        if (t < m.at) break;
        st +=
          (m.to - m.from) *
          spring({ frame: t - m.at, fps, config: BEAD_SPRING });
      }
      states.push(st);
      xs.push(restX(i) + (countX(i) - restX(i)) * st);
    }
    for (let i = 1; i < BEADS; i++) xs[i] = Math.max(xs[i], xs[i - 1] + D);
    for (let i = BEADS - 2; i >= 0; i--) xs[i] = Math.min(xs[i], xs[i + 1] - D);
    for (let i = 0; i < BEADS; i++) {
      const bIn = interpolate(
        t,
        [6 + row * 2 + i * 0.6, 14 + row * 2 + i * 0.6],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const by = y + (1 - bIn) * -6 * u;
      const br = D / 2 - 0.75 * u;
      const lit = Math.max(0, Math.min(1, states[i]));
      beadEls.push(
        <g key={`b${pl}-${i.toString()}`} opacity={bIn}>
          <circle cx={xs[i]} cy={by} r={br} fill={p.bead} />
          {lit > 0 ? (
            <circle
              cx={xs[i]}
              cy={by}
              r={br}
              fill={`url(#${gradId})`}
              opacity={lit}
            />
          ) : null}
        </g>,
      );
    }
  }

  const digitEls: ReactNode[] = [];
  for (let pl = places - 1; pl >= 0; pl--) {
    let kc = 0;
    for (let k = 1; k <= kNow; k++) {
      if (digitAt(seq[k], pl) !== digitAt(seq[k - 1], pl)) kc = k;
    }
    const tick =
      kc === 0
        ? 1
        : interpolate(t, [times[kc], times[kc] + TICK], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
    const dNew = digitAt(seq[kc], pl);
    const isLead = pl === lead;
    const color = pl > lead ? p.faint : isLead ? "transparent" : p.fg;
    digitEls.push(
      <span
        key={`d${pl}`}
        style={{
          display: "inline-block",
          width: cell,
          textAlign: "center",
          color,
          ...(isLead
            ? {
                backgroundImage: leadGrad,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }
            : null),
          opacity: 0.8 + 0.2 * tick,
          transform: `translateY(${(1 - tick) * 6}%)`,
        }}
      >
        {dNew}
      </span>,
    );
    if (pl > 0 && pl % 3 === 0) {
      digitEls.push(
        <span
          key={`c${pl}`}
          style={{
            display: "inline-block",
            width: commaW,
            textAlign: "center",
            color: pl > lead ? p.faint : p.fg,
          }}
        >
          ,
        </span>,
      );
    }
  }

  const labelIn = interpolate(t, [lastAt + 6, lastAt + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const blockH = numSize * 1.12 + 10 * u + 24 * u * 1.3;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(75% 55% at ${46 + 6 * drift}% 112%, color-mix(in oklab, ${RISE.c[2]} ${p.ground * 100}%, transparent) 0%, color-mix(in oklab, ${RISE.c[3]} ${p.ground * 100}%, transparent) 45%, transparent 100%)`,
          opacity: frameIn,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <g opacity={frameIn}>
            <rect
              x={x0 - postW}
              y={postTop}
              width={postW}
              height={postBot - postTop}
              rx={postW / 2}
              fill={p.post}
            />
            <rect
              x={x1}
              y={postTop}
              width={postW}
              height={postBot - postTop}
              rx={postW / 2}
              fill={p.post}
            />
          </g>
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={x1 - travel * (1.1 + 0.15 * drift)}
              y1={postTop}
              x2={x1}
              y2={postBot}
            >
              <stop offset="0" stopColor={p.stops[0]} />
              <stop offset="0.34" stopColor={p.stops[1]} />
              <stop offset="0.7" stopColor={p.stops[2]} />
              <stop offset="1" stopColor={p.stops[3]} />
            </linearGradient>
          </defs>
          {rodsEls}
          {beadEls}
        </svg>

        <div
          style={{
            position: "absolute",
            left: readX,
            top: cy - blockH / 2,
            opacity: frameIn,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: geist,
              fontWeight: 300,
              fontSize: numSize,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {digitEls}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              marginTop: 10 * u,
              paddingLeft: numSize * 0.06,
              fontFamily: geist,
              fontWeight: 400,
              fontSize: 24 * u,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: p.muted,
              whiteSpace: "nowrap",
              opacity: labelIn,
              transform: `translateY(${(1 - labelIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
