const CODE_KEYS = ["code", "ean", "ean13", "gtin", "barcode"] as const;

const valueFromRecord = (value: unknown) => {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;

  for (const key of CODE_KEYS) {
    const candidate = record[key];
    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate).trim();
    }
  }

  return "";
};

export function productCodeFromScan(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      const code = valueFromRecord(JSON.parse(value));
      if (code) return code;
    } catch {
      // A plain product code may contain braces. In that case use it unchanged.
    }
  }

  try {
    const url = new URL(value);
    for (const key of CODE_KEYS) {
      const code = url.searchParams.get(key)?.trim();
      if (code) return code;
    }

    const digitalLinkCode = url.pathname.match(/(?:^|\/)01\/(\d{8,14})(?:\/|$)/)?.[1];
    if (digitalLinkCode) return digitalLinkCode;
  } catch {
    // The usual EAN/UPC value is not a URL.
  }

  const gs1Code = value.match(/\(01\)(\d{14})/)?.[1];
  return gs1Code ?? value;
}

export const normalizedProductCode = (value: string) => value.trim().toLocaleLowerCase("pl");
