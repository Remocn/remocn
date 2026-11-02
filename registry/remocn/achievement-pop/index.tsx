"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: geist } = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

export type AchievementIcon = "trophy" | "bolt" | "star";

export interface Achievement {
  label: string;
  title: string;
  points: number;
  icon?: AchievementIcon;
}

export interface AchievementPopProps {
  achievements?: Achievement[];
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const BEATS = {
  starts: [4, 34, 58],
  open: 6,
  shiftLead: 6,
  poster: 30,
  logo: 10,
} as const;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const MORPH = { damping: 200 };

const KILN = ["#5C0A02", "#E2340C", "#FF9A3A", "#FFE9C7"] as const;
const RARE_FILL = `linear-gradient(104deg, #2A0903 0%, ${KILN[0]} 30%, #A8260A 68%, ${KILN[1]} 100%)`;

const DARK_GROUND: Partial<GradientParams> = {
  colors: ["#2A0601", "#7A1404", "#E2340C", "#FF9A3A"],
};

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  colors: ["#F08A4B", "#F7C39A", "#F3E3D3", "#7A2E12"],
  background: "#F2EEE8",
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.8,
  warp: 0.4,
  blur: 0.65,
  grain: 0.3,
  seed: 4,
};

const THEMES = {
  dark: {
    base: "#060201",
    scrim:
      "radial-gradient(64% 58% at 50% 44%, rgba(6,3,2,0.7) 0%, rgba(6,3,2,0) 100%)",
    pill: "#141112",
    depth:
      "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px -14px rgba(0,0,0,0.7)",
    badge: "#1D191A",
    ring: "rgba(255,255,255,0.12)",
    ink: "#F4F1EC",
    dim: "#9A928C",
    rule: "rgba(255,255,255,0.1)",
    flash: KILN[3],
    logo: "#1A0803",
  },
  light: {
    base: "#F2EEE8",
    scrim:
      "radial-gradient(64% 58% at 50% 44%, rgba(246,243,238,0.7) 0%, rgba(246,243,238,0.2) 100%)",
    pill: "#FFFFFF",
    depth:
      "0 0 0 1px rgba(40,24,12,0.06), 0 1px 3px rgba(40,24,12,0.06), 0 16px 32px -14px rgba(90,40,10,0.22)",
    badge: "#F6F3EE",
    ring: "rgba(40,24,12,0.1)",
    ink: "#17120F",
    dim: "#857B73",
    rule: "rgba(40,24,12,0.1)",
    flash: KILN[1],
    logo: "#17120F",
  },
} as const;

function Icon({
  name,
  size,
  color,
}: {
  name: AchievementIcon;
  size: number;
  color: string;
}) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {name === "trophy" ? (
        <g {...common}>
          <path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0V4Z" />
          <path d="M7.5 6H5.2a2 2 0 0 0 0 4h2.6M16.5 6h2.3a2 2 0 0 1 0 4h-2.6" />
          <path d="M12 13v4M9 20h6M10 17h4" />
        </g>
      ) : name === "bolt" ? (
        <path {...common} d="M13.5 3 6 13.4h5.4L10.5 21 18 10.6h-5.4L13.5 3Z" />
      ) : (
        <path
          {...common}
          d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z"
        />
      )}
    </svg>
  );
}

