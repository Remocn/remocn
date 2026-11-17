import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const swipeDeckConfig: ComponentConfig = {
  componentName: "SwipeDeck",
  importPath: "@/components/remocn/swipe-deck",
  lists: {
    lines: {
      default: [
        "Swipe right on what fits.",
        "Skip the rest.",
        "Install the match.",
      ],
      description: "Lines",
      min: 3,
      max: 3,
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    matchWith: {
      type: "text-content",
      default: "remocn",
      description: "Match with",
    },
    initials: {
      type: "text-content",
      default: "MC",
      description: "Initials",
    },
    deckTitle: {
      type: "text-content",
      default: "Discover",
      description: "Deck title",
    },
    matchTitle: {
      type: "text-content",
      default: "It’s a match",
      description: "Match title",
    },
    ctaLabel: {
      type: "text-content",
      default: "Install",
      description: "Install button",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
