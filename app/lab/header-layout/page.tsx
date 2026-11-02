import type { Metadata } from "next";
import { HeaderLayoutLab } from "./header-layout-lab";

export const metadata: Metadata = {
  title: "Header layout lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HeaderLayoutLab />;
}
