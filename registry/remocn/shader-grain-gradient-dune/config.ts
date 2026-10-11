import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientDunePreset } from ".";

export const shaderGrainGradientDuneConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientDunePreset,
  {
    slug: "shader-grain-gradient-dune",
    componentName: "ShaderGrainGradientDune",
  },
);
