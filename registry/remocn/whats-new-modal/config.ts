import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const whatsNewModalConfig: ComponentConfig = {
  componentName: "WhatsNewModal",
  importPath: "@/components/remocn/whats-new-modal",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    userName: {
      type: "text-content",
      default: "Maya Chen",
      description: "User name",
    },
    nextLabel: {
      type: "text-content",
      default: "Next",
      description: "Next label",
    },
    skipLabel: {
      type: "text-content",
      default: "Skip",
      description: "Skip label",
    },
    dwell: {
      type: "number",
      default: 66,
      min: 30,
      max: 120,
      step: 2,
      description: "Slide hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Figtree" }),
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
