import type { CSSProperties, ReactNode } from "react";
import { Img, Interactive } from "remotion";
import { Caret } from "@/components/remocn/caret";
import { clamp, move, ramp, smooth, typed } from "./motion";

export const mono = '"Roboto Mono", monospace';

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

export function AccentText({
  text,
  highlight,
  accent,
  fullText = text,
}: {
  text: string;
  highlight?: string;
  accent: string;
  fullText?: string;
}) {
  const index = highlight ? fullText.indexOf(highlight) : -1;
  if (!highlight || index < 0 || index >= text.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span style={{ color: accent }}>
        {text.slice(index, index + highlight.length)}
      </span>
      {text.slice(index + highlight.length)}
    </>
  );
}

export function XMark({
  size = 52,
  color = "currentColor",
  outline = false,
  progress = 1,
  src,
}: {
  size?: number;
  color?: string;
  outline?: boolean;
  progress?: number;
  src?: string;
}) {
  if (src)
    return (
      <Img
        src={src}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Workflow node mark"
    >
      <path
        d="M2 3h7v7H2V3Zm13 11h7v7h-7v-7ZM5 12h2v5h6v2H5v-7Zm6-7h8v7h-2V7h-6V5Z"
        fill={outline ? "none" : color}
        fillRule="evenodd"
        stroke={outline ? color : "none"}
        strokeWidth={0.3}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - clamp(progress)}
      />
    </svg>
  );
}

export function Command({
  text,
  t,
  start,
  finish,
  end,
  size = 18,
  tracking = false,
  entering = true,
}: {
  text: string;
  t: number;
  start: number;
  finish: number;
  end: number;
  size?: number;
  tracking?: boolean;
  entering?: boolean;
}) {
  const written = typed(text, t, start, finish);
  const chars = Array.from(text).length * ramp(t, start, finish);
  const progress = ramp(t, start - 0.2, start + 0.25);
  const width = entering
    ? move(t, start - 0.2, start + (tracking ? 1.3 : 0.9), 100, 420, smooth)
    : 420;
  const track = tracking ? Math.max(0, chars * size * 0.6 - 325) : 0;
  const fade = 1 - move(t, end - 0.18, end);
  return (
    <Center style={{ opacity: fade }}>
      <Interactive.Div
        name="Typed command"
        style={{
          width,
          height: size * 2.5,
          overflow: "hidden",
          position: "relative",
          opacity: entering ? progress : 1,
          maskImage:
            "linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)",
          fontFamily: mono,
          fontSize: size,
          color: "#e6f1f8",
          whiteSpace: "pre",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "0.75px solid #3b536c",
            marginInline: 10,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
            translate: `${25 - track}px 0px`,
            gap: size * 0.6,
          }}
        >
          <span
            style={{ fontSize: size * 1.3, fontWeight: 500, lineHeight: 1 }}
          >
            ❯
          </span>
          <span>
            {written}
            <Caret
              color="#f5f5f5"
              height={size * 1.08}
              width={1.8}
              marginLeft={1}
              opacity={
                t < finish + 0.12
                  ? 1
                  : Math.floor((t - finish) * 2.5) % 2 === 0
                    ? 1
                    : 0
              }
            />
          </span>
        </div>
      </Interactive.Div>
    </Center>
  );
}

export function Loading({
  text,
  t,
  start,
  end,
}: {
  text: string;
  t: number;
  start: number;
  end: number;
}) {
  const elapsed = Math.max(0, t - start - 0.45);
  const label = typed(text, t, start, start + 0.55);
  return (
    <Center
      style={{
        opacity: 1 - move(t, end - 0.2, end),
        fontFamily: mono,
        fontSize: 16,
        whiteSpace: "pre",
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <svg width={10} height={18} viewBox="0 0 10 18" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={3 + (i % 2) * 4}
              cy={5 + Math.floor(i / 2) * 4}
              r={0.65}
              fill="#d0d0d0"
              opacity={0.15 + ((Math.floor(t * 12) + i) % 6) / 8}
            />
          ))}
        </svg>
        <span>{label}</span>
        <span
          style={{
            color: "#8198ae",
            fontStyle: "italic",
            opacity: ramp(t, start + 0.6, start + 0.9),
          }}
        >
          {elapsed.toFixed(1)}s
        </span>
      </div>
    </Center>
  );
}
