import "server-only";

import { OpenPanel } from "@openpanel/sdk";

const CRAWLER_UA =
  /bot\b|bot[/_-]|crawler|crawling|spider|slurp|facebookexternalhit|feedfetcher|mediapartners/i;

let client: OpenPanel | null | undefined;

function openPanel(): OpenPanel | null {
  if (client !== undefined) return client;

  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
  const clientSecret = process.env.OPENPANEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    client = null;
    return client;
  }

  client = new OpenPanel({
    clientId,
    clientSecret,
    apiUrl: process.env.NEXT_PUBLIC_OPENPANEL_API_URL,
  });
  return client;
}

export function isCrawler(userAgent: string): boolean {
  return CRAWLER_UA.test(userAgent);
}

export async function trackRegistryInstall(
  component: string,
  userAgent: string,
): Promise<void> {
  if (isCrawler(userAgent)) return;

  try {
    await openPanel()?.track("registry_install", {
      component,
      user_agent: userAgent,
    });
  } catch {
    // A metrics outage must never surface to the caller — the payload already shipped.
  }
}
