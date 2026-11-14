import type { ReactNode } from "react";
import { GITHUB_URL, SUPPORT_EMAIL } from "@/config/site";

export const LAST_UPDATED = "November 14, 2026";

export type LegalItem = { title: ReactNode; body: ReactNode };

export type LegalSection = {
  id: string;
  title: string;
  /** Lead paragraph(s) under the section title. */
  body?: ReactNode;
  /** Bulleted facts, drawn as cards. */
  items?: LegalItem[];
  /** Name / description rows, drawn as a table card. */
  rows?: LegalItem[];
};

export type LegalPart = {
  id: string;
  title: string;
  sections: LegalSection[];
};

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-[2px] underline decoration-divider underline-offset-[3px] transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </a>
  );
}

export const Mail = () => (
  <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A>
);

export const LEGAL_INTRO = {
  lead: "How Remocn handles your data, and the terms that apply when you use the site or buy something.",
  body: (
    <>
      Remocn (&ldquo;we&rdquo;) operates{" "}
      <A href="https://remocn.dev">remocn.dev</A> — an open-source registry of
      video components for Remotion. If anything on this page is unclear, email
      us at <Mail />.
    </>
  ),
};

export const LEGAL_PARTS: LegalPart[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    sections: [
      {
        id: "what-we-collect",
        title: "What we collect",
        body: "The site has no accounts and no sign-up. You can browse the docs, copy components, and use everything on the site without giving us any personal data.",
        items: [
          {
            title: "Usage analytics.",
            body: (
              <>
                We use <A href="https://openpanel.dev">OpenPanel</A> to collect
                anonymous usage data: pages visited, referrer, browser and
                device type, and coarse location (country level). This tells us
                which components people actually use. When you use the docs
                search, we also record what you searched for, how many results
                came back and which one you opened, so we can tell whether the
                search finds what people look for. We do not use advertising
                trackers, we do not build cross-site profiles, and we never sell
                data.
              </>
            ),
          },
          {
            title: "Local preferences.",
            body: "Your theme choice (light or dark) is stored in your browser’s localStorage and never leaves your device.",
          },
          {
            title: "Server logs.",
            body: "Our hosting infrastructure keeps standard access logs (IP address, requested URL, timestamp) for security and operations. They are rotated automatically and not used for anything else.",
          },
        ],
      },
      {
        id: "payments",
        title: "Payments",
        body: (
          <>
            Paid products are sold through <A href="https://creem.io">Creem</A>,
            our merchant of record. Creem runs the checkout and handles payment
            processing, invoicing, and taxes. Your card details go directly to
            Creem and its payment processors — they never touch our servers.
            After a purchase we receive only what is needed to deliver it: your
            email address, the product, and the order details. How Creem handles
            your data is described in{" "}
            <A href="https://www.creem.io/privacy">Creem’s privacy policy</A>.
          </>
        ),
      },
      {
        id: "plugin",
        title: "The plugin and MCP server",
        body: (
          <>
            The Remocn plugin for Claude Code and Codex and the MCP server at{" "}
            <code>remocn.dev/mcp</code> need no account and collect no personal
            data.
          </>
        ),
        items: [
          {
            title: "MCP server.",
            body: "The server is stateless. It answers each request from the public component catalog and does not store or log what you send it: search queries, video briefs and component props are used to build the answer and then discarded. We do count tool calls, to see whether the search works: which tool ran, which client called it, how long a query was and which catalog components came back. Those counts hold none of the text you sent. The standard access logs described above apply, as for the rest of the site.",
          },
          {
            title: "Previews in chat.",
            body: (
              <>
                Component previews shown inside Claude or ChatGPT load pages
                from <code>remocn.dev/embed</code>. Those pages run no
                analytics, so the props in their address are not recorded.
              </>
            ),
          },
          {
            title: "The plugin.",
            body: "Its skills run on your machine, inside your agent. They read public documentation and registry files from remocn.dev and install packages from npm. Nothing about your project or your prompts is sent to us.",
          },
        ],
      },
      {
        id: "third-party-services",
        title: "Third-party services",
        rows: [
          {
            title: <A href="https://openpanel.dev">OpenPanel</A>,
            body: "Anonymous usage analytics.",
          },
          {
            title: <A href="https://creem.io">Creem</A>,
            body: "Checkout and payments, as merchant of record.",
          },
          {
            title: <A href={GITHUB_URL}>GitHub</A>,
            body: "Source code, issues, and sponsorships. Anything you do there is governed by GitHub’s own terms.",
          },
        ],
      },
      {
        id: "your-data",
        title: "Your data",
        body: (
          <>
            We keep order emails for as long as we need them to provide support
            and meet legal obligations. To ask what we hold about you, or to
            have it deleted, email <Mail /> and we will sort it out.
          </>
        ),
      },
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    sections: [
      {
        id: "free-components",
        title: "The site and free components",
        body: (
          <>
            The free components in the registry are released under the{" "}
            <A href={`${GITHUB_URL}/blob/main/LICENSE`}>MIT license</A>. You can
            copy them, modify them, and ship them in personal or commercial
            projects without attribution. The site and the components are
            provided &ldquo;as is&rdquo;, without warranty of any kind.
          </>
        ),
      },
      {
        id: "paid-products",
        title: "Paid products",
        body: "Some products are paid. Unless a product states otherwise at purchase, buying it grants you a non-exclusive license to use it in any number of your own projects, commercial ones included. What it does not grant is the right to redistribute or resell the product itself — for example republishing the components in another registry, template marketplace, or paid bundle.",
      },
      {
        id: "purchases-and-refunds",
        title: "Purchases and refunds",
        body: (
          <>
            Purchases are processed by Creem as merchant of record, so the sale
            itself is also subject to the terms Creem presents at checkout. If a
            product is broken or not as described, email <Mail /> within 14 days
            of purchase and we will fix it or refund you.
          </>
        ),
      },
      {
        id: "liability",
        title: "Liability",
        body: "To the maximum extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the site or its products, and our total liability is limited to the amount you paid us in the twelve months before the claim. Free products come with no liability at all — they are yours to own, audit, and modify.",
      },
      {
        id: "changes",
        title: "Changes",
        body: "We may update this page as the project evolves — for example when new products or services launch. The date at the top reflects the latest revision, and continued use of the site after a change means you accept it.",
      },
      {
        id: "contact",
        title: "Contact",
        body: (
          <>
            For anything related to privacy, purchases, or these terms: <Mail />
            .
          </>
        ),
      },
    ],
  },
];

/** Flat, numbered list of sections (01–11) for the index and the article. */
export const LEGAL_INDEX = LEGAL_PARTS.flatMap((part) => part.sections).map(
  (section, index) => ({
    id: section.id,
    title: section.title,
    number: String(index + 1).padStart(2, "0"),
  }),
);
