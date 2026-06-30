import { type ComponentConfig, FPS } from "@/lib/customizer-config";
import { FLOWITH_DURATION } from "./flowith-demo";

export const a1ProductDemoConfig: ComponentConfig = {
  componentName: "A1ProductDemo",
  importPath: "@/components/remocn/a1-product-demo",
  controls: {},
  durationInFrames: FLOWITH_DURATION,
  fps: FPS,
  compositionWidth: 1920,
  compositionHeight: 1080,
};
