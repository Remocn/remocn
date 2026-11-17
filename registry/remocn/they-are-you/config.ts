import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const theyAreYouConfig: ComponentConfig = {
  componentName: "TheyAreYou",
  importPath: "@/components/remocn/they-are-you",
  lists: {
    facts: {
      default: [
        "They write React for a living.",
        "They have a launch on Monday.",
        "They’ve never touched a timeline.",
      ],
      description: "Facts",
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
    from: {
      type: "text-content",
      default: "They",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "You",
      description: "To",
    },
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Flip stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Gabarito" }),
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
