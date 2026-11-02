"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
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

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
const serifItalic = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type BeamSweepProps = {
  beam?: GshPresetId;
  beamParams?: Partial<GradientParams>;
  angle?: number;
  burn?: string;
  edge?: string;
  light?: boolean;
};

export const beamSweepDefaults: Required<Omit<BeamSweepProps, "beamParams">> & {
  beamParams: Partial<GradientParams>;
} = {
  beam: "flood",
  beamParams: {
    colors: ["#eef5ff", "#8fbaff", "#2f68ff", "#1238c4"],
    background: "#0a2b9e",
    speed: 1.2,
  },
  angle: 34,
  burn: "#2f6bff",
  edge: "#d9e8ff",
  light: false,
};

const LEAD_EASE = Easing.bezier(0.45, 0, 0.55, 1);
const TRAIL_EASE = Easing.bezier(0.5, 0, 0.35, 1);
const LEAD_SOFT = 0.24;
const TRAIL_SOFT = 0.34;

function sweep(p: number) {
  const lead = interpolate(p, [0, 0.56], [-0.06, 1 + LEAD_SOFT + 0.04], {
    ...CLAMP,
    easing: LEAD_EASE,
  });
  const trail = interpolate(p, [0.38, 1], [-TRAIL_SOFT - 0.04, 1.06], {
    ...CLAMP,
    easing: TRAIL_EASE,
  });
  return { lead, trail };
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

const BeamSweepPresentation: React.FC<
  TransitionPresentationComponentProps<BeamSweepProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const props = {
    ...beamSweepDefaults,
    ...passedProps,
    beamParams: passedProps.beamParams ?? beamSweepDefaults.beamParams,
  };
  const { width: W, height: H } = useVideoConfig();
  const p = presentationProgress;
  const cssAngle = `${90 + props.angle}deg`;
  const { lead, trail } = sweep(p);

  if (presentationDirection === "exiting") {
    const k = interpolate(p, [0.02, 0.42], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    const push = interpolate(p, [0, 0.5], [1, 1.045], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    const aMask = `linear-gradient(${cssAngle}, transparent ${pct(lead - LEAD_SOFT)}, #000 ${pct(lead - LEAD_SOFT * 0.35)})`;
    return (
      <AbsoluteFill
        style={{
          maskImage: aMask,
          WebkitMaskImage: aMask,
          transform: `scale(${push})`,
          filter: `brightness(${(1 + k * (props.light ? 0.25 : 1.3)).toFixed(3)}) saturate(${(1 + k * 0.5).toFixed(3)}) blur(${(k * 4).toFixed(2)}px)`,
        }}
      >
        {children}
        <AbsoluteFill
          style={{
            backgroundColor: props.burn,
            mixBlendMode: props.light ? "multiply" : "screen",
            opacity: k * (props.light ? 0.35 : 0.75),
          }}
        />
      </AbsoluteFill>
    );
  }

  const bMask = `linear-gradient(${cssAngle}, #000 ${pct(trail)}, transparent ${pct(trail + TRAIL_SOFT)})`;
  const beamMask = `linear-gradient(${cssAngle}, transparent ${pct(trail)}, #000 ${pct(trail + TRAIL_SOFT)}, #000 ${pct(lead - LEAD_SOFT)}, transparent ${pct(lead)})`;
  const hot = `linear-gradient(${cssAngle}, transparent ${pct(lead - LEAD_SOFT * 0.9)}, ${props.edge} ${pct(lead - LEAD_SOFT * 0.45)}, transparent ${pct(lead - 0.02)})`;
  const span = Math.hypot(W, H) * 1.15;
  const active = p > 0 && p < 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          maskImage: p >= 1 ? undefined : bMask,
          WebkitMaskImage: p >= 1 ? undefined : bMask,
        }}
      >
        {children}
      </AbsoluteFill>
      {active ? (
        <AbsoluteFill
          style={{
            maskImage: beamMask,
            WebkitMaskImage: beamMask,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: (W - span) / 2,
              top: (H - span) / 2,
              width: span,
              height: span,
              transform: `rotate(${props.angle}deg)`,
            }}
          >
            <GshGround
              preset={props.beam}
              params={props.beamParams}
              timeOffset={3}
              timeScale={2.2}
              resolution={0.35}
            />
          </div>
          <AbsoluteFill
            style={{
              background: hot,
              mixBlendMode: props.light ? "normal" : "screen",
              opacity: props.light ? 0.9 : 0.75,
            }}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export function beamSweep(
  props: BeamSweepProps = {},
): TransitionPresentation<BeamSweepProps> {
  return { component: BeamSweepPresentation, props };
}

type Theme = "dark" | "light";

const UI = {
  dark: {
    app: "#0c0d10",
    panel: "#121318",
    raised: "#191b21",
    line: "rgba(255,255,255,0.07)",
    ink: "#eceef3",
    muted: "rgba(236,238,243,0.55)",
    faint: "rgba(236,238,243,0.32)",
    page: "#f4f1ea",
    pageInk: "#17140f",
    pageMuted: "rgba(23,20,15,0.56)",
    accent: "#3B5BFD",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.06)",
    heroInk: "#f3f6ff",
    heroMuted: "rgba(220,230,255,0.6)",
    ground: "earthshine" as GshPresetId,
    groundParams: undefined as Partial<GradientParams> | undefined,
  },
  light: {
    app: "#f3f3f1",
    panel: "#fbfbfa",
    raised: "#ffffff",
    line: "rgba(16,18,24,0.08)",
    ink: "#15171c",
    muted: "rgba(21,23,28,0.56)",
    faint: "rgba(21,23,28,0.34)",
    page: "#121317",
    pageInk: "#f4f2ee",
    pageMuted: "rgba(244,242,238,0.6)",
    accent: "#3B5BFD",
    highlight: "inset 0 1px 0 rgba(255,255,255,0.9)",
    heroInk: "#101320",
    heroMuted: "rgba(16,19,32,0.58)",
    ground: "paper-crease" as GshPresetId,
    groundParams: {
      colors: ["#7f9bff", "#b3c3ff", "#dde3fb", "#f1f2f8"],
      background: "#eef0f6",
    } as Partial<GradientParams> | undefined,
  },
};

const A_BEATS = { tilesIn: -6, press: 24, progress: 27 };
const B_BEATS = { lineIn: 12, subIn: 20 };

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  chevron: "M7 10l5 5 5-5",
  plus: "M12 5v14M5 12h14",
  send: "M12 19V5M6 11l6-6 6 6",
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  spark: "M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",
};

function BuilderScene({
  theme,
  images,
  title,
}: {
  theme: Theme;
  images: string[];
  title: [string, string];
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const c = UI[theme];
  const tall = H > W;
  const u = (tall ? W / 720 : H / 720) * 1.12;
  const press = spring({
    frame: frame - A_BEATS.press,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
  });
  const pressScale =
    frame < A_BEATS.press ? 1 : 1 - Math.sin(press * Math.PI) * 0.06;
  const published = frame >= A_BEATS.press + 3;
  const bar = interpolate(
    frame,
    [A_BEATS.progress, A_BEATS.progress + 36],
    [0, 1],
    {
      ...CLAMP,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    },
  );
  const push = interpolate(frame, [0, 66], [1, 1.03], CLAMP);
  const tile = (i: number) =>
    spring({
      frame: frame - A_BEATS.tilesIn - i * 3,
      fps,
      config: { mass: 0.8, damping: 18, stiffness: 160 },
    });
  const topH = 52 * u;
  const chatW = tall ? 0 : W * 0.27;
  const label: React.CSSProperties = {
    fontFamily: geist.fontFamily,
    fontWeight: 400,
    fontSize: 15 * u,
    color: c.ink,
    letterSpacing: "-0.005em",
  };
  return (
    <AbsoluteFill
      style={{ backgroundColor: c.app, transform: `scale(${push})` }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: topH,
          display: "flex",
          alignItems: "center",
          padding: `0 ${18 * u}px`,
          gap: 14 * u,
          borderBottom: `1px solid ${c.line}`,
          ...label,
        }}
      >
        <div
          style={{
            width: 26 * u,
            height: 26 * u,
            borderRadius: 7 * u,
            background: `linear-gradient(140deg, #5b78ff, ${c.accent})`,
          }}
        />
        <span>Lumen</span>
        <span style={{ color: c.faint }}>/</span>
        <span style={{ color: c.muted }}>launch-site</span>
        <Icon d={ICONS.chevron} size={14 * u} color={c.faint} />
        <div style={{ flex: 1 }} />
        {tall ? null : (
          <div
            style={{
              display: "flex",
              padding: 3 * u,
              borderRadius: 9 * u,
              background: c.raised,
              border: `1px solid ${c.line}`,
              gap: 2 * u,
              fontSize: 13 * u,
            }}
          >
            <span
              style={{
                padding: `${4 * u}px ${12 * u}px`,
                borderRadius: 6 * u,
                background: c.panel,
                boxShadow: c.highlight,
              }}
            >
              Preview
            </span>
            <span style={{ padding: `${4 * u}px ${12 * u}px`, color: c.muted }}>
              Edit
            </span>
          </div>
        )}
        {tall ? null : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              padding: `${6 * u}px ${14 * u}px`,
              borderRadius: 999,
              border: `1px solid ${c.line}`,
              color: c.muted,
              fontSize: 13 * u,
              minWidth: 200 * u,
            }}
          >
            <Icon d={ICONS.globe} size={14 * u} color={c.faint} />
            lumen.app
          </div>
        )}
        <div style={{ flex: 1 }} />
        <Icon d={ICONS.undo} size={17 * u} color={c.faint} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7 * u,
            padding: `${7 * u}px ${16 * u}px`,
            borderRadius: 999,
            background: published ? c.accent : c.ink,
            color: published ? "#fff" : c.app,
            fontSize: 14 * u,
            transform: `scale(${pressScale})`,
            boxShadow: published
              ? `0 0 0 ${4 * u}px rgba(59,91,253,0.22)`
              : "none",
          }}
        >
          {published ? (
            <Icon d={ICONS.check} size={14 * u} color="#fff" />
          ) : null}
          {published ? "Publishing" : "Publish"}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: -1,
            height: 2 * u,
            width: `${bar * 100}%`,
            background: `linear-gradient(90deg, transparent, ${c.accent})`,
          }}
        />
      </div>
      {tall ? null : (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: topH,
            bottom: 0,
            width: chatW,
            borderRight: `1px solid ${c.line}`,
            background: c.panel,
            padding: 18 * u,
            display: "flex",
            flexDirection: "column",
            gap: 14 * u,
            ...label,
            fontSize: 14 * u,
          }}
        >
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "86%",
              padding: `${10 * u}px ${13 * u}px`,
              borderRadius: 12 * u,
              background: c.raised,
              border: `1px solid ${c.line}`,
              boxShadow: c.highlight,
              lineHeight: 1.4,
            }}
          >
            Make the hero calmer and add the product shots.
          </div>
          <div style={{ color: c.faint, fontSize: 13 * u }}>Thought for 6s</div>
          {[
            "Rewrote hero.tsx",
            "Added 2 product images",
            "Tuned type scale",
          ].map((t, i) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9 * u,
                color: c.muted,
                opacity: interpolate(frame, [i * 3, i * 3 + 9], [0, 1], CLAMP),
              }}
            >
              <Icon d={ICONS.check} size={15 * u} color={c.accent} />
              {t}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8 * u, flexWrap: "wrap" }}>
            {["Add pricing", "Dark mode"].map((t) => (
              <div
                key={t}
                style={{
                  padding: `${5 * u}px ${11 * u}px`,
                  borderRadius: 999,
                  border: `1px solid ${c.line}`,
                  color: c.muted,
                  fontSize: 12.5 * u,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div
            style={{
              borderRadius: 14 * u,
              border: `1px solid ${c.line}`,
              background: c.raised,
              boxShadow: `${c.highlight}, 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.18)`,
              padding: 12 * u,
              display: "flex",
              flexDirection: "column",
              gap: 16 * u,
            }}
          >
            <span style={{ color: c.faint }}>Ask for a change…</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 * u }}>
              <Icon d={ICONS.plus} size={16 * u} color={c.muted} />
              <span style={{ color: c.muted, fontSize: 13 * u }}>Build</span>
              <Icon d={ICONS.chevron} size={12 * u} color={c.faint} />
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: 28 * u,
                  height: 28 * u,
                  borderRadius: 8 * u,
                  background: c.accent,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon d={ICONS.send} size={15 * u} color="#fff" />
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: chatW + (tall ? 28 : 24) * u,
          right: (tall ? 28 : 24) * u,
          top: topH + 22 * u,
          bottom: 22 * u,
          borderRadius: 12 * u,
          background: c.page,
          overflow: "hidden",
          boxShadow: `0 0 0 1px ${c.line}, 0 ${12 * u}px ${36 * u}px rgba(0,0,0,0.28), 0 ${2 * u}px ${6 * u}px rgba(0,0,0,0.18)`,
          padding: `${22 * u}px ${36 * u}px`,
          display: "flex",
          flexDirection: "column",
          gap: 26 * u,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22 * u,
            fontFamily: geist.fontFamily,
            fontWeight: 400,
            fontSize: 13 * u,
            color: c.pageMuted,
          }}
        >
          <span
            style={{
              fontFamily: serif.fontFamily,
              fontSize: 22 * u,
              color: c.pageInk,
              marginRight: "auto",
            }}
          >
            Lumen
          </span>
          {tall ? null : <span>Product</span>}
          {tall ? null : <span>Stories</span>}
          <span>Pricing</span>
          <span
            style={{
              padding: `${6 * u}px ${13 * u}px`,
              borderRadius: 999,
              background: c.pageInk,
              color: c.page,
            }}
          >
            Get early access
          </span>
        </div>
        <div
          style={{
            fontFamily: serif.fontFamily,
            fontWeight: 400,
            fontSize: (tall ? 78 : 58) * u,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: c.pageInk,
          }}
        >
          {title[0]}
          <br />
          <span
            style={{ fontFamily: serifItalic.fontFamily, fontStyle: "italic" }}
          >
            {title[1]}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: tall ? "column" : "row",
            gap: 14 * u,
            flex: 1,
            minHeight: 0,
          }}
        >
          {images.slice(0, 3).map((src, i) => {
            const s = tile(i);
            return (
              <div
                key={src}
                style={{
                  flex: i === 0 ? 1.4 : 1,
                  borderRadius: 10 * u,
                  overflow: "hidden",
                  position: "relative",
                  transform: `translateY(${(1 - s) * 30 * u}px)`,
                  opacity: Math.min(1, s * 1.6),
                }}
              >
                <Img
                  src={src}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function RiseLine({
  text,
  at,
  style,
}: {
  text: string;
  at: number;
  style: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={style}>
      {words.map((w, i) => {
        const s = spring({
          frame: frame - at - i * 2,
          fps,
          config: { mass: 0.8, damping: 20, stiffness: 150 },
        });
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.12em",
              marginBottom: "-0.12em",
              verticalAlign: "bottom",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - s) * 100}%)`,
                filter: `blur(${(Math.max(0, 1 - s) * 5).toFixed(2)}px)`,
              }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function StatementScene({
  theme,
  line,
  sub,
  ground,
  groundParams,
}: {
  theme: Theme;
  line: string;
  sub: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = UI[theme];
  const tall = H > W;
  const size = tall ? W * 0.1 : Math.min(W * 0.066, H * 0.12);
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground ?? c.ground}
        params={groundParams ?? c.groundParams}
        timeOffset={2}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${push})`,
          paddingBottom: tall ? H * 0.16 : H * 0.2,
          gap: size * 0.42,
        }}
      >
        <RiseLine
          text={line}
          at={B_BEATS.lineIn}
          style={{
            fontFamily: hanken.fontFamily,
            fontWeight: 300,
            fontSize: size,
            letterSpacing: "-0.04em",
            lineHeight: 1.04,
            color: c.heroInk,
            textAlign: "center",
            textWrap: "balance",
            maxWidth: W * (tall ? 0.86 : 0.8),
          }}
        />
        <RiseLine
          text={sub}
          at={B_BEATS.subIn}
          style={{
            fontFamily: hanken.fontFamily,
            fontWeight: 400,
            fontSize: size * 0.34,
            letterSpacing: "-0.01em",
            color: c.heroMuted,
            textAlign: "center",
            maxWidth: W * 0.8,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export type BeamSweepDemoProps = {
  theme?: Theme;
  images?: string[];
  pageTitle?: [string, string];
  line?: string;
  sub?: string;
  beam?: BeamSweepProps;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  sceneA?: number;
  sceneB?: number;
  transition?: number;
};

export const BEAM_SWEEP_DEMO = { sceneA: 66, sceneB: 72, transition: 30 };

const LIGHT_BEAM: BeamSweepProps = {
  beam: "flood",
  beamParams: {
    colors: ["#ffffff", "#d6e5ff", "#7fa6ff", "#3b5bfd"],
    background: "#b9d0ff",
    speed: 1.2,
  },
  burn: "#9cbcff",
  edge: "#ffffff",
  light: true,
};

export function BeamSweepDemo({
  theme = "dark",
  images = [
    staticFile("templates/product-showcase/sculpture.jpg"),
    staticFile("templates/launch-anything/horizon.jpg"),
    staticFile("templates/product-showcase/workbench.jpg"),
  ],
  pageTitle = ["Your next launch,", "already in motion."],
  line = "Just describe the launch.",
  sub = "Every scene is cut to your product.",
  beam,
  ground,
  groundParams,
  sceneA = BEAM_SWEEP_DEMO.sceneA,
  sceneB = BEAM_SWEEP_DEMO.sceneB,
  transition = BEAM_SWEEP_DEMO.transition,
}: BeamSweepDemoProps) {
  const presentation = beamSweep({
    ...(theme === "light" ? LIGHT_BEAM : {}),
    ...beam,
  });
  return (
    <AbsoluteFill style={{ backgroundColor: UI[theme].app }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneA}>
          <BuilderScene theme={theme} images={images} title={pageTitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={presentation}
          timing={linearTiming({ durationInFrames: transition })}
        />
        <TransitionSeries.Sequence durationInFrames={sceneB}>
          <StatementScene
            theme={theme}
            line={line}
            sub={sub}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
