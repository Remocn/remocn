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
      aria-label="Product frame mark"
      role="img"
    >
      <path
        d="M12 12H78V28H28V78H12ZM38 42H88V108H22V92H72V58H38Z"
        fill={color}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
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
        backgroundImage: `linear-gradient(105deg, ${dark ? "#060609" : "#fff"} ${amount * 140 - 35}%, #a0bea9 ${amount * 140 - 18}%, #497761 ${amount * 140}%, ${dark ? "#070707" : "#cedbcb"} ${amount * 140 + 26}%)`,
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
  const type = ((variant % 6) + 6) % 6;
  const paths = [
    "M5 5h21v8H13v13H5ZM19 19h16v16H19v-7h9v-9Z",
    "M4 4h8v8H4Zm12 0h8v8h-8Zm12 0h8v8h-8ZM4 16h8v8H4Zm12 0h8v8h-8ZM4 28h8v8H4Z",
    "M4 30V16a16 16 0 0 1 32 0v14h-7V16a9 9 0 0 0-18 0v14Z",
    "M4 4h12v12H4Zm20 20h12v12H24ZM9 20h5v9h6v5H9Zm11-11h14v11h-5v-6h-9Z",
    "M5 4h7v32H5Zm12 6h7v26h-7Zm12 6h7v20h-7Z",
    "M4 5h32v7H4Zm0 12h22v7H4Zm0 12h12v7H4Z",
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d={paths[type]} fill={color} />
    </svg>
  );
}
