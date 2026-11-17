import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bracketWinConfig: ComponentConfig = {
  componentName: "BracketWin",
  importPath: "@/components/remocn/bracket-win",
  lists: {
    opponents: {
      default: [
        "Keyframes",
        "Stock clips",
        "Agency",
        "Screen rec",
        "Slide decks",
        "Templates",
        "Freelance",
      ],
      description: "Opponents",
      min: 7,
      max: 7,
    },
    rounds: {
      default: ["Quarterfinal", "Semifinal", "Grand final"],
      description: "Rounds",
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
    title: {
      type: "text-content",
      default: "Champion",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "Playoffs 2026 · 8 teams · 0 maps dropped",
      description: "Caption",
    },
    roundLength: {
      type: "number",
      default: 20,
      min: 12,
      max: 40,
      step: 1,
      description: "Round length (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Tektur" }),
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
