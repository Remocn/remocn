import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientBlushPreset } from ".";

export const shaderGrainGradientBlushConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientBlushPreset,
  {
    slug: "shader-grain-gradient-blush",
    componentName: "ShaderGrainGradientBlush",
  },
);
