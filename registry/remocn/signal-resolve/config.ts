import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const signalResolveConfig: ComponentConfig = {
  componentName: "SignalResolve",
  importPath: "@/components/remocn/signal-resolve",
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
      default: "emocn",
      description: "Name",
    },
    caption: {
      type: "text-content",
      default: "Less noise. More signal.",
      description: "Caption",
    },
    traces: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Traces",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    grid: {
      type: "boolean",
      default: true,
      description: "Grid",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
