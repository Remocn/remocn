import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rubberbandWordConfig: ComponentConfig = {
  componentName: "RubberbandWord",
  importPath: "@/components/remocn/rubberband-word",
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
      default: "tension",
      description: "Word",
    },
    snapWord: {
      type: "text-content",
      default: "release",
      description: "Snap word",
    },
    period: {
      type: "boolean",
      default: true,
      description: "Period",
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
