import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const opencodeConfig: ComponentConfig = {
  componentName: "OpenCode",
  importPath: "@/components/remocn/opencode",
  controls: {
    placeholder: {
      type: "text",
      default: "Ask anything... ",
      label: "Placeholder",
    },
    query: {
      type: "text",
      default: '"What is the tech stack of this project?"',
      label: "Query",
    },
    agentName: { type: "text", default: "Build", label: "Agent" },
    modelName: { type: "text", default: "Kimi K2.5", label: "Model" },
    provider: { type: "text", default: "Moonshot AI", label: "Provider" },
    accentColor: { type: "color", default: "#2B7FFF", label: "Accent" },
    theme: {
      type: "select",
      default: "dark",
      options: ["light", "dark"],
      label: "Theme",
    },
    background: {
      type: "select",
      default: "surface",
      options: ["surface", "transparent"],
      label: "Background",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
