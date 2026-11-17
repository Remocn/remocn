import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const milestoneRollConfig: ComponentConfig = {
  componentName: "MilestoneRoll",
  importPath: "@/components/remocn/milestone-roll",
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
    unit: {
      type: "text-content",
      default: "renders",
      description: "Unit",
    },
    run: {
      type: "number",
      default: 15,
      min: 4,
      max: 40,
      step: 1,
      description: "Race (frames)",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Space Grotesk" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
