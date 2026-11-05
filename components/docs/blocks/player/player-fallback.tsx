import { cn } from "@/lib/utils";

/**
 * Same footprint as the player shell while its config chunk loads: toolbar,
 * stage and transport. Only the customize panel below arrives later.
 */
export function PlayerFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-2 rounded-card border border-transparent bg-dark-surface p-2 dark:border-hairline dark:bg-surface",
        className,
      )}
    >
      <div className="h-[34px] max-md:h-11" />
      <div className="aspect-video w-full rounded-control-sm bg-black" />
      <div className="h-[52px] max-md:h-[72px]" />
    </div>
  );
}

/** Shown when MDX names something the registry or examples don't have. */
export function UnknownBlock({ kind, name }: { kind: string; name: string }) {
  return (
    <div className="not-prose mt-5 rounded-cta bg-surface-muted px-4 py-3.5 text-small text-body first:mt-0">
      Unknown {kind}: <code className="font-mono text-caption">{name}</code>
    </div>
  );
}
