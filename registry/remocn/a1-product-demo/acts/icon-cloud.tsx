"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
  FONT_SERIF,
} from "../foundation";

type ChipKind =
  | "docs"
  | "calendar"
  | "notes"
  | "automations"
  | "projects"
  | "ai"
  | "tasks"
  | "reports"
  | "time"
  | "goals";

type RawChip = {
  label: string;
  kind: ChipKind;
  color: string;
  dx: number;
  dy: number;
};

const RAW_CHIPS: RawChip[] = [
  { label: "Docs", kind: "docs", color: "#4C7DF0", dx: -560, dy: -150 },
  { label: "Calendar", kind: "calendar", color: "#E0583B", dx: -360, dy: -310 },
  { label: "Notes", kind: "notes", color: "#7C5CE0", dx: -60, dy: -344 },
  { label: "Projects", kind: "projects", color: "#3D55C0", dx: 220, dy: -320 },
  { label: "Tasks", kind: "tasks", color: "#3FA45A", dx: 560, dy: -150 },
  { label: "Goals", kind: "goals", color: "#D2487A", dx: 540, dy: 140 },
  { label: "Time Tracking", kind: "time", color: "#2E9CB0", dx: 280, dy: 282 },
  { label: "Reports", kind: "reports", color: "#D69A2A", dx: -40, dy: 304 },
  { label: "Automations", kind: "automations", color: "#2BA38C", dx: -330, dy: 250 },
  { label: "AI Assistant", kind: "ai", color: "#9A55D6", dx: -540, dy: 130 },
];

type Chip = RawChip & { sx: number; sy: number; delay: number; phase: number };

const CHIPS: Chip[] = RAW_CHIPS.map((c, i) => ({
  ...c,
  sx: c.dx * 2.05 + (((i * 53) % 7) - 3) * 26,
  sy: c.dy * 2.05 + (((i * 29) % 7) - 3) * 26,
  delay: i * 6,
  phase: (i * 0.9) % (Math.PI * 2),
}));

const LINE_WORDS = ["Flowith", "has", "all", "your"];

function StarLogo({ size }: { size: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: FLOW_YELLOW,
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="#FFFFFF"
        aria-hidden
      >
        <path d="M12 1.6 C 12.9 8.2 15.8 11.1 22.4 12 C 15.8 12.9 12.9 15.8 12 22.4 C 11.1 15.8 8.2 12.9 1.6 12 C 8.2 11.1 11.1 8.2 12 1.6 Z" />
      </svg>
    </span>
  );
}

function Glyph({ kind, color }: { kind: ChipKind; color: string }) {
  const s = 18;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "docs":
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4" />
          <path d="M9.5 13h6M9.5 16.5h6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 9.5h16M8 3v4M16 3v4" />
        </svg>
      );
    case "notes":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
        </svg>
      );
    case "automations":
      return (
        <svg {...common} fill={color} stroke="none">
          <path d="M13 2 L5 13h5l-1 9 8-12h-5z" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common} fill={color} stroke="none">
          <path d="M12 2 C 12.7 7 15 9.3 20 10 C 15 10.7 12.7 13 12 18 C 11.3 13 9 10.7 4 10 C 9 9.3 11.3 7 12 2 Z" />
          <circle cx="18.5" cy="18.5" r="2" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M5 20V11M12 20V5M19 20v-6" />
          <path d="M3.5 20h17" />
        </svg>
      );
    case "time":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "goals":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
        </svg>
      );
  }
}

function ChipNode({
  chip,
  f,
  fps,
  converge,
}: {
  chip: Chip;
  f: number;
  fps: number;
  converge: number;
}) {
  const enter = spring({
    frame: f - chip.delay,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const orbit = 0.05 * Math.sin(f / 45 + chip.phase);
  const cos = Math.cos(orbit);
  const sin = Math.sin(orbit);
  const ox = chip.dx * cos - chip.dy * sin;
  const oy = chip.dx * sin + chip.dy * cos;

  const ex = chip.sx + (ox - chip.sx) * enter;
  const ey = chip.sy + (oy - chip.sy) * enter;

  const x = ex * (1 - converge);
  const y = ey * (1 - converge);

  const blur = interpolate(enter, [0, 1], [6, 0]);
  const opacityIn = interpolate(f, [chip.delay, chip.delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityOut = interpolate(f, [96, 128], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = (0.86 + enter * 0.14) * (1 - converge * 0.32);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacityIn * opacityOut,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        willChange: "transform, filter, opacity",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 18px 9px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.72)",
          border: `1px solid ${FLOW_BORDER}`,
          boxShadow: "0 6px 18px rgba(30,28,22,0.06)",
        }}
      >
        <Glyph kind={chip.kind} color={chip.color} />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 500,
            color: FLOW_INK,
            whiteSpace: "nowrap",
          }}
        >
          {chip.label}
        </span>
      </div>
    </div>
  );
}

function HeadWord({
  text,
  index,
  f,
  fps,
}: {
  text: string;
  index: number;
  f: number;
  fps: number;
}) {
  const reveal = spring({
    frame: f - index * 4,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const ty = interpolate(reveal, [0, 1], [70, 0]);
  const blur = interpolate(reveal, [0, 1], [7, 0]);
  const color = interpolateColors(reveal, [0, 1], [FLOW_MUTED, FLOW_INK]);

  return (
    <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.06em" }}>
      <span
        style={{
          display: "inline-block",
          color,
          transform: `translateY(${ty}%)`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          willChange: "transform, filter",
        }}
      >
        {text}
      </span>
    </span>
  );
}

export function IconCloud({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const converge = interpolate(f, [92, 138], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const lineAOpacity = interpolate(f, [90, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineBOpacity = interpolate(f, [102, 128], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineBReveal = spring({
    frame: f - 102,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const lineBTy = interpolate(lineBReveal, [0, 1], [34, 0]);
  const lineBBlur = interpolate(lineBReveal, [0, 1], [8, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: FLOW_BG }}>
      <AbsoluteFill>
        {CHIPS.map((chip) => (
          <ChipNode
            key={chip.label}
            chip={chip}
            f={f}
            fps={fps}
            converge={converge}
          />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            opacity: lineAOpacity,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.26em",
            fontFamily: FONT_SERIF,
            fontSize: 60,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            willChange: "opacity",
          }}
        >
          <StarLogo size={48} />
          {LINE_WORDS.map((w, i) => (
            <HeadWord key={w} text={w} index={i} f={f} fps={fps} />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            opacity: lineBOpacity,
            transform: `translateY(${lineBTy}px)`,
            filter: lineBBlur > 0.05 ? `blur(${lineBBlur}px)` : undefined,
            fontFamily: FONT_SERIF,
            fontSize: 60,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: FLOW_INK,
            willChange: "transform, filter, opacity",
          }}
        >
          in one place
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
