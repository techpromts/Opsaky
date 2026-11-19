/** Return only a valid HTTP(S) origin, without paths or trailing slashes. */
function normalizeOrigin(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch { return ""; }
}

/** Browser origin always wins, including on previews and custom domains. */
export function getAppOrigin(): string {
  const browserOrigin = typeof window !== "undefined" ? normalizeOrigin(window.location.origin) : "";
  return browserOrigin || normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

export function pageUrl(slug: string, isDemo: boolean): string {
  const path = isDemo ? "/demo/preview/" : "/";
  return `${getAppOrigin()}${path}${encodeURIComponent(slug)}`;
}

export function displayUrl(slug: string, isDemo: boolean): string {
  return pageUrl(slug, isDemo).replace(/^https?:\/\//, "");
}

/** Resolve the host supplied by the hosting proxy for server-rendered metadata. */
export function originFromHeaders(headers: Pick<Headers, "get">): string {
  const host = (headers.get("x-forwarded-host") || headers.get("host"))?.split(",")[0]?.trim();
  const protocol = (headers.get("x-forwarded-proto") || "https").split(",")[0]?.trim();
  if (host && (protocol === "http" || protocol === "https")) {
    const origin = normalizeOrigin(`${protocol}://${host}`);
    // Reject malformed host values containing credentials, paths, or queries.
    if (origin && new URL(origin).host === host) return origin;
  }
  return getAppOrigin();
}
