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
  length: z
    .union([
      z.int().positive(),
      z.literal("state-driven"),
      z.literal("sustained"),
      z.literal("transcript-driven"),
    ])
    .optional(),
  useWhen: z.array(z.string()).optional(),
  avoidWhen: z.array(z.string()).optional(),
  // How people ask for the component in their own words. Search-only: these
  // feed the lexical scorer and the semantic index, and are never rendered.
  askedAs: z.array(z.string()).optional(),
});
