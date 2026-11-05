import type { Metadata } from "next";
import { CreditsLab } from "./credits-lab";

export const metadata: Metadata = {
  title: "Inspired by lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CreditsLab />;
}
