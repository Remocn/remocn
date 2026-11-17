import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const numberSplitConfig: ComponentConfig = {
  componentName: "NumberSplit",
  importPath: "@/components/remocn/number-split",
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
    total: {
      type: "text-content",
      default: "300+",
      description: "Total",
    },
    label: {
      type: "text-content",
      default: "components",
      description: "Label",
    },
    hold: {
      type: "number",
      default: 36,
      min: 6,
      max: 90,
      step: 1,
      description: "Hold before split (frames)",
      hiddenFromList: false,
    },
    barHeight: {
      type: "number",
      default: 16,
      min: 4,
      max: 40,
      step: 1,
      description: "Bar height",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
