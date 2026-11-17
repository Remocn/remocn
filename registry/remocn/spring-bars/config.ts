import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const springBarsConfig: ComponentConfig = {
  componentName: "SpringBars",
  importPath: "@/components/remocn/spring-bars",
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
      default: "3.4×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "Least sag under the same load",
      description: "Caption",
    },
    accentIndex: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Accent index",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Spring stagger",
      hiddenFromList: false,
    },
    coils: {
      type: "number",
      default: 11,
      min: 3,
      max: 21,
      step: 1,
      description: "Coils",
      hiddenFromList: false,
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
