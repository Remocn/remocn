"use client";

import { CatalogCard } from "../../../../ui/catalog-card";
import type { ClipSpec } from "../../tiles/config";
import { DEFAULT_LIVE_CLIPS } from "../live-clips";
import type { SceneDef, SceneSet } from "./types";

const LIGHT = /^#(f|e)/i;

function scene(spec: ClipSpec): SceneDef {
  return {
    block: spec.name,
    surface: "",
    dark: !LIGHT.test(spec.background),
    duration: 4,
    render: (_, active) => <CatalogCard spec={spec} active={active} />,
  };
}

const cache = new WeakMap<ClipSpec[][], SceneSet>();

export function liveSet(clips: ClipSpec[][]): SceneSet {
  let set = cache.get(clips);
  if (!set) {
    set = clips.map((slots) =>
      Object.fromEntries(slots.map((spec, i) => [i + 1, scene(spec)])),
    );
    cache.set(clips, set);
  }
  return set;
}

export const LIVE_SET = liveSet(DEFAULT_LIVE_CLIPS);
