import { describe, expect, test } from "bun:test";
import { clientAddress, clientKey } from "./client-key";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientAddress", () => {
  test("trusts only the entry the proxy appended", () => {
    expect(
      clientAddress(headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" })),
    ).toBe("1.2.3.4");
    expect(clientAddress(headers({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientAddress(headers({}))).toBeNull();
    expect(
      clientAddress(headers({ "x-forwarded-for": "1.2.3.4:5555" })),
    ).toBeNull();
    expect(
      clientAddress(headers({ "x-forwarded-for": "::ffff:1.2.3.4" })),
    ).toBe("1.2.3.4");
  });

  test("an IPv6 visitor is their /64", () => {
    const a = clientAddress(headers({ "x-forwarded-for": "2001:db8:1:2::1" }));
    const b = clientAddress(
      headers({ "x-forwarded-for": "2001:db8:1:2:ffff::9" }),
    );
    expect(a).toBe("2001:0db8:0001:0002::/64");
    expect(b).toBe(a);
  });
});

test("clientKey is stable and does not contain the address", () => {
  expect(clientKey("1.2.3.4")).toBe(clientKey("1.2.3.4"));
  expect(clientKey("1.2.3.4")).not.toContain("1.2.3.4");
  expect(clientKey("1.2.3.4")).not.toBe(clientKey("1.2.3.5"));
});
