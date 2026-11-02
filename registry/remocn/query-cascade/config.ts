import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const queryCascadeConfig: ComponentConfig = {
  componentName: "QueryCascade",
  importPath: "@/components/remocn/query-cascade",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    hero: {
      type: "text-content",
      default: "how to make a launch video",
      description: "Hero",
    },
    term: {
      type: "text-content",
      default: "launch video",
      description: "Term",
    },
    answerBefore: {
      type: "text-content",
      default: "Your",
      description: "Answer before",
    },
    answerAfter: {
      type: "text-content",
      default: "is ready.",
      description: "Answer after",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
