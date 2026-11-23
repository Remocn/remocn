import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const themeFlipConfig: ComponentConfig = {
  componentName: "ThemeFlip",
  importPath: "@/components/remocn/theme-flip",
  controls: {
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    startTheme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Start theme",
    },
    showToggle: {
      type: "boolean",
      default: true,
      description: "Show toggle",
    },
    showCursor: {
      type: "boolean",
      default: true,
      description: "Show cursor",
    },
    reverse: {
      type: "boolean",
      default: false,
      description: "Reverse",
    },
    clickAt: {
      type: "number",
      default: 36,
      min: 16,
      max: 80,
      step: 1,
      description: "Click at (frame)",
      hiddenFromList: false,
    },
    zoom: {
      type: "number",
      default: 2.1,
      min: 1,
      max: 3,
      step: 0.1,
      description: "Zoom",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
