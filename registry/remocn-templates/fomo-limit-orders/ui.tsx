import type { CSSProperties, ReactNode } from "react";
import type { FomoTheme } from "./content";

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
export function AssetIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="20"
        fill="#19191e"
        stroke="#ffffff0b"
        strokeWidth="0.5"
      />
      <path
        d="m9 24 6.7-5.2L12 15h5.1l3.1 2.5C24.7 14.7 29.6 13 34 12.8c-7.7 2.6-14 6.5-19.9 11.2Zm9.3-2.3 2.5-1.6 4.8 3.9h-5Z"
        fill="white"
      />
    </svg>
  );
}
export function Chevron({
  color = "white",
  size = 16,
  up = false,
}: {
  color?: string;
  size?: number;
  up?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: up ? "rotate(-90deg)" : undefined }}
      aria-hidden
    >
      <path
        d="m5 5 7 7-7 7m8-14 7 7-7 7"
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Badge({
  children,
  theme,
}: {
  children: ReactNode;
  theme: FomoTheme;
}) {
  return (
    <span
      style={{
        color: theme.positive,
        background: `${theme.positive}20`,
        padding: "2px 5px",
        borderRadius: 3,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
export const row: CSSProperties = { display: "flex", alignItems: "center" };
export const muted = "#73727f";
