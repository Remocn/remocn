"use client";

import "@fontsource/inter/latin-400.css";
import "@fontsource/roboto-mono/latin-400.css";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolveXAdsProps, type XAdsMcpProps } from "./content";
import { X_ADS_FPS, X_ADS_FRAMES, X_ADS_HEIGHT, X_ADS_WIDTH } from "./motion";
import { PerformanceChart } from "./scenes/chart";
import {
  CampaignCommand,
  ChangeCommand,
  DoubleCommand,
  Fetch,
  LaunchCommand,
  StatsLoading,
} from "./scenes/commands";
import { Geography } from "./scenes/geography";
import { Intro } from "./scenes/intro";
import { ClosingMark } from "./scenes/mark";
import { Delivery, Recommendation } from "./scenes/responses";
import {
  AnalysisTerminal,
  LaunchedTerminal,
  StatsTerminal,
} from "./scenes/terminal";
import { ClosingTitle, GrowthTitle } from "./scenes/titles";
import { ToolRun } from "./scenes/tools";

export type {
  ChartBar,
  Environment,
  TerminalRow,
  TerminalRun,
  XAdsContent,
  XAdsMcpProps,
} from "./content";
export { workflowEnvironments, xAdsBars, xAdsContent } from "./content";
export {
  type CountryKey,
  countryOutlines,
  defaultCountries,
} from "./countries";
export {
  X_ADS_FPS,
  X_ADS_FRAMES,
  X_ADS_HEIGHT,
  X_ADS_WIDTH,
  xAdsTimeline,
} from "./motion";

export function XAdsMcp(props: XAdsMcpProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const scene = resolveXAdsProps(props);
  const scale = Math.min(width / 480, height / 270);
  const at = (referenceFrame: number) =>
    Math.round((referenceFrame / X_ADS_FPS) * fps);
  return (
    <AbsoluteFill
      name="Workflow Console"
      style={{
        background: scene.background,
        color: "#e7e7e7",
        fontFamily: '"Inter", sans-serif',
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (width - 480 * scale) / 2,
          top: (height - 270 * scale) / 2,
          width: 480,
          height: 270,
          scale,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        {/* Explicit instances let Studio expose every scene in the timeline. */}
        <Sequence
          name="intro"
          from={at(0)}
          durationInFrames={at(132) - at(0)}
          layout="none"
        >
          <Intro scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="campaign-command"
          from={at(132)}
          durationInFrames={at(384) - at(132)}
          layout="none"
        >
          <CampaignCommand scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="fetch"
          from={at(384)}
          durationInFrames={at(486) - at(384)}
          layout="none"
        >
          <Fetch scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="analysis"
          from={at(486)}
          durationInFrames={at(642) - at(486)}
          layout="none"
        >
          <AnalysisTerminal scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="launch-command"
          from={at(642)}
          durationInFrames={at(753) - at(642)}
          layout="none"
        >
          <LaunchCommand scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="geography"
          from={at(753)}
          durationInFrames={at(1008) - at(753)}
          layout="none"
        >
          <Geography scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="tools"
          from={at(1008)}
          durationInFrames={at(1194) - at(1008)}
          layout="none"
        >
          <ToolRun scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="delivery"
          from={at(1194)}
          durationInFrames={at(1320) - at(1194)}
          layout="none"
        >
          <Delivery scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="launched"
          from={at(1320)}
          durationInFrames={at(1440) - at(1320)}
          layout="none"
        >
          <LaunchedTerminal scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="growth-title"
          from={at(1440)}
          durationInFrames={at(1536) - at(1440)}
          layout="none"
        >
          <GrowthTitle scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="stats-loading"
          from={at(1536)}
          durationInFrames={at(1668) - at(1536)}
          layout="none"
        >
          <StatsLoading scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="stats"
          from={at(1668)}
          durationInFrames={at(1884) - at(1668)}
          layout="none"
        >
          <StatsTerminal scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="change-command"
          from={at(1884)}
          durationInFrames={at(1971) - at(1884)}
          layout="none"
        >
          <ChangeCommand scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="recommendation"
          from={at(1971)}
          durationInFrames={at(2241) - at(1971)}
          layout="none"
        >
          <Recommendation scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="double-command"
          from={at(2241)}
          durationInFrames={at(2328) - at(2241)}
          layout="none"
        >
          <DoubleCommand scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="chart"
          from={at(2328)}
          durationInFrames={at(2448) - at(2328)}
          layout="none"
        >
          <PerformanceChart scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="closing-title"
          from={at(2448)}
          durationInFrames={at(2580) - at(2448)}
          layout="none"
        >
          <ClosingTitle scene={scene} t={frame / fps} />
        </Sequence>
        <Sequence
          name="mark"
          from={at(2580)}
          durationInFrames={at(2810) - at(2580)}
          layout="none"
        >
          <ClosingMark scene={scene} t={frame / fps} />
        </Sequence>
      </div>
      {props.audioSrc?.trim() ? (
        <Audio
          src={props.audioSrc}
          volume={
            Number.isFinite(props.volume)
              ? Math.max(0, Math.min(1, props.volume ?? 1))
              : 1
          }
        />
      ) : null}
    </AbsoluteFill>
  );
}

export const WorkflowConsole = XAdsMcp;
export type WorkflowConsoleProps = XAdsMcpProps;

export const xAdsMcpConfig = {
  componentName: "WorkflowConsole",
  importPath: "@/components/remocn/templates/x-ads-mcp",
  controls: {
    productName: {
      type: "text-content" as const,
      default: "Workflow Console",
      description: "Product name in the opening title",
    },
    accentColor: {
      type: "color" as const,
      default: "#8ed8f8",
      description: "Result highlights and performance bars",
    },
    backgroundColor: {
      type: "color" as const,
      default: "#0e1b2b",
      description: "Main background",
    },
  },
  durationInFrames: X_ADS_FRAMES,
  fps: X_ADS_FPS,
  compositionWidth: X_ADS_WIDTH,
  compositionHeight: X_ADS_HEIGHT,
};
