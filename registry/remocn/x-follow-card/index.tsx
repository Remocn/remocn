"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { useState } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Cursor, type CursorStyle } from "@/components/remocn/cursor";
import {
  type CursorWaypoint,
  useCursorPath,
} from "@/components/remocn/use-cursor-path";

const { fontFamily: FONT_FAMILY } = loadFont();

export interface XFollowCardProps {
  name?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  website?: string;
  joined?: string;
  verified?: boolean;
  accentColor?: string;
  orientation?: "horizontal" | "vertical";
  speed?: number;
}

interface Theme {
  page: string;
  cardBg: string;
  cardBorder: string;
  fg: string;
  fgMuted: string;
  divider: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#f5f7f9",
    cardBg: "#ffffff",
    cardBorder: "#e6e9eb",
    fg: "#0f1419",
    fgMuted: "#536471",
    divider: "#eff3f4",
  },
  dark: {
    page: "#0a0a0a",
    cardBg: "#16181c",
    cardBorder: "#2f3336",
    fg: "#e7e9ea",
    fgMuted: "#71767b",
    divider: "#2f3336",
  },
};

export const CLICK_FRAME = 110;

const BUTTON_LAYOUT: Record<
  "horizontal" | "vertical",
  { x: number; y: number; w: number; h: number }
> = {
  horizontal: { x: 800, y: 240, w: 116, h: 40 },
  vertical: { x: 542, y: 336, w: 124, h: 44 },
};

export function cardBounceIn(
  frame: number,
  fps: number,
): { translateY: number; scale: number } {
  const s = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });
  const translateY = interpolate(s, [0, 1], [60, 0]);
  const scale = interpolate(s, [0, 1], [0.9, 1]);
  return { translateY, scale };
}

export function blurInSchedule(): {
  group: number;
  start: number;
  end: number;
}[] {
  return [
    { group: 0, start: 20, end: 26 },
    { group: 1, start: 22, end: 28 },
    { group: 2, start: 24, end: 30 },
    { group: 3, start: 26, end: 32 },
    { group: 4, start: 28, end: 34 },
    { group: 5, start: 30, end: 36 },
    { group: 6, start: 32, end: 38 },
    { group: 7, start: 34, end: 40 },
    { group: 8, start: 36, end: 42 },
  ];
}

export function blurInAt(
  step: { start: number; end: number },
  frame: number,
): { blur: number; opacity: number; translateY: number } {
  const range: [number, number] = [step.start, step.end];
  const opts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  return {
    blur: interpolate(frame, range, [8, 0], opts),
    opacity: interpolate(frame, range, [0, 1], opts),
    translateY: interpolate(frame, range, [8, 0], opts),
  };
}

export function followStateAt(frame: number, speed: number): boolean {
  return frame * speed >= CLICK_FRAME;
}

export function buildFollowWaypoints(args: {
  buttonCenter: { x: number; y: number };
  orientation: "horizontal" | "vertical";
}): CursorWaypoint[] {
  const { buttonCenter, orientation } = args;
  const rest =
    orientation === "vertical" ? { x: 640, y: 1120 } : { x: 1120, y: 600 };
  return [
    { at: 0, x: rest.x, y: rest.y },
    { at: 75, x: rest.x, y: rest.y },
    {
      at: CLICK_FRAME,
      x: buttonCenter.x,
      y: buttonCenter.y,
      duration: 32,
      click: true,
      easing: "inOut",
    },
    { at: CLICK_FRAME + 30, x: buttonCenter.x, y: buttonCenter.y },
  ];
}

function tintGradient(accent: string): string {
  return `linear-gradient(135deg, ${accent} 0%, ${accent}99 55%, ${accent}55 100%)`;
}

function Cover({
  coverUrl,
  accent,
  height,
}: {
  coverUrl: string;
  accent: string;
  height: number;
}) {
  const [errored, setErrored] = useState(false);
  const fallback = (
    <div
      style={{
        width: "100%",
        height,
        background: tintGradient(accent),
      }}
    />
  );
  if (errored || !coverUrl) return fallback;
  return (
    <Img
      src={coverUrl}
      crossOrigin="anonymous"
      onError={() => setErrored(true)}
      style={{ width: "100%", height, objectFit: "cover", display: "block" }}
    />
  );
}

