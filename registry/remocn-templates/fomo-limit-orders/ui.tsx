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
export function AssetIcon({
  size = 40,
  color = "#e8b45a",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="20"
        fill="#242720"
        stroke="#ffffff0b"
        strokeWidth="0.5"
      />
      <path d="M9 25h5v6H9Zm8-8h5v14h-5Zm8-8h6v22h-6Z" fill={color} />
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
export const muted = "#aaa79d";
export const lightMuted = "#6a6357";
