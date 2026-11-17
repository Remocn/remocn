import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const logoConstructConfig: ComponentConfig = {
  componentName: "LogoConstruct",
  importPath: "@/components/remocn/logo-construct",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    name: {
      type: "text-content",
      default: "emocn",
      description: "Name",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    grid: {
      type: "boolean",
      default: true,
      description: "Grid",
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
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
