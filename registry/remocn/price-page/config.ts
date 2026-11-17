import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pricePageConfig: ComponentConfig = {
  componentName: "PricePage",
  importPath: "@/components/remocn/price-page",
  lists: {
    lines: {
      default: [
        "Starter, Pro, Team, Enterprise",
        "Per seat, per month",
        "Billed yearly, save 20%",
        "Watermark on the free plan",
        "Three exports a month",
        "Overage fees may apply",
        "Contact sales",
      ],
      description: "Lines",
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
    label: {
      type: "text-content",
      default: "Pricing",
      description: "Label",
    },
    price: {
      type: "text-content",
      default: "Free.",
      description: "Price",
    },
    note: {
      type: "text-content",
      default: "That’s the whole pricing page.",
      description: "Note",
    },
    hold: {
      type: "number",
      default: 40,
      min: 0,
      max: 120,
      step: 1,
      description: "Hold before cuts (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Albert Sans" }),
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
