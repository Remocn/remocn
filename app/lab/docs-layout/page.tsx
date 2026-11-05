import type { Metadata } from "next";
import { DocsLayoutLab } from "./docs-layout-lab";

export const metadata: Metadata = {
  title: "Docs layout lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DocsLayoutLab />;
}
