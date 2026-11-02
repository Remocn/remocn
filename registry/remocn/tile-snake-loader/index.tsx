"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInstrumentSans } from "@remotion/google-fonts/InstrumentSans";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadInstrumentSans("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const POP = { mass: 0.6, damping: 13, stiffness: 210 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH = { damping: 200 };

const B = {
  name: -10,
  breakAt: 6,
  letterStep: 1.4,
  snake: 6,
  label: 26,
  pctKeys: [24, 48, 70, 92, 108],
  pctVals: [0, 24, 47, 83, 100],
  full: 108,
  retract: 16,
  skeleton: 110,
  grow: 118,
  window: 130,
  content: 131,
  end: 178,
};

export const TILE_SNAKE_LOADER_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const DEFAULT_IMAGES = [
  "templates/product-showcase/sculpture.jpg",
  "reel/reel-4.jpg",
  "templates/launch-anything/desk.jpg",
  "templates/brand-guidelines/ceramics.jpg",
  "reel/reel-5.jpg",
  "templates/product-showcase/courtyard.jpg",
  "templates/launch-anything/earth.jpg",
  "templates/brand-guidelines/chair.jpg",
].map((p) => staticFile(p));

const THEMES = {
  dark: {
    ink: "#f3f2f7",
    soft: "rgba(243,242,247,0.6)",
    pill: "rgba(255,255,255,0.1)",
    skeleton: "#2a2a33",
    tileShadow:
      "0 1px 2px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,8,0.45), 0 26px 50px rgba(0,0,8,0.3)",
    ground: "europa" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
  },
  light: {
    ink: "#1b1a1f",
    soft: "rgba(27,26,31,0.56)",
    pill: "rgba(27,26,31,0.07)",
    skeleton: "#dcd8d1",
    tileShadow:
      "0 1px 2px rgba(70,50,40,0.08), 0 10px 22px rgba(70,50,40,0.12), 0 24px 44px rgba(70,50,40,0.1)",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "mist",
      background: "#f4f0e8",
      colors: ["#f8dfe2", "#f1ecc8", "#e9e0f2", "#f7f4ee"],
      grain: 0.05,
      blur: 0.6,
    } as Partial<GradientParams> | undefined,
  },
};

const WIN = {
  bg: "linear-gradient(180deg, #16171d 0%, #0e0f13 100%)",
  bar: "#141519",
  hair: "rgba(255,255,255,0.08)",
  ink: "#f2f2f5",
  soft: "rgba(242,242,245,0.58)",
  faint: "rgba(242,242,245,0.34)",
  shadow:
    "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.11), 0 2px 4px rgba(0,0,0,0.3), 0 30px 60px rgba(0,0,10,0.4), 0 70px 120px rgba(0,0,10,0.35)",
};

export interface TileSnakeLoaderProps {
  theme?: "dark" | "light";
  accent?: string;
  name?: string;
  label?: string;
  images?: string[];
  product?: string;
  url?: string;
  headline?: string;
  sub?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

type Kind =
  | "photo"
  | "mark"
  | "chart"
  | "button"
  | "swatch"
  | "list"
  | "phone"
  | "toggle"
  | "player";

const KINDS: { kind: Kind; w: number; h: number }[] = [
  { kind: "photo", w: 138, h: 92 },
  { kind: "mark", w: 104, h: 76 },
  { kind: "chart", w: 128, h: 88 },
  { kind: "photo", w: 92, h: 116 },
  { kind: "swatch", w: 70, h: 70 },
  { kind: "list", w: 132, h: 94 },
  { kind: "photo", w: 150, h: 96 },
  { kind: "phone", w: 66, h: 118 },
  { kind: "button", w: 124, h: 80 },
  { kind: "photo", w: 104, h: 104 },
  { kind: "toggle", w: 118, h: 84 },
  { kind: "player", w: 140, h: 86 },
];

const SWATCHES = ["#ff6a3d", "#b9a4ff", "#ffd34d", "#2fd3a6"];

function Line({ w, c, h = 5 }: { w: string; c: string; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: h, background: c }} />
  );
}

