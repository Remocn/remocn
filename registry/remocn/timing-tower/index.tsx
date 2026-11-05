"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Saira";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: saira } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

export interface TimingTowerProps {
  /** Three-letter code of the hero car, the one that climbs to P1. */
  code?: string;
  /** The nine other cars, leader first. The hero starts behind the seventh. */
  field?: string[];
  /** Lap the tower opens on. One lap ticks per overtake. */
  lap?: number;
  /** Race distance shown after the slash in the lap counter. */
  laps?: number;
  /** The poster's interval to P2. */
  interval?: string;
  /** Small label over the poster interval. */
  intervalLabel?: string;
  /** The live dot in the tower header. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 4, 30fps, speed 1):
//   0–16   the tower wipes in from the left edge, header first, rows staggered
//          2 frames apart; the giant "P8" rises on the right
//  14–93   seven laps, one every ~11 frames, the gaps rewriting on each tick:
//          the hero swaps up one row per lap (9-frame eased swap, nudged out
//          of line while it passes), the row and the giant numeral flash the
//          aurora "personal best" green, the numeral rolls to the new place;
//          a few other cars swap behind it so the whole tower lives
//  93      P1: the hero row and the numeral turn aurora purple for good
// 110–130  the tower peels off to the left, bottom row first; the numeral
//          slides left and the code, team logo and interval wipe in beside it
// 130–     poster hold: "P1 · RMC" with the interval counted up to +12.408
const LAP_AT = [14, 28, 41, 53, 64, 74, 84];
const SWAP = 9;
const EXIT_AT = 110;

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const SWAP_EASE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT_EASE = Easing.bezier(0.55, 0, 0.85, 0.35);
const MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "aurora": bg #03050b, #a0f0c8 #3fb5a3 #5147b6 #b25c9c.
const AURORA = ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"] as const;
const GREEN = `linear-gradient(180deg, ${AURORA[0]} 0%, ${AURORA[1]} 100%)`;
const PURPLE = `linear-gradient(165deg, ${AURORA[3]} 0%, #7A4FB8 45%, ${AURORA[2]} 100%)`;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    row: "#141417",
    rowEdge: "#1F1F23",
    pos: "#F3F2EF",
    posInk: "#0A0A0B",
    head: "#1C1C20",
    ink: "#F3F2EF",
    dim: "#8A8990",
    faint: "#3A3A40",
    stripes: ["#6E6D74", "#4E4D54", "#9A99A0", "#5E5D64", "#3E3D44"],
    greenInk: AURORA[0],
    ground: 1,
  },
  light: {
    stage: "#F5F4F0",
    row: "#FFFFFF",
    rowEdge: "#E6E4DE",
    pos: "#121214",
    posInk: "#F5F4F0",
    head: "#121214",
    ink: "#121214",
    dim: "#7E7D77",
    faint: "#C9C7C0",
    stripes: ["#9A9993", "#BDBBB4", "#6E6D68", "#AEACA5", "#85847E"],
    greenInk: "#1F8C7B",
    ground: 0.55,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** Up in 1 frame, eases back over `len`. */
function flash(d: number, len: number) {
  if (d < 0 || d > len + 1) return 0;
  if (d < 1) return d;
  const k = 1 - (d - 1) / len;
  return k * k;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Swaps per lap, as slot pairs (0 = P1). The first pair of every lap is the
// hero passing the car ahead; the rest shuffle the field behind it.
const SWAPS: number[][][] = [
  [[6, 7]],
  [
    [5, 6],
    [2, 3],
  ],
  [
    [4, 5],
    [8, 9],
  ],
  [[3, 4]],
  [
    [2, 3],
    [6, 7],
  ],
  [[1, 2]],
  [
    [0, 1],
    [8, 9],
  ],
];

export function TimingTower({
  code = "RMC",
  field = ["KRV", "DLA", "MTS", "BRN", "OKO", "VAL", "PIR", "SAN", "TOR"],
  lap = 41,
  laps = 58,
  interval = "+12.408",
  intervalLabel = "Gap to P2",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TimingTowerProps) {
  // Starts four frames in, so frame 0 already shows the tower wiping in.
  const t = useCurrentFrame() * speed + 4;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  // ── Orders per lap ────────────────────────────────────────────────────────
  const cars = [...field.slice(0, 7), code, ...field.slice(7, 9)];
  const hero = 7;
  const orders: number[][] = [cars.map((_, i) => i)];
  for (const pairs of SWAPS) {
    const next = [...orders[orders.length - 1]];
    for (const [a, b] of pairs) {
      const tmp = next[a];
      next[a] = next[b];
      next[b] = tmp;
    }
    orders.push(next);
  }
  let k = 0;
  while (k < LAP_AT.length && t >= LAP_AT[k]) k++;
  const from = orders[Math.max(0, k - 1)];
  const to = orders[k];
  const swapP = k === 0 ? 1 : SWAP_EASE(ramp(t, LAP_AT[k - 1], SWAP));
  const slotIn = (order: number[], car: number) => order.indexOf(car);
  const heroSlot = slotIn(to, hero);
  const heroPos = heroSlot + 1;
  const p1At = LAP_AT[LAP_AT.length - 1];
  const p1 = SWAP_EASE(ramp(t, p1At + SWAP - 1, 6));

  // ── Layout ────────────────────────────────────────────────────────────────
  const towerX = 64 * u;
  const towerW = 388 * u;
  const headH = 58 * u;
  const pitch = 50 * u;
  const rowH = 46 * u;
  const towerY = (H - (headH + 8 * u + 10 * pitch - (pitch - rowH))) / 2;
  const rowsY = towerY + headH + 8 * u;
  const posW = 50 * u;

  const enter = (delay: number) => EASE(ramp(t, delay, 9));
  const exitP = (slot: number) =>
    EXIT_EASE(ramp(t, EXIT_AT + (9 - slot) * 0.8, 9));
  const exitDX = towerX + towerW + 60 * u;

  const lapNow = lap + k;
  const lapFlash = k > 0 ? flash(t - LAP_AT[k - 1], 8) : 0;

  // Interval to the car ahead: rewritten every lap, leader shows "Leader".
  const gapText = (slot: number) => {
    if (slot === 0) return "Leader";
    const v = 0.18 + 1.6 * hash(slot * 13.1 + k * 7.7);
    return `+${v.toFixed(3)}`;
  };

  // Hero flash on every pass.
  const passFlash = LAP_AT.reduce(
    (a, at) => Math.max(a, flash(t - at - 3, 12)),
    0,
  );

  // ── Giant numeral & poster ────────────────────────────────────────────────
  const giantFs = 400 * u;
  const cellW = 0.58 * giantFs;
  const posterP = MOVE(ramp(t, EXIT_AT + 7, 18));
  const blockIn = (d: number) => EASE(ramp(t, EXIT_AT + 15 + d, 12));
  const giantShift = (1 - posterP) * 420 * u;
  const giantIn = EASE(ramp(t, 6, 12));
  const intervalNum = Number.parseFloat(interval.replace(/[^0-9.]/g, "")) || 0;
  const decimals = (interval.split(".")[1] ?? "").length;
  const countP = Easing.bezier(0.22, 1, 0.36, 1)(ramp(t, EXIT_AT + 19, 18));
  const intervalText = `${interval.trim().startsWith("-") ? "−" : "+"}${(intervalNum * countP).toFixed(decimals)}`;

  // Which digit is rolling in the giant numeral.
  const lastPass = k > 0 ? LAP_AT[k - 1] : -100;
  const rollP = SWAP_EASE(ramp(t, lastPass + 2, 8));
  const prevPos = k > 0 ? slotIn(from, hero) + 1 : heroPos;

  // One glyph, stacked: ink, then the green flash and the purple P1 fill as
  // clip-text copies on top (each glyph clips its own gradient).
  const glyph = (ch: string | number) => {
    const fills: [string, number][] = [
      [GREEN, passFlash * (1 - p1)],
      [PURPLE, p1],
    ];
    return (
      <span style={{ position: "relative", display: "inline-block" }}>
        <span style={{ color: c.ink, opacity: 1 - p1 }}>{ch}</span>
        {fills.map(([fill, op]) =>
          op > 0 ? (
            <span
              key={fill}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: op,
                backgroundImage: fill,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {ch}
            </span>
          ) : null,
        )}
      </span>
    );
  };

  const digitLayer = (n: number, y: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: cellW,
        height: giantFs,
        transform: `translateY(${y}px)`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {glyph(n)}
    </div>
  );

  const giantText = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        fontFamily: saira,
        fontWeight: 500,
        fontSize: giantFs,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {glyph("P")}
      <div
        style={{
          position: "relative",
          width: cellW,
          height: giantFs,
          overflow: "hidden",
          marginLeft: -0.02 * giantFs,
        }}
      >
        {rollP < 1 && prevPos !== heroPos
          ? [
              digitLayer(prevPos, -rollP * giantFs, "out"),
              digitLayer(heroPos, (1 - rollP) * giantFs, "in"),
            ]
          : digitLayer(heroPos, 0, "now")}
      </div>
    </div>
  );

  const giantW = 0.62 * giantFs + cellW;

  // Aurora ground under the poster, gently drifting.
  const drift = interpolate(t, [0, 165], [0, 8], CLAMP);
  const ground = [
    `radial-gradient(34% 60% at ${62 - drift}% 30%, color-mix(in oklab, ${AURORA[3]} 55%, transparent) 0%, transparent 70%)`,
    `radial-gradient(34% 60% at ${84 - drift}% 38%, color-mix(in oklab, ${AURORA[2]} 65%, transparent) 0%, transparent 70%)`,
    `radial-gradient(30% 55% at ${30 + drift}% 34%, color-mix(in oklab, ${AURORA[1]} 35%, transparent) 0%, transparent 70%)`,
    `linear-gradient(180deg, transparent 40%, color-mix(in oklab, ${AURORA[2]} 30%, transparent) 72%, transparent 100%)`,
  ].join(", ");
  const groundOp = c.ground * (0.25 * giantIn + 0.75 * p1);

  // Rows, hero rendered last so it passes over the others.
  const drawOrder = cars.map((_, i) => i).filter((i) => i !== hero);
  drawOrder.push(hero);

  const rows = drawOrder.map((car) => {
    const a = slotIn(from, car);
    const b = slotIn(to, car);
    const slot = a + (b - a) * swapP;
    const settled = b;
    const isHero = car === hero;
    const passing = a !== b && b < a ? Math.sin(Math.PI * swapP) : 0;
    const ent = enter(3 + settled * 1.2);
    const ex = exitP(settled);
    const x = towerX - (1 - ent) * (towerW + towerX) - ex * exitDX;
    const y = rowsY + slot * pitch;
    const stripe = isHero ? PURPLE : c.stripes[(car * 3) % c.stripes.length];
    return (
      <div
        key={cars[car]}
        style={{
          position: "absolute",
          left: x + posW + 4 * u + passing * 14 * u,
          top: y,
          width: towerW - posW - 4 * u,
          height: rowH,
          background: c.row,
          boxShadow: `inset 0 0 0 ${1 * u}px ${c.rowEdge}`,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {isHero ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, ${AURORA[1]} 0%, color-mix(in oklab, ${AURORA[1]} 25%, transparent) 100%)`,
                opacity: passFlash * (1 - p1) * 0.85,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, ${AURORA[3]} 0%, #7A4FB8 40%, ${AURORA[2]} 100%)`,
                clipPath: `inset(0 ${(1 - p1) * 100}% 0 0)`,
              }}
            />
          </>
        ) : null}
        <div
          style={{
            position: "relative",
            width: 6 * u,
            height: rowH - 16 * u,
            marginLeft: 12 * u,
            background: isHero ? GREEN : stripe,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            position: "relative",
            marginLeft: 14 * u,
            fontFamily: saira,
            fontWeight: 500,
            fontSize: 27 * u,
            letterSpacing: "0.06em",
            color: isHero && (p1 > 0.5 || passFlash > 0.4) ? "#FFFFFF" : c.ink,
            flex: 1,
            paddingTop: 1 * u,
          }}
        >
          {cars[car]}
        </div>
        <div
          style={{
            position: "relative",
            marginRight: 18 * u,
            fontFamily: saira,
            fontWeight: 400,
            fontSize: 22 * u,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: settled === 0 ? "0.08em" : "0.01em",
            textTransform: "uppercase",
            color: isHero && p1 > 0.5 ? "#FFFFFF" : c.dim,
          }}
        >
          {gapText(settled)}
        </div>
      </div>
    );
  });

