import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const multiplayerCursorsConfig: ComponentConfig = {
  componentName: "MultiplayerCursors",
  importPath: "@/components/remocn/multiplayer-cursors",
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
    boardTitle: {
      type: "text-content",
      default: "Launch plan",
      description: "Board title",
    },
    headline: {
      type: "text-content",
      default: "Plan the launch together",
      description: "Headline",
    },
    stickyText: {
      type: "text-content",
      default: "Record the hero demo by Friday",
      description: "Sticky text",
    },
    commentText: {
      type: "text-content",
      default: "Love this. Ship it Friday.",
      description: "Comment text",
    },
    shareLabel: {
      type: "text-content",
      default: "Share",
      description: "Share button",
    },
    shapeLabel: {
      type: "text-content",
      default: "Launch day",
      description: "Shape label",
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
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
