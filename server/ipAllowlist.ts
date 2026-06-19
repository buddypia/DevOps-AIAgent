import type { NextFunction, Request, Response } from "express";
import net from "node:net";

const EXACT_ALLOWED_IPS = [
  "61.25.196.10",
  "61.25.196.14",
  "61.121.214.178",
  "101.110.14.66",
  "101.110.43.226",
  "101.110.43.229",
  "101.110.55.186",
  "101.110.55.188",
  "101.110.55.194",
  "101.110.55.196",
  "101.110.59.250",
  "101.110.59.252",
  "103.63.115.162",
  "106.161.27.98",
  "106.161.27.100",
  "111.87.41.97",
  "111.87.41.99",
  "111.87.41.100",
  "111.87.41.101",
  "111.87.41.102",
  "111.101.126.250",
  "111.101.126.252",
  "111.102.190.65",
  "111.102.190.67",
  "111.237.107.17",
  "111.238.38.121",
  "111.238.38.125",
  "111.238.66.254",
  "111.238.226.22",
  "113.36.198.162",
  "113.37.121.122",
  "113.38.99.42",
  "113.38.99.44",
  "113.40.34.218",
  "113.40.34.221",
  "113.43.231.98",
  "113.43.231.100",
  "113.149.254.129",
  "113.149.254.131",
  "118.69.226.239",
  "118.155.206.129",
  "118.155.249.1",
  "118.155.249.8",
  "118.155.249.9",
  "118.155.249.10",
  "118.155.249.20",
  "118.155.249.21",
  "118.155.249.22",
  "118.155.249.23",
  "118.155.249.26",
  "118.155.249.27",
  "118.155.249.33",
  "118.159.236.97",
  "118.159.236.100",
  "118.159.236.101",
  "118.159.236.105",
  "118.159.236.106",
  "122.209.195.114",
  "122.209.195.116",
  "122.214.4.82",
  "122.214.4.85",
  "122.219.5.11",
  "122.219.5.14",
  "124.35.82.10",
  "124.35.82.13",
  "124.37.38.34",
  "124.37.38.37",
  "125.102.242.114",
  "125.102.242.117",
  "125.103.80.246",
  "125.103.169.218",
  "180.233.141.16",
  "180.233.141.24",
  "180.233.141.25",
  "180.233.142.16",
  "180.233.142.17",
  "180.233.142.18",
  "180.233.142.19",
  "180.233.142.22",
  "180.233.142.23",
  "180.233.142.25",
  "180.233.142.26",
  "180.233.142.32",
  "180.233.142.33",
  "180.233.142.34",
  "180.233.142.35",
  "180.233.142.38",
  "180.233.142.39",
  "180.233.142.41",
  "180.233.142.42",
  "182.171.81.10",
  "182.171.81.13",
  "202.32.2.193",
  "202.32.2.196",
  "202.32.2.197",
  "202.32.2.201",
  "202.32.2.202",
  "202.221.186.129",
  "202.221.186.136",
  "202.221.186.137",
  "202.221.186.138",
  "202.221.186.148",
  "202.221.186.149",
  "202.221.186.150",
  "202.221.186.151",
  "202.221.186.154",
  "202.221.186.155",
  "202.221.186.161",
  "202.238.130.1",
  "202.238.130.3",
  "202.238.130.4",
  "202.238.130.5",
  "202.238.130.6",
  "203.216.204.126",
  "210.199.215.106",
  "210.199.215.108",
  "210.224.81.50",
  "210.224.81.52",
  "210.224.97.226",
  "210.224.97.228",
  "219.59.170.206",
  "219.113.181.157",
  "221.115.235.98",
  "221.115.235.101",
  "221.241.27.90",
  "221.241.27.92"
];

const RAKUTEN_MOBILE_CIDRS = [
  "27.121.128.0/17",
  "27.111.76.0/22",
  "61.114.160.0/22",
  "61.114.164.0/22",
  "61.114.168.0/21",
  "61.203.144.0/20",
  "61.213.224.0/19",
  "101.102.0.0/18",
  "103.1.140.0/22",
  "103.124.0.0/22",
  "110.165.128.0/17",
  "114.69.0.0/17",
  "119.30.192.0/18",
  "119.31.128.0/19",
  "119.31.136.0/21",
  "119.31.144.0/20",
  "119.63.144.0/20",
  "133.106.8.0/20",
  "133.106.24.0/20",
  "133.106.40.0/20",
  "133.106.56.0/20",
  "133.106.72.0/20",
  "133.106.88.0/20",
  "133.106.104.0/20",
  "133.106.112.0/20",
  "133.106.120.0/20",
  "133.106.136.0/20",
  "133.106.152.0/20",
  "133.106.168.0/20",
  "133.106.184.0/20",
  "133.106.200.0/20",
  "133.106.216.0/20",
  "133.106.232.0/20",
  "133.106.248.0/21",
  "134.180.0.0/16",
  "157.192.0.0/16",
  "193.82.160.0/19",
  "193.114.32.0/19",
  "193.114.64.0/19",
  "193.114.192.0/18",
  "193.115.0.0/19",
  "193.117.96.0/19",
  "193.118.0.0/19",
  "193.118.64.0/19",
  "193.119.128.0/17",
  "194.193.64.0/19",
  "194.193.224.0/19",
  "194.223.96.0/19",
  "202.176.16.0/20",
  "202.176.32.0/19",
  "202.216.0.0/20",
  "202.216.16.0/20",
  "203.216.0.0/17",
  "210.157.192.0/19",
  "211.7.96.0/19",
  "211.133.160.0/19",
  "218.251.128.0/17",
  "219.105.144.0/20",
  "219.105.160.0/19",
  "219.105.192.0/18",
  "219.106.0.0/17",
  "2400:5100::/32",
  "2400:5100::/48",
  "2403:d000::/32",
  "2403:d001::/32",
  "2405::/32",
  "240b:c000::/24",
  "2001:268:809:700::/56",
  "2001:268:809:800::/56"
];

