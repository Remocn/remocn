"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { type CSSProperties, type ReactNode, useEffect } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { focusPull } from "@/registry/remocn/focus-pull";
import { pushThrough } from "@/registry/remocn/push-through";
import { rippleZoom } from "@/registry/remocn/ripple-zoom";
import { whipPan } from "@/registry/remocn/whip-pan";
import { zoomBlur } from "@/registry/remocn/zoom-blur";
import { Clip, preloadClip } from "./clips";
import {
  COMP_SIZE,
  type Cut,
  type HeroTilesConfig,
  type Reel,
  resolveReel,
  TILE_SIZE,
} from "./config";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SHADOW =
  "inset 0 3px 0 #FFFFFF59, 0 3px 6px #0E10120F, 0 14px 28px #0E101214, 0 32px 64px #0E101214";

function cutCenters(reel: Reel) {
  const half = Math.round(reel.transitionFrames / 2);
  return Array.from(
    { length: reel.clips.length + 1 },
    (_, k) => k * reel.beat - half,
  );
}

function swayAt(frame: number, centers: number[], amount: number) {
  let last = centers[0];
  for (const center of centers) if (center <= frame) last = center;
  const t = Math.max(0, frame - last);
  return amount * Math.sin((2 * Math.PI * t) / 16) * Math.exp(-t / 11);
}

function transition(cut: Cut, frames: number, key: string) {
  const timing = linearTiming({ durationInFrames: frames });
  switch (cut.kind) {
    case "whip-pan":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={whipPan({ direction: cut.direction, blur: 18 })}
        />
      );
    case "zoom-blur":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={zoomBlur({ blur: 14 })}
        />
      );
    case "push-through":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={pushThrough({})}
        />
      );
    case "focus-pull":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={focusPull({})}
        />
      );
    case "ripple-zoom":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={rippleZoom({})}
        />
      );
    case "cut":
      return (
        <TransitionSeries.Transition
          key={key}
          timing={timing}
          presentation={hardCut()}
        />
      );
  }
}

function ReelContent({ reel }: { reel: Reel }) {
  const tf = reel.transitionFrames;
  const items: ReactNode[] = [];
  const clips = [...reel.clips, reel.clips[0]];
  clips.forEach((spec, i) => {
    const last = i === clips.length - 1;
    const first = i === 0;
    const duration = last ? tf : first ? reel.beat : reel.beat + tf;
    items.push(
      <TransitionSeries.Sequence
        key={`s-${i}`}
        durationInFrames={Math.max(1, duration)}
      >
        {first ? (
          <Sequence from={-tf}>
            <Clip spec={spec} />
          </Sequence>
        ) : (
          <Clip spec={spec} />
        )}
      </TransitionSeries.Sequence>,
    );
    if (!last && tf > 0) {
      items.push(transition(reel.cuts[i], tf, `t-${i}`));
    }
  });
  return <TransitionSeries>{items}</TransitionSeries>;
}

function hardCut() {
  return {
    component: ({
      children,
      presentationProgress,
      presentationDirection,
    }: {
      children: ReactNode;
      presentationProgress: number;
      presentationDirection: "entering" | "exiting";
    }) => {
      const visible =
        presentationDirection === "entering"
          ? presentationProgress >= 0.5
          : presentationProgress < 0.5;
      return (
        <AbsoluteFill style={{ opacity: visible ? 1 : 0 }}>
          {children}
        </AbsoluteFill>
      );
    },
    props: {},
  };
}

function HardCutContent({ reel, extend = 0 }: { reel: Reel; extend?: number }) {
  const centers = cutCenters(reel);
  return (
    <>
      {[...reel.clips, reel.clips[0]].map((spec, i) => (
        <Sequence
          key={`${spec.name}-${i}`}
          from={centers[i]}
          durationInFrames={reel.beat + extend}
        >
          <Clip spec={spec} />
        </Sequence>
      ))}
    </>
  );
}

