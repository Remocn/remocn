"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

/**
 * gradients.sh "halo" palette: [#fff4ec, #ffb36b, #e2457a, #3d4dff]. The ring
 * that circles the day is drawn in it, tightens into a full stop that keeps
 * it, and leaves a soft halo ring behind the lockup. The blue end is the
 * accent, so the palette lands on the brand.
 */
const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;

/**
 * Beat sheet (30fps, speed 1):
 * 0–30     the month draws itself as hairlines; header and day numbers settle.
 * 14–44    days light up in a quick sweep from the 1st to the launch day.
 * 30–88    slow eased push toward the launch day; the rest of the grid
 *          drifts out of focus.
 * 66–90    an accent stroke circles the day.
 * 92–124   the grid falls away; the day slides into a huge "10.30" lockup
 *          while the circle tightens into the accent full stop.
 * 120–180  label lands, long hold.
 */

export interface LaunchDateValue {
  /** 1–12. */
  month: number;
  day: number;
  year: number;
}

export interface LaunchDateProps {
  date?: LaunchDateValue;
  /** Short line under the lockup. */
  label?: string;
  /** "month-day" renders 10.30, "day-month" renders 30.10. */
  order?: "month-day" | "day-month";
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_PUSH = Easing.bezier(0.5, 0, 0.3, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.055)",
    fg: "#F3F2EF",
    muted: "#85848A",
    faint: "#4A4A50",
    line: "rgba(255,255,255,0.13)",
    lit: "rgba(255,255,255,0.075)",
    grain: 0.065,
    /** Peak opacity of the halo behind the lockup. */
    halo: 1,
    /** Halo ring stops, top-left → bottom-right, before the accent. */
    haloStops: [HALO[0], HALO[1], HALO[2]],
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.85)",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#B9B6AE",
    line: "rgba(18,18,20,0.13)",
    lit: "rgba(18,18,20,0.05)",
    grain: 0.045,
    halo: 0.9,
    haloStops: [HALO[1], HALO[1], HALO[2]],
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

/** Day of week, 0 = Monday (Sakamoto). Pure arithmetic, no Date. */
function weekday(year: number, month: number, day: number) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  const sun0 =
    (y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) +
      t[month - 1] +
      day) %
    7;
  return (sun0 + 6) % 7;
}

function daysIn(year: number, month: number) {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

const pad = (n: number) => String(n).padStart(2, "0");

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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface CellProps {
  t: number;
  day: number;
  col: number;
  row: number;
  cellW: number;
  cellH: number;
  hero: boolean;
  launchDay: number;
  heroRow: number;
  heroCol: number;
  p: Palette;
  u: number;
}

function DayCell({
  t,
  day,
  col,
  row,
  cellW,
  cellH,
  hero,
  launchDay,
  heroRow,
  heroCol,
  p,
  u,
}: CellProps) {
  // settle in with the grid
  const appear = interpolate(t, [8 + row * 2.5, 24 + row * 2.5], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // sweep: day 1 → launch day across ~28 frames
  const step = 28 / Math.max(1, launchDay);
  const hit = 16 + (day - 1) * step;
  const swept = day <= launchDay;
  const flash = swept
    ? interpolate(t, [hit, hit + 3, hit + 14], [0, 1, 0], CLAMP)
    : 0;
  const after = swept ? interpolate(t, [hit, hit + 10], [0, 1], CLAMP) : 0;
  const numO = appear * (0.38 + 0.62 * flash + 0.22 * after * (1 - flash));
  // fall away: ripple outward from the launch day
  const dist = Math.hypot(col - heroCol, (row - heroRow) * 1.3);
  const f0 = 90 + dist * 2.2;
  const fall = interpolate(t, [f0, f0 + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IN,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: col * cellW,
        top: row * cellH,
        width: cellW,
        height: cellH,
        transform: `perspective(${900 * u}px) translateY(${fall * cellH * 0.9}px) rotateX(${-fall * 55}deg)`,
        transformOrigin: "50% 100%",
        opacity: 1 - fall,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 1.5 * u,
          borderRadius: 6 * u,
          background: p.lit,
          opacity: flash + (hero ? after * 0.9 : after * 0.25),
        }}
      />
      {hero ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: sora,
            fontWeight: 300,
            fontSize: cellH * 0.3,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            color: p.fg,
            opacity: numO,
          }}
        >
          {day}
        </div>
      )}
    </div>
  );
}

