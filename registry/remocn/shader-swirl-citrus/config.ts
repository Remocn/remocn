import { presetConfig } from "@/lib/shader-presets";
import { shaderSwirlConfig } from "../shader-swirl/config";
import { shaderSwirlCitrusPreset } from ".";

export const shaderSwirlCitrusConfig = presetConfig(
  shaderSwirlConfig,
  shaderSwirlCitrusPreset,
  {
    slug: "shader-swirl-citrus",
    componentName: "ShaderSwirlCitrus",
  },
);
