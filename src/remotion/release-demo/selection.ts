import { z } from "zod";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { LAUNCH_PIECES, type LaunchPiece } from "./launch-pieces.generated";

/**
 * Which pieces play in the montage, editable from Remotion Studio: each
 * category and each piece in it has its own switch, and the film's length is
 * recalculated from what is switched on.
 */
export const releaseDemoSchema = z.object({
  /** How much faster than real time the pieces play. */
  speed: z.number().min(1).max(4).step(0.25),
  /** Share of each piece's own motion that plays on screen. */
  minShare: z.number().min(0.25).max(1).step(0.05),
  categories: z.array(
    z.object({
      title: z.string(),
      enabled: z.boolean(),
      pieces: z.array(
        z.object({
          name: z.string(),
          enabled: z.boolean(),
          /** Seconds on screen. Overrides `share` when set. */
          seconds: z.number().min(0.1).max(20).step(0.1).optional(),
          /** Share of the piece's own motion to play, instead of `minShare`. */
          share: z.number().min(0.1).max(1).step(0.05).optional(),
          /** Playback speed for this piece, instead of the film's `speed`. */
          speed: z.number().min(0.25).max(4).step(0.25).optional(),
        }),
      ),
    }),
  ),
});

export type ReleaseDemoProps = z.infer<typeof releaseDemoSchema>;

/** Montage order, and the gradient each category title is painted in. */
export const CATEGORY_LOOK: { title: string; preset: GshPresetId }[] = [
  { title: "Typography", preset: "petal-arc" },
  { title: "Numbers & Stats", preset: "comet" },
  { title: "UI Blocks", preset: "riptide" },
  { title: "Product Scenes", preset: "afterhours" },
  { title: "Transitions", preset: "petal-arc" },
  { title: "Motion Graphics", preset: "spectral-sea" },
  { title: "Graphic Looks", preset: "garnet" },
  { title: "Logo Stings", preset: "solar-wind" },
  { title: "Media & Collage", preset: "ember" },
  { title: "Social", preset: "solar-wind" },
  { title: "Effects", preset: "nova" },
  { title: "Camera & Physics", preset: "comet" },
];

const BY_NAME = new Map(LAUNCH_PIECES.map((p) => [p.name, p]));

export type Cut = {
  piece: LaunchPiece;
  /** Frames on screen. */
  frames: number;
  /** First frame of the piece's own timeline that shows. */
  cutIn: number;
  speed: number;
};

const FPS = 30;

export function cutsFor(
  category: ReleaseDemoProps["categories"][number],
  { speed, minShare }: Pick<ReleaseDemoProps, "speed" | "minShare">,
): Cut[] {
  if (!category.enabled) return [];
  return category.pieces.flatMap((entry) => {
    const piece = BY_NAME.get(entry.name);
    if (!entry.enabled || !piece) return [];
    const pieceSpeed = entry.speed ?? speed;
    const frames =
      entry.seconds !== undefined
        ? Math.round(entry.seconds * FPS)
        : Math.max(
            2,
            Math.ceil((piece.motion * (entry.share ?? minShare)) / pieceSpeed),
          );
    const shown = Math.min(piece.motion, frames * pieceSpeed);
    // Skip a little of the empty lead-in when only part of the motion plays.
    const cutIn = Math.round((piece.motion - shown) * 0.3);
    return [{ piece, cutIn, frames, speed: pieceSpeed }];
  });
}

export const enabledCategories = (props: ReleaseDemoProps) =>
  props.categories.filter((c) => c.enabled && c.pieces.some((p) => p.enabled));
