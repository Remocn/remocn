"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_STATS,
  PREROLL,
  type VersusSplitElementId,
  type VersusStat,
  versusSplitTimeline,
} from "./timeline";

const { fontFamily: condensed } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
// Same family name as the upright face; "VS" picks it up through fontStyle.
loadFont("italic", {
  weights: ["500"],
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

export type { VersusStat };

export interface VersusSplitProps {
  /** The opponent, set in condensed caps on the right half. The left half is always the remocn logo. */
  away?: string;
  /** Small label over the logo. */
  homeLabel?: string;
  /** Small label over the opponent. */
  awayLabel?: string;
  /** Tale-of-the-tape rows, both sides land at once. Three read best. */
  stats?: VersusStat[];
  /** The marker on the seam plates. */
  accent?: string;
  /** Text color of the names and values; overrides the theme. */
  ink?: string;
  /** Background fill behind the halves; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Barlow Condensed by default. */
  fontFamily?: string;
  /** The word that slams onto the seam. */
  versus?: string;
  /** Frames between stat rows as they land. */
  stagger?: number;
  /** Replaces the remocn mark on the left half. */
  logo?: React.ReactNode;
  /** Size of the whole split, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the split, the "VS", single stat rows and the
   * light, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<VersusSplitElementId>;
}

// Beat sheet (internal clock = frame + 2, 30fps, speed 1):
//   0–10   the frame splits on a diagonal: both halves slam in from opposite
//          sides and meet on the seam, which flashes on impact
//  12–18   "VS" slams down onto the seam from 1.7× (kick on landing)
//  26–48   stat rows land one by one, 7f apart: the seam plate opens, both
//          values shoot in from the outer edges at the same time
//  56–64   the remocn half lights up: a "halo" gradient wipes across it from
//          the left edge; the opponent half and its numbers dim
//  64–     fight-poster hold
// The frames live in `./timeline`, on the scene timeline (clock - PREROLL).

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const WIPE = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo": #fff4ec, #ffb36b, #e2457a, #3d4dff.
const HALO = ["#FFF4EC", "#FFB36B", "#E2457A", "#3D4DFF"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    home: "#1E1E23",
    away: "#121215",
    awayOff: "#0E0E10",
    ink: "#F3F2EF",
    dim: "#86858C",
    off: "#47464D",
    plate: "#0A0A0B",
    plateInk: "#C9C8CE",
    seam: "#FFFFFF",
  },
  light: {
    stage: "#F5F4F0",
    home: "#E6E4DE",
    away: "#DDDBD4",
    awayOff: "#ECEAE5",
    ink: "#121214",
    dim: "#7E7D77",
    off: "#B9B7B0",
    plate: "#121214",
    plateInk: "#E9E8E3",
    seam: "#121214",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 2 frames, eases back over 9. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 9);
  return k * k;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function VersusSplit(props: VersusSplitProps) {
  const {
    away = "The old way",
    homeLabel = "Challenger",
    awayLabel = "Title holder",
    stats = DEFAULT_STATS,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = condensed,
    versus = "VS",
    logo,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed + PREROLL;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    versusSplitTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  // The schedule counts scene frames; `t` runs `PREROLL` ahead of them.
  const splitEl = tl.get("split");
  const splitAt = splitEl.start + PREROLL;
  const splitEnd = splitAt + splitEl.length;
  const vsEl = tl.get("versus");
  const vsAt = vsEl.start + PREROLL;
  const lightEl = tl.get("light");
  const lightAt = lightEl.start + PREROLL;
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.stage);
  const u = Math.min(W / 1280, H / 720);

  // The seam leans right at the top: x = W/2 + lean at y = 0, W/2 - lean at y = H.
  const lean = 0.14 * H;
  const seamX = (y: number) => W / 2 + lean * (1 - (2 * y) / H);

  const split = SLAM(ramp(t, splitAt, splitEl.length));
  const leftDx = -(1 - split) * 0.75 * W;
  const rightDx = (1 - split) * 0.75 * W;
  const seamFlash =
    t >= splitEnd - 1
      ? Math.max(0, 1 - (t - splitEnd + 1) / splitEl.beat("flash"))
      : 0;

  const vs = SLAM(ramp(t, vsAt, vsEl.length));
  const vsScale = 1.7 - 0.7 * vs;
  const vsOpacity = ramp(t, vsAt, vsEl.beat("fade"));

  const light = WIPE(ramp(t, lightAt, lightEl.length));
  const dimP = ramp(t, lightAt + lightEl.beat("dimAt"), lightEl.beat("dim"));

  const camAt = (at: number) =>
    1 +
    0.02 *
      Math.max(
        kick(at - splitEnd + 1),
        kick(at - vsAt - 4),
        0.6 * kick(at - lightAt - lightEl.length + 2),
      );
  const camScale = camAt(t);
  // The camera kick carries the whole frame, and the halves paint up to its
  // edges, so a tilt there would show a seam as the kick dies out. The text
  // blocks take the tilt instead while the kick moves them.
  const camMoving =
    Math.abs(camAt(t + speed) - camScale) > 1e-6 ||
    Math.abs(camScale - camAt(t - speed)) > 1e-6;
  const textTilt = glide(camMoving);

  // The light's front edge runs parallel to the seam, from off the left edge
  // to just past the seam.
  const edgeW = 14 * u;
  const reach = W / 2 + lean + edgeW;
  const frontAt = (y: number) => seamX(y) - reach + light * (reach + 30 * u);
  const lit = (x: number, y: number) => light > 0 && frontAt(y) > x;

  const leftPoly = `polygon(0 0, ${seamX(0)}px 0, ${seamX(H)}px ${H}px, 0 ${H}px)`;
  const rightPoly = `polygon(${seamX(0)}px 0, ${W}px 0, ${W}px ${H}px, ${seamX(H)}px ${H}px)`;
  const f0 = frontAt(0);
  const fH = frontAt(H);
  const lightPoly = `polygon(0 0, ${f0}px 0, ${fH}px ${H}px, 0 ${H}px)`;
  const edgePoly = `polygon(${f0 - edgeW}px 0, ${f0}px 0, ${fH}px ${H}px, ${fH - edgeW}px ${H}px)`;

  const drift = interpolate(
    t,
    [lightAt, lightAt + lightEl.beat("drift")],
    [0, 8],
    CLAMP,
  );
  const haloGround = [
    `radial-gradient(70% 55% at ${8 + drift}% 104%, ${HALO[1]}f0 0%, transparent 70%)`,
    `radial-gradient(60% 60% at ${58 - drift}% 78%, ${HALO[2]}e6 0%, transparent 72%)`,
    `radial-gradient(60% 50% at 10% 0%, #6E7BFFcc 0%, transparent 70%)`,
    `linear-gradient(165deg, ${HALO[3]} 0%, #2A2FB8 55%, #3A1F7A 100%)`,
  ].join(", ");

  // ── Names row ─────────────────────────────────────────────────────────────
  const nameY = 0.175 * H;
  const vsY = 0.375 * H;
  const homeCx = 0.25 * W;
  const awayCx = 0.755 * W;
  const labelFs = 20 * u;
  const homeNameInk = lit(homeCx, nameY) ? "#FFFFFF" : fg;
  const homeLabelInk = lit(homeCx, nameY) ? "#FFFFFFcc" : c.dim;
  const awayInk = dimP > 0.5 ? c.off : fg;

  // ── Stat rows ─────────────────────────────────────────────────────────────
  const rowTop = 0.575 * H;
  const rowStep = Math.min(
    0.12 * H,
    (0.95 * H - rowTop) / Math.max(1, stats.length),
  );
  const valueFs = 78 * u;
  const plateW = 210 * u;
  const plateH = 42 * u;
  const valueGap = plateW / 2 + 26 * u;

  const label = (text: string, ink: string) => (
    <div
      style={{
        fontFamily,
        fontWeight: 500,
        fontSize: labelFs,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: ink,
        lineHeight: 1,
        marginBottom: 14 * u,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${camScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* Left half: remocn. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${leftDx}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: leftPoly,
                background: c.home,
              }}
            >
              {light > 0 ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: lightPoly,
                      background: haloGround,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: edgePoly,
                      background: HALO[0],
                      opacity: 1 - light,
                    }}
                  />
                </>
              ) : null}
            </div>
            <div
              style={{
                position: "absolute",
                left: homeCx - 0.24 * W,
                width: 0.48 * W,
                top: nameY - 60 * u,
                transform: textTilt || undefined,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {label(homeLabel, homeLabelInk)}
              {logo ?? <RemocnLogo fontSize={80 * u} color={homeNameInk} />}
            </div>
          </div>

          {/* Right half: the opponent. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${rightDx}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: rightPoly,
                background: dimP > 0 ? c.awayOff : c.away,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: awayCx - 0.24 * W,
                width: 0.48 * W,
                top: nameY - 60 * u,
                transform: textTilt || undefined,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {label(awayLabel, dimP > 0.5 ? c.off : c.dim)}
              <div
                style={{
                  fontFamily,
                  fontWeight: 500,
                  fontSize: 92 * u,
                  lineHeight: 0.84,
                  letterSpacing: "0.005em",
                  textTransform: "uppercase",
                  color: awayInk,
                  whiteSpace: "nowrap",
                }}
              >
                {away}
              </div>
            </div>
          </div>

          {/* Impact flash along the seam. */}
          {seamFlash > 0 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `polygon(${seamX(0) - 5 * u}px 0, ${seamX(0) + 5 * u}px 0, ${seamX(H) + 5 * u}px ${H}px, ${seamX(H) - 5 * u}px ${H}px)`,
                background: c.seam,
                opacity: seamFlash,
              }}
            />
          ) : null}

          {/* Stat rows. */}
          {stats.map((s, i) => {
            const row = tl.get(`row:${i}`);
            const at = row.start + PREROLL;
            const p = SLAM(ramp(t, at, row.length));
            const op = ramp(t, at, row.beat("fade"));
            const plate = SLAM(ramp(t, at, row.beat("plate")));
            const y = rowTop + (i + 0.5) * rowStep;
            const sx = seamX(y);
            const homeX = sx - valueGap;
            const awayX = sx + valueGap;
            const homeInk = lit(homeX - 60 * u, y) ? "#FFFFFF" : fg;
            const awayValInk = dimP > 0.5 ? c.off : fg;
            return (
              <div key={`${i}-${s.label}`}>
                <div
                  style={{
                    position: "absolute",
                    right: W - homeX,
                    top: y - valueFs / 2,
                    height: valueFs,
                    display: "flex",
                    alignItems: "center",
                    transform: `translateX(${-(1 - p) * 0.38 * W}px)${textTilt}`,
                    opacity: op,
                    fontFamily,
                    fontWeight: 500,
                    fontSize: valueFs,
                    lineHeight: 1,
                    letterSpacing: "0.005em",
                    textTransform: "uppercase",
                    color: homeInk,
                    whiteSpace: "nowrap",
                    paddingTop: 6 * u,
                  }}
                >
                  {s.home}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: awayX,
                    top: y - valueFs / 2,
                    height: valueFs,
                    display: "flex",
                    alignItems: "center",
                    transform: `translateX(${(1 - p) * 0.38 * W}px)${textTilt}`,
                    opacity: op,
                    fontFamily,
                    fontWeight: 500,
                    fontSize: valueFs,
                    lineHeight: 1,
                    letterSpacing: "0.005em",
                    textTransform: "uppercase",
                    color: awayValInk,
                    whiteSpace: "nowrap",
                    paddingTop: 6 * u,
                  }}
                >
                  {s.away}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: sx - plateW / 2,
                    top: y - plateH / 2,
                    width: plateW,
                    height: plateH,
                    background: c.plate,
                    transform: textTilt || undefined,
                    clipPath: `inset(0 ${50 * (1 - plate)}% 0 ${50 * (1 - plate)}%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10 * u,
                    fontFamily,
                    fontWeight: 500,
                    fontSize: labelFs,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: c.plateInk,
                  }}
                >
                  <div
                    style={{
                      width: 4 * u,
                      height: 16 * u,
                      background: accent,
                    }}
                  />
                  <span style={{ paddingTop: 2 * u }}>{s.label}</span>
                </div>
              </div>
            );
          })}

          {/* VS on the seam. */}
          <div
            style={{
              position: "absolute",
              left: seamX(vsY) - 200 * u,
              width: 400 * u,
              top: vsY - 120 * u,
              height: 240 * u,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${vsScale})${glide(camMoving || midway(vs))}`,
              opacity: vsOpacity,
              fontFamily,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 250 * u,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: theme === "dark" ? "#FFFFFF" : fg,
              paddingTop: 12 * u,
            }}
          >
            {versus}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
