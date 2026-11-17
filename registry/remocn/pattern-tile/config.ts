import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const patternTileConfig: ComponentConfig = {
  componentName: "PatternTile",
  importPath: "@/components/remocn/pattern-tile",
  lists: {
    steps: {
      default: ["tile", "rotate 90°", "mirror", "translate"],
      description: "Steps",
      min: 4,
      max: 4,
    },
  },
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
    unit: {
      type: "text-content",
      default: "tiles",
      description: "Unit",
    },
    zoom: {
      type: "number",
      default: 2.8,
      min: 1,
      max: 5,
      step: 0.1,
      description: "Start zoom",
      hiddenFromList: false,
    },
    highlight: {
      type: "boolean",
      default: true,
      description: "Highlight first tile",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
