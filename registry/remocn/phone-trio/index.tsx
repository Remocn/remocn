"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const manrope = loadManrope("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const FLICK = { mass: 0.9, damping: 22, stiffness: 110 };

const B = {
  rise: [-12, -8, -4],
  scrollL: 10,
  flick1: 14,
  scrollR: 20,
  flick2: 44,
  forward: 70,
  banner: 84,
  end: 132,
};

const PW = 286;
const PH = 620;
const BEZEL = 10;
const SW = PW - BEZEL * 2;
const SH = PH - BEZEL * 2;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const line = (color: string, w = 1.5) => ({
  fill: "none",
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

interface Tone {
  dark: boolean;
  bg: string;
  ink: string;
  muted: string;
  faint: string;
  hair: string;
  fill: string;
  accent: string;
}

function StatusBar({ t }: { t: Tone }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 46,
        display: "flex",
        alignItems: "center",
        padding: "4px 26px 0",
        fontSize: 15,
        color: t.ink,
        zIndex: 5,
      }}
    >
      <span style={{ flex: 1, letterSpacing: "-0.01em" }}>9:41</span>
      <svg viewBox="0 0 18 12" width={17} height={11} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 4.6}
            y={9 - i * 2.6}
            width={3}
            height={3 + i * 2.6}
            rx={0.8}
            fill={t.ink}
          />
        ))}
      </svg>
      <svg
        viewBox="0 0 16 12"
        width={15}
        height={11}
        style={{ marginLeft: 6 }}
        aria-hidden
      >
        <path
          d="M1.5 4.5a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0M6.5 9.5a2.4 2.4 0 0 1 3 0"
          {...line(t.ink, 1.6)}
        />
      </svg>
      <div
        style={{
          marginLeft: 6,
          width: 24,
          height: 12,
          borderRadius: 4,
          border: `1.2px solid ${t.faint}`,
          padding: 1.5,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "78%",
            height: "100%",
            borderRadius: 2,
            background: t.ink,
          }}
        />
      </div>
    </div>
  );
}

function Phone({
  t,
  children,
  shellDark,
}: {
  t: Tone;
  children: React.ReactNode;
  shellDark: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: -PW / 2,
        top: -PH / 2,
        width: PW,
        height: PH,
        borderRadius: 54,
        background: shellDark
          ? "linear-gradient(150deg, #4a4a52 0%, #16161a 22%, #0b0b0d 60%, #34343a 100%)"
          : "linear-gradient(150deg, #ffffff 0%, #d9d6d2 26%, #c9c5c0 62%, #f4f2ef 100%)",
        boxShadow: shellDark
          ? "inset 0 0 0 1.5px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.3), 0 24px 50px rgba(20,10,40,0.35), 0 70px 120px rgba(20,10,40,0.35)"
          : "inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 2px 4px rgba(80,60,40,0.12), 0 24px 50px rgba(120,90,60,0.18), 0 70px 120px rgba(120,90,60,0.2)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: BEZEL,
          top: BEZEL,
          width: SW,
          height: SH,
          borderRadius: 44,
          overflow: "hidden",
          background: t.bg,
          boxShadow: shellDark ? "0 0 0 2px #050506" : "0 0 0 2px #1a1a1c",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 62,
            background: `linear-gradient(180deg, ${t.bg} 0%, ${t.bg} 74%, transparent 100%)`,
            zIndex: 4,
          }}
        />
        <StatusBar t={t} />
        <div
          style={{
            position: "absolute",
            left: SW / 2 - 46,
            top: 11,
            width: 92,
            height: 27,
            borderRadius: 14,
            background: "#000",
            zIndex: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SW / 2 - 58,
            bottom: 8,
            width: 116,
            height: 5,
            borderRadius: 3,
            background: t.ink,
            opacity: 0.85,
            zIndex: 6,
          }}
        />
      </div>
    </div>
  );
}

