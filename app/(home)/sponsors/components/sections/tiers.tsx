"use client";

import { ArrowRight, Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SPRING_BOUNCE, SPRING_SOFT } from "@/config/site";
import { type BillingMode, type Tier, tiers } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { SpotlightSurface } from "@/components/spotlight-surface";
import { FadeUp } from "../../../components/fade-up";

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingMode;
  onChange: (v: BillingMode) => void;
}) {
  const options: { id: BillingMode; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "one-time", label: "One-time" },
  ];

  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Button
            key={opt.id}
            variant="ghost"
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none",
              active
                ? "text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.div
                layoutId="billing-thumb"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={SPRING_SOFT}
              />
            )}
            <span className="relative">{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function TierCard({
  tier,
  billingMode,
}: {
  tier: Tier;
  billingMode: BillingMode;
}) {
  const checkoutUrl =
    billingMode === "monthly" ? tier.monthlyUrl : tier.oneTimeUrl;
  const priceSuffix = billingMode === "monthly" ? "/mo" : "one-time";

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={SPRING_BOUNCE}
      className={cn(
        "surface-card group relative flex h-full flex-col overflow-hidden rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30",
        tier.highlighted && "ring-1 ring-foreground/15",
      )}
    >
      {/* Spotlight overlay (driven by parent --mx/--my) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(500px circle at var(--mx) var(--my), ${tier.glow}1A, transparent 40%)`,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-muted-foreground">
            {tier.tagline}
          </span>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {tier.name}
          </h3>
        </div>
        {tier.highlighted && <Badge variant="secondary">Most popular</Badge>}
      </div>

      <div className="relative mt-6 flex items-baseline gap-2 overflow-hidden">
        <motion.div
          key={billingMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="flex items-baseline gap-2"
        >
          <span className="text-5xl font-semibold tracking-tight text-foreground">
            ${tier.price}
          </span>
          <span className="text-sm text-muted-foreground">{priceSuffix}</span>
        </motion.div>
      </div>

      <Separator className="relative my-6 bg-border" />

      <ul className="relative flex flex-col gap-3">
        {tier.perks.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-3 text-sm text-muted-foreground"
          >
            <Check
              className="mt-[3px] size-3.5 shrink-0"
              style={{ color: tier.glow }}
              aria-hidden="true"
            />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-8 pt-2">
        <Button
          variant={tier.highlighted ? "default" : "outline"}
          size="lg"
          className="h-11 w-full gap-2 rounded-full"
          render={<Link href={checkoutUrl} target="_blank" rel="noreferrer" />}
        >
          Become a {tier.name}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </motion.article>
  );
}

export function Tiers() {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");

  return (
    <section id="tiers" className="relative py-20 sm:py-24">
      <div className="section">
        <FadeUp>
          <div className="mb-10 flex justify-center">
            <BillingToggle value={billingMode} onChange={setBillingMode} />
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <SpotlightSurface className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier, i) => (
              <FadeUp key={tier.id} delay={i * 0.08}>
                <TierCard tier={tier} billingMode={billingMode} />
              </FadeUp>
            ))}
          </SpotlightSurface>
        </FadeUp>
      </div>
    </section>
  );
}