export function LaunchDate({
  date = { month: 10, day: 30, year: 2026 },
  label = "Coming soon",
  order = "month-day",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: LaunchDateProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = PALETTES[theme];

  const month = Math.min(12, Math.max(1, Math.round(date.month)));
  const total = daysIn(date.year, month);
  const launchDay = Math.min(total, Math.max(1, Math.round(date.day)));
  const lead = weekday(date.year, month, 1);
  const rows = Math.ceil((lead + total) / 7);

  // ---- calendar layout (grid space, origin at the grid's top-left) ----
  const cellH = Math.min(height * 0.64, height) / (rows + 1.7);
  const cellW = Math.min(cellH * 1.38, (width * 0.62) / 7);
  const gridW = cellW * 7;
  const headH = cellH * 1.1;
  const dowH = cellH * 0.6;
  const gridH = headH + dowH + rows * cellH;
  const bodyTop = headH + dowH;
  const heroIdx = lead + launchDay - 1;
  const heroCol = heroIdx % 7;
  const heroRow = Math.floor(heroIdx / 7);
  const heroGX = (heroCol + 0.5) * cellW;
  const heroGY = bodyTop + (heroRow + 0.5) * cellH;

  // ---- camera: screen = C + (g - F) * s ----
  const cx = width / 2;
  const cy = height * 0.5;
  const push = interpolate(t, [20, 90], [0, 1], {
    ...CLAMP,
    easing: EASE_PUSH,
  });
  const S = 2.5;
  const s =
    interpolate(push, [0, 1], [0.94, S]) *
    interpolate(t, [0, 20], [0.97, 1], CLAMP);
  const fx = interpolate(push, [0, 1], [gridW / 2, heroGX]);
  const fy = interpolate(push, [0, 1], [gridH / 2, heroGY]);
  const toScreen = (gx: number, gy: number) => ({
    x: cx + (gx - fx) * s,
    y: cy + (gy - fy) * s,
  });
  const gridOrigin = toScreen(0, 0);
  const dof = interpolate(push, [0.35, 1], [0, 2.4 * u], CLAMP);
  const linesOut = interpolate(t, [86, 104], [1, 0], CLAMP);
  const headOut = interpolate(t, [60, 84], [1, 0], CLAMP);

  // ---- lockup (screen space) ----
  const F = Math.min(height * 0.34, (width * 0.7) / 2.7);
  const groupW = F * 1.14;
  const dotW = F * 0.27;
  const lockW = groupW * 2 + dotW;
  const lockCY = height * 0.45;
  const lockLeft = cx - lockW / 2;
  const dayFirst = order === "day-month";
  const daySlotX = dayFirst
    ? lockLeft + groupW / 2
    : lockLeft + lockW - groupW / 2;
  const dotD = F * 0.135;
  const dotX = cx;
  const dotY = lockCY + F * 0.364 - dotD / 2;

  // hero day: follows its cell, then glides to the lockup slot
  const hand = interpolate(t, [92, 120], [0, 1], { ...CLAMP, easing: EASE_IO });
  const heroCell = toScreen(heroGX, heroGY);
  const heroFont0 = cellH * 0.3 * s;
  const heroX = interpolate(hand, [0, 1], [heroCell.x, daySlotX]);
  const heroY = interpolate(hand, [0, 1], [heroCell.y, lockCY]);
  const heroFont = interpolate(hand, [0, 1], [heroFont0, F]);
  const heroWeight = 300;
  const heroTrack = interpolate(hand, [0, 1], [-0.02, -0.06]);
  const heroAppear = interpolate(
    t,
    [8 + heroRow * 2.5, 24 + heroRow * 2.5],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const heroHit = 16 + (launchDay - 1) * (28 / Math.max(1, launchDay));
  const heroLit = interpolate(t, [heroHit, heroHit + 3], [0.38, 1], CLAMP);

  // circle: draws around the day, rides along with it, then tightens into
  // the full stop of the lockup
  const draw = interpolate(t, [64, 90], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const ringW0 = Math.max(2, 2.5 * u * (s / S));
  const rideR = heroFont * interpolate(hand, [0, 1], [1.2, 0.7]);
  const rideW = ringW0 * interpolate(hand, [0, 1], [1, 1.7]);
  const shrink = interpolate(t, [114, 136], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  // stays a hairline while it tightens, fills only once it is dot-sized
  const close = interpolate(t, [124, 134], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const outerR = interpolate(shrink, [0, 1], [rideR + rideW / 2, dotD / 2]);
  const ringW = Math.min(outerR, interpolate(close, [0, 1], [rideW, outerR]));
  const ringR = outerR - ringW / 2;
  const ringX = interpolate(shrink, [0, 1], [heroX, dotX]);
  const ringY = interpolate(shrink, [0, 1], [heroY, dotY]);
  const ringBox = ringR + ringW + 4;
  const circ = 2 * Math.PI * ringR;
  const ringId = `ring${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // the echo: as the full stop lands, the ring it came from rings out once
  // more, wide, and stays behind the lockup as a halo of the same light
  const echo = interpolate(t, [124, 164], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const echoR = dotD / 2 + (height * 0.37 - dotD / 2) * echo;
  const echoO = interpolate(t, [124, 130], [0, 1], CLAMP);
  const haloSpin = interpolate(t, [124, 195], [-30, 10], CLAMP);
  const haloId = `halo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const blurId = `hb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // the other half of the lockup
  const other = interpolate(t, [128, 152], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelP = (d: number) =>
    interpolate(t, [140 + d, 164 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelTop = lockCY + F * 0.5 + 40 * u;
  const otherValue = pad(month);
  const fullDate = `${WEEKDAYS[weekday(date.year, month, launchDay)]}, ${MONTHS[month - 1]} ${launchDay}, ${date.year}`;

  const lines: React.ReactNode[] = [];
  for (let r = 0; r <= rows; r++) {
    const d = r * 2;
    const k = interpolate(t, [d, d + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    lines.push(
      <div
        key={`h${r}`}
        style={{
          position: "absolute",
          left: 0,
          top: bodyTop + r * cellH,
          width: gridW,
          height: Math.max(1, u),
          background: p.line,
          transformOrigin: "0 50%",
          transform: `scaleX(${k})`,
        }}
      />,
    );
  }
  for (let c = 1; c < 7; c++) {
    const d = 4 + c * 2;
    const k = interpolate(t, [d, d + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    lines.push(
      <div
        key={`v${c}`}
        style={{
          position: "absolute",
          left: c * cellW,
          top: bodyTop,
          width: Math.max(1, u),
          height: rows * cellH,
          background: p.line,
          transformOrigin: "50% 0",
          transform: `scaleY(${k})`,
        }}
      />,
    );
  }

  const cells: React.ReactNode[] = [];
  for (let d = 1; d <= total; d++) {
    const i = lead + d - 1;
    cells.push(
      <DayCell
        key={d}
        t={t}
        day={d}
        col={i % 7}
        row={Math.floor(i / 7)}
        cellW={cellW}
        cellH={cellH}
        hero={d === launchDay}
        launchDay={launchDay}
        heroRow={heroRow}
        heroCol={heroCol}
        p={p}
        u={u}
      />,
    );
  }

  // a slow push that never quite stops, so the hold stays alive
  const drift = interpolate(t, [90, 195], [1, 1.035], CLAMP);
  const headIn = interpolate(t, [4, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at 50% 40%, ${p.stage}, transparent 75%)`,
        }}
      />

      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {echoO > 0 ? (
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={haloId}
                gradientUnits="userSpaceOnUse"
                x1={dotX - echoR}
                y1={lockCY - echoR}
                x2={dotX + echoR}
                y2={lockCY + echoR}
                gradientTransform={`rotate(${haloSpin} ${dotX} ${lockCY})`}
              >
                <stop offset="0%" stopColor={p.haloStops[0]} />
                <stop offset="38%" stopColor={p.haloStops[1]} />
                <stop offset="70%" stopColor={p.haloStops[2]} />
                <stop offset="100%" stopColor={accent} />
              </linearGradient>
              <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={16 * u} />
              </filter>
            </defs>
            <g opacity={echoO * p.halo}>
              <circle
                cx={dotX}
                cy={lockCY}
                r={echoR}
                fill="none"
                stroke={`url(#${haloId})`}
                strokeWidth={34 * u}
                filter={`url(#${blurId})`}
                opacity={0.55}
              />
              <circle
                cx={dotX}
                cy={lockCY}
                r={echoR}
                fill="none"
                stroke={`url(#${haloId})`}
                strokeWidth={interpolate(echo, [0, 1], [4, 1.6]) * u}
              />
            </g>
          </svg>
        ) : null}
        {/* the month, in grid space under the camera */}
        <div
          style={{
            position: "absolute",
            left: gridOrigin.x,
            top: gridOrigin.y,
            width: gridW,
            height: gridH,
            transformOrigin: "0 0",
            transform: `scale(${s})`,
            filter: dof > 0.05 ? `blur(${dof / s}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: cellW * 0.12,
              right: cellW * 0.12,
              top: 0,
              height: headH,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: headIn * headOut,
              transform: `translateY(${(1 - headIn) * 10 * u}px)`,
            }}
          >
            <span
              style={{
                fontFamily: sora,
                fontWeight: 500,
                fontSize: cellH * 0.5,
                letterSpacing: "-0.04em",
                color: p.fg,
              }}
            >
              {MONTHS[month - 1]}
            </span>
            <span
              style={{
                fontFamily: sora,
                fontWeight: 400,
                fontSize: cellH * 0.3,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: p.muted,
              }}
            >
              {date.year}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: headH,
              width: gridW,
              height: dowH,
              display: "flex",
              opacity: headIn * headOut,
            }}
          >
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                style={{
                  width: cellW,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: sora,
                  fontWeight: 400,
                  fontSize: cellH * 0.17,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: i > 4 ? p.faint : p.muted,
                }}
              >
                {w.slice(0, 3)}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: linesOut }}>
            {lines}
          </div>
          <div style={{ position: "absolute", left: 0, top: bodyTop }}>
            {cells}
          </div>
        </div>

        {/* accent ring → full stop */}
        <svg
          width={ringBox * 2}
          height={ringBox * 2}
          viewBox={`${-ringBox} ${-ringBox} ${ringBox * 2} ${ringBox * 2}`}
          style={{
            position: "absolute",
            left: ringX - ringBox,
            top: ringY - ringBox,
            overflow: "visible",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={ringId}
              gradientUnits="userSpaceOnUse"
              x1={-ringBox}
              y1={-ringBox}
              x2={ringBox}
              y2={ringBox}
            >
              <stop offset="8%" stopColor={HALO[1]} />
              <stop offset="50%" stopColor={HALO[2]} />
              <stop offset="92%" stopColor={accent} />
            </linearGradient>
          </defs>
          <circle
            r={ringR}
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth={ringW}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - draw)}
            transform="rotate(-118)"
          />
        </svg>

        {/* the launch day, in screen space so it can leave the grid */}
        <div
          style={{
            position: "absolute",
            left: heroX - F * 2,
            top: heroY - F,
            width: F * 4,
            height: F * 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: sora,
            fontWeight: heroWeight,
            fontSize: heroFont,
            lineHeight: 1,
            letterSpacing: `${heroTrack}em`,
            fontVariantNumeric: "tabular-nums",
            color: p.fg,
            opacity: heroAppear * heroLit,
            filter:
              dof > 0.05 && hand < 0.01 ? `blur(${dof * 0.15}px)` : undefined,
          }}
        >
          {pad(launchDay)}
        </div>

        {/* the other half of the lockup, revealed from behind the full stop */}
        <div
          style={{
            position: "absolute",
            left: dayFirst ? cx + dotW / 2 : lockLeft,
            top: lockCY - F,
            width: groupW,
            height: F * 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: sora,
              fontWeight: 300,
              fontSize: F,
              lineHeight: 1,
              letterSpacing: "-0.06em",
              fontVariantNumeric: "tabular-nums",
              color: p.fg,
              opacity: other,
              transform: `translateX(${(dayFirst ? -1 : 1) * (1 - other) * groupW * 0.55}px)`,
            }}
          >
            {otherValue}
          </div>
        </div>

        {/* label */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: labelTop,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16 * u,
            fontFamily: sora,
            fontSize: 21 * u,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: p.fg,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              opacity: labelP(0),
              transform: `translateY(${(1 - labelP(0)) * 12 * u}px)`,
            }}
          >
            {label}
          </span>
          <div
            style={{
              width: Math.max(1, u),
              height: 20 * u,
              background: p.line,
              transform: `scaleY(${labelP(3)})`,
            }}
          />
          <span
            style={{
              color: p.muted,
              fontWeight: 400,
              letterSpacing: "-0.015em",
              fontVariantNumeric: "tabular-nums",
              opacity: labelP(6),
              transform: `translateY(${(1 - labelP(6)) * 12 * u}px)`,
            }}
          >
            {fullDate}
          </span>
        </div>
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
