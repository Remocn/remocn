import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const gotEmConfig: ComponentConfig = {
  componentName: "GotEm",
  importPath: "@/components/remocn/got-em",
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
    pending: {
      type: "text-content",
      default: "Entry submitted",
      description: "Pending",
    },
    title: {
      type: "text-content",
      default: "GOT ’EM",
      description: "Title",
    },
    subline: {
      type: "text-content",
      default: "You got remocn 2.0.",
      description: "Subline",
    },
    pause: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Pause (frames)",
      hiddenFromList: false,
    },
    rays: {
      type: "number",
      default: 40,
      min: 12,
      max: 72,
      step: 1,
      description: "Rays",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Unbounded" }),
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
