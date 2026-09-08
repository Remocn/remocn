import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img } from "remotion";
import type { SceneProps } from "./content";
import { fitSize, mix, progress } from "./motion";

export const center: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
export const mono = "'SFMono-Regular', Consolas, 'Liberation Mono', monospace";
export const markPath =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

export function BrandMark({
  content,
  logoSrc,
  size = 100,
  color = "currentColor",
}: Pick<SceneProps, "content" | "logoSrc"> & {
  size?: number;
  color?: string;
}) {
  if (logoSrc)
    return (
      <Img
        src={logoSrc}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  if (content.productName.toLowerCase() !== "remocn")
    return (
      <div
        style={{
          ...center,
          width: size,
          height: size,
          border: `2px solid ${color}`,
          borderRadius: size * 0.22,
          fontSize: size * 0.64,
          fontWeight: 600,
          color,
        }}
      >
        {Array.from(content.productName)[0]}
      </div>
    );
  return (
    <svg
      width={size * 0.925}
      height={size}
      viewBox="0 0 124.06 134.26"
      aria-hidden="true"
    >
      <path fill={color} d={markPath} />
    </svg>
  );
}

export function Wordmark({
  content,
  logoSrc,
  size = 200,
  color = "currentColor",
}: Pick<SceneProps, "content" | "logoSrc"> & {
  size?: number;
  color?: string;
}) {
  const fontSize = fitSize(content.productName, size, 1300);
  const isRemocn = content.productName.toLowerCase() === "remocn" && !logoSrc;
  return (
    <div
      style={{
        ...center,
        gap: isRemocn ? 7 : 24,
        fontSize,
        fontWeight: 600,
        letterSpacing: "-0.075em",
        lineHeight: 1,
        color,
      }}
    >
      <BrandMark
        content={content}
        logoSrc={logoSrc}
        size={fontSize * 0.78}
        color={color}
      />
      <span>
        {isRemocn ? content.productName.slice(1) : content.productName}
      </span>
    </div>
  );
}

export function Stage({
  children,
  theme,
  light = false,
  style,
}: {
  children?: ReactNode;
  theme: SceneProps["theme"];
  light?: boolean;
  style?: CSSProperties;
}) {
  return (
    <AbsoluteFill
      style={{
        background: light ? theme.paper : theme.ink,
        color: light ? theme.ink : theme.paper,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function Eyebrow({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 19,
        fontWeight: 500,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Headline({
  text,
  time,
  start = 0,
  size = 114,
  width = 1660,
  color,
  style,
}: {
  text: string;
  time: number;
  start?: number;
  size?: number;
  width?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const words = text.split(/\s+/);
  return (
    <div
      style={{
        width,
        fontSize: fitSize(text, size, width),
        fontWeight: 500,
        letterSpacing: "-0.055em",
        lineHeight: 1.1,
        color,
        ...style,
      }}
    >
      {words.map((word, i) => {
        const p = progress(time, start + i * 0.065, 0.32);
        return (
          <span
            key={`${i}-${word}`}
            style={{
              display: "inline-block",
              marginRight: "0.24em",
              opacity: p,
              translate: `0 ${mix(60, 0, p)}px`,
              filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

export function CornerLabel({
  children,
  light = false,
  theme,
}: {
  children: ReactNode;
  light?: boolean;
  theme: SceneProps["theme"];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 68,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: light ? theme.ink : theme.paper,
        opacity: 0.7,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 9,
          background: theme.accent,
        }}
      />
      <Eyebrow>{children}</Eyebrow>
    </div>
  );
}

export function Cursor({
  x,
  y,
  scale = 1,
  pressed = false,
  color = "#141318",
}: {
  x: number;
  y: number;
  scale?: number;
  pressed?: boolean;
  color?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width="54"
      height="66"
      viewBox="0 0 54 66"
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: scale * (pressed ? 0.86 : 1),
        transformOrigin: "8px 6px",
        filter: "drop-shadow(0 6px 6px #0003)",
      }}
    >
      <path
        d="M8 6L43 36L28 39L22 55Z"
        fill={color}
        stroke="#F5F3EE"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WindowBar({
  title,
  dark = false,
}: {
  title: string;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 26px",
        borderBottom: `1px solid ${dark ? "#ffffff18" : "#14131815"}`,
        fontSize: 18,
        color: dark ? "#ada9b7" : "#706d77",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: 9,
            background: dark ? "#ffffff30" : "#14131825",
          }}
        />
      ))}
      <span style={{ marginLeft: 16, fontFamily: mono }}>{title}</span>
    </div>
  );
}
