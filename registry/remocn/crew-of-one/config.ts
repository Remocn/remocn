import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const crewOfOneConfig: ComponentConfig = {
  componentName: "CrewOfOne",
  importPath: "@/components/remocn/crew-of-one",
  lists: {
    roles: {
      default: [
        "Written by",
        "Directed by",
        "Edited by",
        "Motion by",
        "Captions by",
        "Shipped by",
      ],
      description: "Roles",
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
    name: {
      type: "text-content",
      default: "you",
      description: "Name",
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 100,
      max: 900,
      step: 100,
      description: "Role weight",
      hiddenFromList: false,
    },
    nameScale: {
      type: "number",
      default: 2.3,
      min: 1,
      max: 4,
      step: 0.1,
      description: "Name size",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
