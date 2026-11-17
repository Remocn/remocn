import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const areaCompareConfig: ComponentConfig = {
  componentName: "AreaCompare",
  importPath: "@/components/remocn/area-compare",
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
    label: {
      type: "text-content",
      default: "Bundle size",
      description: "Label",
    },
    before: {
      type: "text-content",
      default: "Before",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "remocn",
      description: "After",
    },
    unit: {
      type: "text-content",
      default: "KB",
      description: "Unit",
    },
    verdict: {
      type: "text-content",
      default: "smaller",
      description: "Verdict",
    },
    shape: {
      type: "enum",
      default: "circle",
      variants: {
        circle: {},
        square: {},
      },
      description: "Shape",
    },
    beforeValue: {
      type: "number",
      default: 1200,
      min: 0,
      max: 3600,
      step: 1,
      description: "Before value",
      hiddenFromList: false,
    },
    afterValue: {
      type: "number",
      default: 84,
      min: 0,
      max: 252,
      step: 1,
      description: "After value",
      hiddenFromList: false,
    },
    shrink: {
      type: "number",
      default: 40,
      min: 10,
      max: 90,
      step: 1,
      description: "Shrink (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
