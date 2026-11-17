import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    lift: {
      type: "number",
      default: 0.24,
      min: 0,
      max: 0.6,
      step: 0.02,
      description: "Hop height",
      hiddenFromList: false,
    },
    floor: {
      type: "boolean",
      default: true,
      description: "Floor glow",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
