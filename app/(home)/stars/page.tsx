import type { Metadata } from "next";
import { StargazersDeprecatedNotice } from "./components/stargazers-deprecated-notice";

export const metadata: Metadata = {
  title: "GitHub Stars Video Generator",
  description:
    "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.",
  openGraph: {
    title: "GitHub Stars Video Generator · remocn",
    description:
      "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.",
  },
};

export default function StarsPage() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
      </div>

      <div className="section">
        <StargazersDeprecatedNotice />
      </div>
    </section>
  );
}
