"use client";

import { loadFont } from "@remotion/google-fonts/ChakraPetch";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: chakra } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: chakraItalic } = loadFont("italic", {
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

export interface KillFeedProps {
  /** One feed line per elimination, in order. remocn is always the one getting the kill. */
  kills?: string[];
  /** The streak callout after each kill, bottom left. The last kill fires the banner instead. */
  callouts?: string[];
  /** The multi-kill banner that slams across the middle after the last kill. */
  banner?: string;
  /** Small line under the banner, next to the logo. */
  caption?: string;
  /** Small markers: the streak tick and the caption rule. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 3, 30fps, speed 1, five kills):
//   2–48   five kill lines slide into the feed (top right) from the right edge,
//          gaps tightening 14 → 8 frames; each lands with a white flash, older
//          lines settle to a dimmer level
//   3–49   the streak callout bottom left rolls up to the next one on every
//          kill: First blood → Double kill → Triple kill → Quadra kill
//  52–59   the fifth kill fires the "halo" band: it slams across the middle,
//          the frame kicks, the feed sinks back (lines under the band go)
//  63–74   logo and caption rise under the band; poster holds
const FIRST_KILL = 2;
const KILL_GAPS = [14, 12, 10, 8];
const BANNER_DELAY = 4;
const BAND_IN = 7;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo": bg #030306, [#fff4ec, #ffb36b, #e2457a, #3d4dff].
const HALO = ["#FFF4EC", "#FFB36B", "#E2457A", "#3D4DFF"] as const;
const BAND = `linear-gradient(100deg, #2A34C9 0%, ${HALO[3]} 22%, #8C47B8 48%, ${HALO[2]} 72%, #EE6F5E 90%, ${HALO[1]} 100%)`;
const CHIP = `linear-gradient(100deg, ${HALO[3]} 0%, #7B48C2 70%, ${HALO[2]} 130%)`;

const THEMES = {
  dark: {
    stage: "#08080A",
    slab: "#17171B",
    slabEdge: "#232329",
    ink: "#F3F2EF",
    victim: "#FF8DA6",
    dim: "#86858C",
    callout: "#F3F2EF",
  },
  light: {
    stage: "#F5F4F0",
    slab: "#FFFFFF",
    slabEdge: "#E3E1DA",
    ink: "#121214",
    victim: "#D3305F",
    dim: "#7E7D77",
    callout: "#121214",
  },
} as const;

// Flat weapon-ish glyphs, all in a 80 × 28 box.
const WEAPONS = [
  // rifle
  "M3 9 L13 8 L17 10 L50 10 L52 7.5 L60 7.5 L60 10 L78 10 L78 13 L60 13 L57 15.5 L42 15.5 L38 24 L31.5 24 L34 15.5 L24 15.5 L17 21 L3 21 Z",
  // blade
  "M3 12.5 L19 11 L21 7.5 L26 7.5 L26 11 L70 11.5 L78 14 L70 17 L26 17 L26 20.5 L21 20.5 L19 17 L3 15.5 Z",
  // sniper with scope
  "M2 11.5 L15 11 L22 13 L56 13 L56 12 L79 12 L79 14.5 L56 14.5 L53 17 L37 17 L33 23 L27 23 L29.5 17 L19 17 L12 21 L2 21 Z M31 6.5 L51 6.5 L51 10.5 L31 10.5 Z",
  // sidearm
  "M18 6 L62 6 L62 13 L42 13 L40 15.5 L35 15.5 L37.5 24.5 L27 24.5 L25 15.5 L18 13 Z",
  // ability bolt
  "M45 2 L29 15.5 L39 15.5 L33 26 L52 11 L42 11 L49 2 Z",
] as const;

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

function Crosshair({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="7.5"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
      />
      <path
        d="M12 1.5 V7 M12 17 V22.5 M1.5 12 H7 M17 12 H22.5"
        stroke={color}
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function KillFeed({
  kills = [
    "Manual keyframes",
    "Render queue",
    "Agency invoice",
    "Stock templates",
    "Export presets",
  ],
  callouts = ["First blood", "Double kill", "Triple kill", "Quadra kill"],
  banner = "Penta ship",
  caption = "5 / 5 eliminated",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: KillFeedProps) {
  // Starts three frames in, so frame 0 already has the first line on its way.
  const t = useCurrentFrame() * speed + 3;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const killAt: number[] = [];
  kills.forEach((_, i) => {
    killAt.push(
      i === 0
        ? FIRST_KILL
        : killAt[i - 1] + (KILL_GAPS[i - 1] ?? KILL_GAPS[KILL_GAPS.length - 1]),
    );
  });
  const lastKill = killAt[killAt.length - 1] ?? FIRST_KILL;
  const bandAt = lastKill + BANNER_DELAY;
  const landAt = bandAt + BAND_IN;

  // ── Camera kick on every kill and on the band landing ─────────────────────
  const killKick = killAt.reduce((a, k) => Math.max(a, kick(t - k - 2, 6)), 0);
  const bandKick = kick(t - landAt + 1, 9);
  const shakeX =
    bandKick * 9 * u * Math.sin(t * 2.7) + killKick * 2 * u * Math.sin(t * 3.1);
  const shakeY = bandKick * 5 * u * Math.cos(t * 3.3);

  // ── Feed ──────────────────────────────────────────────────────────────────
  const lineH = 74 * u;
  const lineGap = 11 * u;
  const feedRight = 52 * u;
  const feedTop = 46 * u;
  const fs = 35 * u;
  const cut = 16 * u;

  // ── Callout ───────────────────────────────────────────────────────────────
  const calloutFs = 124 * u;
  const calloutLeft = 60 * u;
  const calloutBottom = 48 * u;
  const calloutH = calloutFs * 1.08 + 34 * u;

  // ── Band ──────────────────────────────────────────────────────────────────
  const bandH = 256 * u;
  const bandY = H / 2 - bandH / 2 + 14 * u;
  const slant = 0.24 * bandH;
  const bandIn = SLAM(ramp(t, bandAt, BAND_IN));
  const bandX = -(W + 2 * slant) * (1 - bandIn);
  const textIn = OUT(ramp(t, bandAt + 1, 14));
  const textX = -0.22 * W * (1 - textIn);
  const textScale = 1 + 0.1 * (1 - textIn);
  const capIn = OUT(ramp(t, landAt + 4, 11));
  const flash = kick(t - landAt + 1, 5);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Kill feed, top right. New lines join at the bottom. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          {kills.map((victim, i) => {
            const at = killAt[i];
            if (t < at) return null;
            const p = SLAM(ramp(t, at, 6));
            const sink = OUT(ramp(t, bandAt + 2 + i, 10));
            const hit = kick(t - at - 4, 7);
            const next = killAt[i + 1];
            const op = next === undefined ? 1 : 1 - 0.42 * ramp(t, next, 8);
            const weapon = WEAPONS[i % WEAPONS.length];
            const headshot = i === 1 || i === kills.length - 1;
            return (
              <div
                key={`${i}-${victim}`}
                style={{
                  position: "absolute",
                  right: feedRight,
                  top: feedTop + i * (lineH + lineGap),
                  height: lineH,
                  display: "flex",
                  alignItems: "stretch",
                  transform: `translateX(${(1 - p) * 115}%)`,
                  opacity:
                    op *
                    (1 -
                      (feedTop + (i + 1) * (lineH + lineGap) > bandY
                        ? 1
                        : 0.62) *
                        sink),
                  clipPath: `polygon(${cut}px 0, 100% 0, 100% 100%, 0 100%)`,
                  background: c.slab,
                  boxShadow: `inset 0 0 0 ${1 * u}px ${c.slabEdge}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${22 * u}px 0 ${30 * u}px`,
                    background: CHIP,
                  }}
                >
                  <RemocnLogo fontSize={36 * u} color="#FFFFFF" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    padding: `0 ${22 * u}px`,
                  }}
                >
                  <svg
                    width={92 * u}
                    height={(92 * u * 28) / 80}
                    viewBox="0 0 80 28"
                    aria-hidden
                  >
                    <path d={weapon} fill={c.ink} />
                  </svg>
                  {headshot ? <Crosshair size={26 * u} color={c.ink} /> : null}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingRight: 26 * u,
                    fontFamily: chakra,
                    fontWeight: 500,
                    fontSize: fs,
                    letterSpacing: "-0.005em",
                    color: c.victim,
                    whiteSpace: "nowrap",
                  }}
                >
                  {victim}
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#FFFFFF",
                    opacity: 0.6 * hit + (1 - p) * 0.5,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Streak callout, bottom left: rolls up to the next one on every kill. */}
        <div
          style={{
            position: "absolute",
            left: calloutLeft,
            bottom: calloutBottom,
            width: W - 2 * calloutLeft,
            height: calloutH,
            overflow: "hidden",
          }}
        >
          {callouts.map((text, i) => {
            const at = killAt[i];
            if (at === undefined || t < at) return null;
            const exitAt = i + 1 < callouts.length ? killAt[i + 1] : bandAt - 3;
            const inP = SLAM(ramp(t, at + 1, 7));
            const outP =
              exitAt === undefined ? 0 : SLAM(ramp(t, exitAt + 1, 7));
            if (outP >= 1) return null;
            return (
              <div
                key={`${i}-${text}`}
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: calloutH,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  transform: `translate(${(1 - inP) * 40 * u}px, ${(1 - inP - outP) * calloutH}px)`,
                  opacity: 1 - outP,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14 * u,
                    marginLeft: 8 * u,
                    fontFamily: chakra,
                    fontWeight: 500,
                    fontSize: 22 * u,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: c.dim,
                  }}
                >
                  <div
                    style={{
                      width: 26 * u,
                      height: 6 * u,
                      background: accent,
                      transform: "skewX(-20deg)",
                    }}
                  />
                  <span>Streak ×{i + 1}</span>
                </div>
                <div
                  style={{
                    fontFamily: chakraItalic,
                    fontWeight: 500,
                    fontStyle: "italic",
                    fontSize: calloutFs,
                    lineHeight: 1.08,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                    color: c.callout,
                    whiteSpace: "nowrap",
                  }}
                >
                  {text}
                </div>
              </div>
            );
          })}
        </div>

        {/* The multi-kill band. */}
        {t >= bandAt ? (
          <div
            style={{
              position: "absolute",
              left: bandX - slant,
              top: bandY,
              width: W + 2 * slant,
              height: bandH,
              clipPath: `polygon(${slant}px 0, 100% 0, calc(100% - ${slant}px) 100%, 0 100%)`,
              background: BAND,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 10 * u,
                height: 2 * u,
                background: HALO[0],
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 10 * u,
                height: 2 * u,
                background: HALO[0],
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: HALO[0],
                opacity: 0.35 * flash,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateX(${textX}px) scale(${textScale})`,
                fontFamily: chakraItalic,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 214 * u,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                paddingTop: 6 * u,
              }}
            >
              {banner}
            </div>
          </div>
        ) : null}

        {/* Logo + caption under the band. */}
        {capIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: bandY + bandH + 34 * u,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22 * u,
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 16 * u}px)`,
            }}
          >
            <RemocnLogo fontSize={46 * u} color={c.ink} />
            <div
              style={{
                width: 2 * u,
                height: 30 * u,
                background: accent,
                transform: "skewX(-20deg)",
              }}
            />
            <div
              style={{
                fontFamily: chakra,
                fontWeight: 500,
                fontSize: 28 * u,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: c.dim,
                paddingTop: 2 * u,
              }}
            >
              {caption}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
