import type { Metadata } from "next";
import { WhatsInside } from "@/app/(home)/components/landing/sections/whats-inside";
import { BentoLab } from "./bento-lab";

export const metadata: Metadata = {
  title: "What's inside lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <BentoLab>
      <WhatsInside />
    </BentoLab>
  );
}
