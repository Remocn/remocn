import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const embargoLiftConfig: ComponentConfig = {
  componentName: "EmbargoLift",
  importPath: "@/components/remocn/embargo-lift",
  lists: {
    lines: {
      default: ["remocn is [free],", "[open source]", "and [out today]."],
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
    slug: {
      type: "text-content",
      default: "Embargoed until 9:00 a.m.",
      description: "Slug",
    },
    liftedSlug: {
      type: "text-content",
      default: "Embargo lifted, 9:00 a.m.",
      description: "Lifted slug",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 14,
      min: 0,
      max: 30,
      step: 1,
      description: "Bar stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Big Shoulders" }),
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
