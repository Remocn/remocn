import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientTidePreset } from ".";

export const shaderGrainGradientTideConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientTidePreset,
  {
    slug: "shader-grain-gradient-tide",
    componentName: "ShaderGrainGradientTide",
  },
);
