"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/Manrope";
import { memo, useMemo, useState } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence } from "remotion";
import { BlurOutUp } from "@/components/remocn/blur-out-up";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import {
  useCompositionFrames,
  useSceneConfig,
  useSceneFrame,
} from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedElement,
  resolve,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_SPONSORS,
  type GitHubSponsorsElementId,
  gitHubSponsorsTimeline,
  type SponsorEntry,
} from "./timeline";

export type Sponsor = SponsorEntry;

export interface GitHubSponsorsProps {
  account?: string;
  sponsors?: Sponsor[];
  accentColor?: string;
  speed?: number;
  theme?: "light" | "dark";
  /**
   * Moves, trims or stretches the heart, its dock, each avatar, the copy and
   * the call to action, by the ids in `./timeline`. Frames on the scene
   * timeline, after `speed`.
   */
  timing?: Timing<GitHubSponsorsElementId>;
}

export const SAMPLE_SPONSORS: Sponsor[] = DEFAULT_SPONSORS;

const { fontFamily: SANS_FAMILY } = loadSans();
const FONT_FAMILY = SANS_FAMILY;

const HEART_PATH =
  "M12.0001 4.52853C14.2745 2.23823 17.9866 2.23823 20.2611 4.52853C22.5784 6.86156 22.5784 10.667 20.2611 13.0001L12.0001 21.3199L3.73907 13.0001C1.42175 10.667 1.42175 6.86156 3.73907 4.52853C6.01353 2.23823 9.72563 2.23823 12.0001 4.52853Z";

const REF_W = 1280;
const REF_H = 720;
const GRID_CX = 640;
const GRID_CY = 304;
const GRID_BOX_W = 900;
const GRID_BOX_H = 236;
const HEART_START_Y = 286;
const HEART_HEADER_Y = 120;

type HeartElement = ResolvedElement<GitHubSponsorsElementId>;

/** The heart as the schedule lays it out without `timing`. */
const DEFAULT_HEART: HeartElement = resolve(
  gitHubSponsorsTimeline({}, { length: 0 }),
).get("heart");

interface Theme {
  bg: string;
  bgSubtle: string;
  fg: string;
  fgMuted: string;
  border: string;
}

const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    bg: "#ffffff",
    bgSubtle: "#fafafa",
    fg: "#171717",
    fgMuted: "#737373",
    border: "#ededed",
  },
  dark: {
    bg: "#0a0a0a",
    bgSubtle: "#161618",
    fg: "#fafafa",
    fgMuted: "#a1a1aa",
    border: "#262626",
  },
};

export interface Point {
  x: number;
  y: number;
}

export function gridColumns(
  count: number,
  boxW = GRID_BOX_W,
  boxH = GRID_BOX_H,
): number {
  if (count <= 0) return 0;
  return Math.max(
    1,
    Math.min(count, Math.round(Math.sqrt((count * boxW) / boxH))),
  );
}

export function gridLayout(
  count: number,
  cols: number,
  cellW: number,
  cellH: number,
  cx = GRID_CX,
  cy = GRID_CY,
): Point[] {
  if (count <= 0 || cols <= 0) return [];
  const rows = Math.ceil(count / cols);
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const rowCount = Math.min(cols, count - r * cols);
    const rowW = (rowCount - 1) * cellW;
    const x = cx - rowW / 2 + c * cellW;
    const totalH = (rows - 1) * cellH;
    const y = cy - totalH / 2 + r * cellH;
    out.push({ x, y });
  }
  return out;
}

