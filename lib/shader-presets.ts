import type { InteractivitySchema } from "remotion";
import type { ComponentConfig } from "@/lib/customizer-config";
import remocnRegistry from "@/registry/remocn/registry.json";

/**
 * Shader presets are standalone registry items (`shader-warp-silk`, …) that
 * wrap a base shader with a fixed look. They carry `meta.presetOf` in
 * registry.json, which the base page's preset gallery and its markdown export
 * read from. Each preset also has its own docs page next to its base shader's
 * page: `content/docs/shaders/components/<shader>/<preset>.mdx`.
 */

export interface ShaderPresetItem {
  name: string;
  /** The preset's own name, without the base prefix: `silk`, `deep-sea`. */
  label: string;
  /** Docs page of the preset: `/docs/shaders/components/shader-warp/silk`. */
  href: string;
  title: string;
  description: string;
}

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  meta?: { presetOf?: string };
}

/** Preset items of a base shader, in registry order. */
export function presetsOf(base: string): ShaderPresetItem[] {
  return (remocnRegistry.items as RegistryItem[])
    .filter((item) => item.meta?.presetOf === base)
    .map((item) => ({
      name: item.name,
      label: item.name.slice(base.length + 1),
      href: `/docs/shaders/components/${base}/${item.name.slice(base.length + 1)}`,
      title: item.title ?? item.name,
      description: item.description ?? "",
    }));
}

/**
 * Derives a preset's customizer config from its base shader's config: same
 * controls, but each one starts at the preset's value so the docs preview
 * opens on the preset's look. `speed` is left alone — preset components treat
 * it as a multiplier on the preset's own speed, so its default stays 1.
 */
export function presetConfig(
  base: ComponentConfig,
  preset: Record<string, unknown>,
  { slug, componentName }: { slug: string; componentName: string },
): ComponentConfig {
  const controls: InteractivitySchema = {};
  for (const [key, field] of Object.entries(base.controls)) {
    const value = preset[key];
    if (key === "speed" || value === undefined) {
      controls[key] = field;
    } else if (field.type === "number" && typeof value === "number") {
      controls[key] = {
        ...field,
        default: value,
        min: Math.min(field.min ?? value, value),
        max: field.max === undefined ? undefined : Math.max(field.max, value),
      };
    } else {
      controls[key] = { ...field, default: value } as typeof field;
    }
  }
  return {
    ...base,
    controls,
    componentName,
    importPath: `@/components/remocn/${slug}`,
  };
}