function TileFace({
  kind,
  idx,
  images,
  accent,
}: {
  kind: Kind;
  idx: number;
  images: string[];
  accent: string;
}) {
  const fill = { position: "absolute" as const, inset: 0 };
  if (kind === "photo") {
    return (
      <Img
        src={images[idx % images.length]}
        alt=""
        style={{ ...fill, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  if (kind === "mark") {
    return (
      <div
        style={{
          ...fill,
          background: "linear-gradient(160deg, #1d1e25 0%, #0b0b0f 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: accent,
            }}
          />
        </div>
      </div>
    );
  }
  if (kind === "chart") {
    const bars = [0.42, 0.6, 0.5, 0.78, 0.66, 0.92];
    return (
      <div style={{ ...fill, background: "#ffffff", padding: 10 }}>
        <Line w="44%" c="rgba(20,20,30,0.18)" />
        <div
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            height: "56%",
            display: "flex",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          {bars.map((b, i) => (
            <div
              key={`b${b}`}
              style={{
                flex: 1,
                height: `${b * 100}%`,
                borderRadius: 3,
                background:
                  i === bars.length - 1 ? accent : "rgba(20,20,30,0.12)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (kind === "swatch") {
    const col = SWATCHES[idx % SWATCHES.length];
    return (
      <div
        style={{
          ...fill,
          background: `linear-gradient(150deg, ${col} 0%, color-mix(in oklab, ${col} 70%, #000) 100%)`,
        }}
      />
    );
  }
  if (kind === "list") {
    return (
      <div
        style={{
          ...fill,
          background: "#f7f6f3",
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        {[0.7, 0.52, 0.62].map((w, i) => (
          <div
            key={`r${w}`}
            style={{ display: "flex", alignItems: "center", gap: 7 }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: [accent, "#ff9d6b", "#9fd8c4"][i],
              }}
            />
            <Line w={`${w * 100}%`} c="rgba(20,20,30,0.16)" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "phone") {
    return (
      <div style={{ ...fill, background: "#0c0c10", padding: 5 }}>
        <div
          style={{
            position: "absolute",
            inset: 5,
            borderRadius: 9,
            overflow: "hidden",
          }}
        >
          <Img
            src={images[(idx + 3) % images.length]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    );
  }
  if (kind === "button") {
    return (
      <div
        style={{
          ...fill,
          background: "linear-gradient(180deg, #ffffff 0%, #f2f1ee 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
        }}
      >
        <Line w="58%" c="rgba(20,20,30,0.2)" h={6} />
        <div
          style={{
            width: "52%",
            height: 20,
            borderRadius: 10,
            background: accent,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        />
      </div>
    );
  }
  if (kind === "toggle") {
    return (
      <div
        style={{
          ...fill,
          background: "#1a1b21",
          padding: 11,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[true, false, true].map((on, i) => (
          <div
            key={`t${i}-${on}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Line w="46%" c="rgba(255,255,255,0.2)" />
            <div
              style={{
                width: 24,
                height: 13,
                borderRadius: 7,
                background: on ? accent : "rgba(255,255,255,0.16)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: on ? 13 : 2,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  background: "#fff",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  const wave = Array.from(
    { length: 18 },
    (_, i) => 0.25 + random(`tsl-w-${idx}-${i}`) * 0.75,
  );
  return (
    <div
      style={{
        ...fill,
        background: "linear-gradient(160deg, #2a1f4d 0%, #120f22 100%)",
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          background: "#fff",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden>
          <path d="M8 5.5v13l10-6.5z" fill="#120f22" />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          height: 30,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {wave.map((v, i) => (
          <div
            key={`w${i}-${v}`}
            style={{
              flex: 1,
              height: `${v * 100}%`,
              borderRadius: 2,
              background: i < 7 ? "#c9b8ff" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RailIcon({ i, color }: { i: number; color: string }) {
  const paths = [
    "M4 5h16v14H4zM4 9h16",
    "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z",
    "M12 4v16M4 12h16",
    "M5 7h14M5 12h14M5 17h9",
  ];
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d={paths[i % paths.length]}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WindowContent({
  frame,
  fps,
  portrait,
  accent,
  product,
  url,
  headline,
  sub,
  images,
}: {
  frame: number;
  fps: number;
  portrait: boolean;
  accent: string;
  product: string;
  url: string;
  headline: string;
  sub: string;
  images: string[];
}) {
  const k = portrait ? 1.55 : 1;
  const step = (i: number) => ramp(frame, B.content + i * 3, 13);
  const rise = (i: number) => ({
    opacity: step(i),
    transform: `translateY(${mix(14 * k, 0, step(i))}px)`,
    filter: `blur(${(1 - step(i)) * 5}px)`,
  });
  const cardPop = spring({ frame: frame - B.content - 4, fps, config: CARD });
  const lines = headline.split("\n");
  const barH = 46 * k;
  const railW = portrait ? 0 : 60;
  return (
    <div
      style={{ position: "absolute", inset: 0, fontFamily: sans.fontFamily }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: barH,
          borderBottom: `1px solid ${WIN.hair}`,
          display: "flex",
          alignItems: "center",
          padding: `0 ${16 * k}px`,
          opacity: step(0),
        }}
      >
        <div style={{ display: "flex", gap: 7 * k }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
            <div
              key={col}
              style={{
                width: 11 * k,
                height: 11 * k,
                borderRadius: 6 * k,
                background: col,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              height: 28 * k,
              padding: `0 ${14 * k}px`,
              borderRadius: 8 * k,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${WIN.hair}`,
              display: "flex",
              alignItems: "center",
              gap: 7 * k,
              fontSize: 16 * k,
              color: WIN.soft,
            }}
          >
            <svg viewBox="0 0 24 24" width={13 * k} height={13 * k} aria-hidden>
              <path
                d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
                fill="none"
                stroke={WIN.soft}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </svg>
            {url}
          </div>
        </div>
        <div
          style={{
            height: 30 * k,
            padding: `0 ${14 * k}px`,
            borderRadius: 8 * k,
            background: accent,
            color: "#fff",
            fontSize: 16 * k,
            display: "flex",
            alignItems: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          Publish
        </div>
      </div>
      {!portrait ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: barH,
            bottom: 0,
            width: railW,
            borderRight: `1px solid ${WIN.hair}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 18,
            gap: 20,
            opacity: step(1),
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <RailIcon
              key={`ri${i}`}
              i={i}
              color={i === 0 ? WIN.ink : WIN.faint}
            />
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: railW + (portrait ? 56 : 44),
          top: barH + (portrait ? 70 : 44),
          width: portrait ? 820 : 440,
        }}
      >
        <div
          style={{
            fontSize: 17 * k,
            color: WIN.soft,
            display: "flex",
            alignItems: "center",
            gap: 8 * k,
            ...rise(1),
          }}
        >
          <div
            style={{
              width: 7 * k,
              height: 7 * k,
              borderRadius: 4 * k,
              background: accent,
            }}
          />
          {product}
        </div>
        <div
          style={{
            marginTop: 18 * k,
            fontSize: 46 * k,
            lineHeight: 1.06,
            fontWeight: 400,
            letterSpacing: "-0.035em",
            color: WIN.ink,
          }}
        >
          {lines.map((l, i) => (
            <div key={`h${l}`} style={rise(2 + i)}>
              {l}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 18 * k,
            fontSize: 18 * k,
            lineHeight: 1.4,
            color: WIN.soft,
            ...rise(4),
          }}
        >
          {sub}
        </div>
        <div
          style={{
            marginTop: 26 * k,
            display: "flex",
            gap: 10 * k,
            ...rise(5),
          }}
        >
          <div
            style={{
              height: 40 * k,
              padding: `0 ${18 * k}px`,
              borderRadius: 20 * k,
              background: "#f2f2f5",
              color: "#111",
              fontSize: 17 * k,
              display: "flex",
              alignItems: "center",
            }}
          >
            Start a film
          </div>
          <div
            style={{
              height: 40 * k,
              padding: `0 ${18 * k}px`,
              borderRadius: 20 * k,
              border: `1px solid ${WIN.hair}`,
              color: WIN.ink,
              fontSize: 17 * k,
              display: "flex",
              alignItems: "center",
            }}
          >
            See examples
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: portrait ? 56 : 40,
          left: portrait ? 56 : undefined,
          top: portrait ? barH + 560 : barH + 40,
          width: portrait ? undefined : 330,
          height: portrait ? 440 : 300,
          borderRadius: 16 * k,
          overflow: "hidden",
          background: accent,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), 0 20px 40px rgba(0,0,0,0.35)",
          opacity: Math.min(1, cardPop * 1.5),
          transform: `translateY(${mix(30 * k, 0, cardPop)}px) scale(${mix(0.92, 1, cardPop)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10 * k,
            bottom: 56 * k,
            borderRadius: 10 * k,
            overflow: "hidden",
          }}
        >
          <Img
            src={images[0]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 52 * k,
              height: 52 * k,
              marginLeft: -26 * k,
              marginTop: -26 * k,
              borderRadius: 26 * k,
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width={20 * k} height={20 * k} aria-hidden>
              <path d="M8 5.5v13l10-6.5z" fill="#111" />
            </svg>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 18 * k,
            right: 18 * k,
            bottom: 0,
            height: 56 * k,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#fff",
            fontSize: 17 * k,
          }}
        >
          <span>Launch film</span>
          <span style={{ fontFamily: mono.fontFamily, opacity: 0.8 }}>
            0:42
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: railW + (portrait ? 56 : 44),
          right: portrait ? 56 : 40,
          bottom: portrait ? 56 : 30,
          height: portrait ? 230 : 88,
          display: "flex",
          gap: 12 * k,
        }}
      >
        {[1, 2, 3, 4].map((im, i) => (
          <div
            key={`th${im}`}
            style={{
              flex: 1,
              borderRadius: 10 * k,
              overflow: "hidden",
              border: `1px solid ${WIN.hair}`,
              position: "relative",
              ...rise(6 + i * 0.6),
            }}
          >
            <Img
              src={images[im % images.length]}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const SCRAMBLE = "abcdefghijklmnopqrstuvwxyz";

export function TileSnakeLoader({
  theme = "dark",
  accent = "#3B5BFD",
  name = "Lumen Studio",
  label = "Initializing",
  images = DEFAULT_IMAGES,
  product = "Lumen Studio",
  url = "lumen.studio",
  headline = "Launch films,\ncut in minutes.",
  sub = "Drop your screens in. Ship the film by Friday.",
  ground,
  groundParams,
}: TileSnakeLoaderProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const c = THEMES[theme];
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;
  const k = portrait ? 1.55 : 1;

  const PW = portrait ? 900 : 1080;
  const PH = portrait ? 1260 : 520;
  const PR = portrait ? 190 : 150;
  const cx = stageW / 2;
  const cy = stageH / 2;
  const straightW = PW - 2 * PR;
  const straightH = PH - 2 * PR;
  const arc = (Math.PI * PR) / 2;
  const P = 2 * straightW + 2 * straightH + 4 * arc;
  const gap = portrait ? 220 : 146;
  const tk = portrait ? 2.05 : 1.32;

  const pathPoint = (s0: number) => {
    let s = ((s0 % P) + P) % P;
    const L = cx - PW / 2;
    const R = cx + PW / 2;
    const T = cy - PH / 2;
    const Bt = cy + PH / 2;
    const seg = (len: number) => {
      if (s <= len) return true;
      s -= len;
      return false;
    };
    if (seg(straightH / 2)) return { x: L, y: cy - s };
    if (seg(arc)) {
      const a = Math.PI + (s / arc) * (Math.PI / 2);
      return { x: L + PR + PR * Math.cos(a), y: T + PR + PR * Math.sin(a) };
    }
    if (seg(straightW)) return { x: L + PR + s, y: T };
    if (seg(arc)) {
      const a = -Math.PI / 2 + (s / arc) * (Math.PI / 2);
      return { x: R - PR + PR * Math.cos(a), y: T + PR + PR * Math.sin(a) };
    }
    if (seg(straightH)) return { x: R, y: T + PR + s };
    if (seg(arc)) {
      const a = (s / arc) * (Math.PI / 2);
      return { x: R - PR + PR * Math.cos(a), y: Bt - PR + PR * Math.sin(a) };
    }
    if (seg(straightW)) return { x: R - PR - s, y: Bt };
    if (seg(arc)) {
      const a = Math.PI / 2 + (s / arc) * (Math.PI / 2);
      return { x: L + PR + PR * Math.cos(a), y: Bt - PR + PR * Math.sin(a) };
    }
    return { x: L, y: Bt - PR - s };
  };

  const pctAt = (f: number) =>
    interpolate(f, B.pctKeys, B.pctVals, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: MOVE,
    });
  const headAt = (f: number) =>
    P * 0.1 * ramp(f, B.snake, 18, SWAY) + P * 1.22 * (pctAt(f) / 100);
  const lenAt = (f: number) => {
    const h = headAt(f);
    const base = Math.min(h, P * (0.5 + 0.2 * (pctAt(f) / 100)));
    return base * (1 - ramp(f, B.full, B.retract, EXIT));
  };
  const tailAt = (f: number) =>
    headAt(f) - lenAt(f) + (f >= B.full + B.retract ? gap : 0);

  const firstFrame = (test: (f: number) => boolean) => {
    for (let f = B.snake; f <= B.end + 1; f++) if (test(f)) return f;
    return 9999;
  };

  const maxHead = headAt(B.end);
  const nTiles = Math.floor(maxHead / gap) + 1;
  const tiles: ReactNode[] = [];
  for (let n = 0; n < nTiles; n++) {
    const sN = n * gap + gap * 0.3;
    const birth = firstFrame((f) => headAt(f) >= sN);
    const death = firstFrame((f) => tailAt(f) >= sN);
    if (frame < birth || frame > death + 6) continue;
    const pop = spring({ frame: frame - birth, fps, config: POP });
    const gone = ramp(frame, death, 6, EXIT);
    const scale = pop * (1 - gone);
    if (scale <= 0.002) continue;
    const spec = KINDS[n % KINDS.length];
    const p = pathPoint(sN);
    const jx = (random(`tsl-jx-${n}`) - 0.5) * 18 * k;
    const jy = (random(`tsl-jy-${n}`) - 0.5) * 18 * k;
    const tilt = (random(`tsl-r-${n}`) - 0.5) * 6;
    const w = spec.w * tk;
    const h = spec.h * tk;
    tiles.push(
      <div
        key={`tile-${n}`}
        style={{
          position: "absolute",
          left: p.x + jx - w / 2,
          top: p.y + jy - h / 2,
          width: w,
          height: h,
          transform: `rotate(${mix(tilt * 3, tilt, pop)}deg) scale(${scale})`,
          zIndex: n,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: spec.kind === "phone" ? 12 : 9,
            overflow: "hidden",
            boxShadow: c.tileShadow,
            transform: `scale(${tk})`,
            transformOrigin: "0 0",
            width: spec.w,
            height: spec.h,
          }}
        >
          <TileFace kind={spec.kind} idx={n} images={images} accent={accent} />
        </div>
      </div>,
    );
  }

  const nameSize = portrait ? 132 : 96;
  const nameIn = ramp(frame, B.name, 14);
  const chars = Array.from(name);

  const labelSize = 30 * k;
  const labelIn = ramp(frame, B.label - 4, 10);
  const settleN = Math.floor(
    interpolate(frame, [B.label, B.label + 14], [0, label.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const labelText = Array.from(label)
    .map((ch, i) =>
      i < settleN || ch === " "
        ? ch
        : SCRAMBLE[
            Math.floor(
              random(`tsl-sc-${i}-${Math.floor(frame / 2)}`) * SCRAMBLE.length,
            )
          ],
    )
    .join("");
  const pct = Math.round(pctAt(frame));
  const labelOut = ramp(frame, B.skeleton, 8, EXIT);
  const skelIn = ramp(frame, B.skeleton + 2, 6);

  const skelW0 = portrait ? 520 : 340;
  const skelH0 = 46 * k;
  const winW = portrait ? 940 : 1000;
  const winH = portrait ? 1380 : 580;
  const grow = spring({
    frame: frame - B.grow,
    fps,
    config: MORPH,
    durationInFrames: 16,
  });
  const winOn = ramp(frame, B.window, 8);
  const settle = spring({ frame: frame - B.window, fps, config: CARD });
  const winScale = frame >= B.window ? mix(0.965, 1, settle) : 1;
  const boxW = mix(skelW0, winW, grow);
  const boxH = mix(skelH0, winH, grow);
  const boxR = mix(skelH0 / 2, 20 * k * (portrait ? 0.85 : 1), grow);
  const push = 1 + 0.03 * ramp(frame, B.content, B.end - B.content, SWAY);

  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);

  return (
    <AbsoluteFill style={{ fontFamily: sans.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={5}
        timeScale={0.45}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
          }}
        >
          {tiles}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: cy - nameSize * 0.62,
              height: nameSize * 1.24,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: nameSize,
                fontWeight: 400,
                letterSpacing: "-0.04em",
                color: c.ink,
                whiteSpace: "pre",
                transform: `translateY(${mix(nameSize, 0, nameIn)}px)`,
              }}
            >
              {chars.map((ch, i) => {
                const g = ramp(frame, B.breakAt + i * B.letterStep, 7, EXIT);
                return (
                  <span
                    key={`n${i}-${ch}`}
                    style={{
                      display: "inline-block",
                      transform: `scale(${1 - g})`,
                      opacity: 1 - g * g,
                      margin: `0 ${g * 0.12}em`,
                      filter: `blur(${g * 4}px)`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
          {frame >= B.label - 4 && labelOut < 1 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: cy - skelH0 / 2,
                height: skelH0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12 * k,
                opacity: labelIn * (1 - labelOut),
                filter: `blur(${labelOut * 8 + (1 - labelIn) * 5}px)`,
                transform: `translateY(${mix(10 * k, 0, labelIn)}px)`,
              }}
            >
              <div
                style={{
                  width: 8 * k,
                  height: 8 * k,
                  borderRadius: 4 * k,
                  background: accent,
                  opacity: 0.55 + 0.45 * Math.sin(frame / 3),
                }}
              />
              <div
                style={{
                  fontSize: labelSize,
                  color: c.ink,
                  letterSpacing: "-0.015em",
                  minWidth: label.length * labelSize * 0.5,
                }}
              >
                {labelText}
              </div>
              <div
                style={{
                  height: 38 * k,
                  minWidth: 76 * k,
                  padding: `0 ${13 * k}px`,
                  borderRadius: 19 * k,
                  background: c.pill,
                  color: c.soft,
                  fontFamily: mono.fontFamily,
                  fontSize: 21 * k,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {`${pct}%`}
              </div>
            </div>
          ) : null}
          {skelIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: cx - boxW / 2,
                top: cy - boxH / 2,
                width: boxW,
                height: boxH,
                borderRadius: boxR,
                transform: `scale(${winScale})`,
                opacity: skelIn,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: boxR,
                  background: c.skeleton,
                  opacity: 1 - winOn,
                }}
              />
              {winOn > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: boxR,
                    background: WIN.bg,
                    boxShadow: WIN.shadow,
                    overflow: "hidden",
                    opacity: winOn,
                  }}
                >
                  <WindowContent
                    frame={frame}
                    fps={fps}
                    portrait={portrait}
                    accent={accent}
                    product={product}
                    url={url}
                    headline={headline}
                    sub={sub}
                    images={images}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
