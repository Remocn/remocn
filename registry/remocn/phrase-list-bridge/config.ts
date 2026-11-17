import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const phraseListBridgeConfig: ComponentConfig = {
  componentName: "PhraseListBridge",
  importPath: "@/components/remocn/phrase-list-bridge",
  lists: {
    items: {
      default: [
        "Zoom Blur",
        "Typewriter",
        "Inline Highlight",
        "Rolling Number",
        "Echo Stack",
        "Orbit Lock",
      ],
      description: "Rows",
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
    left: {
      type: "text-content",
      default: "Browse through",
      description: "Left",
    },
    right: {
      type: "text-content",
      default: "ready-made scenes",
      description: "Right",
    },
    searchLabel: {
      type: "text-content",
      default: "Search scenes",
      description: "Search label",
    },
    pickedIndex: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Picked index",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
