import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chatGptConfig: ComponentConfig = {
  componentName: "ChatGpt",
  importPath: "@/components/remocn/chat-gpt",
  controls: {
    greeting: {
      type: "text",
      default: "What's on your mind today?",
      label: "Greeting",
    },
    placeholder: {
      type: "text",
      default: "Ask anything",
      label: "Placeholder",
    },
    prompt: {
      type: "text",
      default: "Make a sunset over a calm ocean",
      label: "Prompt",
    },
    accentColor: { type: "color", default: "#2F6FED", label: "Accent" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#FFFFFF" },
};
