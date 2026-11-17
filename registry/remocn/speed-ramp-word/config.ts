import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const speedRampWordConfig: ComponentConfig = {
  componentName: "SpeedRampWord",
  importPath: "@/components/remocn/speed-ramp-word",
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
      default: "Everything changes in an instant.",
      description: "Text",
    },
    keyWord: {
      type: "text-content",
      default: "instant",
      description: "Key word",
    },
    hud: {
      type: "boolean",
      default: true,
      description: "Hud",
    },
    ghosts: {
      type: "boolean",
      default: true,
      description: "Ghosts",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
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
  durationInFrames: 121,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
