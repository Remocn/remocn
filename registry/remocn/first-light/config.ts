import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const firstLightConfig: ComponentConfig = {
  componentName: "FirstLight",
  importPath: "@/components/remocn/first-light",
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
      default: "Every frame catches the light.",
      description: "Tagline",
    },
    rise: {
      type: "number",
      default: 54,
      min: 12,
      max: 120,
      step: 1,
      description: "Rise (frames)",
      hiddenFromList: false,
    },
    ticks: {
      type: "boolean",
      default: true,
      description: "Ruler ticks",
    },
    accent: { type: "color", default: undefined, description: "Line color" },
    ...sceneControls({ font: "Space Grotesk" }),
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
