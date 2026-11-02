import { cn } from "@/lib/utils";

/** Solid play triangle in ink, for the white play keys on dark stages. */
export function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 10"
      aria-hidden="true"
      className={cn("h-2.5 w-2 shrink-0 fill-[#0e1012]", className)}
    >
      <path d="M0 0 8 5 0 10Z" />
    </svg>
  );
}

export function PauseGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 10"
      aria-hidden="true"
      className={cn("h-2.5 w-2 shrink-0 fill-[#0e1012]", className)}
    >
      <path d="M0 0h2.6v10H0zM5.4 0H8v10H5.4z" />
    </svg>
  );
}
