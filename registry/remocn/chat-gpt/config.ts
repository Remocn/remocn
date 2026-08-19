import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chatGptConfig: ComponentConfig = {
  componentName: "ChatGpt",
  importPath: "@/components/remocn/chat-gpt",
  controls: {
    greeting: {
      type: "text-content",
      default: "What's on your mind today?",
      description: "Greeting",
    },
    placeholder: {
      type: "text-content",
      default: "Ask anything",
      description: "Placeholder",
    },
    prompt: {
      type: "text-content",
      default: "Make a sunset over a calm ocean",
      description: "Prompt",
    },
    accentColor: {
      type: "color",
      default: "#2F6FED",
      description: "Accent",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#FFFFFF" },
};
