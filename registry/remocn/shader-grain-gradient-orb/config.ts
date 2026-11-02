import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientOrbPreset } from ".";

export const shaderGrainGradientOrbConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientOrbPreset,
  {
    slug: "shader-grain-gradient-orb",
    componentName: "ShaderGrainGradientOrb",
  },
);
