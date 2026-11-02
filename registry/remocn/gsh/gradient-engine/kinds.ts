import type { GradientKindDefinition } from "./kind";
import { aurora } from "./shaders/aurora";
import { beam } from "./shaders/beam";
import { chrome } from "./shaders/chrome";
import { ditherBurst } from "./shaders/dither-burst";
import { ditherField } from "./shaders/dither-field";
import { fluted } from "./shaders/fluted";
import { grain } from "./shaders/grain";
import { halo } from "./shaders/halo";
import { horizon } from "./shaders/horizon";
import { limb } from "./shaders/limb";
import { linearFlow } from "./shaders/linear-flow";
import { mesh } from "./shaders/mesh";
import { mist } from "./shaders/mist";
import { pixelGlass } from "./shaders/pixel-glass";
import { radialGlow } from "./shaders/radial-glow";
import { ribbon } from "./shaders/ribbon";
import { rise } from "./shaders/rise";
import { silk } from "./shaders/silk";
import { smear } from "./shaders/smear";
import { spectrum } from "./shaders/spectrum";
import { swirl } from "./shaders/swirl";
import { voidKind } from "./shaders/void";
import { waves } from "./shaders/waves";
import type { GradientKind, GradientParams } from "./types";

export type { GradientKindDefinition } from "./kind";

const registry = new Map<string, GradientKindDefinition>();

/** Adds a kind. Re-registering a name replaces it. */
export function registerKind(definition: GradientKindDefinition): void {
  registry.set(definition.name, definition);
}

for (const definition of [
  mesh,
  grain,
  aurora,
  waves,
  radialGlow,
  linearFlow,
  horizon,
  ditherField,
  halo,
  beam,
  voidKind,
  limb,
  ditherBurst,
  pixelGlass,
  fluted,
  spectrum,
  silk,
  ribbon,
  chrome,
  rise,
  mist,
  smear,
  swirl,
]) {
  registerKind(definition);
}

/** The kind's definition, or mesh when the name is unknown. */
export function getKind(kind: GradientKind): GradientKindDefinition {
  return registry.get(kind) ?? mesh;
}

export function listKinds(): GradientKindDefinition[] {
  return [...registry.values()];
}

/** Full params tuned for a kind. */
export function kindDefaults(kind: GradientKind): GradientParams {
  const definition = getKind(kind);
  return { ...definition.defaults, kind: definition.name };
}
