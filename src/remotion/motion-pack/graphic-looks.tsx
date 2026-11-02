import { Blueprint } from "@/registry/remocn/blueprint";
import { BrickMosaic } from "@/registry/remocn/brick-mosaic";
import { ComicPanels } from "@/registry/remocn/comic-panels";
import { DuotoneBeat } from "@/registry/remocn/duotone-beat";
import { LineBoil } from "@/registry/remocn/line-boil";
import { LongShadow } from "@/registry/remocn/long-shadow";
import { RisoPrint } from "@/registry/remocn/riso-print";
import { Synthwave } from "@/registry/remocn/synthwave";
import { XRayScan } from "@/registry/remocn/x-ray-scan";
import { DemoLogo, type DraftEntry, INK } from "./shared";

export const graphicLookDrafts: DraftEntry[] = [
  {
    id: "riso-print",
    component: () => <RisoPrint />,
    durationInFrames: 75,
  },
  {
    id: "line-boil",
    component: () => <LineBoil />,
    durationInFrames: 90,
  },
  {
    id: "blueprint",
    component: () => <Blueprint />,
    durationInFrames: 75,
  },
  {
    id: "duotone-beat",
    component: () => <DuotoneBeat />,
    durationInFrames: 120,
  },
  {
    id: "comic-panels",
    component: () => (
      <ComicPanels word="POW">
        <DemoLogo color={INK} />
      </ComicPanels>
    ),
    durationInFrames: 66,
  },
  {
    id: "long-shadow",
    component: () => <LongShadow />,
    durationInFrames: 70,
  },
  {
    id: "synthwave",
    component: () => <Synthwave />,
    durationInFrames: 120,
  },
  {
    id: "brick-mosaic",
    component: () => <BrickMosaic />,
    durationInFrames: 85,
  },
  {
    id: "x-ray-scan",
    component: () => <XRayScan />,
    durationInFrames: 65,
  },
];