export interface PhoneTrioProps {
  theme?: "dark" | "light";
  accent?: string;
  name?: string;
  handle?: string;
  role?: string;
  headline?: string;
  accentWord?: string;
  images?: string[];
  skills?: string[];
  liveLabel?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function PhoneTrio({
  theme = "dark",
  accent = "#ff5a36",
  name = "Ines Marlow",
  handle = "ines.marlow",
  role = "Motion designer",
  headline = "Driven by motion, obsessed with the",
  accentWord = "seamless.",
  images = [
    staticFile("reel/reel-1.jpg"),
    staticFile("templates/launch-anything/horizon.jpg"),
    staticFile("reel/reel-3.jpg"),
    staticFile("templates/product-showcase/sculpture.jpg"),
    staticFile("templates/launch-anything/earth.jpg"),
    staticFile("reel/reel-6.jpg"),
    staticFile("templates/brand-guidelines/ceramics.jpg"),
    staticFile("templates/product-showcase/gallery.jpg"),
    staticFile("reel/reel-4.jpg"),
  ],
  skills = ["Motion", "Sound", "Web"],
  liveLabel = "Portfolio is live",
  ground,
  groundParams,
}: PhoneTrioProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 720 : 1280;
  const stageH = portrait ? 1280 : 720;
  const k = width / stageW;

  const t: Tone = dark
    ? {
        dark: true,
        bg: "#0c0c0e",
        ink: "#f5f4f2",
        muted: "rgba(245,244,242,0.56)",
        faint: "rgba(245,244,242,0.34)",
        hair: "rgba(255,255,255,0.09)",
        fill: "rgba(255,255,255,0.08)",
        accent,
      }
    : {
        dark: false,
        bg: "#ffffff",
        ink: "#141414",
        muted: "rgba(20,20,20,0.55)",
        faint: "rgba(20,20,20,0.32)",
        hair: "rgba(20,20,20,0.08)",
        fill: "rgba(20,20,20,0.05)",
        accent,
      };

  const img = (i: number) => images[i % images.length];

  const rise = B.rise.map((at) =>
    spring({ frame: frame - at, fps, config: CARD }),
  );
  const risePrev = B.rise.map((at) =>
    spring({ frame: frame - 1 - at, fps, config: CARD }),
  );
  const fwd = spring({ frame: frame - B.forward, fps, config: HEAVY });
  const banner = spring({ frame: frame - B.banner, fps, config: CHIP });

  const scrollL = ramp(frame, B.scrollL, 96, MOVE) * 110;
  const f1 = spring({ frame: frame - B.flick1, fps, config: FLICK });
  const f2 = spring({ frame: frame - B.flick2, fps, config: FLICK });
  const f1p = spring({ frame: frame - 1 - B.flick1, fps, config: FLICK });
  const f2p = spring({ frame: frame - 1 - B.flick2, fps, config: FLICK });
  const scrollM = f1 * 250 + f2 * 236;
  const scrollMV = Math.abs(scrollM - (f1p * 250 + f2p * 236));
  const scrollR = ramp(frame, B.scrollR, 70, MOVE) * 60;

  const layout = portrait
    ? [
        { x: mix(-196, -226, fwd), y: 70, s: mix(1.1, 1.02, fwd), z: 0 },
        { x: 0, y: mix(0, -14, fwd), s: mix(1.42, 1.52, fwd), z: 2 },
        { x: mix(196, 226, fwd), y: 70, s: mix(1.1, 1.02, fwd), z: 1 },
      ]
    : [
        {
          x: mix(-330, -350, fwd),
          y: mix(0, 8, fwd),
          s: mix(1, 0.92, fwd),
          z: 0,
        },
        { x: 0, y: mix(0, -4, fwd), s: mix(1, 1.07, fwd), z: 2 },
        {
          x: mix(330, 350, fwd),
          y: mix(0, 8, fwd),
          s: mix(1, 0.92, fwd),
          z: 1,
        },
      ];
  const camPush = 1 + 0.02 * ramp(frame, 0, B.end, Easing.linear);

  const resolvedPreset: GshPresetId | undefined =
    ground ?? (dark ? "velvet-hour" : undefined);
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (ground || dark
      ? undefined
      : {
          kind: "mist",
          background: "#f3efe8",
          colors: ["#e9b8ff", "#ffd3a8", "#fff2b8", "#a7c4ff"],
        });

  const navRow = (title: string, back = true) => (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: 16,
        color: t.ink,
      }}
    >
      <div style={{ width: 28 }}>
        {back ? (
          <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
            <path d="m15 5-7 7 7 7" {...line(t.ink, 1.8)} />
          </svg>
        ) : null}
      </div>
      <span style={{ flex: 1, textAlign: "center" }}>{title}</span>
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
        <path d="M5 12h.01M12 12h.01M19 12h.01" {...line(t.ink, 2.6)} />
      </svg>
    </div>
  );

  const profileScreen = (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 46,
          transform: `translateY(${-scrollL}px)`,
        }}
      >
        {navRow(handle)}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 16px 0",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              padding: 3,
              background: `conic-gradient(from 200deg, ${accent}, #ffb36b, #e889b5, ${accent})`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 35,
                border: `3px solid ${t.bg}`,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <Img
                src={img(6)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            {[
              ["48", "projects"],
              ["21", "clients"],
              ["6", "awards"],
            ].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, color: t.ink }}>{v}</div>
                <div style={{ fontSize: 13, color: t.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ fontSize: 17, color: t.ink, letterSpacing: "-0.01em" }}>
            {name}
          </div>
          <div style={{ fontSize: 15, color: accent, marginTop: 1 }}>
            {role}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.muted,
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            Launch films and product motion for small teams.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "12px 16px 0" }}>
          <div
            style={{
              flex: 1,
              height: 34,
              borderRadius: 10,
              background: accent,
              color: "#fff",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Follow
          </div>
          <div
            style={{
              flex: 1,
              height: 34,
              borderRadius: 10,
              background: t.fill,
              color: t.ink,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Message
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            margin: "14px 0 2px",
            borderBottom: `1px solid ${t.hair}`,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "8px 18px 9px",
                borderBottom:
                  i === 0 ? `1.5px solid ${t.ink}` : "1.5px solid transparent",
                marginBottom: -1,
              }}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
                <path
                  d={
                    i === 0
                      ? "M4 4h16v16H4zM4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16"
                      : i === 1
                        ? "M5 5h14v14H5zM10 9.5l5 2.5-5 2.5z"
                        : "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"
                  }
                  {...line(i === 0 ? t.ink : t.faint)}
                />
              </svg>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2,
          }}
        >
          {[0, 1, 2, 3, 4, 5, 7, 8, 2].map((ix, i) => (
            <div key={`${ix}-${i}`} style={{ height: 112, overflow: "hidden" }}>
              <Img
                src={img(ix)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 74,
          background: t.bg,
          borderTop: `1px solid ${t.hair}`,
          display: "flex",
          justifyContent: "space-around",
          paddingTop: 12,
          boxSizing: "border-box",
        }}
      >
        {[
          "M4 10.5 12 4l8 6.5V20h-5v-5h-6v5H4z",
          "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
          "M5 5h14v14H5zM12 9v6M9 12h6",
          "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
          "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5",
        ].map((d, i) => (
          <svg key={d} viewBox="0 0 24 24" width={24} height={24} aria-hidden>
            <path d={d} {...line(i === 4 ? t.ink : t.muted, 1.6)} />
          </svg>
        ))}
      </div>
    </>
  );

  const workScreen = (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 46,
          transform: `translateY(${-scrollM}px)`,
          filter:
            scrollMV > 3
              ? `blur(${Math.min(3, scrollMV * 0.12)}px)`
              : undefined,
        }}
      >
        <div
          style={{
            padding: "6px 16px 0",
            fontSize: 30,
            fontWeight: 300,
            color: t.ink,
            letterSpacing: "-0.035em",
          }}
        >
          Selected work
        </div>
        <div style={{ display: "flex", gap: 6, padding: "12px 16px 14px" }}>
          {["All", "Motion", "Web", "Sound"].map((c, i) => (
            <span
              key={c}
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 15,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                background: i === 0 ? t.ink : t.fill,
                color: i === 0 ? t.bg : t.ink,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        {[
          ["Launch film", "2026 · 0:42"],
          ["Brand motion kit", "2026 · 24 scenes"],
          ["App store preview", "2025 · 0:30"],
          ["Product teaser", "2025 · 0:15"],
          ["Keynote opener", "2025 · 1:10"],
        ].map(([title, meta], i) => (
          <div key={title} style={{ padding: "0 12px 14px" }}>
            <div
              style={{
                position: "relative",
                height: 200,
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <Img
                src={img(i * 2)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.6) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 12,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, color: "#fff" }}>{title}</div>
                  <div
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}
                  >
                    {meta}
                  </div>
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: "rgba(255,255,255,0.22)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                    <path d="M8 5.5v13l10-6.5z" fill="#fff" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: 50,
          height: 64,
          borderRadius: 20,
          background: dark ? "rgba(36,36,40,0.94)" : "rgba(255,255,255,0.96)",
          border: `1px solid ${t.hair}`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          zIndex: 7,
          opacity: frame >= B.banner ? Math.min(1, banner * 2) : 0,
          transform: `translateY(${mix(-90, 0, banner)}px) scale(${mix(0.9, 1, banner)})`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
            <path d="m6 12.5 4 4 8-9" {...line("#fff", 2.2)} />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: t.ink }}>{liveLabel}</div>
          <div style={{ fontSize: 13, color: t.muted, whiteSpace: "nowrap" }}>
            {handle}.studio · now
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: SW / 2 - 28,
          bottom: 26,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: dark ? "#f5f4f2" : "#141414",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          zIndex: 4,
        }}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
          <path d="M8 5.5v13l10-6.5z" fill={dark ? "#0c0c0e" : "#ffffff"} />
        </svg>
      </div>
    </>
  );

  const aboutScreen = (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 46,
          transform: `translateY(${-scrollR}px)`,
        }}
      >
        {navRow("About")}
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ fontSize: 13, color: accent, letterSpacing: "0.02em" }}>
            {name} · {role}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 300,
              color: t.ink,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              marginTop: 12,
            }}
          >
            {headline}{" "}
            <span
              style={{
                fontFamily: serif.fontFamily,
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: accent,
              }}
            >
              {accentWord}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.muted,
              lineHeight: 1.5,
              marginTop: 14,
            }}
          >
            Eight years of launch films, product reveals and the small
            transitions that make an interface feel alive.
          </div>
        </div>
        <div
          style={{ margin: "18px 18px 0", borderTop: `1px solid ${t.hair}` }}
        >
          {skills.map((s, i) => (
            <div
              key={s}
              style={{
                height: 52,
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: `1px solid ${t.hair}`,
                fontSize: 16,
                color: t.ink,
              }}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
                <path
                  d={
                    i % 3 === 0
                      ? "M5 5h14v14H5zM10 9.5l5 2.5-5 2.5z"
                      : i % 3 === 1
                        ? "M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"
                        : "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"
                  }
                  {...line(t.muted)}
                />
              </svg>
              <span style={{ flex: 1 }}>{s}</span>
              <span style={{ fontSize: 13, color: t.faint }}>
                {[12, 7, 9][i % 3]} projects
              </span>
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                <path d="m9 6 6 6-6 6" {...line(t.faint)} />
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 110,
          background: `linear-gradient(180deg, transparent, ${t.bg} 40%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 30,
          height: 54,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: t.ink }}>Open for projects</div>
          <div style={{ fontSize: 13, color: t.muted }}>
            Replies within a day
          </div>
        </div>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 24px color-mix(in oklab, ${accent} 45%, transparent)`,
          }}
        >
          <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
            <path d="M7 17 17 7M9 7h8v8" {...line("#fff", 1.8)} />
          </svg>
        </div>
      </div>
    </>
  );

  const screens = [profileScreen, workScreen, aboutScreen];

  return (
    <AbsoluteFill
      style={{ fontFamily: manrope.fontFamily, overflow: "hidden" }}
    >
      <GshGround
        preset={resolvedPreset}
        params={resolvedParams}
        timeOffset={2}
        timeScale={0.4}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        {rise.map((r, i) => (
          <filter
            key={B.rise[i]}
            id={`pt-rise-${i}`}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feGaussianBlur
              stdDeviation={`0 ${Math.min(6, Math.abs(r - risePrev[i]) * PH * 0.06)}`}
            />
          </filter>
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          perspective: 2400,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: stageW / 2,
            top: stageH / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `scale(${camPush}) rotateX(${4 - 2 * fwd}deg)`,
          }}
        >
          {[0, 2, 1].map((i) => {
            const L = layout[i];
            const r = rise[i];
            const side = i !== 1;
            const blurV = Math.abs(r - risePrev[i]) * PH * 0.06;
            const tilt = (i - 1) * mix(10, 0, Math.min(1, r));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  zIndex: L.z,
                  transform: `translate(${L.x}px, ${L.y + mix(stageH * 0.85, 0, r)}px) rotateZ(${tilt}deg) rotateY(${(1 - i) * 6 * (side ? 1 - fwd * 0.4 : 0)}deg) scale(${L.s})`,
                  filter:
                    [
                      blurV > 0.4 ? `url(#pt-rise-${i})` : "",
                      side && fwd > 0.01
                        ? `brightness(${mix(1, dark ? 0.62 : 0.9, fwd)}) blur(${fwd * 1.4}px)`
                        : "",
                    ]
                      .join(" ")
                      .trim() || undefined,
                  opacity: frame >= B.rise[i] ? 1 : 0,
                }}
              >
                <Phone t={t} shellDark={dark}>
                  {screens[i]}
                </Phone>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default PhoneTrio;
