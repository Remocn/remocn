import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlTidePreset } from ".";

export const shaderSwirlTideConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlTidePreset,
  {
    slug: "shader-swirl-tide",
    componentName: "ShaderSwirlTide",
  },
);
