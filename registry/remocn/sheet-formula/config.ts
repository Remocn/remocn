import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const sheetFormulaConfig: ComponentConfig = {
  componentName: "SheetFormula",
  importPath: "@/components/remocn/sheet-formula",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