function Shell({
  radius,
  style,
  children,
}: {
  radius: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: (COMP_SIZE - TILE_SIZE) / 2,
        top: (COMP_SIZE - TILE_SIZE) / 2,
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: radius * TILE_SIZE,
        overflow: "hidden",
        boxShadow: SHADOW,
        isolation: "isolate",
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: "inset 0 3px 0 #FFFFFF59",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function ReelMode({ config, reel }: { config: HeroTilesConfig; reel: Reel }) {
  const frame = useCurrentFrame();
  const rotate =
    config.video.tilt + swayAt(frame, cutCenters(reel), config.video.sway);
  return (
    <Shell
      radius={reel.clips[0]?.radius ?? 0.25}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <ReelContent reel={reel} />
    </Shell>
  );
}

function MorphMode({ config, reel }: { config: HeroTilesConfig; reel: Reel }) {
  const frame = useCurrentFrame();
  const centers = cutCenters(reel);
  const tf = Math.max(reel.transitionFrames, 1);
  const shapes = [...reel.clips, reel.clips[0]].map((spec) => spec.radius);
  let index = 0;
  centers.forEach((center, k) => {
    if (center <= frame) index = k;
  });
  const center = centers[Math.min(index + 1, centers.length - 1)];
  const p = interpolate(frame, [center - tf / 2, center + tf / 2], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const from = shapes[index] ?? 0.25;
  const to = shapes[Math.min(index + 1, shapes.length - 1)] ?? from;
  const radius = from + (to - from) * p;
  const squash = Math.sin(Math.PI * p) * 0.1 * config.video.morph;
  const rotate = config.video.tilt + swayAt(frame, centers, config.video.sway);
  return (
    <Shell
      radius={radius}
      style={{
        transform: `rotate(${rotate}deg) scale(${1 + squash}, ${1 - squash})`,
      }}
    >
      <ReelContent reel={reel} />
    </Shell>
  );
}

function FlipMode({ config, reel }: { config: HeroTilesConfig; reel: Reel }) {
  const frame = useCurrentFrame();
  const centers = cutCenters(reel);
  const half = Math.max(Math.round(reel.transitionFrames / 2), 1);
  let angle = 0;
  for (const center of centers) {
    if (frame >= center - half && frame < center) {
      angle = interpolate(frame, [center - half, center], [0, 90], {
        ...clamp,
        easing: Easing.in(Easing.cubic),
      });
    } else if (frame >= center && frame <= center + half) {
      angle = interpolate(frame, [center, center + half], [-90, 0], {
        ...clamp,
        easing: Easing.out(Easing.back(1.6)),
      });
    }
  }
  const rotate = config.video.tilt + swayAt(frame, centers, config.video.sway);
  return (
    <AbsoluteFill style={{ perspective: 900 }}>
      <Shell
        radius={0.25}
        style={{ transform: `rotate(${rotate}deg) rotateY(${angle}deg)` }}
      >
        <HardCutContent reel={reel} />
      </Shell>
    </AbsoluteFill>
  );
}

function deckPose(slot: number, tilt: number) {
  return {
    rotate: tilt + slot * 7,
    x: slot * 16,
    y: slot * -10,
    scale: 1 - slot * 0.07,
  };
}

function DeckMode({ config, reel }: { config: HeroTilesConfig; reel: Reel }) {
  const frame = useCurrentFrame();
  const centers = cutCenters(reel);
  const tf = Math.max(reel.transitionFrames, 1);
  const depth = config.video.deckDepth;
  const ordered = [...reel.clips, reel.clips[0]];
  let index = 0;
  centers.forEach((center, k) => {
    if (center <= frame) index = k;
  });
  const p = interpolate(frame, [centers[index], centers[index] + tf], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const sway = swayAt(frame, centers, config.video.sway);
  const at = (slot: number) => {
    const a = deckPose(slot + 1, config.video.tilt);
    const b = deckPose(slot, config.video.tilt);
    return {
      rotate: a.rotate + (b.rotate - a.rotate) * p,
      x: a.x + (b.x - a.x) * p,
      y: a.y + (b.y - a.y) * p,
      scale: a.scale + (b.scale - a.scale) * p,
    };
  };
  const transform = (pose: ReturnType<typeof at>, extra = 0) =>
    `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotate + extra}deg) scale(${pose.scale})`;

  const backs = Array.from({ length: depth }, (_, k) => depth - k);
  const outgoing = index > 0 ? ordered[index - 1] : ordered[ordered.length - 2];
  const fly = interpolate(
    frame,
    [centers[index], centers[index] + tf],
    [0, 1],
    {
      ...clamp,
      easing: Easing.in(Easing.quad),
    },
  );

  return (
    <AbsoluteFill>
      {backs.map((slot) => {
        const spec = ordered[(index + slot) % reel.clips.length];
        return (
          <Shell
            key={`back-${slot}`}
            radius={0.25}
            style={{
              transform: transform(at(slot)),
              background: spec.background,
              boxShadow: "0 3px 6px #0E10120D, 0 14px 28px #0E101210",
            }}
          >
            <div />
          </Shell>
        );
      })}
      <Shell radius={0.25} style={{ transform: transform(at(0), sway) }}>
        <HardCutContent reel={reel} extend={tf} />
      </Shell>
      {fly < 1 && (
        <Shell
          radius={0.25}
          style={{
            transform: `translate(${fly * 150}px, ${fly * -120}px) rotate(${config.video.tilt + fly * 28}deg) scale(${1 - fly * 0.1})`,
            opacity: 1 - fly,
          }}
        >
          <Sequence from={centers[index] - reel.beat}>
            <Clip spec={outgoing} />
          </Sequence>
        </Shell>
      )}
    </AbsoluteFill>
  );
}

export function VideoTileComposition({ config }: { config: HeroTilesConfig }) {
  const reel = resolveReel(config);
  const names = reel.clips.map((clip) => clip.name).join(",");
  useEffect(() => {
    for (const name of names.split(",")) preloadClip(name);
  }, [names]);
  switch (config.video.mode) {
    case "reel":
      return <ReelMode config={config} reel={reel} />;
    case "morph":
      return <MorphMode config={config} reel={reel} />;
    case "flip":
      return <FlipMode config={config} reel={reel} />;
    case "deck":
      return <DeckMode config={config} reel={reel} />;
  }
}
