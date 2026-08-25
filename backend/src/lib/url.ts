const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) {
    return true;
  }
  if (/^(10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (host === "::" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }
  return false;
}

export function hostMatchesAllowlist(hostname: string, allowlist: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowlist.some((entry) => {
    const allowed = entry.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!allowed) {
      return false;
    }
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

export function isAllowedMerchantUrl(value: string, allowlist: string[]): boolean {
  if (!isSafeHttpUrl(value)) {
    return false;
  }
  const hostname = hostnameOf(value);
  if (!hostname || isPrivateHostname(hostname)) {
    return false;
  }
  if (allowlist.length === 0) {
    return true;
  }
  return hostMatchesAllowlist(hostname, allowlist);
}

export function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, max);
}
