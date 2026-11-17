import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const dotGlobeConfig: ComponentConfig = {
  componentName: "DotGlobe",
  importPath: "@/components/remocn/dot-globe",
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
    prefix: {
      type: "text-content",
      default: "Live in",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "countries",
      description: "Suffix",
    },
    count: {
      type: "number",
      default: 142,
      min: 0,
      max: 426,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 20,
      min: 4,
      max: 40,
      step: 1,
      description: "Route stagger",
      hiddenFromList: false,
    },
    flight: {
      type: "number",
      default: 32,
      min: 12,
      max: 60,
      step: 1,
      description: "Flight (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
