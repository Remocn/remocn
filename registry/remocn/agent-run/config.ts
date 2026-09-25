import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getAgentRunDuration } from ".";

const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

function durationOf(values: Record<string, unknown>) {
  return getAgentRunDuration(undefined, {
    seed: numberOf(values.seed),
    compression: numberOf(values.compression),
    speed: numberOf(values.speed),
  });
}

export const agentRunConfig: ComponentConfig = {
  componentName: "AgentRun",
  importPath: "@/components/remocn/agent-run",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: { light: {}, dark: {} },
      description: "Theme",
    },
    accentColor: { type: "color", default: "#2563eb", description: "Accent" },
    compression: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 0.5,
      description: "Compression",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 1,
      min: 1,
      max: 99,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 355,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ececea" },
};
