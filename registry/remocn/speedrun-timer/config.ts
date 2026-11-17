import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const speedrunTimerConfig: ComponentConfig = {
  componentName: "SpeedrunTimer",
  importPath: "@/components/remocn/speedrun-timer",
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
    category: {
      type: "text-content",
      default: "Launch video · Any%",
      description: "Category",
    },
    banner: {
      type: "text-content",
      default: "World record",
      description: "Banner",
    },
    pbLabel: {
      type: "text-content",
      default: "Personal best",
      description: "PB label",
    },
    radius: {
      type: "number",
      default: 18,
      min: 0,
      max: 40,
      step: 1,
      description: "Panel radius",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
