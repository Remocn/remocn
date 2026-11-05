import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the design-system scales from app/globals.css. Without
// this, `text-ui` / `text-h2` look like text colours and get merged away
// against `text-white`, and custom radii/tracking aren't deduped.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "micro",
        "mono",
        "caption",
        "small",
        "ui",
        "button-lg",
        "lead",
        "quote",
        "h3",
        "h2",
        "display",
      ],
      radius: [
        "tag",
        "tile",
        "control-sm",
        "control",
        "cta",
        "capsule",
        "card",
        "panel",
        "shell",
      ],
      tracking: ["display", "heading", "title"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
