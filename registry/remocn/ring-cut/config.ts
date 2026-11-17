import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ringCutConfig: ComponentConfig = {
  componentName: "RingCut",
  importPath: "@/components/remocn/ring-cut",
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
    from: {
      type: "text-content",
      default: "One idea",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "remocn",
      description: "To",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 8,
      step: 1,
      description: "Ring stagger (frames)",
      hiddenFromList: false,
    },
    expand: {
      type: "number",
      default: 24,
      min: 8,
      max: 60,
      step: 1,
      description: "Ring expand (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
