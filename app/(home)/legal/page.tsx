import type { Metadata } from "next";
import { GITHUB_URL, SUPPORT_EMAIL } from "@/config/site";

const DESCRIPTION =
  "How remocn handles your data, and the terms that apply to the site, the free components, and paid products.";

export const metadata: Metadata = {
  title: "Privacy & Terms",
  description: DESCRIPTION,
  alternates: { canonical: "/legal" },
  openGraph: {
    type: "website",
    url: "/legal",
    siteName: "Remocn",
    title: "Privacy & Terms · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 675,
        alt: "Privacy & Terms · remocn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy & Terms · remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
};

const LAST_UPDATED = "July 24, 2026";

export default function LegalPage() {
  return (
    <>
      <section className="pt-24 pb-10 sm:pt-28">
        <div className="section">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Privacy & Terms
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            How remocn handles your data, and the terms that apply when you use
            the site or buy something. Last updated {LAST_UPDATED}.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="section">
          <div className="typeset typeset-docs max-w-3xl">
            <p>
              remocn (&ldquo;we&rdquo;) operates{" "}
              <a href="https://remocn.dev">remocn.dev</a> — an open-source
              registry of video components for Remotion. If anything on this
              page is unclear, email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>

            <h2 id="privacy">Privacy Policy</h2>

            <h3>What we collect</h3>
            <p>
              The site has no accounts and no sign-up. You can browse the docs,
              copy components, and use everything on the site without giving us
              any personal data.
            </p>
            <ul>
              <li>
                <strong>Usage analytics.</strong> We use{" "}
                <a href="https://openpanel.dev">OpenPanel</a> to collect
                anonymous usage data: pages visited, referrer, browser and
                device type, and coarse location (country level). This tells us
                which components people actually use. We do not use advertising
                trackers, we do not build cross-site profiles, and we never sell
                data.
              </li>
              <li>
                <strong>Local preferences.</strong> Your theme choice (light or
                dark) is stored in your browser&apos;s localStorage and never
                leaves your device.
              </li>
              <li>
                <strong>Server logs.</strong> Our hosting infrastructure keeps
                standard access logs (IP address, requested URL, timestamp) for
                security and operations. They are rotated automatically and not
                used for anything else.
              </li>
            </ul>

            <h3>Payments</h3>
            <p>
              Paid products are sold through{" "}
              <a href="https://creem.io">Creem</a>, our merchant of record.
              Creem runs the checkout and handles payment processing, invoicing,
              and taxes. Your card details go directly to Creem and its payment
              processors — they never touch our servers. After a purchase we
              receive only what is needed to deliver it: your email address, the
              product, and the order details. How Creem handles your data is
              described in{" "}
              <a href="https://www.creem.io/privacy">
                Creem&apos;s privacy policy
              </a>
              .
            </p>

            <h3>Third-party services</h3>
            <ul>
              <li>
                <a href="https://openpanel.dev">OpenPanel</a> — anonymous usage
                analytics.
              </li>
              <li>
                <a href="https://creem.io">Creem</a> — checkout and payments, as
                merchant of record.
              </li>
              <li>
                <a href={GITHUB_URL}>GitHub</a> — source code, issues, and
                sponsorships. Anything you do there is governed by GitHub&apos;s
                own terms.
              </li>
            </ul>

            <h3>Your data</h3>
            <p>
              We keep order emails for as long as we need them to provide
              support and meet legal obligations. To ask what we hold about you,
              or to have it deleted, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we
              will sort it out.
            </p>

            <h2 id="terms">Terms of Service</h2>

            <h3>The site and free components</h3>
            <p>
              The free components in the registry are released under the{" "}
              <a href={`${GITHUB_URL}/blob/main/LICENSE`}>MIT license</a>. You
              can copy them, modify them, and ship them in personal or
              commercial projects without attribution. The site and the
              components are provided &ldquo;as is&rdquo;, without warranty of
              any kind.
            </p>

            <h3>Paid products</h3>
            <p>
              Some products are paid. Unless a product states otherwise at
              purchase, buying it grants you a non-exclusive license to use it
              in any number of your own projects, commercial ones included. What
              it does not grant is the right to redistribute or resell the
              product itself — for example republishing the components in
              another registry, template marketplace, or paid bundle.
            </p>

            <h3>Purchases and refunds</h3>
            <p>
              Purchases are processed by Creem as merchant of record, so the
              sale itself is also subject to the terms Creem presents at
              checkout. If a product is broken or not as described, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within 14
              days of purchase and we will fix it or refund you.
            </p>

            <h3>Liability</h3>
            <p>
              To the maximum extent permitted by law, we are not liable for
              indirect or consequential damages arising from your use of the
              site or its products, and our total liability is limited to the
              amount you paid us in the twelve months before the claim. Free
              products come with no liability at all — they are yours to own,
              audit, and modify.
            </p>

            <h3>Changes</h3>
            <p>
              We may update this page as the project evolves — for example when
              new products or services launch. The date at the top reflects the
              latest revision, and continued use of the site after a change
              means you accept it.
            </p>

            <h3>Contact</h3>
            <p>
              For anything related to privacy, purchases, or these terms:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
