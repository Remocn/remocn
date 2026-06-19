"use client";

import { useState } from "react";
import { loadFont as loadSans } from "@remotion/google-fonts/Manrope";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Confetti } from "@/components/remocn/confetti";

export interface FollowerNotification {
  name: string;
  verified: boolean;
  /** Relative time label, e.g. "7h", "1d". */
  time: string;
}

export interface XFollowersOverviewProps {
  notifications?: FollowerNotification[];
  totalFollowers?: number;
  handle?: string;
  avatarUrl?: string;
  accentColor?: string;
  orientation?: "horizontal" | "vertical";
  speed?: number;
}

const { fontFamily: SANS_FAMILY } = loadSans();
const FONT_FAMILY = SANS_FAMILY;

interface Theme {
  bg: string;
  fg: string;
  fgMuted: string;
  border: string;
}

const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    bg: "#ffffff",
    fg: "#0f1419",
    fgMuted: "#536471",
    border: "#eff3f4",
  },
  dark: {
    bg: "#0a0a0a",
    fg: "#e7e9ea",
    fgMuted: "#71767b",
    border: "#2f3336",
  },
};

/**
 * Hardcoded sample notifications so the composition renders immediately from
 * defaults. A future revision swaps this for live X API data.
 */
export const SAMPLE_FOLLOWERS: FollowerNotification[] = [
  { name: "Andre Vitorio", verified: true, time: "7h" },
  { name: "Sarah Chen", verified: true, time: "7h" },
  { name: "marcus", verified: false, time: "8h" },
  { name: "Lena Powell", verified: true, time: "9h" },
  { name: "dev_jay", verified: false, time: "10h" },
  { name: "Priya Nair", verified: true, time: "11h" },
  { name: "Tomás Rivera", verified: true, time: "13h" },
  { name: "hana.eth", verified: false, time: "15h" },
  { name: "Will Carter", verified: true, time: "18h" },
  { name: "Yuki Tanaka", verified: true, time: "21h" },
  { name: "benoit", verified: false, time: "23h" },
  { name: "Amara Okafor", verified: true, time: "1d" },
  { name: "Leo Martins", verified: true, time: "1d" },
  { name: "sol", verified: false, time: "2d" },
];

// --- Pure helpers (unit-tested) -------------------------------------------

/** Map an effective frame to the active notification index + in-slot fraction. */
export function slotProgress(
  fc: number,
  slotFrames: number,
  count: number,
): { idx: number; frac: number } {
  if (slotFrames <= 0 || count <= 0) return { idx: 0, frac: 0 };
  const pos = fc / slotFrames;
  const idx = Math.max(0, Math.min(Math.floor(pos), count - 1));
  const frac = Math.max(0, Math.min(pos - idx, 1));
  return { idx, frac };
}

/** Smoothstep flip ramp: rest for `hold` of the slot, then flip 0→1. */
export function flipEase(frac: number, hold: number): number {
  if (hold >= 1) return 0;
  const raw = (frac - hold) / (1 - hold);
  const c = Math.max(0, Math.min(raw, 1));
  return c * c * (3 - 2 * c);
}

export function blurIn(
  frame: number,
  start: number,
  end: number,
): { blur: number; opacity: number; translateY: number } {
  const range: [number, number] = [start, end];
  const opts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  return {
    blur: interpolate(frame, range, [10, 0], opts),
    opacity: interpolate(frame, range, [0, 1], opts),
    translateY: interpolate(frame, range, [12, 0], opts),
  };
}

// --- Sub-components --------------------------------------------------------

function VerifiedBadge({ accent, size }: { accent: string; size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 22"
      width={size}
      height={size}
      fill={accent}
      style={{ flexShrink: 0 }}
    >
      <title>Verified</title>
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );
}

