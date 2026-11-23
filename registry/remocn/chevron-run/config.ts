import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const chevronRunConfig: ComponentConfig = {
  componentName: "ChevronRun",
  importPath: "@/components/remocn/chevron-run",
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
    value: {
      type: "text-content",
      default: "+312%",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "growth since launch",
      description: "Caption",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 200,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    columns: {
      type: "number",
      default: 13,
      min: 5,
      max: 25,
      step: 1,
      description: "Columns",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
