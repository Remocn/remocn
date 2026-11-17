import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const noiseForgeStingConfig: ComponentConfig = {
  componentName: "NoiseForgeSting",
  importPath: "@/components/remocn/noise-forge-sting",
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
    tagline: {
      type: "text-content",
      default: "Launch videos, built from parts.",
      description: "Tagline",
    },
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 16,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    hot: { type: "color", default: undefined, description: "Hot color" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