export function heartDrawProgress(
  frame: number,
  speed = 1,
  heart: HeartElement = DEFAULT_HEART,
): number {
  return interpolate(frame * speed, [heart.start, heart.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

export function heartPulseScale(
  frame: number,
  speed = 1,
  heart: HeartElement = DEFAULT_HEART,
): number {
  return interpolate(
    frame * speed,
    [
      heart.start + heart.beat("pulseAt"),
      heart.start + heart.beat("squeeze"),
      heart.start + heart.beat("bounce"),
      heart.start + heart.beat("pulseEnd"),
    ],
    [1, 0.9, 1.06, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    },
  );
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function ramp(
  frame: number,
  speed: number,
  start: number,
  end: number,
  easing = Easing.bezier(0.22, 1, 0.36, 1),
): number {
  return interpolate(frame * speed, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

function Avatar({
  login,
  avatarUrl,
  size,
  theme,
  grayscale,
}: {
  login: string;
  avatarUrl: string;
  size: number;
  theme: Theme;
  grayscale: number;
}) {
  const [errored, setErrored] = useState(false);
  const base = {
    width: size,
    height: size,
    borderRadius: 9999,
    border: `1px solid ${theme.border}`,
    flexShrink: 0,
    filter: `grayscale(${grayscale})`,
  } as const;

  if (errored || !avatarUrl) {
    return (
      <div
        style={{
          ...base,
          background: theme.bgSubtle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.fgMuted,
          fontSize: size * 0.42,
          fontWeight: 600,
          fontFamily: FONT_FAMILY,
        }}
      >
        {login.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Img
      src={avatarUrl}
      crossOrigin="anonymous"
      onError={() => setErrored(true)}
      style={{ ...base, objectFit: "cover" }}
    />
  );
}

const SponsorNode = memo(function SponsorNode({
  sponsor,
  cell,
  progress,
  size,
  theme,
  glide,
}: {
  sponsor: Sponsor;
  cell: Point;
  progress: number;
  size: number;
  theme: Theme;
  glide: (moving: boolean) => string;
}) {
  const y = (1 - progress) * 14;
  const blur = (1 - progress) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: cell.x,
        top: cell.y,
        translate: `-50% calc(-50% + ${y}px)`,
        // The fallback initial is text and rides the rise.
        transform: glide(midway(progress)) || undefined,
        opacity: progress,
        filter: `blur(${blur}px)`,
        willChange: "opacity, filter",
      }}
    >
      <Avatar
        login={sponsor.login}
        avatarUrl={sponsor.avatarUrl}
        size={size}
        theme={theme}
        grayscale={1 - progress}
      />
    </div>
  );
});

function HeartGlyph({
  size,
  accent,
  draw,
  fill,
}: {
  size: number;
  accent: string;
  draw: number;
  fill: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <title>GitHub Sponsors</title>
      <path
        d={HEART_PATH}
        pathLength={1}
        fill={accent}
        fillOpacity={fill}
        stroke={accent}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </svg>
  );
}

export function GitHubSponsors(props: GitHubSponsorsProps) {
  const {
    account = "remocn",
    sponsors = SAMPLE_SPONSORS,
    accentColor = "#db61a2",
    speed = 1,
    theme = "light",
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    gitHubSponsorsTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const heart = tl.get("heart");
  const dockEl = tl.get("dock");
  const cta = tl.get("cta");
  // A `<Sequence>` starts on one of the composition's own frames.
  const toFrames = useCompositionFrames();
  const t = THEMES[theme] ?? THEMES.light;
  const stageScale = Math.min(width / REF_W, height / REF_H);

  const count = sponsors.length;
  const cols = gridColumns(count);
  const rows = Math.max(1, Math.ceil(count / Math.max(1, cols)));
  const cellW = GRID_BOX_W / Math.max(1, cols);
  const cellH = GRID_BOX_H / rows;
  const avatarSize = Math.min(84, Math.min(cellW, cellH) * 0.76);

  const cells = useMemo(
    () => gridLayout(count, cols, cellW, cellH),
    [count, cols, cellW, cellH],
  );

  const draw = heartDrawProgress(frame, speed, heart);
  const fillO = ramp(
    frame,
    speed,
    heart.start + heart.beat("fillAt"),
    heart.start + heart.beat("fillEnd"),
    Easing.linear,
  );
  const pulse = heartPulseScale(frame, speed, heart);
  const dock = ramp(frame, speed, dockEl.start, dockEl.end);

  const heartBase = 168;
  const heartScale = (1 - 0.62 * dock) * pulse;
  const heartDy = (HEART_HEADER_Y - HEART_START_Y) * dock;

  const ctaProgress = ramp(frame, speed, cta.start, cta.end);
  const ctaBlur = (1 - ctaProgress) * 10;
  const ctaY = (1 - ctaProgress) * 12;
  const accountOpacity = ramp(
    frame,
    speed,
    cta.start + cta.beat("account"),
    cta.end + cta.beat("account"),
  );

  return (
    <AbsoluteFill style={{ background: t.bg }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: REF_W,
          height: REF_H,
          translate: "-50% -50%",
          scale: `${stageScale}`,
        }}
      >
        {sponsors.map((sponsor, i) => (
          <SponsorNode
            key={`node-${sponsor.login}-${i}`}
            sponsor={sponsor}
            cell={cells[i]}
            progress={ramp(
              frame,
              speed,
              tl.get(`avatar:${i}`).start,
              tl.get(`avatar:${i}`).end,
            )}
            size={avatarSize}
            theme={t}
            glide={glide}
          />
        ))}

        <div
          style={{
            position: "absolute",
            left: GRID_CX,
            top: HEART_START_Y,
            translate: `-50% calc(-50% + ${heartDy}px)`,
            scale: `${heartScale}`,
            width: heartBase,
            height: heartBase,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartGlyph
            size={heartBase}
            accent={accentColor}
            draw={draw}
            fill={fillO}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 444,
            width: REF_W,
            height: 84,
          }}
        >
          <Sequence
            from={toFrames(tl.get("thanks").start / speed)}
            layout="none"
          >
            <SoftBlurIn
              text="Thank you"
              fontSize={54}
              fontWeight={600}
              color={t.fg}
              speed={speed}
            />
          </Sequence>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 532,
            width: REF_W,
            height: 36,
          }}
        >
          <Sequence
            from={toFrames(tl.get("count").start / speed)}
            layout="none"
          >
            <BlurOutUp
              text={`Powered by ${count} sponsors`}
              fontSize={24}
              fontWeight={500}
              color={t.fgMuted}
              speed={speed}
            />
          </Sequence>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 584,
            width: REF_W,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              translate: `0 ${ctaY}px`,
              transform: glide(midway(ctaProgress)) || undefined,
              opacity: ctaProgress,
              filter: `blur(${ctaBlur}px)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 26px",
              borderRadius: 9999,
              background: accentColor,
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 600,
              fontFamily: FONT_FAMILY,
              willChange: "opacity, filter",
            }}
          >
            <HeartGlyph size={22} accent="#ffffff" draw={1} fill={1} />
            Become a sponsor
          </div>
          <div
            style={{
              opacity: accountOpacity * 0.9,
              fontSize: 18,
              fontWeight: 400,
              color: t.fgMuted,
              fontFamily: FONT_FAMILY,
            }}
          >
            github.com/sponsors/{account}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
