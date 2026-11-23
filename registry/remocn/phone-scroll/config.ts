import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const phoneScrollConfig: ComponentConfig = {
  componentName: "PhoneScroll",
  importPath: "@/components/remocn/phone-scroll",
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
    label: {
      type: "text-content",
      default: "Find your next stay in two taps.",
      description: "Label",
    },
    labelAccent: {
      type: "text-content",
      default: "two taps.",
      description: "Label accent",
    },
    eyebrow: {
      type: "text-content",
      default: "remocn for iOS",
      description: "Eyebrow",
    },
    searchLabel: {
      type: "text-content",
      default: "Where to?",
      description: "Search field",
    },
    flickGap: {
      type: "number",
      default: 46,
      min: 20,
      max: 120,
      step: 1,
      description: "Flick gap (frames)",
      hiddenFromList: false,
    },
    motionBlur: {
      type: "boolean",
      default: true,
      description: "Motion blur",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
