import { cn } from "@/lib/utils";
import { ArrowUpRightIcon } from "./docs-icons";

const HREF = "/llms-components.txt";

/** "for agents /llms-components.txt" at the foot of the sidebar. */
export function AgentsLink({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-caption text-muted-foreground">for agents</span>
      <a
        href={HREF}
        target="_blank"
        rel="noreferrer"
        className="flex h-[26px] items-center gap-1.5 rounded-tag bg-surface-muted px-2.5 font-mono text-mono text-body outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {HREF}
        <ArrowUpRightIcon className="size-3 text-muted-foreground" />
      </a>
    </div>
  );
}
