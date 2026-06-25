import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dashboardPopulateConfig: ComponentConfig = {
  componentName: "DashboardPopulate",
  importPath: "@/components/remocn/dashboard-populate",
  controls: {
    accentColor: {
      type: "color",
      default: "#22c55e",
      label: "Accent color",
    },
    kpiTarget: {
      type: "number-input",
      default: 128400,
      min: 1000,
      max: 1000000,
      step: 100,
      label: "KPI target",
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#09090b" },
};