const LOCAL_DEVELOPMENT_CIDRS = ["127.0.0.0/8", "::1/128"];

type ParsedCidr = {
  raw: string;
  family: 4 | 6;
  network: bigint;
  prefix: number;
};

type ParsedIp = {
  family: 4 | 6;
  value: bigint;
};

const ALLOWED_CIDRS = [...EXACT_ALLOWED_IPS.map((ip) => `${ip}/32`), ...LOCAL_DEVELOPMENT_CIDRS, ...RAKUTEN_MOBILE_CIDRS].map(parseCidr);

function normalizeIp(ip: string) {
  return ip.trim().replace(/^\[|\]$/g, "").replace(/^::ffff:/i, "");
}

function ipv4ToBigInt(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) throw new Error(`Invalid IPv4 address: ${ip}`);
  return parts.reduce((value, part) => {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) throw new Error(`Invalid IPv4 address: ${ip}`);
    return (value << 8n) + BigInt(octet);
  }, 0n);
}

function ipv6ToBigInt(ip: string) {
  const [head, tail] = ip.toLowerCase().split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0 || (ip.includes("::") ? false : headParts.length !== 8)) throw new Error(`Invalid IPv6 address: ${ip}`);
  const parts = [...headParts, ...Array.from({ length: missing }, () => "0"), ...tailParts];
  if (parts.length !== 8) throw new Error(`Invalid IPv6 address: ${ip}`);
  return parts.reduce((value, part) => {
    const hextet = Number.parseInt(part, 16);
    if (!Number.isInteger(hextet) || hextet < 0 || hextet > 0xffff) throw new Error(`Invalid IPv6 address: ${ip}`);
    return (value << 16n) + BigInt(hextet);
  }, 0n);
}

function ipToBigInt(ip: string): ParsedIp | undefined {
  const normalized = normalizeIp(ip);
  const family = net.isIP(normalized);
  if (family === 4) return { family: 4, value: ipv4ToBigInt(normalized) };
  if (family === 6) return { family: 6, value: ipv6ToBigInt(normalized) };
  return undefined;
}

function parseCidr(cidr: string): ParsedCidr {
  const [ip, prefixText] = cidr.split("/");
  const parsed = ipToBigInt(ip);
  if (!parsed) throw new Error(`Invalid CIDR address: ${cidr}`);
  const maxPrefix = parsed.family === 4 ? 32 : 128;
  const prefix = Number(prefixText ?? maxPrefix);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) throw new Error(`Invalid CIDR prefix: ${cidr}`);
  const hostBits = BigInt(maxPrefix - prefix);
  const mask = hostBits === BigInt(maxPrefix) ? 0n : ((1n << BigInt(maxPrefix)) - 1n) ^ ((1n << hostBits) - 1n);
  return {
    raw: cidr,
    family: parsed.family,
    network: parsed.value & mask,
    prefix
  };
}

function isIpInCidr(ip: string, cidr: ParsedCidr) {
  const parsed = ipToBigInt(ip);
  if (!parsed || parsed.family !== cidr.family) return false;
  const maxPrefix = cidr.family === 4 ? 32 : 128;
  const hostBits = BigInt(maxPrefix - cidr.prefix);
  const mask = hostBits === BigInt(maxPrefix) ? 0n : ((1n << BigInt(maxPrefix)) - 1n) ^ ((1n << hostBits) - 1n);
  return (parsed.value & mask) === cidr.network;
}

export function isAllowedClientIp(ip: string) {
  return ALLOWED_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
}

export function isIpAllowlistEnforced() {
  return process.env.IP_ALLOWLIST_MODE === "strict" || process.env.ENFORCE_IP_ALLOWLIST === "true";
}

export function getClientIp(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  return normalizeIp(candidate);
}

export function ipAllowlistMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isIpAllowlistEnforced()) {
    next();
    return;
  }

  const clientIp = getClientIp(req);
  if (clientIp && isAllowedClientIp(clientIp)) {
    next();
    return;
  }

  res.status(403).json({
    error: "forbidden",
    message: "Your IP address is not allowed."
  });
}

export const ipAllowlistSummary = {
  mode: isIpAllowlistEnforced() ? "strict" : "monitor",
  enforced: isIpAllowlistEnforced(),
  exactIpCount: EXACT_ALLOWED_IPS.length,
  localDevelopmentCidrCount: LOCAL_DEVELOPMENT_CIDRS.length,
  rakutenMobileCidrCount: RAKUTEN_MOBILE_CIDRS.length
};
