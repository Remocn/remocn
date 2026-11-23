import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ctaCollapseMarkConfig: ComponentConfig = {
  componentName: "CtaCollapseMark",
  importPath: "@/components/remocn/cta-collapse-mark",
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
    cta: {
      type: "text-content",
      default: "Ship your first launch film",
      description: "Cta",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Manrope" }),
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
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
