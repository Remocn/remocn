import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlNeonPreset } from ".";

export const shaderSwirlNeonConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlNeonPreset,
  {
    slug: "shader-swirl-neon",
    componentName: "ShaderSwirlNeon",
  },
);
