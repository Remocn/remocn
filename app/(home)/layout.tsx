import type { ReactNode } from "react";
import { PageShell } from "./components/page-shell";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </PageShell>
  );
}
