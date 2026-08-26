import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function ipv4Private(o: number[]): boolean {
  const [a, b] = o;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function ipv6Private(addr: string): boolean {
  const s = addr.toLowerCase();
  if (s === "::" || s === "::1") return true;
  if (s.startsWith("fc") || s.startsWith("fd")) return true;
  if (s.startsWith("fe8") || s.startsWith("fe9") || s.startsWith("fea") || s.startsWith("feb")) return true;
  if (s.startsWith("ff")) return true;
  if (s.startsWith("2001:db8")) return true;
  const mapped = /^::ffff:(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(s);
  if (mapped) {
    return ipv4Private(mapped.slice(1).map(Number));
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (/^localhost$/i.test(hostname)) throw new Error("localhost is not allowed");
  if (isIP(hostname)) {
    const v = isIP(hostname);
    const bad = v === 4 ? ipv4Private(hostname.split(".").map(Number)) : ipv6Private(hostname);
    if (bad) throw new Error("private/reserved IP is not allowed");
    return;
  }
  let addrs: { address: string }[];
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    throw new Error("cannot resolve host");
  }
  if (!addrs.length) throw new Error("cannot resolve host");
  for (const { address } of addrs) {
    const v = isIP(address);
    const bad =
      v === 4
        ? ipv4Private(address.split(".").map(Number))
        : v === 6
          ? ipv6Private(address)
          : true;
    if (bad) throw new Error("host resolves to private/reserved IP");
  }
}

export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("invalid URL");
  }
  if (u.protocol !== "https:") throw new Error("only https:// endpoints are allowed");
  await assertPublicHost(u.hostname);
  return u;
}
