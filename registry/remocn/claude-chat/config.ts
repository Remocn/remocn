import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const claudeChatConfig: ComponentConfig = {
  componentName: "ClaudeChat",
  importPath: "@/components/remocn/claude-chat",
  controls: {
    greeting: {
      type: "text-content",
      default: "Back at it, Dima",
      description: "Greeting",
    },
    placeholder: {
      type: "text-content",
      default: "Try: draft an email · summarize a doc · plan your week",
      description: "Placeholder",
    },
    prompt: {
      type: "text-content",
      default: "Draft a launch tweet for our new release",
      description: "Prompt",
    },
    modelName: {
      type: "text-content",
      default: "Opus 4.8",
      description: "Model",
    },
    modelTier: {
      type: "text-content",
      default: "Max",
      description: "Tier",
    },
    accentColor: {
      type: "color",
      default: "#D97757",
      description: "Accent",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#F5F4EF" },
};
