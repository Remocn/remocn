import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hiddenWordConfig: ComponentConfig = {
  componentName: "HiddenWord",
  importPath: "@/components/remocn/hidden-word",
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
    text: {
      type: "text-content",
      default:
        "Small teams make their launch film in code and post it by Friday.",
      description: "Text",
    },
    word: {
      type: "text-content",
      default: "ship",
      description: "Word",
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
  durationInFrames: 186,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
