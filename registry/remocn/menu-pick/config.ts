import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const menuPickConfig: ComponentConfig = {
  componentName: "MenuPick",
  importPath: "@/components/remocn/menu-pick",
  lists: {
    options: {
      default: [
        "Keyframe every beat",
        "Wait on an agency",
        "Install the scenes",
      ],
      description: "Options",
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
    prompt: {
      type: "text-content",
      default: "Choose your launch",
      description: "Prompt",
    },
    backLabel: {
      type: "text-content",
      default: "Back",
      description: "Back label",
    },
    selectLabel: {
      type: "text-content",
      default: "Select",
      description: "Select label",
    },
    pick: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Row stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: "#E60012", description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Rubik" }),
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