function Avatar({
  avatarUrl,
  name,
  size,
  accent,
  theme,
}: {
  avatarUrl: string;
  name: string;
  size: number;
  accent: string;
  theme: Theme;
}) {
  const [errored, setErrored] = useState(false);
  const ringStyle = {
    width: size,
    height: size,
    borderRadius: "100%",
    border: `4px solid ${theme.cardBg}`,
    flexShrink: 0,
    boxSizing: "border-box" as const,
  };

  if (errored || !avatarUrl) {
    return (
      <div
        style={{
          ...ringStyle,
          background: `${accent}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
          fontSize: size * 0.4,
          fontWeight: 700,
          fontFamily: FONT_FAMILY,
        }}
      >
        {name.charAt(0).toUpperCase()}
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

function VerifiedBadge({ accent, size }: { accent: string; size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 22"
      width={size}
      height={size}
      fill={accent}
    >
      <title>Verified</title>
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );
}

function ProfileInfo({
  name,
  handle,
  bio,
  verified,
  accent,
  theme,
  isVertical,
  nameStyle,
  handleStyle,
  bioStyle,
}: {
  name: string;
  handle: string;
  bio: string;
  verified: boolean;
  accent: string;
  theme: Theme;
  isVertical: boolean;
  nameStyle: React.CSSProperties;
  handleStyle: React.CSSProperties;
  bioStyle: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginTop: 12,
      }}
    >
      <div
        style={{ ...nameStyle, display: "flex", alignItems: "center", gap: 6 }}
      >
        <span
          style={{
            fontSize: isVertical ? 28 : 24,
            fontWeight: 800,
            color: theme.fg,
            fontFamily: FONT_FAMILY,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </span>
        {verified && (
          <VerifiedBadge accent={accent} size={isVertical ? 24 : 22} />
        )}
      </div>
      <span
        style={{
          ...handleStyle,
          fontSize: isVertical ? 18 : 16,
          fontWeight: 400,
          color: theme.fgMuted,
          fontFamily: FONT_FAMILY,
          lineHeight: 1.3,
        }}
      >
        @{handle}
      </span>
      <p
        style={{
          ...bioStyle,
          margin: "8px 0 0",
          fontSize: isVertical ? 18 : 16,
          fontWeight: 400,
          color: theme.fg,
          fontFamily: FONT_FAMILY,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {bio}
      </p>
    </div>
  );
}

function MetaRow({
  location,
  website,
  joined,
  accent,
  theme,
}: {
  location: string;
  website: string;
  joined: string;
  accent: string;
  theme: Theme;
}) {
  const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 15,
    color: theme.fgMuted,
    fontFamily: FONT_FAMILY,
  } as const;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 14,
      }}
    >
      <span style={itemStyle}>
        <PinIcon color={theme.fgMuted} />
        {location}
      </span>
      <span style={itemStyle}>
        <LinkIcon color={theme.fgMuted} />
        <span style={{ color: accent }}>{website}</span>
      </span>
      <span style={itemStyle}>
        <CalendarIcon color={theme.fgMuted} />
        {`Joined ${joined}`}
      </span>
    </div>
  );
}

function PinIcon({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <title>Location</title>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function LinkIcon({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <title>Website</title>
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <title>Joined</title>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
  );
}

function FollowButton({
  frame,
  speed,
  accent,
  theme,
  layout,
  pressScale,
}: {
  frame: number;
  speed: number;
  accent: string;
  theme: Theme;
  layout: { x: number; y: number; w: number; h: number };
  pressScale: number;
}) {
  const _followed = followStateAt(frame, speed);
  const flip = interpolate(
    frame * speed,
    [CLICK_FRAME, CLICK_FRAME + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const base = {
    position: "absolute" as const,
    left: layout.x,
    top: layout.y,
    width: layout.w,
    height: layout.h,
    borderRadius: layout.h / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: FONT_FAMILY,
    boxSizing: "border-box" as const,
    transform: `scale(${pressScale})`,
    transformOrigin: "center",
  };

  return (
    <div style={base}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: layout.h / 2,
          background: accent,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - flip,
        }}
      >
        Follow
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: layout.h / 2,
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          color: theme.fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: flip,
        }}
      >
        Following
      </div>
    </div>
  );
}

function MessageButton({
  layout,
  theme,
}: {
  layout: { x: number; y: number; size: number };
  theme: Theme;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: layout.x,
        top: layout.y,
        width: layout.size,
        height: layout.size,
        borderRadius: layout.size / 2,
        border: `1px solid ${theme.cardBorder}`,
        background: theme.cardBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill={theme.fg}>
        <title>Message</title>
        <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.638-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" />
      </svg>
    </div>
  );
}

function Tabs({
  accent,
  theme,
  isVertical,
}: {
  accent: string;
  theme: Theme;
  isVertical: boolean;
}) {
  const tabs = ["Posts", "Replies", "Media", "Likes"];
  return (
    <div
      style={{
        display: "flex",
        marginTop: 0,
        columnGap: 32,
        borderBottom: `1px solid ${theme.divider}`,
      }}
    >
      {tabs.map((tab, i) => {
        const active = i === 0;
        return (
          <div
            key={tab}
            style={{
              // flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingBottom: 12,
              position: "relative",
            }}
          >
            <span
              style={{
                fontSize: isVertical ? 17 : 15,
                fontWeight: active ? 700 : 500,
                color: active ? theme.fg : theme.fgMuted,
                fontFamily: FONT_FAMILY,
              }}
            >
              {tab}
            </span>
            {active && (
              <div
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 4,
                  width: 56,
                  borderRadius: 2,
                  background: accent,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SamplePost({
  name,
  handle,
  avatarUrl,
  accent,
  theme,
}: {
  name: string;
  handle: string;
  avatarUrl: string;
  accent: string;
  theme: Theme;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 16,
      }}
    >
      <Avatar
        avatarUrl={avatarUrl}
        name={name}
        size={44}
        accent={accent}
        theme={theme}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT_FAMILY,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.fg }}>
            {name}
          </span>
          <span style={{ fontSize: 15, color: theme.fgMuted }}>
            {`@${handle} · 2d`}
          </span>
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 15,
            color: theme.fg,
            fontFamily: FONT_FAMILY,
            lineHeight: 1.4,
          }}
        >
          Shipping something new today. Built entirely with Remotion and a lot
          of coffee. More soon.
        </p>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 10,
            color: theme.fgMuted,
            fontFamily: FONT_FAMILY,
            fontSize: 13,
          }}
        >
          <span>12</span>
          <span>48</span>
          <span>312</span>
        </div>
      </div>
    </div>
  );
}

function CursorLayer({
  accent,
  style,
}: {
  accent: string;
  style: CursorStyle;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      <Cursor variant="pointer" rippleColor={accent} style={style} />
    </div>
  );
}

export function XFollowCard({
  name = "remocn",
  handle = "remocn",
  bio = "Building the collaborative video toolkit for small teams.\nShip demos faster with ready-made motion.",
  avatarUrl = "/logo.svg",
  coverUrl = "",
  location = "Tunisia",
  website = "remocn.tn",
  joined = "January 2024",
  verified = true,
  accentColor = "#1d9bf0",
  orientation = "horizontal",
  speed = 1,
}: XFollowCardProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES.light;
  const isVertical = orientation === "vertical";

  const refW = isVertical ? 720 : 1280;
  const refH = isVertical ? 1280 : 720;
  const stageScale = Math.min(width / refW, height / refH);

  const cardWidth = isVertical ? 660 : 600;
  const cardLeft = (refW - cardWidth) / 2;
  const cardTop = isVertical ? 140 : 70;
  const coverHeight = isVertical ? 180 : 150;
  const avatarSize = isVertical ? 120 : 110;

  const bounce = cardBounceIn(frame * speed, fps);
  const schedule = blurInSchedule();

  const layout = BUTTON_LAYOUT[orientation];
  const buttonCenter = {
    x: layout.x + layout.w / 2,
    y: layout.y + layout.h / 2,
  };

  const cursorStyle = useCursorPath(
    buildFollowWaypoints({ buttonCenter, orientation }),
    { speed },
  );
  const pressScale = 0.9 + 0.1 * (cursorStyle.pressScale ?? 1);

  const messageLayout = {
    x: layout.x - layout.h - 8,
    y: layout.y,
    size: layout.h,
  };

  const groupStyle = (group: number) => {
    const step = schedule[group];
    const b = blurInAt(step, frame * speed);
    return {
      filter: b.blur > 0 ? `blur(${b.blur}px)` : "none",
      opacity: b.opacity,
      transform: `translateY(${b.translateY}px)`,
    };
  };

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
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 24,
            overflow: "hidden",
            transform: `translateY(${bounce.translateY}px) scale(${bounce.scale})`,
            transformOrigin: "center top",
            boxShadow: "0 12px 40px -16px rgba(15,20,25,0.18)",
          }}
        >
          <div style={groupStyle(0)}>
            <Cover
              coverUrl={coverUrl}
              accent={accentColor}
              height={coverHeight}
            />
          </div>

          <div style={{ padding: "0 24px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: -(avatarSize / 2),
                position: "relative",
              }}
            >
              <div
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: "100%",
                  background: t.cardBg,
                  flexShrink: 0,
                }}
              >
                <div style={groupStyle(1)}>
                  <Avatar
                    avatarUrl={avatarUrl}
                    name={name}
                    size={avatarSize}
                    accent={accentColor}
                    theme={t}
                  />
                </div>
              </div>
            </div>

            <ProfileInfo
              name={name}
              handle={handle}
              bio={bio}
              verified={verified}
              accent={accentColor}
              theme={t}
              isVertical={isVertical}
              nameStyle={groupStyle(2)}
              handleStyle={groupStyle(3)}
              bioStyle={groupStyle(4)}
            />

            <div style={groupStyle(5)}>
              <MetaRow
                location={location}
                website={website}
                joined={joined}
                accent={accentColor}
                theme={t}
              />
            </div>

            <div style={{ height: layout.h - 8 }} aria-hidden="true" />

            <div style={groupStyle(7)}>
              <Tabs accent={accentColor} theme={t} isVertical={isVertical} />
            </div>

            <div style={groupStyle(8)}>
              <SamplePost
                name={name}
                handle={handle}
                avatarUrl={avatarUrl}
                accent={accentColor}
                theme={t}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${bounce.translateY}px) scale(${bounce.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div style={{ ...groupStyle(6), position: "absolute", inset: 0 }}>
            <MessageButton layout={messageLayout} theme={t} />
            <FollowButton
              frame={frame}
              speed={speed}
              accent={accentColor}
              theme={t}
              layout={layout}
              pressScale={pressScale}
            />
          </div>
        </div>

        <CursorLayer accent={accentColor} style={cursorStyle} />
      </div>
    </AbsoluteFill>
  );
}
