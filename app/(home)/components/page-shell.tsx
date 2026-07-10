import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell relative flex min-h-screen flex-col font-sans text-foreground antialiased">
      {children}
    </div>
  );
}
