import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pillMorphConfig: ComponentConfig = {
  componentName: "PillMorph",
  importPath: "@/components/remocn/pill-morph",
  lists: {
    features: {
      default: ["Transitions", "Captions", "Backgrounds"],
      description: "Features",
      min: 3,
      max: 3,
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
    name: {
      type: "text-content",
      default: "",
      description: "Name",
    },
    caption: {
      type: "text-content",
      default: "Launch day, in one take",
      description: "Caption",
    },
    radius: {
      type: "number",
      default: 28,
      min: 0,
      max: 60,
      step: 1,
      description: "Corner radius",
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
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
