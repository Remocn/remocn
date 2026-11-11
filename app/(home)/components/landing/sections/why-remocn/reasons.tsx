import Link from "next/link";

type WhyReason = {
  title: string;
  body: string;
  /** Read-more link set after the body, inside the same paragraph. */
  link?: { href: string; label: string };
};

const WHY_REASONS: WhyReason[] = [
  {
    title: "No After Effects",
    body: "Nothing to install, nothing to learn. If you can describe it, you can make it.",
    link: {
      href: "/docs/guides/after-effects-alternatives-for-developers",
      label: "Compare After Effects alternatives",
    },
  },
  {
    title: "Not a screen recording",
    body: "A cursor wandering across your app isn’t a demo. This looks shipped on purpose.",
  },
  {
    title: "Yours to keep",
    body: "The code copies into your repo. MIT, no runtime, no account, nothing to cancel.",
  },
  {
    title: "Changes in seconds",
    body: "Say what feels wrong and watch it change. No revision round, no queue.",
  },
];

/** Four reasons under the comparison cards, each under a hairline rule. */
export function Reasons() {
  return (
    <ul
      data-reveal="stagger"
      className="grid w-full grid-cols-1 gap-[22px] pt-2 md:grid-cols-2 md:gap-x-10 md:gap-y-8 xl:grid-cols-4 xl:gap-10"
    >
      {WHY_REASONS.map((reason) => (
        <li
          key={reason.title}
          className="flex flex-col gap-1.5 border-t border-[#e3e5e6] pt-[18px] md:gap-2.5 md:pt-[22px] dark:border-divider"
        >
          <h3 className="text-[20px] leading-[26px] tracking-title text-foreground md:text-[22px] md:leading-7">
            {reason.title}
          </h3>
          <p className="text-[16px] leading-6 text-body-muted">
            {reason.body}
            {reason.link && (
              <>
                {" "}
                <Link
                  href={reason.link.href}
                  className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {reason.link.label}
                </Link>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
