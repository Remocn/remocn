import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const aiAnswerSourcesConfig: ComponentConfig = {
  componentName: "AiAnswerSources",
  importPath: "@/components/remocn/ai-answer-sources",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    query: {
      type: "text-content",
      default: "What is the fastest way to make a launch video?",
      description: "Query",
    },
    brand: {
      type: "text-content",
      default: "sift",
      description: "Brand",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 419,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
