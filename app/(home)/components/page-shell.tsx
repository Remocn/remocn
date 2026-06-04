import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell relative flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      {children}
    </div>
  );
}
