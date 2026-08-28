"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTrackEvent } from "@/lib/analytics";

const HERO_BADGE_HREF = "/changelog#2026-08-25-saas-typography";

export function HeroBadge() {
  const trackEvent = useTrackEvent();

  return (
    <Badge
      variant="secondary"
      className="group relative mb-5 h-7 gap-1.5 rounded-full px-3 text-xs before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']"
      render={
        <Link
          href={HERO_BADGE_HREF}
          onClick={() =>
            trackEvent("cta_clicked", {
              cta: "hero_saas_typography_badge",
              destination: HERO_BADGE_HREF,
            })
          }
        />
      }
    >
      <span className="font-semibold text-foreground">Introducing</span>
      <span aria-hidden className="text-muted-foreground/60">
        ·
      </span>
      <span className="text-foreground">SaaS Typography</span>
      <ArrowRight
        className="size-3 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Badge>
  );
}
