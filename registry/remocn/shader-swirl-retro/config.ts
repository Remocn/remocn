import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlRetroPreset } from ".";

export const shaderSwirlRetroConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlRetroPreset,
  {
    slug: "shader-swirl-retro",
    componentName: "ShaderSwirlRetro",
  },
);
