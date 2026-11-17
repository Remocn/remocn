import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const spineTurnConfig: ComponentConfig = {
  componentName: "SpineTurn",
  importPath: "@/components/remocn/spine-turn",
  lists: {
    titles: {
      default: ["Kickoff", "Deep dive", "Wrap-up"],
      description: "Titles",
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
    hold: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    turn: {
      type: "number",
      default: 26,
      min: 6,
      max: 60,
      step: 1,
      description: "Turn (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "IBM Plex Sans", ink: false }),
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
