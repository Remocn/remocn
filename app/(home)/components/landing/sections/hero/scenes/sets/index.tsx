"use client";

import { CLIP_DURATION, CLIP_SURFACE, ClipView } from "../clips";
import { SCENARIO_SCENES } from "../scenario-scenes";
import { EFFECTS_SET } from "./effects";
import { FRAMES_SET } from "./frames";
import { LIVE_SET } from "./live";
import { STORY_SET } from "./story";
import type { SceneSet } from "./types";

const LIGHT = new Set(["bg-white", "bg-[#F4F4F5]", "bg-[#FBE8FD]"]);

const CATALOG_SET: SceneSet = SCENARIO_SCENES.map((scenes) =>
  Object.fromEntries(
    Object.entries(scenes).map(([slot, entry]) => {
      const surface = CLIP_SURFACE[entry.clip.kind];
      return [
        slot,
        {
          block: entry.block,
          surface,
          dark: !LIGHT.has(surface.split(" ")[0]),
          duration: CLIP_DURATION[entry.clip.kind],
          render: (p) => <ClipView clip={entry.clip} {...p} />,
        },
      ];
    }),
  ),
);

export const SCENE_SETS = {
  live: LIVE_SET,
  catalog: CATALOG_SET,
  frames: FRAMES_SET,
  effects: EFFECTS_SET,
  story: STORY_SET,
} satisfies Record<string, SceneSet>;

export type SceneSetId = keyof typeof SCENE_SETS;

export const SCENE_SET_IDS = Object.keys(SCENE_SETS) as SceneSetId[];
