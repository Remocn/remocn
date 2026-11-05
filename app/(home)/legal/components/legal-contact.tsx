import { SUPPORT_EMAIL } from "@/config/site";
import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";

/**
 * "If anything is unclear, email us": under the index on desktop, a card at
 * the end of the article below `xl`.
 */
export function LegalContact({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--hairline)] xl:rounded-none xl:bg-transparent xl:px-2 xl:py-0 xl:shadow-none",
        className,
      )}
    >
      <p className="text-[15px] leading-[22px] text-muted-foreground xl:text-small">
        If anything on this page is unclear, email us.
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className={cn(
          landingButtonVariants({ variant: "secondary" }),
          "h-11 rounded-control-sm px-4 text-[15px] leading-5 xl:h-10 xl:self-start xl:text-small",
        )}
      >
        {SUPPORT_EMAIL}
      </a>
    </div>
  );
}
