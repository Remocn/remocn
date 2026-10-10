import type { Metadata } from "next";
import { HeaderLab } from "./header-lab";

export const metadata: Metadata = {
  title: "Header lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HeaderLab />;
}
