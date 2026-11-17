import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const frostedClearConfig: ComponentConfig = {
  componentName: "FrostedClear",
  importPath: "@/components/remocn/frosted-clear",
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
      default: "10×",
      description: "Title",
    },
    kicker: {
      type: "text-content",
      default: "Faster renders",
      description: "Kicker",
    },
    clear: {
      type: "number",
      default: 64,
      min: 16,
      max: 120,
      step: 2,
      description: "Clear (frames)",
      hiddenFromList: false,
    },
    blur: {
      type: "number",
      default: 30,
      min: 0,
      max: 80,
      step: 1,
      description: "Frost blur",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
