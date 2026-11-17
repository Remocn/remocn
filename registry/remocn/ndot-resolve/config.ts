import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ndotResolveConfig: ComponentConfig = {
  componentName: "NdotResolve",
  importPath: "@/components/remocn/ndot-resolve",
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
    text: {
      type: "text-content",
      default: "Less noise. More launch.",
      description: "Text",
    },
    emphasis: {
      type: "text-content",
      default: "launch",
      description: "Emphasis",
    },
    resolveAt: {
      type: "number",
      default: 34,
      min: 0,
      max: 90,
      step: 1,
      description: "Resolve at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2.2,
      min: 0,
      max: 6,
      step: 0.2,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
