"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Tektur";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: tektur } = loadFont("normal", {
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

export interface BracketWinProps {
  /**
   * The seven teams remocn plays through, in bracket order after remocn:
   * [QF opponent, the two teams of the other left quarterfinal, then the four
   * teams of the right half]. remocn always holds the top-left seed.
   */
  opponents?: string[];
  /** Word on the champion plate. */
  title?: string;
  /** Small line under the plate. */
  caption?: string;
  /** Round labels over the columns: quarterfinal, semifinal, final. */
  rounds?: [string, string, string];
  /** Winner ticks on the non-remocn matches. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–14   slots slide in from the outer edges, empty later-round slots and
//          the connector lines draw toward the centre, round labels fade up
//  20     quarterfinals resolve: scores tick in, losers dim, winners' lines
//          draw to the semifinal slots (remocn's in the gradient)
//  40     semifinals resolve the same way, winners advance into the final
//  60     the final resolves; remocn's slot flashes
//  68–82  the final node bursts: a gradient plate grows out of it with a ring,
//          the bracket sinks back, "CHAMPION" slams in with the logo
//  86–    poster hold
const ROUND_AT = [20, 40, 60] as const;
const DIM_DELAY = 4;
const LINE_LEN = 9;
const BURST_AT = 68;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "radial-glow": bg #020204, [#f3f1ff, #9db4ff, #5a46cb, #1d1240].
const GLOW = ["#F3F1FF", "#9DB4FF", "#5A46CB", "#1D1240"] as const;

const THEMES = {
  dark: {
    stage: "#050507",
    slot: "#141418",
    edge: "#24242A",
    line: "#2A2A31",
    ink: "#F3F2EF",
    dim: "#7C7B82",
    score: "#1D1D22",
  },
  light: {
    stage: "#F5F4F0",
    slot: "#FFFFFF",
    edge: "#E1DFD8",
    line: "#D3D1CA",
    ink: "#121214",
    dim: "#86847E",
    score: "#EFEDE7",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A hit: up in 1 frame, eases back over `len`. */
function kick(d: number, len = 8) {
  if (d < 0) return 0;
  if (d < 1) return d;
  const k = Math.max(0, 1 - (d - 1) / len);
  return k * k;
}

// Team indices: 0 is remocn, 1–7 the opponents in bracket order.
interface Match {
  round: 0 | 1 | 2;
  a: number;
  b: number;
  win: number;
  score: [number, number];
}
const MATCHES: Match[] = [
  { round: 0, a: 0, b: 1, win: 0, score: [2, 0] },
  { round: 0, a: 2, b: 3, win: 2, score: [2, 1] },
  { round: 0, a: 4, b: 5, win: 4, score: [2, 1] },
  { round: 0, a: 6, b: 7, win: 6, score: [2, 0] },
  { round: 1, a: 0, b: 2, win: 0, score: [2, 0] },
  { round: 1, a: 4, b: 6, win: 6, score: [1, 2] },
  { round: 2, a: 0, b: 6, win: 0, score: [3, 1] },
];

interface Slot {
  x: number;
  y: number;
  team: number;
  match: number;
  side: "a" | "b";
  /** Frame the team's name appears in the slot. */
  arrive: number;
}

interface Link {
  d: string;
  len: number;
  team: number;
  at: number;
}

export function BracketWin({
  opponents = [
    "Keyframes",
    "Stock clips",
    "Agency",
    "Screen rec",
    "Slide decks",
    "Templates",
    "Freelance",
  ],
  title = "Champion",
  caption = "Playoffs 2026 · 8 teams · 0 maps dropped",
  rounds = ["Quarterfinal", "Semifinal", "Grand final"],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BracketWinProps) {
  const t = useCurrentFrame() * speed + 1;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const names = ["remocn", ...opponents];

  // ── Geometry ──────────────────────────────────────────────────────────────
  const slotW = 192 * u;
  const slotH = 50 * u;
  const pairGap = 6 * u;
  const finalW = 204 * u;
  const cx = W / 2;
  const cy = H / 2 + 24 * u;
  const qfX = [48 * u, W - 48 * u - slotW];
  const sfX = [qfX[0] + slotW + 52 * u, qfX[1] - 52 * u - slotW];
  const fX = cx - finalW / 2;
  const qfCy = [cy - 142 * u, cy + 142 * u];
  const pairTop = (mcy: number) => mcy - slotH - pairGap / 2;
  const pairBot = (mcy: number) => mcy + pairGap / 2;

  // Every slot in the bracket.
  const slots: Slot[] = [];
  const links: Link[] = [];
  const addPair = (m: number, x: number, mcy: number, arrive: number): void => {
    slots.push({
      x,
      y: pairTop(mcy),
      team: MATCHES[m].a,
      match: m,
      side: "a",
      arrive,
    });
    slots.push({
      x,
      y: pairBot(mcy),
      team: MATCHES[m].b,
      match: m,
      side: "b",
      arrive,
    });
  };
  const winAt = (round: number) => ROUND_AT[round] + DIM_DELAY;
  const landAt = (round: number) => winAt(round) + LINE_LEN - 1;

  addPair(0, qfX[0], qfCy[0], 0);
  addPair(1, qfX[0], qfCy[1], 0);
  addPair(2, qfX[1], qfCy[0], 0);
  addPair(3, qfX[1], qfCy[1], 0);
  addPair(4, sfX[0], cy, landAt(0));
  addPair(5, sfX[1], cy, landAt(0));
  addPair(6, fX, cy, landAt(1));

  const elbow = (x0: number, y0: number, x1: number, y1: number) => {
    const xm = (x0 + x1) / 2;
    return {
      d: `M ${x0} ${y0} H ${xm} V ${y1} H ${x1}`,
      len: Math.abs(xm - x0) + Math.abs(y1 - y0) + Math.abs(x1 - xm),
    };
  };
  const slotMid = (y: number) => y + slotH / 2;
  // Quarterfinal → semifinal, left and right.
  for (let k = 0; k < 2; k++) {
    const mL = MATCHES[k];
    const toL = elbow(
      qfX[0] + slotW,
      qfCy[k],
      sfX[0],
      slotMid(k === 0 ? pairTop(cy) : pairBot(cy)),
    );
    links.push({ ...toL, team: mL.win, at: winAt(0) });
    const mR = MATCHES[2 + k];
    const toR = elbow(
      qfX[1],
      qfCy[k],
      sfX[1] + slotW,
      slotMid(k === 0 ? pairTop(cy) : pairBot(cy)),
    );
    links.push({ ...toR, team: mR.win, at: winAt(0) });
  }
  // Semifinal → final.
  const toFL = elbow(sfX[0] + slotW, cy, fX, slotMid(pairTop(cy)));
  links.push({ ...toFL, team: MATCHES[4].win, at: winAt(1) });
  const toFR = elbow(sfX[1], cy, fX + finalW, slotMid(pairBot(cy)));
  links.push({ ...toFR, team: MATCHES[5].win, at: winAt(1) });

  // ── Global beats ──────────────────────────────────────────────────────────
  const baseDraw = OUT(ramp(t, 4, 12));
  const labelsIn = OUT(ramp(t, 6, 10));
  const burst = SLAM(ramp(t, BURST_AT, 10));
  const sinkP = OUT(ramp(t, BURST_AT, 12));
  const titleIn = SLAM(ramp(t, BURST_AT + 2, 8));
  const logoIn = OUT(ramp(t, BURST_AT + 5, 10));
  const capIn = OUT(ramp(t, BURST_AT + 12, 10));
  const push = 1 + 0.035 * INOUT(ramp(t, 0, BURST_AT + 20));
  const hit = Math.max(
    ...ROUND_AT.map((r) => kick(t - r, 7) * 0.6),
    kick(t - BURST_AT - 4, 10),
  );

  // Final champion plate: grows out of the final node.
  const plateW0 = finalW;
  const plateH0 = slotH * 2 + pairGap;
  const plateW1 = 2 * (cx - sfX[0]) + 28 * u;
  const plateH1 = 262 * u;
  const plateW = plateW0 + (plateW1 - plateW0) * burst;
  const plateH = plateH0 + (plateH1 - plateH0) * burst;
  const plateCut = 26 * u * burst;

  const sunk = 1 - 0.72 * sinkP;

  const slotEl = (s: Slot, i: number) => {
    const m = MATCHES[s.match];
    const resolveAt = ROUND_AT[m.round];
    const isFinal = m.round === 2;
    const w = isFinal ? finalW : slotW;
    const enter =
      m.round === 0
        ? SLAM(ramp(t, (i % 4) - 1, 9))
        : OUT(ramp(t, 3 + m.round * 2, 10));
    const fromLeft = s.x < cx - (isFinal ? w : 0);
    const named = t >= s.arrive;
    const nameP = s.arrive === 0 ? 1 : SLAM(ramp(t, s.arrive, 6));
    const resolved = t >= resolveAt;
    const sc = s.side === "a" ? m.score[0] : m.score[1];
    const scoreP = SLAM(ramp(t, resolveAt + (s.match % 4) * 1, 5));
    const won = m.win === s.team;
    const lost = !won;
    const dimP = lost ? OUT(ramp(t, resolveAt + DIM_DELAY, 6)) : 0;
    const isRemocn = s.team === 0;
    const lit = isRemocn && named;
    const winFlash = won ? kick(t - resolveAt - DIM_DELAY, 9) : 0;
    const hideInBurst = isFinal && t >= BURST_AT;
    if (hideInBurst) return null;
    return (
      <div
        key={`slot-${i}`}
        style={{
          position: "absolute",
          left: s.x,
          top: s.y,
          width: w,
          height: slotH,
          transform:
            m.round === 0
              ? `translateX(${(1 - enter) * (fromLeft ? -1 : 1) * (slotW + 60 * u)}px)`
              : `scale(${0.94 + 0.06 * enter})`,
          opacity:
            (m.round === 0 ? 1 : enter) *
            (1 - 0.68 * dimP) *
            (isRemocn ? 1 : sunk),
          display: "flex",
          alignItems: "stretch",
          background: lit
            ? `linear-gradient(100deg, ${GLOW[2]} 0%, #3C3AA8 60%, ${GLOW[3]} 100%)`
            : c.slot,
          boxShadow: `inset 0 0 0 ${1 * u}px ${lit ? GLOW[2] : c.edge}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 4 * u,
            background: isRemocn ? GLOW[0] : accent,
            opacity: resolved && won && named ? 1 : 0,
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            paddingLeft: 14 * u,
            overflow: "hidden",
          }}
        >
          {named ? (
            <div
              style={{
                transform: `translateY(${(1 - nameP) * slotH}px)`,
                display: "flex",
                alignItems: "center",
              }}
            >
              {isRemocn ? (
                <RemocnLogo fontSize={25 * u} color="#FFFFFF" />
              ) : (
                <span
                  style={{
                    fontFamily: tektur,
                    fontWeight: 500,
                    fontSize: 21 * u,
                    letterSpacing: "0.01em",
                    color: c.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {names[s.team]}
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                width: 34 * u,
                height: 3 * u,
                background: c.line,
              }}
            />
          )}
        </div>
        <div
          style={{
            width: 40 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: lit ? "rgba(255,255,255,0.12)" : c.score,
            fontFamily: tektur,
            fontWeight: 500,
            fontSize: 22 * u,
            color: lit ? "#FFFFFF" : c.ink,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
          }}
        >
          {resolved && named ? (
            <span
              style={{
                transform: `translateY(${(1 - scoreP) * slotH * 0.8}px)`,
              }}
            >
              {sc}
            </span>
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#FFFFFF",
            opacity: 0.55 * winFlash,
          }}
        />
      </div>
    );
  };

  const labelCols = [
    { x: qfX[0], w: slotW, text: rounds[0] },
    { x: sfX[0], w: slotW, text: rounds[1] },
    { x: fX, w: finalW, text: rounds[2] },
    { x: sfX[1], w: slotW, text: rounds[1] },
    { x: qfX[1], w: slotW, text: rounds[0] },
  ];

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${push * (1 + 0.01 * hit)})`,
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Round labels. */}
          {labelCols.map((l, i) => (
            <div
              key={`label-${i}-${l.text}`}
              style={{
                position: "absolute",
                left: l.x,
                width: l.w,
                top: qfCy[0] - slotH - 70 * u,
                textAlign: i === 2 ? "center" : i < 2 ? "left" : "right",
                fontFamily: tektur,
                fontWeight: 400,
                fontSize: 17 * u,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: c.dim,
                opacity: labelsIn * sunk,
                transform: `translateY(${(1 - labelsIn) * 10 * u}px)`,
              }}
            >
              {l.text}
            </div>
          ))}

          {/* Connectors: base lines, then each winner's advance. */}
          <svg
            width={W}
            height={H}
            style={{ position: "absolute", inset: 0, opacity: sunk }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`${id}-path`}
                gradientUnits="userSpaceOnUse"
                x1={qfX[0]}
                y1={0}
                x2={cx}
                y2={0}
              >
                <stop offset="0" stopColor={GLOW[1]} />
                <stop offset="0.55" stopColor="#7C6CF0" />
                <stop offset="1" stopColor={GLOW[0]} />
              </linearGradient>
            </defs>
            {links.map((l, i) => (
              <path
                key={`base-${i}`}
                d={l.d}
                fill="none"
                stroke={c.line}
                strokeWidth={2 * u}
                strokeDasharray={l.len}
                strokeDashoffset={l.len * (1 - baseDraw)}
              />
            ))}
            {links.map((l, i) => {
              const p = SLAM(ramp(t, l.at, LINE_LEN));
              if (p <= 0) return null;
              const mine = l.team === 0;
              return (
                <path
                  key={`win-${i}`}
                  d={l.d}
                  fill="none"
                  stroke={mine ? `url(#${id}-path)` : c.ink}
                  strokeOpacity={mine ? 1 : 0.5}
                  strokeWidth={(mine ? 4 : 2) * u}
                  strokeDasharray={l.len}
                  strokeDashoffset={l.len * (1 - p)}
                />
              );
            })}
          </svg>

          {slots.map(slotEl)}
        </div>

        {/* remocn's lit path stays on top of the sunk bracket. */}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, opacity: sinkP }}
          aria-hidden
        >
          {links
            .filter((l) => l.team === 0)
            .map((l, i) => (
              <path
                key={`lit-${i}`}
                d={l.d}
                fill="none"
                stroke={`url(#${id}-path)`}
                strokeWidth={4 * u}
              />
            ))}
        </svg>

        {/* Burst: two crisp rings racing out of the final node. */}
        {t >= BURST_AT
          ? [0, 4].map((delay) => {
              const p = OUT(ramp(t, BURST_AT + delay, 26));
              const r = (120 + 560 * p) * u;
              return (
                <div
                  key={`ring-${delay}`}
                  style={{
                    position: "absolute",
                    left: cx - r,
                    top: cy - r,
                    width: 2 * r,
                    height: 2 * r,
                    borderRadius: "50%",
                    boxShadow: `inset 0 0 0 ${(delay === 0 ? 4 : 2) * u}px ${delay === 0 ? GLOW[1] : GLOW[2]}`,
                    opacity: (1 - p) * (p > 0 ? 1 : 0),
                  }}
                />
              );
            })
          : null}

        {/* Champion plate. */}
        {t >= BURST_AT ? (
          <div
            style={{
              position: "absolute",
              left: cx - plateW / 2,
              top: cy - plateH / 2,
              width: plateW,
              height: plateH,
              clipPath: `polygon(${plateCut}px 0, 100% 0, 100% calc(100% - ${plateCut}px), calc(100% - ${plateCut}px) 100%, 0 100%, 0 ${plateCut}px)`,
              background: [
                `radial-gradient(70% 90% at 50% 115%, ${GLOW[1]} 0%, transparent 70%)`,
                `radial-gradient(60% 80% at 50% 0%, ${GLOW[3]} 0%, transparent 80%)`,
                `linear-gradient(180deg, ${GLOW[3]} 0%, ${GLOW[2]} 70%, #7D73E6 100%)`,
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6 * u,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                opacity: logoIn,
                transform: `translateY(${(1 - logoIn) * 14 * u}px)`,
              }}
            >
              <RemocnLogo fontSize={50 * u} color="#FFFFFF" />
            </div>
            <div
              style={{
                fontFamily: tektur,
                fontWeight: 500,
                fontSize: 128 * u,
                lineHeight: 1,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                opacity: Math.min(1, titleIn * 1.5),
                transform: `scale(${1 + 0.16 * (1 - titleIn)})`,
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#FFFFFF",
                opacity: 0.3 * kick(t - BURST_AT - 1, 7),
              }}
            />
          </div>
        ) : null}

        {/* Caption under the plate. */}
        {capIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: cy + plateH1 / 2 + 26 * u,
              textAlign: "center",
              fontFamily: tektur,
              fontWeight: 400,
              fontSize: 20 * u,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: c.dim,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 10 * u}px)`,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
