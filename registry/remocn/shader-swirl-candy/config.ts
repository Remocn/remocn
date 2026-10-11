import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlCandyPreset } from ".";

export const shaderSwirlCandyConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlCandyPreset,
  {
    slug: "shader-swirl-candy",
    componentName: "ShaderSwirlCandy",
  },
);
