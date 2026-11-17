import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const radarCompareConfig: ComponentConfig = {
  componentName: "RadarCompare",
  importPath: "@/components/remocn/radar-compare",
  lists: {
    axes: {
      default: ["Speed", "Quality", "Price", "Support", "Integrations", "Docs"],
      description: "Axes",
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
    brandLabel: {
      type: "text-content",
      default: "remocn",
      description: "Brand label",
    },
    competitorLabel: {
      type: "text-content",
      default: "Kitebase",
      description: "Competitor label",
    },
    stagger: {
      type: "number",
      default: 1.8,
      min: 0,
      max: 6,
      step: 0.2,
      description: "Vertex stagger",
      hiddenFromList: false,
    },
    rings: {
      type: "number",
      default: 4,
      min: 1,
      max: 8,
      step: 1,
      description: "Rings",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
