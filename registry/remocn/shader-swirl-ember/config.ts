import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlEmberPreset } from ".";

export const shaderSwirlEmberConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlEmberPreset,
  {
    slug: "shader-swirl-ember",
    componentName: "ShaderSwirlEmber",
  },
);
