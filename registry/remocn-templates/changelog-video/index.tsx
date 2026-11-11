"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CHANGELOG_VIDEO_FPS,
  CHANGELOG_VIDEO_HEIGHT,
  CHANGELOG_VIDEO_WIDTH,
  type ChangelogVideoProps,
  changelogVideoDefaults,
  changelogVideoDuration,
  changelogVideoThemes,
  ITEM_FRAMES,
  OUTRO_FRAMES,
  type ResolvedChangelogVideo,
  resolveChangelogVideoProps,
  STAMP_FRAMES,
} from "./content";

export type {
  ChangelogVideoItem,
  ChangelogVideoProps,
} from "./content";
export {
  CHANGELOG_VIDEO_FPS,
  CHANGELOG_VIDEO_HEIGHT,
  CHANGELOG_VIDEO_MAX_ITEMS,
  CHANGELOG_VIDEO_WIDTH,
  calculateChangelogVideoMetadata,
  changelogVideoDefaults,
  changelogVideoDuration,
  resolveChangelogVideoProps,
} from "./content";

const { fontFamily: sans } = loadManrope("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.75, 0.2);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EXIT = 14;

type Palette = (typeof changelogVideoThemes)[keyof typeof changelogVideoThemes];

/** 0→1 entrance from `start`, over `length` frames. */
function enter(frame: number, start: number, length = 22) {
  return interpolate(frame, [start, start + length], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
}

/** 1→0 exit over the last frames of a beat. */
function leave(frame: number, beat: number) {
  return interpolate(frame, [beat - EXIT, beat], [1, 0], {
    ...CLAMP,
    easing: EASE_IN,
  });
}

/** Shrinks a line so long titles fit the 1600px measure without clipping. */
function fitSize(text: string, max: number, min: number, measure = 1600) {
  const perChar = 0.56;
  return Math.max(min, Math.min(max, measure / (text.length * perChar || 1)));
}

/** A line that rises out of its own mask. */
function Rise({
  frame,
  start,
  children,
  style,
}: {
  frame: number;
  start: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const t = enter(frame, start);
  return (
    // The pad keeps descenders inside the mask; the negative margin gives the
    // space back so the layout does not shift.
    <div style={{ overflow: "hidden", paddingBottom: 24, marginBottom: -24 }}>
      <div
        style={{
          transform: `translateY(${(1 - t) * 105}%)`,
          opacity: interpolate(t, [0, 0.4], [0, 1], CLAMP),
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Stamp({ scene, palette }: SceneProps) {
  const frame = useCurrentFrame();
  const out = leave(frame, STAMP_FRAMES);
  const rule = enter(frame, 10, 30);
  const meta = [scene.version, scene.date].filter(Boolean).join("  ·  ");
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: out,
        transform: `translateY(${(1 - out) * -24}px)`,
      }}
    >
      <Rise frame={frame} start={0}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: fitSize(scene.product, 180, 96),
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: palette.foreground,
          }}
        >
          {scene.product}
        </div>
      </Rise>
      <div
        style={{
          width: 120 * rule,
          height: 3,
          margin: "40px 0 34px",
          background: scene.accent,
          borderRadius: 2,
        }}
      />
      {meta ? (
        <Rise frame={frame} start={16}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 40,
              letterSpacing: "0.04em",
              color: palette.muted,
            }}
          >
            {meta}
          </div>
        </Rise>
      ) : null}
    </AbsoluteFill>
  );
}

function Item({
  scene,
  palette,
  index,
}: SceneProps & {
  index: number;
}) {
  const frame = useCurrentFrame();
  const item = scene.items[index];
  const out = leave(frame, ITEM_FRAMES);
  const total = scene.items.length;
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return (
    <AbsoluteFill
      style={{
        padding: "0 160px",
        justifyContent: "center",
        opacity: out,
        transform: `translateY(${(1 - out) * -24}px)`,
      }}
    >
      <Rise frame={frame} start={0}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 30,
            letterSpacing: "0.06em",
            color: scene.accent,
          }}
        >
          {counter}
        </div>
      </Rise>
      <div style={{ height: 36 }} />
      <Rise frame={frame} start={6}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: fitSize(item.title, 120, 64),
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: palette.foreground,
            textWrap: "balance",
          }}
        >
          {item.title}
        </div>
      </Rise>
      {item.payoff ? (
        <>
          <div style={{ height: 28 }} />
          <Rise frame={frame} start={16}>
            <div
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: fitSize(item.payoff, 56, 36),
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                color: palette.muted,
                textWrap: "balance",
              }}
            >
              {item.payoff}
            </div>
          </Rise>
        </>
      ) : null}
    </AbsoluteFill>
  );
}

