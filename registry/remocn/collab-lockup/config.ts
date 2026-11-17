import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const collabLockupConfig: ComponentConfig = {
  componentName: "CollabLockup",
  importPath: "@/components/remocn/collab-lockup",
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
    left: {
      type: "text-content",
      default: "remocn",
      description: "Left name",
    },
    right: {
      type: "text-content",
      default: "Kitebase",
      description: "Right name",
    },
    caption: {
      type: "text-content",
      default: "Launch videos, rendered from every Kitebase workspace.",
      description: "Caption",
    },
    joiner: {
      type: "enum",
      default: "×",
      variants: {
        "×": {},
        "&": {},
      },
      description: "Joiner",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    trail: {
      type: "boolean",
      default: true,
      description: "Motion trail",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
