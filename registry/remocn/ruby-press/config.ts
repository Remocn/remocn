import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rubyPressConfig: ComponentConfig = {
  componentName: "RubyPress",
  importPath: "@/components/remocn/ruby-press",
  lists: {
    words: {
      default: ["a fortnight", "a morning", "one render"],
      description: "Words",
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
    before: {
      type: "text-content",
      default: "Subtitles for every market in",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: ".",
      description: "After",
    },
    hold: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Hold",
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
    press: {
      type: "number",
      default: 22,
      min: 6,
      max: 48,
      step: 1,
      description: "Press (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: "#E03C31", description: "Accent" },
    ...sceneControls({ font: "Zen Kaku Gothic New" }),
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
