import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const scanRevealConfig: ComponentConfig = {
  componentName: "ScanReveal",
  importPath: "@/components/remocn/scan-reveal",
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
    title: {
      type: "text-content",
      default: "Built frame by frame",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Launch films from components you own.",
      description: "Subtitle",
    },
    scan: {
      type: "number",
      default: 56,
      min: 20,
      max: 120,
      step: 2,
      description: "Scan (frames)",
      hiddenFromList: false,
    },
    guides: {
      type: "boolean",
      default: true,
      description: "Guides",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
  durationInFrames: 142,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
