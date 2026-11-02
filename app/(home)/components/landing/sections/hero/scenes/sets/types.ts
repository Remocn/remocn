import type { ReactNode } from "react";

export type SceneProps = { cycle: number; speed: number };

export type SceneDef = {
  block: string;
  duration: number;
  surface: string;
  dark: boolean;
  /**
   * `active` is false while the scene is mounted ahead of time (hidden,
   * waiting for its turn): live scenes stay paused then.
   */
  render: (props: SceneProps, active: boolean) => ReactNode;
};

export type SceneSet = Record<number, SceneDef>[];
