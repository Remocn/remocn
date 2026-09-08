import type { CSSProperties, ReactNode } from "react";
import { Img } from "remotion";
import { remocnMark } from "./brand";
import type { SceneProps } from "./content";
import { tween } from "./motion";

export function Layer({
  x = 0,
  y = 0,
  w,
  h,
  style,
  children,
}: {
  x?: number;
  y?: number;
  w?: number | string;
  h?: number | string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export const row: CSSProperties = { display: "flex", alignItems: "center" };
export function Logo({
  brandName,
  logoSrc,
  size = 30,
  color = "white",
  markOnly = false,
}: Pick<SceneProps, "brandName" | "logoSrc"> & {
  size?: number;
  color?: string;
  markOnly?: boolean;
}) {
  return (
    <div
      style={{
        ...row,
        justifyContent: "center",
        gap: size * 0.22,
        color,
        whiteSpace: "nowrap",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: -size * 0.055,
        lineHeight: 1,
      }}
    >
      {logoSrc ? (
        <Img
          src={logoSrc}
          style={{ width: size * 0.9, height: size, objectFit: "contain" }}
        />
      ) : (
        <svg
          width={size * 0.8}
          height={size}
          viewBox="0 0 124.06 134.26"
          aria-hidden
        >
          <path d={remocnMark} fill={color} />
        </svg>
      )}
      {!markOnly && <span>{brandName}</span>}
    </div>
  );
}
export function Glow({
  t,
  accent,
  light = false,
  strength = 1,
}: {
  t: number;
  accent: string;
  light?: boolean;
  strength?: number;
}) {
  return (
    <Layer
      x={-60}
      y={150 + Math.sin(t * 1.1) * 9}
      w={600}
      h={155}
      style={{
        pointerEvents: "none",
        opacity: strength,
        background: `radial-gradient(ellipse at 52% 84%, ${light ? "#e6f7ff" : "#ddf3ff"} 0%, ${accent} 24%, ${accent}66 42%, transparent 69%)`,
        filter: "blur(14px)",
        mixBlendMode: light ? "multiply" : "screen",
      }}
    />
  );
}
export function Landscape({
  media,
  night = 0,
  t = 0,
}: Pick<SceneProps, "media"> & { night?: number; t?: number }) {
  return (
    <Layer
      w={480}
      h={270}
      style={{ overflow: "hidden", background: "#113050" }}
    >
      <Img
        src={media.landscape}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${1.02 + Math.sin(t * 0.12) * 0.015})`,
          filter: `brightness(${1 - night * 0.85}) saturate(${1 - night * 0.25})`,
        }}
      />
      <Layer
        w={480}
        h={270}
        style={{
          background: "#053474",
          opacity: night * 0.52,
          mixBlendMode: "color",
        }}
      />
      <svg
        width="480"
        height="135"
        style={{ position: "absolute", top: 0, opacity: night * 0.85 }}
        aria-hidden
      >
        {Array.from({ length: 125 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 137.5) % 480}
            cy={(i * 43.7) % 120}
            r={i % 7 === 0 ? 0.65 : 0.3}
            fill="white"
            opacity={0.25 + (i % 5) * 0.14}
          />
        ))}
      </svg>
    </Layer>
  );
}
export function Cursor({
  x,
  y,
  click = 0,
  dark = false,
}: {
  x: number;
  y: number;
  click?: number;
  dark?: boolean;
}) {
  return (
    <Layer
      x={x}
      y={y}
      w={15}
      h={19}
      style={{ transform: `scale(${1 - click * 0.18})` }}
    >
      <svg width="15" height="19" viewBox="0 0 15 19" aria-hidden>
        <path
          d="M1 1v14l4-4 3 6 2-1-3-6h6Z"
          fill={dark ? "#111" : "#fff"}
          stroke={dark ? "#fff" : "#111"}
          strokeWidth="0.8"
        />
      </svg>
    </Layer>
  );
}
export function Headline({
  children,
  t,
  start,
  color = "white",
  size = 25,
}: {
  children: ReactNode;
  t: number;
  start: number;
  color?: string;
  size?: number;
}) {
  const p = tween(t, start, start + 0.3);
  return (
    <Layer
      x={25}
      y={111}
      w={430}
      h={48}
      style={{
        ...row,
        justifyContent: "center",
        textAlign: "center",
        fontSize: size,
        color,
        letterSpacing: -1,
        lineHeight: 1.04,
        opacity: p,
        filter: `blur(${(1 - p) * 7}px)`,
        transform: `translateY(${(1 - p) * 15}px)`,
      }}
    >
      {children}
    </Layer>
  );
}
