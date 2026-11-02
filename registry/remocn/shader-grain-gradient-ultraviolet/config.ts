import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientUltravioletPreset } from ".";

export const shaderGrainGradientUltravioletConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientUltravioletPreset,
  {
    slug: "shader-grain-gradient-ultraviolet",
    componentName: "ShaderGrainGradientUltraviolet",
  },
);
