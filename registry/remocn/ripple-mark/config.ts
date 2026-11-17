import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rippleMarkConfig: ComponentConfig = {
  componentName: "RippleMark",
  importPath: "@/components/remocn/ripple-mark",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    stagger: {
      type: "number",
      default: 2.5,
      min: 0,
      max: 8,
      step: 0.5,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    density: {
      type: "number",
      default: 80,
      min: 40,
      max: 120,
      step: 5,
      description: "Dot density",
      hiddenFromList: false,
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
