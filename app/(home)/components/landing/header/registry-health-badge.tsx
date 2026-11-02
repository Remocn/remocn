import { getRegistryHealth } from "@/lib/registry-health";
import { RegistryHealthButton } from "./registry-health";

/**
 * Server half of the header health button: fetches the remocn entry from the
 * shadcn directory (cached for an hour) and renders nothing when the data is
 * missing, stale or in an unknown score format.
 */
export async function RegistryHealthBadge() {
  const health = await getRegistryHealth();
  if (!health) return null;
  return <RegistryHealthButton health={health} />;
}