function Avatar({
  avatarUrl,
  handle,
  size,
  theme,
}: {
  avatarUrl: string;
  handle: string;
  size: number;
  theme: Theme;
}) {
  const [errored, setErrored] = useState(false);
  const ringStyle = {
    width: size,
    height: size,
    borderRadius: 9999,
    border: `1px solid ${theme.border}`,
    flexShrink: 0,
  } as const;

  if (errored || !avatarUrl) {
    return (
      <div
        style={{
          ...ringStyle,
          background: theme.border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.fgMuted,
          fontSize: size * 0.42,
          fontWeight: 700,
          fontFamily: FONT_FAMILY,
        }}
      >
        {handle.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Img
      src={avatarUrl}
      crossOrigin="anonymous"
      onError={() => setErrored(true)}
      style={{ ...ringStyle, objectFit: "cover" }}
    />
  );
}

/** Username + verified badge — the only part that flips. Absolutely overlaid
 *  and centered inside a slot sized to the active name, so the line as a whole
 *  stays centered while names swap. */
function NameBlock({
  item,
  fontSize,
  height,
  theme,
  accent,
  deg,
  opacity,
}: {
  item: FollowerNotification;
  fontSize: number;
  height: number;
  theme: Theme;
  accent: string;
  deg: number;
  opacity: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: fontSize * 0.2,
        whiteSpace: "nowrap",
        transformOrigin: "center",
        backfaceVisibility: "hidden",
        transform: `rotateX(${deg}deg)`,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          fontWeight: 800,
          color: theme.fg,
          lineHeight: 1,
        }}
      >
        {item.name}
      </span>
      {item.verified && (
        <VerifiedBadge accent={accent} size={fontSize * 0.66} />
      )}
    </div>
  );
}

// --- Main composition ------------------------------------------------------

