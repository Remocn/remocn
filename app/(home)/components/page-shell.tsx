import type { ReactNode } from "react";
import { DOCS_LAYOUT, docsLayoutVars } from "@/lib/docs-layout";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      style={docsLayoutVars(DOCS_LAYOUT)}
      className={cn(
        "page-shell relative flex min-h-screen flex-col font-sans text-foreground antialiased",
        className,
      )}
    >
      {children}
    </div>
  );
}
