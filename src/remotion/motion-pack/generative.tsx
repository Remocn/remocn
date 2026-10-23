import { FlowField } from "@/registry/remocn/flow-field";
import { IsometricBuild } from "@/registry/remocn/isometric-build";
import { LifeGrid } from "@/registry/remocn/life-grid";
import { PendulumWave } from "@/registry/remocn/pendulum-wave";
import { Phyllotaxis } from "@/registry/remocn/phyllotaxis";
import { StringArt } from "@/registry/remocn/string-art";
import { TopoLines } from "@/registry/remocn/topo-lines";
import type { DraftEntry } from "./shared";

export const generativeDrafts: DraftEntry[] = [
  { id: "pendulum-wave", component: PendulumWave, durationInFrames: 450 },
  { id: "flow-field", component: FlowField, durationInFrames: 300 },
  { id: "isometric-build", component: IsometricBuild, durationInFrames: 90 },
  { id: "life-grid", component: LifeGrid, durationInFrames: 300 },
  { id: "string-art", component: StringArt, durationInFrames: 340 },
  { id: "topo-lines", component: TopoLines, durationInFrames: 300 },
  { id: "phyllotaxis", component: Phyllotaxis, durationInFrames: 165 },
];
