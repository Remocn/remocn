"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FLOW_BG, FLOW_BORDER, FLOW_YELLOW, FONT } from "../foundation";

const ICONS = ["github", "figma", "flowith", "notion", "slack"] as const;

export function Integrations({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const lineGrow = interpolate(f, [6, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: FLOW_BG,
        fontFamily: FONT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 56,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: "50%",
            height: 2,
            background: FLOW_BORDER,
            transformOrigin: "center",
            transform: `translateY(-50%) scaleX(${lineGrow})`,
          }}
        />
        {ICONS.map((kind, i) => {
          const pop = spring({
            frame: f - 6 - i * 5,
            fps,
            config: { damping: 14, stiffness: 170 },
          });
          const center = kind === "flowith";
          const size = center ? 128 : 100;
          return (
            <div
              key={kind}
              style={{
                position: "relative",
                transform: `scale(${pop})`,
                transformOrigin: "center",
              }}
            >
              <Glyph kind={kind} size={size} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Glyph({ kind, size }: { kind: (typeof ICONS)[number]; size: number }) {
  if (kind === "github") return <GithubMark size={size} />;
  if (kind === "figma") return <FigmaMark size={size} />;
  if (kind === "flowith") return <FlowithMark size={size} />;
  if (kind === "notion") return <NotionMark size={size} />;
  return <SlackMark size={size} />;
}

function GithubMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "#161614",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 22px rgba(30,28,22,0.14)",
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill="#FFFFFF"
          d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.61 8.21 11.17.6.11.82-.25.82-.56 0-.28-.01-1.01-.02-1.98-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.21.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.21A11.6 11.6 0 0 1 12 5.8c1.02 0 2.05.13 3.01.39 2.29-1.53 3.3-1.21 3.3-1.21.66 1.64.24 2.86.12 3.16.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.52-5.49 5.81.43.36.81 1.08.81 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.22.68.83.56C20.56 21.9 24 17.49 24 12.29 24 5.78 18.63.5 12 .5z"
        />
      </svg>
    </div>
  );
}

function FigmaMark({ size }: { size: number }) {
  const w = size * 0.6;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={w} height={size * 0.9} viewBox="0 0 38 57" fill="none">
        <path
          fill="#1ABCFE"
          d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"
        />
        <path
          fill="#0ACF83"
          d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"
        />
        <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
        <path
          fill="#F24E1E"
          d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"
        />
        <path
          fill="#A259FF"
          d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"
        />
      </svg>
    </div>
  );
}

function FlowithMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: FLOW_YELLOW,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 26px rgba(242,210,0,0.4)",
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill="#FFFFFF"
          d="M12 1.5 14 9.6 23 12 14 14.4 12 22.5 10 14.4 1 12 10 9.6 Z"
        />
      </svg>
    </div>
  );
}

function NotionMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        background: "#161614",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 22px rgba(30,28,22,0.14)",
      }}
    >
      <span
        style={{
          fontSize: size * 0.52,
          fontWeight: 700,
          color: "#FFFFFF",
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
        }}
      >
        N
      </span>
    </div>
  );
}

function SlackMark({ size }: { size: number }) {
  const bar = size * 0.2;
  const len = size * 0.46;
  const r = bar / 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: size * 0.6,
          height: size * 0.6,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            left: len - bar,
            width: bar,
            height: len,
            borderRadius: r,
            background: "#36C5F0",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: len - bar,
            right: 0,
            width: len,
            height: bar,
            borderRadius: r,
            background: "#2EB67D",
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: bar,
            width: bar,
            height: len,
            borderRadius: r,
            background: "#ECB22E",
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: len - bar,
            left: 0,
            width: len,
            height: bar,
            borderRadius: r,
            background: "#E01E5A",
          }}
        />
      </div>
    </div>
  );
}
