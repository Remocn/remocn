"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/Manrope";
import { memo, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BlurOutUp } from "@/components/remocn/blur-out-up";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";

export interface Sponsor {
  login: string;
  avatarUrl: string;
}

export interface GitHubSponsorsProps {
  account?: string;
  sponsors?: Sponsor[];
  accentColor?: string;
  speed?: number;
  theme?: "light" | "dark";
}

export const SAMPLE_SPONSORS: Sponsor[] = [
  {
    login: "mojombo",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  {
    login: "defunkt",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
  },
  {
    login: "pjhyett",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
  },
  {
    login: "wycats",
    avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
  },
  {
    login: "schacon",
    avatarUrl: "https://avatars.githubusercontent.com/u/70?v=4",
  },
  {
    login: "rtomayko",
    avatarUrl: "https://avatars.githubusercontent.com/u/5?v=4",
  },
  {
    login: "bmizerany",
    avatarUrl: "https://avatars.githubusercontent.com/u/6?v=4",
  },
  {
    login: "atmos",
    avatarUrl: "https://avatars.githubusercontent.com/u/38?v=4",
  },
  {
    login: "ezmobius",
    avatarUrl: "https://avatars.githubusercontent.com/u/14?v=4",
  },
  {
    login: "macournoyer",
    avatarUrl: "https://avatars.githubusercontent.com/u/15?v=4",
  },
  {
    login: "ivey",
    avatarUrl: "https://avatars.githubusercontent.com/u/18?v=4",
  },
  {
    login: "uggedal",
    avatarUrl: "https://avatars.githubusercontent.com/u/16?v=4",
  },
  {
    login: "anotherjesse",
    avatarUrl: "https://avatars.githubusercontent.com/u/9?v=4",
  },
  {
    login: "technoweenie",
    avatarUrl: "https://avatars.githubusercontent.com/u/21?v=4",
  },
  {
    login: "takeo",
    avatarUrl: "https://avatars.githubusercontent.com/u/22?v=4",
  },
  {
    login: "evanphx",
    avatarUrl: "https://avatars.githubusercontent.com/u/25?v=4",
  },
  {
    login: "vanpelt",
    avatarUrl: "https://avatars.githubusercontent.com/u/26?v=4",
  },
  {
    login: "wayneeseguin",
    avatarUrl: "https://avatars.githubusercontent.com/u/28?v=4",
  },
  {
    login: "brynary",
    avatarUrl: "https://avatars.githubusercontent.com/u/30?v=4",
  },
  {
    login: "kevinclark",
    avatarUrl: "https://avatars.githubusercontent.com/u/31?v=4",
  },
  {
    login: "kballard",
    avatarUrl: "https://avatars.githubusercontent.com/u/7?v=4",
  },
  {
    login: "jnewland",
    avatarUrl: "https://avatars.githubusercontent.com/u/12?v=4",
  },
  {
    login: "caged",
    avatarUrl: "https://avatars.githubusercontent.com/u/13?v=4",
  },
  { login: "sr", avatarUrl: "https://avatars.githubusercontent.com/u/19?v=4" },
];

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

const DRAW_END = 40;
const PULSE_END = 62;
const HEART_DOCK_START = 52;
const HEART_DOCK_END = 84;
const AVATAR_START = 70;
const AVATAR_STEP = 3;
const AVATAR_DUR = 22;
const AVATAR_WINDOW = 56;
const THANK_START = 150;
const SUB_START = 166;
const CTA_START = 182;
const CTA_DUR = 22;

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

export function heartDrawProgress(frame: number, speed = 1): number {
  return interpolate(frame * speed, [0, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

export function heartPulseScale(frame: number, speed = 1): number {
  return interpolate(
    frame * speed,
    [DRAW_END - 2, DRAW_END + 6, DRAW_END + 17, PULSE_END],
    [1, 0.9, 1.06, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    },
  );
}

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
}: {
  sponsor: Sponsor;
  cell: Point;
  progress: number;
  size: number;
  theme: Theme;
}) {
  const y = (1 - progress) * 14;
  const blur = (1 - progress) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: cell.x,
        top: cell.y,
        transform: `translate(-50%, -50%) translateY(${y}px)`,
        opacity: progress,
        filter: `blur(${blur}px)`,
        willChange: "transform, opacity, filter",
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

export function GitHubSponsors({
  account = "remocn",
  sponsors = SAMPLE_SPONSORS,
  accentColor = "#db61a2",
  speed = 1,
  theme = "light",
}: GitHubSponsorsProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = THEMES[theme] ?? THEMES.light;
  const stageScale = Math.min(width / REF_W, height / REF_H);

  const count = sponsors.length;
  const avatarStep =
    count > 1 ? Math.min(AVATAR_STEP, AVATAR_WINDOW / (count - 1)) : 0;
  const cols = gridColumns(count);
  const rows = Math.max(1, Math.ceil(count / Math.max(1, cols)));
  const cellW = GRID_BOX_W / Math.max(1, cols);
  const cellH = GRID_BOX_H / rows;
  const avatarSize = Math.min(84, Math.min(cellW, cellH) * 0.76);

  const cells = useMemo(
    () => gridLayout(count, cols, cellW, cellH),
    [count, cols, cellW, cellH],
  );

  const draw = heartDrawProgress(frame, speed);
  const fillO = ramp(frame, speed, DRAW_END - 8, PULSE_END, Easing.linear);
  const pulse = heartPulseScale(frame, speed);
  const dock = ramp(frame, speed, HEART_DOCK_START, HEART_DOCK_END);

  const heartBase = 168;
  const heartScale = (1 - 0.62 * dock) * pulse;
  const heartDy = (HEART_HEADER_Y - HEART_START_Y) * dock;

  const ctaProgress = ramp(frame, speed, CTA_START, CTA_START + CTA_DUR);
  const ctaBlur = (1 - ctaProgress) * 10;
  const ctaY = (1 - ctaProgress) * 12;
  const accountOpacity = ramp(
    frame,
    speed,
    CTA_START + 8,
    CTA_START + CTA_DUR + 8,
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
          transform: `translate(-50%, -50%) scale(${stageScale})`,
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
              AVATAR_START + i * avatarStep,
              AVATAR_START + i * avatarStep + AVATAR_DUR,
            )}
            size={avatarSize}
            theme={t}
          />
        ))}

        <div
          style={{
            position: "absolute",
            left: GRID_CX,
            top: HEART_START_Y,
            transform: `translate(-50%, -50%) translate(0px, ${heartDy}px) scale(${heartScale})`,
            width: heartBase,
            height: heartBase,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            willChange: "transform",
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
          <Sequence from={Math.round(THANK_START / speed)} layout="none">
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
          <Sequence from={Math.round(SUB_START / speed)} layout="none">
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
              transform: `translateY(${ctaY}px)`,
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
              willChange: "transform, opacity, filter",
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
