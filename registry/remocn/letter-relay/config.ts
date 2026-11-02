import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const letterRelayConfig: ComponentConfig = {
  componentName: "LetterRelay",
  importPath: "@/components/remocn/letter-relay",
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
    word: {
      type: "text-content",
      default: "remocn",
      description: "Word",
    },
    mark: {
      type: "boolean",
      default: true,
      description: "Mark",
    },
    hop: {
      type: "number",
      default: 10,
      min: 0,
      max: 30,
      step: 1,
      description: "Hop",
      hiddenFromList: false,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
