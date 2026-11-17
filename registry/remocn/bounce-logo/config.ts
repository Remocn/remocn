import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bounceLogoConfig: ComponentConfig = {
  componentName: "BounceLogo",
  importPath: "@/components/remocn/bounce-logo",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    line: {
      type: "text-content",
      default: "Hit the corner.",
      description: "Line",
    },
    cornerAt: {
      type: "number",
      default: 112,
      min: 40,
      max: 140,
      step: 1,
      description: "Corner hit (frame)",
      hiddenFromList: false,
    },
    flip: {
      type: "boolean",
      default: true,
      description: "Flip color on hits",
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
  durationInFrames: 168,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