function Outro({ scene, palette }: SceneProps) {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [OUTRO_FRAMES - 10, OUTRO_FRAMES], [1, 0], {
    ...CLAMP,
    easing: EASE_IN,
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: fade,
      }}
    >
      <Rise frame={frame} start={0}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 112,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: palette.foreground,
          }}
        >
          {scene.product}
        </div>
      </Rise>
      {scene.closing ? (
        <>
          <div style={{ height: 28 }} />
          <Rise frame={frame} start={10}>
            <div
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 48,
                color: palette.muted,
              }}
            >
              {scene.closing}
            </div>
          </Rise>
        </>
      ) : null}
      {scene.url ? (
        <>
          <div style={{ height: 72 }} />
          <Rise frame={frame} start={22}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 34,
                letterSpacing: "0.02em",
                color: scene.accent,
              }}
            >
              {scene.url}
            </div>
          </Rise>
        </>
      ) : null}
    </AbsoluteFill>
  );
}

/** One segment per item; the current one fills across its beat. */
function Progress({ scene, palette }: SceneProps) {
  const frame = useCurrentFrame();
  const total = scene.items.length;
  const show =
    interpolate(frame, [STAMP_FRAMES - 10, STAMP_FRAMES + 6], [0, 1], CLAMP) *
    interpolate(
      frame,
      [
        STAMP_FRAMES + total * ITEM_FRAMES - EXIT,
        STAMP_FRAMES + total * ITEM_FRAMES,
      ],
      [1, 0],
      CLAMP,
    );
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        right: 160,
        bottom: 96,
        display: "flex",
        gap: 12,
        opacity: show,
      }}
    >
      {scene.items.map((item, i) => {
        const start = STAMP_FRAMES + i * ITEM_FRAMES;
        const fill = interpolate(
          frame,
          [start, start + ITEM_FRAMES - EXIT],
          [0, 1],
          CLAMP,
        );
        return (
          <div
            key={`${i}-${item.title}`}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: palette.hairline,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fill * 100}%`,
                height: "100%",
                background: scene.accent,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

type SceneProps = { scene: ResolvedChangelogVideo; palette: Palette };

/**
 * A release-notes video driven entirely by props: a stamp with product,
 * version and date, one beat per changelog item, and a closing beat with the
 * changelog URL. Same frame every release; only the data changes.
 */
export function ChangelogVideo(props: ChangelogVideoProps) {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { product, version, date, items, url, closing, accent, theme } = props;
  const scene = useMemo(
    () =>
      resolveChangelogVideoProps({
        product,
        version,
        date,
        items,
        url,
        closing,
        accent,
        theme,
      }),
    [product, version, date, items, url, closing, accent, theme],
  );
  const palette = changelogVideoThemes[scene.theme];
  const scale = Math.min(
    width / CHANGELOG_VIDEO_WIDTH,
    height / CHANGELOG_VIDEO_HEIGHT,
  );
  const outroStart = STAMP_FRAMES + scene.items.length * ITEM_FRAMES;
  // A slow drift of accent light behind every beat, the one constant.
  const drift = Math.sin(frame / 90) * 6;

  return (
    <AbsoluteFill
      style={{ background: palette.background, overflow: "hidden" }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 70% at ${30 + drift}% 110%, ${scene.accent}2e, transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: CHANGELOG_VIDEO_WIDTH,
            height: CHANGELOG_VIDEO_HEIGHT,
            flexShrink: 0,
            transform: `scale(${scale})`,
          }}
        >
          <Sequence durationInFrames={STAMP_FRAMES} layout="none">
            <Stamp scene={scene} palette={palette} />
          </Sequence>
          {scene.items.map((item, i) => (
            <Sequence
              key={`${i}-${item.title}`}
              from={STAMP_FRAMES + i * ITEM_FRAMES}
              durationInFrames={ITEM_FRAMES}
              layout="none"
            >
              <Item scene={scene} palette={palette} index={i} />
            </Sequence>
          ))}
          <Progress scene={scene} palette={palette} />
          <Sequence
            from={outroStart}
            durationInFrames={OUTRO_FRAMES}
            layout="none"
          >
            <Outro scene={scene} palette={palette} />
          </Sequence>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const changelogVideoConfig = {
  componentName: "ChangelogVideo",
  importPath: "@/components/remocn/templates/changelog-video",
  controls: {
    product: {
      type: "text-content" as const,
      default: changelogVideoDefaults.product,
      description: "Product name on the stamp and the closing beat",
    },
    version: {
      type: "text-content" as const,
      default: changelogVideoDefaults.version,
      description: "Release tag; leave empty to hide",
    },
    date: {
      type: "text-content" as const,
      default: changelogVideoDefaults.date,
      description: "Release date as printed; leave empty to hide",
    },
    url: {
      type: "text-content" as const,
      default: changelogVideoDefaults.url,
      description: "Full changelog URL in the closing beat",
    },
    closing: {
      type: "text-content" as const,
      default: changelogVideoDefaults.closing,
      description: "Closing line",
    },
    accent: {
      type: "color" as const,
      default: changelogVideoDefaults.accent,
      description: "Accent",
    },
    theme: {
      type: "enum" as const,
      default: changelogVideoDefaults.theme,
      variants: { dark: {}, light: {} },
      description: "Theme",
    },
  },
  durationInFrames: changelogVideoDuration(changelogVideoDefaults.items.length),
  fps: CHANGELOG_VIDEO_FPS,
  compositionWidth: CHANGELOG_VIDEO_WIDTH,
  compositionHeight: CHANGELOG_VIDEO_HEIGHT,
};