export function XFollowersOverview({
  notifications = SAMPLE_FOLLOWERS,
  totalFollowers = 1709,
  handle = "remocn",
  avatarUrl = "/logo.svg",
  accentColor = "#1d9bf0",
  orientation = "horizontal",
  speed = 1,
}: XFollowersOverviewProps) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height, fps } = useVideoConfig();
  const t = THEMES.light;
  const isVertical = orientation === "vertical";

  const refW = isVertical ? 720 : 1280;
  const refH = isVertical ? 1280 : 720;
  const stageScale = Math.min(width / refW, height / refH);

  const notifSize = isVertical ? 38 : 46;
  const countNum = isVertical ? 92 : 110;
  const countLabel = isVertical ? 40 : 46;
  const perspective = isVertical ? 1000 : 1200;
  const stageH = isVertical ? 160 : 180;
  const lineH = notifSize * 1.4;
  // Fast cadence: ~0.43s per username at speed 1; flip occupies the back half.
  const SLOT = 13;
  const HOLD = 0.45;

  const fc = frame * speed;
  const items = notifications.length > 0 ? notifications : SAMPLE_FOLLOWERS;
  const count = items.length;

  // Notifications cycle first, then the total blurs in. The reveal starts once
  // the list is exhausted, capped so it always fits before the timeline ends.
  const revealStart = Math.min(
    count * SLOT,
    Math.round(durationInFrames * 0.82),
  );

  const { idx, frac } = slotProgress(fc, SLOT, count);
  const flipP = flipEase(frac, HOLD);
  const hasNext = idx + 1 < count;

  const current = items[idx];
  const next = hasNext ? items[idx + 1] : undefined;
  const activeItem = flipP >= 0.5 && next ? next : current;

  const currentDeg = hasNext ? -90 * flipP : 0;
  const currentOpacity = hasNext
    ? interpolate(flipP, [0, 0.55], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const nextDeg = 90 * (1 - flipP);
  const nextOpacity = interpolate(flipP, [0.45, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const notifOpacity = interpolate(
    fc,
    [revealStart - 4, revealStart + 8],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const countIn = blurIn(fc, revealStart + 4, revealStart + 28);
  // Dynamic pop: spring overshoot on the total as it blurs in.
  const revealSpring = spring({
    fps,
    frame: fc - (revealStart + 2),
    config: { damping: 10, stiffness: 170, mass: 0.8 },
  });
  const revealScale = interpolate(revealSpring, [0, 1], [0.5, 1]);

  // Avatar + handle reveal in sync with the total: same window as countIn,
  // avatar sliding in from the left, handle from the right.
  const avatarSize = isVertical ? 72 : 64;
  const handleSize = isVertical ? 30 : 34;
  const avatarIn = blurIn(fc, revealStart + 4, revealStart + 28);
  const handleIn = avatarIn;
  const slideOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const avatarX = interpolate(
    fc,
    [revealStart + 4, revealStart + 28],
    [-36, 0],
    slideOpts,
  );
  const handleX = interpolate(
    fc,
    [revealStart + 4, revealStart + 28],
    [36, 0],
    slideOpts,
  );

  // Confetti fires on the real frame the reveal begins (sync across speeds),
  // centered on the canvas.
  const confettiStart = Math.round((revealStart + 2) / speed);
  const confettiColors = [
    accentColor,
    "#ff5da2",
    "#ffd23f",
    "#22c55e",
    "#a855f7",
  ];


  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: refH,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: refW, height: stageH }}>
            {/* Cycling notifications — only the username flips in 3D, the
                "followed you · <time>" suffix stays put. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: notifSize * 0.28,
                opacity: notifOpacity,
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: lineH,
                  perspective,
                  display: "inline-flex",
                }}
              >
                {/* Invisible spacer sizes the slot to the active name so the
                    whole line stays centered; flips overlay it absolutely. */}
                <div
                  aria-hidden="true"
                  style={{
                    visibility: "hidden",
                    display: "flex",
                    alignItems: "center",
                    gap: notifSize * 0.2,
                    whiteSpace: "nowrap",
                    fontFamily: FONT_FAMILY,
                    fontSize: notifSize,
                    fontWeight: 800,
                  }}
                >
                  {activeItem.name}
                  {activeItem.verified && (
                    <span style={{ width: notifSize * 0.66 }} />
                  )}
                </div>
                <NameBlock
                  item={current}
                  fontSize={notifSize}
                  height={lineH}
                  theme={t}
                  accent={accentColor}
                  deg={currentDeg}
                  opacity={currentOpacity}
                />
                {next && (
                  <NameBlock
                    item={next}
                    fontSize={notifSize}
                    height={lineH}
                    theme={t}
                    accent={accentColor}
                    deg={nextDeg}
                    opacity={nextOpacity}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: notifSize,
                  fontWeight: 500,
                  color: t.fgMuted,
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                followed you · {activeItem.time}
              </span>
            </div>

            {/* Total reveal: avatar + handle above the count */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isVertical ? 26 : 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    opacity: avatarIn.opacity,
                    filter:
                      avatarIn.blur > 0 ? `blur(${avatarIn.blur}px)` : "none",
                    transform: `translateX(${avatarX}px)`,
                  }}
                >
                  <Avatar
                    avatarUrl={avatarUrl}
                    handle={handle}
                    size={avatarSize}
                    theme={t}
                  />
                </div>
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: handleSize,
                    fontWeight: 700,
                    color: t.fg,
                    whiteSpace: "nowrap",
                    opacity: handleIn.opacity,
                    filter:
                      handleIn.blur > 0 ? `blur(${handleIn.blur}px)` : "none",
                    transform: `translateX(${handleX}px)`,
                  }}
                >
                  @{handle}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 18,
                  opacity: countIn.opacity,
                  filter: countIn.blur > 0 ? `blur(${countIn.blur}px)` : "none",
                  transform: `translateY(${countIn.translateY}px) scale(${revealScale})`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: countNum,
                    fontWeight: 800,
                    color: t.fg,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {totalFollowers.toLocaleString("en-US")}
                </span>
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: countLabel,
                    fontWeight: 500,
                    color: t.fgMuted,
                    lineHeight: 1,
                  }}
                >
                  Followers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Confetti
        startFrame={confettiStart}
        originX={0.5}
        originY={0.5}
        colors={confettiColors}
        particleCount={160}
      />
    </AbsoluteFill>
  );
}
