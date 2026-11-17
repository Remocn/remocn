import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    hold: {
      type: "number",
      default: 8,
      min: 1,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    stretch: {
      type: "number",
      default: 1,
      min: 0.4,
      max: 1.6,
      step: 0.1,
      description: "Stretch",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({}),
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
