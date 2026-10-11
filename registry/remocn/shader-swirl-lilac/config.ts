import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlLilacPreset } from ".";

export const shaderSwirlLilacConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlLilacPreset,
  {
    slug: "shader-swirl-lilac",
    componentName: "ShaderSwirlLilac",
  },
);