  // Position boxes stay put; the cars move past them.
  const posBoxes = cars.map((_, s) => {
    const ent = enter(3 + s * 1.2);
    const ex = exitP(s);
    return (
      <div
        key={`pos-${s + 1}`}
        style={{
          position: "absolute",
          left: towerX - (1 - ent) * (towerW + towerX) - ex * exitDX,
          top: rowsY + s * pitch,
          width: posW,
          height: rowH,
          background: c.pos,
          color: c.posInk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: saira,
          fontWeight: 500,
          fontSize: 25 * u,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {s + 1}
      </div>
    );
  });

  const headEnt = enter(0);
  const headEx = exitP(-1);

  const label: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 16 * u,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: c.dim,
  };

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ground,
          opacity: groundOp,
        }}
      />

      {/* Tower header: lap counter. */}
      <div
        style={{
          position: "absolute",
          left: towerX - (1 - headEnt) * (towerW + towerX) - headEx * exitDX,
          top: towerY,
          width: towerW,
          height: headH,
          background: c.head,
          display: "flex",
          alignItems: "center",
          paddingLeft: 18 * u,
          paddingRight: 18 * u,
          gap: 12 * u,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            height: 4 * u,
            background: `linear-gradient(90deg, ${AURORA[0]} 0%, ${AURORA[1]} 35%, ${AURORA[2]} 70%, ${AURORA[3]} 100%)`,
          }}
        />
        <div
          style={{
            width: 9 * u,
            height: 9 * u,
            background: accent,
            opacity: Math.floor(t / 15) % 2 === 0 ? 1 : 0.35,
          }}
        />
        <div
          style={{
            fontFamily: saira,
            fontWeight: 500,
            fontSize: 26 * u,
            letterSpacing: "0.08em",
            color: "#F3F2EF",
            flex: 1,
            paddingTop: 2 * u,
          }}
        >
          LAP{" "}
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              color: lapFlash > 0.3 ? AURORA[0] : "#F3F2EF",
            }}
          >
            {lapNow}
          </span>
          <span style={{ color: "#8A8990" }}>/{laps}</span>
        </div>
        <div style={{ ...label, color: "#8A8990", fontSize: 13 * u }}>
          Interval
        </div>
      </div>

      {posBoxes}
      {rows}

      {/* Giant numeral; slides left into the poster with the info block. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 52 * u,
            transform: `translateX(${giantShift}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: giantW,
              height: giantFs,
              transform: `translateY(${(1 - giantIn) * 60 * u}px)`,
              opacity: giantIn,
            }}
          >
            <div
              style={{
                ...label,
                position: "absolute",
                left: 0.02 * giantFs,
                top: 0.06 * giantFs,
                opacity: 1 - posterP,
              }}
            >
              {code} · Position
            </div>
            {giantText}
          </div>

          {/* Poster block: code, team, interval. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: 400 * u,
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontFamily: saira,
                  fontWeight: 500,
                  fontSize: 150 * u,
                  lineHeight: 0.9,
                  letterSpacing: "0.02em",
                  color: c.ink,
                  transform: `translateY(${(1 - blockIn(0)) * 100}%)`,
                }}
              >
                {code}
              </div>
            </div>
            <div
              style={{
                marginTop: 18 * u,
                opacity: blockIn(3),
                transform: `translateX(${(1 - blockIn(3)) * -30 * u}px)`,
              }}
            >
              <RemocnLogo fontSize={46 * u} color={c.ink} />
            </div>
            <div
              style={{
                marginTop: 34 * u,
                width: 360 * u,
                height: 2 * u,
                background: c.faint,
                transformOrigin: "0 0",
                transform: `scaleX(${blockIn(5)})`,
              }}
            />
            <div
              style={{
                ...label,
                marginTop: 16 * u,
                opacity: blockIn(6),
              }}
            >
              {intervalLabel}
            </div>
            <div
              style={{
                marginTop: 4 * u,
                fontFamily: saira,
                fontWeight: 500,
                fontSize: 78 * u,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                color: c.greenInk,
                opacity: blockIn(6),
                transform: `translateX(${(1 - blockIn(6)) * -30 * u}px)`,
              }}
            >
              {intervalText}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
