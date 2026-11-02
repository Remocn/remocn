import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlSunburstPreset } from ".";

export const shaderSwirlSunburstConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlSunburstPreset,
  {
    slug: "shader-swirl-sunburst",
    componentName: "ShaderSwirlSunburst",
  },
);
