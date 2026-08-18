export function isAmazonUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host === "amzn.to" ||
      host === "amzn.in" ||
      host === "amzn.com" ||
      /(^|\.)amazon\.[a-z.]+$/.test(host)
    );
  } catch {
    return false;
  }
}

export function isAmazonShortLink(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "amzn.to" || host === "amzn.in" || host === "amzn.com";
  } catch {
    return false;
  }
}

export function amazonUrlIncludesTag(value: string, tag: string): boolean {
  if (!tag.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    const params = url.searchParams;
    return [params.get("tag"), params.get("asc_tag"), params.get("AssociateTag")].includes(tag);
  } catch {
    return false;
  }
}

export function amazonTagWarning(
  affiliateUrl: string,
  source: string,
  associateTag: string | null,
): string {
  const url = affiliateUrl.trim();
  if (!url) {
    return "";
  }

  const amazon = source === "AMAZON" || isAmazonUrl(url);
  if (!amazon) {
    return "";
  }

  if (isAmazonShortLink(url)) {
    return "Short Amazon links cannot be checked for your tag. Prefer a full amazon.in URL with tag=.";
  }

  if (!isAmazonUrl(url)) {
    return "Source is Amazon, but this URL does not look like an Amazon link.";
  }

  if (!associateTag) {
    return "Add your Associates tracking ID in the URL (tag=yourid-21), or set AMAZON_ASSOCIATE_TAG on the API.";
  }

  if (!amazonUrlIncludesTag(url, associateTag)) {
    return `This Amazon URL does not include your tag (${associateTag}).`;
  }

  return "";
}
