"use client";

import { TransitionSeries } from "@remotion/transitions";
import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { planTransitionTiming } from "./duration";
import { FeatureFrame } from "./feature-frame";
import { FlowithDemo } from "./flowith-demo";
import {
  CtaScene,
  cameraCraneUp,
  type ProductDemoConfig,
  type ProductDemoScene,
  resolveTiming,
  spatialPush,
  type TemplateTheme,
} from "./foundation";
import { ProductHero } from "./product-hero";

export { getProductDemoDuration } from "./duration";
export type {
  ProductDemoConfig,
  ProductDemoScene,
  TemplateTheme,
} from "./foundation";

export interface A1ProductDemoProps {
  accentColor?: string;
  theme?: "light" | "dark";
  speed?: number;
  config?: ProductDemoConfig;
}

const THEME_TOKENS = {
  dark: {
    background: "#0B0B0F",
    foreground: "#FAFAFA",
    muted: "rgba(250,250,250,0.55)",
  },
  light: {
    background: "#FFFFFF",
    foreground: "#0B0B0F",
    muted: "rgba(11,11,15,0.55)",
  },
} as const;

export const DEFAULT_PRODUCT_DEMO_CONFIG: ProductDemoConfig = {
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: {
    accent: "#6366F1",
    background: "#0B0B0F",
    foreground: "#FAFAFA",
    muted: "rgba(250,250,250,0.55)",
    fontFamily: "Geist",
  },
  scenes: [
    {
      type: "product-hero",
      durationInFrames: 150,
      content: {
        name: "Switchboard",
        pitch: "One inbox for every channel",
      },
    },
    {
      type: "feature-frame",
      durationInFrames: 180,
      content: {
        title: "Unified inbox",
        bullet: "Email, chat and SMS in one stream",
        side: "left",
      },
    },
    {
      type: "feature-frame",
      durationInFrames: 180,
      content: {
        title: "Auto routing",
        bullet: "Every message reaches the right person",
        side: "right",
      },
    },
    {
      type: "cta-scene",
      durationInFrames: 120,
      content: { line: "Try it free", domain: "switchboard.app" },
    },
  ],
};

const SNAPSHOT_START = 20;
const SNAPSHOT_STAGGER = 4;

function SnapshotLine({
  width,
  strong,
  order,
  theme,
  f,
}: {
  width: string;
  strong?: boolean;
  order: number;
  theme: TemplateTheme;
  f: number;
}) {
  const start = SNAPSHOT_START + order * SNAPSHOT_STAGGER;
  const p = interpolate(f, [start, start + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        height: 16,
        width,
        borderRadius: 6,
        background: strong ? `${theme.foreground}30` : `${theme.foreground}16`,
        opacity: p,
        transform: `scaleX(${interpolate(p, [0, 1], [0.6, 1])})`,
        transformOrigin: "left center",
      }}
    />
  );
}

function DefaultSnapshot({
  theme,
  speed = 1,
}: {
  theme: TemplateTheme;
  speed?: number;
}) {
  const f = useCurrentFrame() * speed;
  const sidebar: Array<[string, boolean?]> = [
    ["70%", true],
    ["90%"],
    ["80%"],
    ["60%"],
    ["85%"],
  ];
  const main: Array<[string, boolean?]> = [
    ["40%", true],
    ["100%"],
    ["95%"],
    ["88%"],
    ["70%"],
  ];

  return (
    <div style={{ display: "flex", gap: 22, height: "100%" }}>
      <div
        style={{
          flex: "0 0 30%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingRight: 22,
          borderRight: `1px solid ${theme.foreground}14`,
        }}
      >
        {sidebar.map(([width, strong], i) => (
          <SnapshotLine
            key={`s-${i}`}
            width={width}
            strong={strong}
            order={i}
            theme={theme}
            f={f}
          />
        ))}
      </div>
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}
      >
        {main.map(([width, strong], i) => (
          <SnapshotLine
            key={`m-${i}`}
            width={width}
            strong={strong}
            order={i + 2}
            theme={theme}
            f={f}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductDemo({
  config,
  speed = 1,
}: {
  config: ProductDemoConfig;
  speed?: number;
}) {
  const { theme, scenes } = config;

  const nodes: ReactNode[] = [];
  scenes.forEach((scene, index) => {
    nodes.push(
      <TransitionSeries.Sequence
        key={`scene-${index}`}
        durationInFrames={scene.durationInFrames}
      >
        <AbsoluteFill style={{ background: theme.background }} />
        <SceneContent scene={scene} theme={theme} speed={speed} />
      </TransitionSeries.Sequence>,
    );

    const next = scenes[index + 1];
    if (next) {
      const timing = resolveTiming(planTransitionTiming(scene, next));
      if (scene.type === "feature-frame" && next.type === "feature-frame") {
        const direction = next.content.side === "right" ? "left" : "right";
        nodes.push(
          <TransitionSeries.Transition
            key={`transition-${index}`}
            presentation={spatialPush({ direction })}
            timing={timing}
          />,
        );
      } else {
        nodes.push(
          <TransitionSeries.Transition
            key={`transition-${index}`}
            presentation={cameraCraneUp()}
            timing={timing}
          />,
        );
      }
    }
  });

  return (
    <AbsoluteFill style={{ background: theme.background }}>
      <TransitionSeries>{nodes}</TransitionSeries>
    </AbsoluteFill>
  );
}

function SceneContent({
  scene,
  theme,
  speed,
}: {
  scene: ProductDemoScene;
  theme: TemplateTheme;
  speed: number;
}) {
  if (scene.type === "product-hero") {
    return <ProductHero content={scene.content} theme={theme} speed={speed} />;
  }
  if (scene.type === "feature-frame") {
    return (
      <FeatureFrame
        title={scene.content.title}
        bullet={scene.content.bullet}
        side={scene.content.side}
        accent={theme.accent}
        theme={theme}
        header=""
        frame={<DefaultSnapshot theme={theme} speed={speed} />}
        speed={speed}
      />
    );
  }
  return (
    <CtaScene
      line={scene.content.line}
      domain={scene.content.domain}
      theme={theme}
      speed={speed}
    />
  );
}

export function A1ProductDemo({
  accentColor,
  theme = "dark",
  speed = 1,
  config,
}: A1ProductDemoProps) {
  if (!config) {
    return <FlowithDemo speed={speed} />;
  }

  const tokens = THEME_TOKENS[theme];
  const resolvedConfig: ProductDemoConfig = {
    ...config,
    theme: {
      accent: accentColor ?? config.theme.accent,
      background: tokens.background,
      foreground: tokens.foreground,
      muted: tokens.muted,
      fontFamily: config.theme.fontFamily,
    },
  };

  return <ProductDemo config={resolvedConfig} speed={speed} />;
}
