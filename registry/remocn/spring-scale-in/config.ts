import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const springScaleInConfig: ComponentConfig = {
  componentName: "SpringScaleIn",
  importPath: "@/components/remocn/spring-scale-in",
  controls: {
    text: { type: "text", default: "Fast. Crisp. Fluid.", label: "Text" },
    staggerDelay: {
      type: "number",
      default: 3,
      min: 1,
      max: 12,
      step: 1,
      label: "Stagger",
    },
    scaleFrom: {
      type: "number",
      default: 0.7,
      min: 0.1,
      max: 1,
      step: 0.05,
      label: "Scale from",
    },
    fontSize: {
      type: "number",
      default: 72,
      min: 12,
      max: 160,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    fontWeight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
