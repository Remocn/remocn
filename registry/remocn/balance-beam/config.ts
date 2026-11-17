import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const balanceBeamConfig: ComponentConfig = {
  componentName: "BalanceBeam",
  importPath: "@/components/remocn/balance-beam",
  lists: {
    items: {
      default: [
        "$4,800",
        "62 hours",
        "3 tools",
        "9 revisions",
        "2 freelancers",
      ],
      description: "Items",
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
    accentLabel: {
      type: "text-content",
      default: "remocn",
      description: "Accent label",
    },
    title: {
      type: "text-content",
      default: "One block.",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Outweighs the whole stack.",
      description: "Subtitle",
    },
    stagger: {
      type: "number",
      default: 9,
      min: 0,
      max: 24,
      step: 1,
      description: "Block stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
