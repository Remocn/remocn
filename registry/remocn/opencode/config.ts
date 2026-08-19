import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const opencodeConfig: ComponentConfig = {
  componentName: "OpenCode",
  importPath: "@/components/remocn/opencode",
  controls: {
    placeholder: {
      type: "text-content",
      default: "Ask anything... ",
      description: "Placeholder",
    },
    query: {
      type: "text-content",
      default: '"What is the tech stack of this project?"',
      description: "Query",
    },
    agentName: {
      type: "text-content",
      default: "Build",
      description: "Agent",
    },
    modelName: {
      type: "text-content",
      default: "Kimi K2.5",
      description: "Model",
    },
    provider: {
      type: "text-content",
      default: "Moonshot AI",
      description: "Provider",
    },
    accentColor: {
      type: "color",
      default: "#2B7FFF",
      description: "Accent",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#000000" },
};