export function AchievementPop({
  achievements = [
    {
      label: "Unlocked · 64% of makers",
      title: "Shipped in one day",
      points: 100,
      icon: "trophy",
    },
    {
      label: "Unlocked · 23% of makers",
      title: "Zero keyframes by hand",
      points: 50,
      icon: "bolt",
    },
    {
      label: "Rare · 1.8% of makers",
      title: "Launch video shipped",
      points: 250,
      icon: "star",
    },
  ],
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: AchievementPopProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W;
  const dark = theme === "dark";
  const c = THEMES[theme];
  const u = tall ? (W * 0.88) / 820 : Math.min(W / 1280, H / 720);
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "kiln" : undefined);
  const resolvedParams = groundParams ?? (dark ? DARK_GROUND : LIGHT_GROUND);

  const list = achievements.slice(0, BEATS.starts.length);
  const n = list.length;
  const starts = BEATS.starts.slice(0, n);
  const lastStart = starts[n - 1] ?? BEATS.starts[0];

  const ph = 116 * u;
  const D = ph;
  const pw = 820 * u;
  const gap = ph + 20 * u;
  const cy = tall ? 0.4 * H : 0.46 * H;

  const sp = (from: number, config: Partial<typeof CARD>, dur?: number) =>
    spring({
      frame: t - from,
      fps,
      config,
      durationInFrames: dur,
    });

  const kf =
    1 + starts.slice(1).reduce((a, s) => a + sp(s - BEATS.shiftLead, CARD), 0);
  const posterAt = lastStart + BEATS.poster;
  const poster = sp(posterAt, HEAVY);
  const stackK = interpolate(kf, [1, 2, 3], [1.26, 1.1, 1], CLAMP);
  const groupK = stackK * interpolate(poster, [0, 1], [1, tall ? 1.04 : 1.12]);
  const logoP = interpolate(
    t,
    [posterAt + BEATS.logo, posterAt + BEATS.logo + 14],
    [0, 1],
    { ...CLAMP, easing: ENTER },
  );

  const total = list.reduce(
    (a, item, i) =>
      a +
      item.points *
        interpolate(t, [starts[i] + 10, starts[i] + 22], [0, 1], {
          ...CLAMP,
          easing: ENTER,
        }),
    0,
  );
  const totalIn = interpolate(t, [starts[0] + 8, starts[0] + 22], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });

  return (
    <AbsoluteFill style={{ background: c.base, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={dark ? 5 : 3}
        timeScale={0.45}
      />
      <AbsoluteFill style={{ background: c.scrim }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${groupK})`,
          transformOrigin: `50% ${(cy / H) * 100}%`,
        }}
      >
        {list.map((a, i) => {
          const s = starts[i];
          if (t < s) return null;
          const rare = i === n - 1 && n > 1;
          const y = cy + (i - (kf - 1) / 2) * gap;
          const pop = sp(s, CHIP);
          const badgeK = 0.5 + 0.5 * pop;
          const open = sp(s + BEATS.open, MORPH, 16);
          const pillW = D + (pw - D) * open;
          const left = W / 2 - pillW / 2;
          const textP = interpolate(
            t,
            [s + BEATS.open + 4, s + BEATS.open + 16],
            [0, 1],
            { ...CLAMP, easing: ENTER },
          );
          const ptsP = interpolate(
            t,
            [s + BEATS.open + 8, s + BEATS.open + 20],
            [0, 1],
            { ...CLAMP, easing: ENTER },
          );
          const flashP = interpolate(t, [s + 2, s + 16], [0, 1], {
            ...CLAMP,
            easing: ENTER,
          });
          const sheen = interpolate(
            t,
            [s + BEATS.open + 14, s + BEATS.open + 32],
            [0, 1],
            { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
          );
          const ink = rare ? "#FFF4E8" : c.ink;
          const dim = rare ? "rgba(255,233,199,0.72)" : c.dim;
          const bx = left + D / 2;
          const R = D / 2;
          const appear = interpolate(t, [s, s + 3], [0, 1], CLAMP);
          return (
            <div key={`${a.title}-${s}`}>
              <div
                style={{
                  position: "absolute",
                  left,
                  top: y - ph / 2,
                  width: pillW,
                  height: ph,
                  borderRadius: ph / 2,
                  overflow: "hidden",
                  background: rare ? RARE_FILL : c.pill,
                  boxShadow: rare
                    ? `inset 0 1px 0 rgba(255,233,199,0.28), 0 0 0 1px rgba(255,154,58,0.28), 0 22px 48px -14px rgba(120,24,4,${dark ? 0.8 : 0.45})`
                    : c.depth,
                  opacity: appear,
                }}
              >
                {rare && sheen > 0 && sheen < 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: 160 * u,
                      left: interpolate(sheen, [0, 1], [-200 * u, pw + 40 * u]),
                      background:
                        "linear-gradient(100deg, transparent 0%, rgba(255,233,199,0.32) 50%, transparent 100%)",
                      transform: "skewX(-20deg)",
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: D + 22 * u,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 10 * u,
                    opacity: textP,
                    transform: `translateX(${(1 - textP) * -24 * u}px)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      fontFamily: mono,
                      fontWeight: 400,
                      fontSize: 17 * u,
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: dim,
                    }}
                  >
                    {a.label}
                  </div>
                  <div
                    style={{
                      fontFamily: geist,
                      fontWeight: 400,
                      fontSize: 40 * u,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: ink,
                    }}
                  >
                    {a.title}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: pw - 220 * u,
                    width: 180 * u,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8 * u,
                    opacity: ptsP,
                    transform: `translateX(${(1 - ptsP) * -16 * u}px)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: geist,
                      fontWeight: 300,
                      fontSize: 40 * u,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      fontVariantNumeric: "tabular-nums",
                      color: ink,
                    }}
                  >
                    +{a.points}
                  </span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontWeight: 400,
                      fontSize: 17 * u,
                      letterSpacing: "0.04em",
                      color: dim,
                      transform: `translateY(${4 * u}px)`,
                    }}
                  >
                    XP
                  </span>
                </div>
              </div>

              {flashP > 0 && flashP < 1 ? (
                <svg
                  width={W}
                  height={H}
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                  }}
                  aria-hidden
                >
                  <circle
                    cx={bx}
                    cy={y}
                    r={R * interpolate(flashP, [0, 1], [0.9, 1.7])}
                    fill="none"
                    stroke={rare ? KILN[2] : c.flash}
                    strokeWidth={interpolate(flashP, [0, 1], [5, 0.5]) * u}
                    opacity={(1 - flashP) * 0.9}
                  />
                </svg>
              ) : null}

              <div
                style={{
                  position: "absolute",
                  left: bx - R,
                  top: y - R,
                  width: D,
                  height: D,
                  transform: `scale(${badgeK})`,
                  opacity: appear,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 10 * u,
                    borderRadius: "50%",
                    background: rare ? "rgba(255,233,199,0.12)" : c.badge,
                    boxShadow: rare
                      ? "inset 0 0 0 1px rgba(255,233,199,0.45)"
                      : `inset 0 0 0 1px ${c.ring}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={a.icon ?? "trophy"} size={40 * u} color={ink} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tall ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0.66 * H,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18 * u,
            opacity: totalIn,
            transform: `translateY(${(1 - totalIn) * 24 * u}px)`,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontWeight: 400,
              fontSize: 20 * u,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: c.dim,
            }}
          >
            Launch week
          </div>
          <div
            style={{
              fontFamily: geist,
              fontWeight: 300,
              fontSize: 170 * u,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              fontVariantNumeric: "tabular-nums",
              color: c.ink,
            }}
          >
            {Math.round(total)}
            <span
              style={{ fontSize: 56 * u, letterSpacing: "0", color: c.dim }}
            >
              {" "}
              XP
            </span>
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: tall ? 0.88 * H : 0.885 * H,
          display: "flex",
          justifyContent: "center",
          opacity: logoP,
          transform: `translateY(${(1 - logoP) * 14 * u}px)`,
        }}
      >
        <RemocnLogo fontSize={30 * u} color={c.logo} />
      </div>
    </AbsoluteFill>
  );
}
