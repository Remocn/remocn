import { z } from "zod";

export const VIBES = [
  "clean",
  "premium",
  "tech",
  "data",
  "playful",
  "social",
  "paper",
] as const;

export type Vibe = (typeof VIBES)[number];

export const componentMetaSchema = z.object({
  component: z.string().optional(),
  vibe: z.enum(VIBES).optional(),
  length: z.union([z.int().positive(), z.literal("state-driven")]).optional(),
  useWhen: z.array(z.string()).optional(),
  avoidWhen: z.array(z.string()).optional(),
});
