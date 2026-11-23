import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const sheetFormulaConfig: ComponentConfig = {
  componentName: "SheetFormula",
  importPath: "@/components/remocn/sheet-formula",
  lists: {
    lines: {
      default: ["Type it once.", "Fill it down.", "Chart it in one click."],
      description: "Lines",
      min: 3,
      max: 3,
    },
  },
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
    formula: {
      type: "text-content",
      default: "=D2/C2",
      description: "Formula",
    },
    formulaHeader: {
      type: "text-content",
      default: "ARPU",
      description: "Formula header",
    },
    title: {
      type: "text-content",
      default: "Signups 2026",
      description: "Title",
    },
    chartTitle: {
      type: "text-content",
      default: "ARPU by month",
      description: "Chart title",
    },
    sheetName: {
      type: "text-content",
      default: "Signups",
      description: "Sheet tab",
    },
    valueFormat: {
      type: "enum",
      default: "currency",
      variants: {
        currency: {},
        percent: {},
        number: {},
      },
      description: "Value format",
    },
    charFrames: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      description: "Typing (frames per character)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
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
  durationInFrames: 290,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
