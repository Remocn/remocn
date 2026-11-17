import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const upCloseConfig: ComponentConfig = {
  componentName: "UpClose",
  importPath: "@/components/remocn/up-close",
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
    close: {
      type: "text-content",
      default: "Up close, it’s code.",
      description: "Close",
    },
    wide: {
      type: "text-content",
      default: "From here, it’s your launch.",
      description: "Wide",
    },
    readoutLabel: {
      type: "text-content",
      default: "Zoom",
      description: "Readout label",
    },
    zoom: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Zoom",
      hiddenFromList: false,
    },
    pullAt: {
      type: "number",
      default: 44,
      min: 10,
      max: 90,
      step: 1,
      description: "Pull back at (frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
