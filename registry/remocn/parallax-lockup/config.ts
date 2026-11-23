import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const parallaxLockupConfig: ComponentConfig = {
  componentName: "ParallaxLockup",
  importPath: "@/components/remocn/parallax-lockup",
  lists: {
    lines: {
      default: ["Every launch", "deserves", "a film"],
      description: "Lines",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    accentLine: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent line",
      hiddenFromList: false,
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
    lockAt: {
      type: "number",
      default: 94,
      min: 40,
      max: 130,
      step: 2,
      description: "Lock frame",
      hiddenFromList: false,
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
