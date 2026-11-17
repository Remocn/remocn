import { createHash } from "node:crypto";
import { isIP, isIPv6 } from "node:net";

/**
 * Who is asking, as a salted hash of their IP address: the guard counts
 * strikes and quotas by it without storing the address.
 *
 * The site sits behind one reverse proxy (Traefik in Coolify), which appends
 * the address it saw to `X-Forwarded-For`. Only that last entry is trusted;
 * anything before it came from the client and can be forged.
 *
 * An IPv6 visitor is known by their /64: a home or phone connection gets a
 * whole /64 and could otherwise step to a fresh address per request.
 */
export function clientAddress(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  const raw = last || headers.get("x-real-ip")?.trim() || "";
  // An IPv4 client seen over an IPv6 socket, as ::ffff:1.2.3.4.
  const address = raw.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
  if (!isIP(address)) return null;
  if (!isIPv6(address)) return address;
  const groups = expandIPv6(address).slice(0, 4);
  return `${groups.join(":")}::/64`;
}

function expandIPv6(address: string): string[] {
  const [head, tail = ""] = address.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const missing = address.includes("::") ? 8 - left.length - right.length : 0;
  return [...left, ...Array(missing).fill("0"), ...right].map((group) =>
    group.toLowerCase().padStart(4, "0"),
  );
}

/**
 * The hash the guard stores, or null in production without a salt: a hash
 * of an IPv4 address with a known salt can be reversed by trying them all.
 */
export function clientKey(address: string): string | null {
  const salt =
    process.env.DESCRIBE_IP_SALT ||
    (process.env.NODE_ENV === "production" ? null : "remocn-dev-salt");
  if (!salt) return null;
  return createHash("sha256")
    .update(`${salt}:${address}`)
    .digest("hex")
    .slice(0, 32);
}
