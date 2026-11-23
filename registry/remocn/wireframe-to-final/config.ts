import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wireframeToFinalConfig: ComponentConfig = {
  componentName: "WireframeToFinal",
  importPath: "@/components/remocn/wireframe-to-final",
  lists: {
    captions: {
      default: ["Idea", "Product"],
      description: "Captions",
      min: 2,
      max: 2,
    },
    measurements: {
      default: ["1440", "900", "288"],
      description: "Measurements",
      min: 3,
      max: 3,
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    sweep: {
      type: "number",
      default: 48,
      min: 12,
      max: 96,
      step: 2,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    glow: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Glow",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "IBM Plex Mono" }),
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
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
