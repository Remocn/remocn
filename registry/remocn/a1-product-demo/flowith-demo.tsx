"use client";

import { AbsoluteFill, Series } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { AIPlanning } from "./acts/ai-planning";
import { FeaturesSwap } from "./acts/features-swap";
import { FocusAnalytics } from "./acts/focus-analytics";
import { IconCloud } from "./acts/icon-cloud";
import { Integrations } from "./acts/integrations";
import { LogoOutro } from "./acts/logo-outro";
import { MetricsCards } from "./acts/metrics-cards";
import { Positioning } from "./acts/positioning";
import { ProblemHook } from "./acts/problem-hook";
import { SocialProof } from "./acts/social-proof";
import { TaskMgmt } from "./acts/task-mgmt";
import { WorkflowAuto } from "./acts/workflow-auto";
import { FLOW_BG } from "./foundation";

export const FLOWITH_DURATION = 1356;

export function FlowithDemo({ speed = 1 }: { speed?: number }) {
  // The act lengths are written on the 30 fps timeline the acts run on; a
  // series counts in the composition's own frames.
  const toFrames = useCompositionFrames();
  return (
    <AbsoluteFill style={{ background: FLOW_BG }}>
      <Series>
        <Series.Sequence durationInFrames={toFrames(165)}>
          <ProblemHook speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(120)}>
          <Positioning speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(150)}>
          <IconCloud speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(120)}>
          <AIPlanning speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(90)}>
          <WorkflowAuto speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(75)}>
          <FeaturesSwap speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(150)}>
          <TaskMgmt speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(105)}>
          <FocusAnalytics speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(75)}>
          <Integrations speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(90)}>
          <MetricsCards speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(120)}>
          <SocialProof speed={speed} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={toFrames(96)}>
          <LogoOutro speed={speed} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
