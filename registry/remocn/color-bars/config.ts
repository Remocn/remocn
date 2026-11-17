import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const colorBarsConfig: ComponentConfig = {
  componentName: "ColorBars",
  importPath: "@/components/remocn/color-bars",
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
    eyebrow: {
      type: "text-content",
      default: "Introducing",
      description: "Eyebrow",
    },
    tagline: {
      type: "text-content",
      default: "Motion for the films you launch with.",
      description: "Tagline",
    },
    direction: {
      type: "enum",
      default: "right",
      variants: {
        right: {},
        left: {},
        up: {},
        down: {},
      },
      description: "Direction",
    },
    angle: {
      type: "number",
      default: 16,
      min: 0,
      max: 48,
      step: 1,
      description: "Angle",
      hiddenFromList: false,
    },
    bars: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Bars",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Bar stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({
      font: "Bricolage Grotesque",
      background: false,
      grain: true,
    }),
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
  durationInFrames: 86,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
