import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlHypnoPreset } from ".";

export const shaderSwirlHypnoConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlHypnoPreset,
  {
    slug: "shader-swirl-hypno",
    componentName: "ShaderSwirlHypno",
  },
);
