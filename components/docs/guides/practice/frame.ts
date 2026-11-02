/**
 * Shared surfaces for the practice-guide illustrations.
 *
 * - `frameTile`: a tiny video frame. Always ink; in dark mode it keeps the
 *   ink fill and gains a divider ring so it reads against the card.
 * - `inkChip`: a solid "on" element (a highlighted chip, a filled bar).
 *   Ink in light, flips to the foreground colour in dark.
 */
export const frameTile =
  "bg-dark-surface dark:shadow-[0_0_0_1px_var(--color-divider)]";

export const inkChip = "bg-foreground text-background";
