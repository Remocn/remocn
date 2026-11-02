import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
