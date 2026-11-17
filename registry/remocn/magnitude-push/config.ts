import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const magnitudePushConfig: ComponentConfig = {
  componentName: "MagnitudePush",
  importPath: "@/components/remocn/magnitude-push",
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
    value: {
      type: "text-content",
      default: "1000",
      description: "Value",
    },
    suffix: {
      type: "text-content",
      default: "×",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "fewer keyframes to set by hand",
      description: "Label",
    },
    pushGap: {
      type: "number",
      default: 15,
      min: 4,
      max: 40,
      step: 1,
      description: "Push gap (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
