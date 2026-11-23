import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const heatTraceConfig: ComponentConfig = {
  componentName: "HeatTrace",
  importPath: "@/components/remocn/heat-trace",
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
    tagline: {
      type: "text-content",
      default: "Launch-video scenes for Remotion. Copy, paste, render.",
      description: "Tagline",
    },
    eyebrow: {
      type: "text-content",
      default: "",
      description: "Eyebrow",
    },
    pass: {
      type: "number",
      default: 56,
      min: 20,
      max: 100,
      step: 1,
      description: "Heat pass (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
