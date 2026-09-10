import type { CSSProperties, ReactNode } from "react";
import { Img, Interactive } from "remotion";
import { clamp, tween } from "./motion";

export function Center({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Title({
  text,
  size = 44,
  style,
}: {
  text: string;
  size?: number;
  style?: CSSProperties;
}) {
  const longest = Math.max(...text.split("\n").map((line) => line.length), 1);
  return (
    <Interactive.Div
      name="Headline"
      style={{
        fontSize: Math.min(size, 720 / longest),
        fontWeight: 500,
        lineHeight: 1.13,
        letterSpacing: "-0.04em",
        wordSpacing: "0.025em",
        textAlign: "center",
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {text}
    </Interactive.Div>
  );
}

export function BrandMark({
  size = 68,
  color = "currentColor",
  src,
}: {
  size?: number;
  color?: string;
  src?: string;
}) {
  if (src)
    return (
      <Img
        src={src}
        style={{ width: size, height: size * 1.25, objectFit: "contain" }}
      />
    );
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 100 125"
      aria-label="Launch brand mark"
      role="img"
    >
      <path
        d="M50 3L96 83H4Z"
        fill={color}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="109" r="17" fill={color} />
    </svg>
  );
}

export function RevealCopy({
  text,
  t,
  start,
  size = 43,
  dark = false,
}: {
  text: string;
  t: number;
  start: number;
  size?: number;
  dark?: boolean;
}) {
  const amount = tween(t, start, start + 0.55);
  return (
    <Title
      text={text}
      size={size}
      style={{
        opacity: clamp((t - start) * 14),
        backgroundImage: `linear-gradient(105deg, ${dark ? "#060609" : "#fff"} ${amount * 140 - 35}%, #80a7ff ${amount * 140 - 18}%, #303be2 ${amount * 140}%, ${dark ? "#070707" : "#b7c4ef"} ${amount * 140 + 26}%)`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        transform: `translateY(${(1 - amount) * 6}px)`,
        filter: `blur(${(1 - amount) * 1.4}px)`,
      }}
    />
  );
}

export function LogoGlyph({
  variant,
  size = 26,
  color = "currentColor",
}: {
  variant: number;
  size?: number;
  color?: string;
}) {
  const type = ((variant % 9) + 9) % 9;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ color }}
    >
      {type === 0 ? (
        <g fill="currentColor">
          <rect x="4" y="3" width="13" height="12" rx="2" />
          <rect x="17" y="14" width="13" height="12" rx="2" />
          <rect x="4" y="25" width="13" height="12" rx="2" />
        </g>
      ) : null}
      {type === 1 ? (
        <g
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M27 7L12 20l15 13M35 7L20 20l15 13M19 7L4 20l15 13" />
        </g>
      ) : null}
      {type === 2 ? (
        <g stroke="currentColor" strokeWidth="4">
          <rect x="2" y="11" width="22" height="17" rx="8" />
          <rect x="16" y="11" width="22" height="17" rx="8" />
        </g>
      ) : null}
      {type === 3 ? (
        <g fill="currentColor">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <ellipse
              key={n}
              cx={10 + n * 3.3}
              cy="20"
              rx={1.2}
              ry={16 - Math.abs(n - 3) * 2}
            />
          ))}
        </g>
      ) : null}
      {type === 4 ? (
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M4 31V10l9 9 8-9v21M24 10h12L24 30h13" />
        </g>
      ) : null}
      {type === 5 ? (
        <g fill="currentColor">
          <path d="M8 4l7 7h10l7-7 4 17c1 21-34 21-33 0z" />
          <ellipse cx="13" cy="23" rx="3" ry="5" fill="white" />
          <ellipse cx="27" cy="23" rx="3" ry="5" fill="white" />
        </g>
      ) : null}
      {type === 6 ? (
        <g stroke="currentColor" strokeWidth="4">
          <rect x="4" y="4" width="32" height="32" rx="11" />
          <path d="M12 18h16M14 25q6 5 12 0M15 12v3M25 12v3" />
        </g>
      ) : null}
      {type === 7 ? (
        <g fill="currentColor">
          <path d="M1 7h38L25 22v14H15V22z" />
        </g>
      ) : null}
      {type === 8 ? (
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M7 14h25l-9 12H7q-8-7 0-12ZM32 8H11l10 22h12M16 14l8 12" />
        </g>
      ) : null}
    </svg>
  );
}
