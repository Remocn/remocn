import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const claudeChatConfig: ComponentConfig = {
  componentName: "ClaudeChat",
  importPath: "@/components/remocn/claude-chat",
  controls: {
    greeting: { type: "text", default: "Back at it, Dima", label: "Greeting" },
    placeholder: {
      type: "text",
      default: "Try: draft an email · summarize a doc · plan your week",
      label: "Placeholder",
    },
    prompt: {
      type: "text",
      default: "Draft a launch tweet for our new release",
      label: "Prompt",
    },
    modelName: { type: "text", default: "Opus 4.8", label: "Model" },
    modelTier: { type: "text", default: "Max", label: "Tier" },
    accentColor: { type: "color", default: "#D97757", label: "Accent" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#F5F4EF" },
};
