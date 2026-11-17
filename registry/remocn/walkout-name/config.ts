import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const walkoutNameConfig: ComponentConfig = {
  componentName: "WalkoutName",
  importPath: "@/components/remocn/walkout-name",
  lists: {
    name: {
      default: ["The", "Launch", "Kid"],
      description: "Name",
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
    nickname: {
      type: "text-content",
      default: "Ships before lunch",
      description: "Nickname",
    },
    record: {
      type: "text-content",
      default: "12–0",
      description: "Record",
    },
    finishes: {
      type: "text-content",
      default: "12 KO",
      description: "Finishes",
    },
    recordLabel: {
      type: "text-content",
      default: "Pro record",
      description: "Record label",
    },
    billing: {
      type: "text-content",
      default: "Main event · Tonight",
      description: "Billing",
    },
    bandWidth: {
      type: "number",
      default: 0.19,
      min: 0.05,
      max: 0.5,
      step: 0.01,
      description: "Band width",
      hiddenFromList: false,
    },
    impact: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      description: "Impact shake",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Oswald" }),
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
