import { irisWipe } from "@/registry/remocn/iris-wipe";
import { lightLeak } from "@/registry/remocn/light-leak";
import { paperTear } from "@/registry/remocn/paper-tear";
import { pixelSort } from "@/registry/remocn/pixel-sort";
import { venetianBlinds } from "@/registry/remocn/venetian-blinds";
import {
  type DraftEntry,
  TransitionDemo,
  transitionDemoDuration,
} from "./shared";

const IRIS = 36;
const BLINDS = 26;
const TEAR = 36;
const SORT = 30;
const LEAK = 20;

export const transitionDrafts: DraftEntry[] = [
  {
    id: "iris-wipe",
    component: () => (
      <TransitionDemo presentation={irisWipe()} transitionFrames={IRIS} />
    ),
    durationInFrames: transitionDemoDuration(IRIS),
  },
  {
    id: "venetian-blinds",
    component: () => (
      <TransitionDemo
        presentation={venetianBlinds()}
        transitionFrames={BLINDS}
      />
    ),
    durationInFrames: transitionDemoDuration(BLINDS),
  },
  {
    id: "paper-tear",
    component: () => (
      <TransitionDemo presentation={paperTear()} transitionFrames={TEAR} />
    ),
    durationInFrames: transitionDemoDuration(TEAR),
  },
  {
    id: "pixel-sort",
    component: () => (
      <TransitionDemo presentation={pixelSort()} transitionFrames={SORT} />
    ),
    durationInFrames: transitionDemoDuration(SORT),
  },
  {
    id: "light-leak",
    component: () => (
      <TransitionDemo presentation={lightLeak()} transitionFrames={LEAK} />
    ),
    durationInFrames: transitionDemoDuration(LEAK),
  },
];
