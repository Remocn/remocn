import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { TIDEPOOL } from "./brand-frames";

type Tile = {
  background: string;
  text: string;
  accent: string;
  widths: [number, number];
  align?: string;
  ring?: boolean;
};

const ONE_LOOK: Tile[] = [
  { ...TIDEPOOL, widths: [56, 34], ring: true },
  { ...TIDEPOOL, widths: [44, 60], ring: true },
  { ...TIDEPOOL, widths: [64, 28], ring: true },
];

const THREE_LOOKS: Tile[] = [
  {
    background: "#141318",
    text: "#F4F2EC",
    accent: "#D4F25C",
    widths: [56, 34],
  },
  {
    background: "#FFE7D6",
    text: "#7A2E12",
    accent: "#E8590C",
    widths: [44, 60],
    align: "items-center",
  },
  {
    background: "#0F2A2A",
    text: "#DDF3EE",
    accent: "#3FD0B0",
    widths: [64, 28],
    align: "justify-end pb-3",
  },
];

/**
 * "Consistency compounds": three videos in one look next to three videos
 * in three looks. Children: the sentence (one markdown paragraph).
 */
export function GuideConsistency({ children }: { children: ReactNode }) {
  return (
    <figure
      className={cn(
        "not-prose mt-4 flex flex-col gap-3.5 rounded-card p-5",
        guideCard,
      )}
    >
      <figcaption className="text-ui leading-6 text-body [&_p]:m-0">
        {children}
      </figcaption>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Group tiles={ONE_LOOK} label="One look, a channel" strong />
        <Group tiles={THREE_LOOKS} label="Three looks, three experiments" />
      </div>
    </figure>
  );
}

function Group({
  tiles,
  label,
  strong,
}: {
  tiles: Tile[];
  label: string;
  strong?: boolean;
}) {
  return (
    <div className="flex min-w-0 grow basis-0 flex-col gap-2.5">
      <div aria-hidden="true" className="grid grid-cols-3 gap-2">
        {tiles.map((tile, index) => (
          <span
            key={index}
            className={cn(
              "flex h-[61px] flex-col justify-center gap-[5px] rounded-tile px-3",
              tile.align,
              tile.ring && "shadow-[0_0_0_1px_var(--color-hairline)]",
            )}
            style={{ backgroundColor: tile.background }}
          >
            <span
              className="h-[7px] max-w-full rounded-[4px]"
              style={{ width: tile.widths[0], backgroundColor: tile.text }}
            />
            <span
              className="h-[7px] max-w-full rounded-[4px]"
              style={{ width: tile.widths[1], backgroundColor: tile.accent }}
            />
          </span>
        ))}
      </div>
      <span
        className={cn(
          "text-small font-medium",
          strong ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
