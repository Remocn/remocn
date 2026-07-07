import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LAVENDER, MINT, PEACH } from "@/config/site";
import { FadeUp } from "../../../components/fade-up";

const OPENPANEL_DASHBOARD_URL = "https://op.kapish.dev/share/overview/hRpldJ";

function OpenPanelLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 61 35"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="34.0269"
        y="0.368164"
        width="10.3474"
        height="34.2258"
        rx="5.17372"
      />
      <rect
        x="49.9458"
        y="0.368164"
        width="10.3474"
        height="17.5109"
        rx="5.17372"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.212 0C6.36293 0 0 6.36293 0 14.212V20.02C0 27.8691 6.36293 34.232 14.212 34.232C22.0611 34.232 28.424 27.8691 28.424 20.02V14.212C28.424 6.36293 22.0611 0 14.212 0ZM14.2379 8.35999C11.3805 8.35999 9.06419 10.6763 9.06419 13.5337V20.6971C9.06419 23.5545 11.3805 25.8708 14.2379 25.8708C17.0953 25.8708 19.4116 23.5545 19.4116 20.6971V13.5337C19.4116 10.6763 17.0953 8.35999 14.2379 8.35999Z"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-4 sm:pt-28 sm:pb-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-40"
        style={{
          background: `radial-gradient(60% 50% at 50% 20%, ${LAVENDER}22, transparent 70%), radial-gradient(40% 40% at 20% 80%, ${PEACH}18, transparent 60%), radial-gradient(40% 40% at 80% 20%, ${MINT}18, transparent 60%)`,
        }}
      />
      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.06}>
            <p className="mb-3 font-mono text-xs font-medium text-muted-foreground">
              Sponsors
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Support the future of video
            </h1>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              remocn is open-source and free. Your sponsorship helps us spend
              more time building premium animations and keeping the project
              alive.
            </p>
          </FadeUp>
          <FadeUp delay={0.22}>
            <Button
              variant="outline"
              size="lg"
              className="mt-8 h-11 gap-2 rounded-full px-5 text-sm"
              render={
                <Link
                  href={OPENPANEL_DASHBOARD_URL}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <OpenPanelLogo className="h-4 w-auto" />
              See our live traffic
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
