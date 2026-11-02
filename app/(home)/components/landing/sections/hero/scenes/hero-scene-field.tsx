"use client";

import type { ScenesConfig } from "./config";
import saved from "./hero-scenes.json";
import { DEFAULT_LIVE_CLIPS } from "./live-clips";
import { SceneField } from "./scene-field";
import { liveSet } from "./sets/live";

const config = saved as ScenesConfig;
const set = liveSet(config.live ?? DEFAULT_LIVE_CLIPS);

export function HeroSceneField() {
  return <SceneField config={config} set={set} />;
}
