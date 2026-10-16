/**
 * Standardizes and canonicalizes size names across the Storefront.
 * Normalizes full-word names (e.g. "SMALL" -> "S", "MEDIUM" -> "M", "XXXL" -> "3XL")
 * and handles "Free Size" / "One Size".
 */
export const canonicalizeSizeName = (name: string): string => {
  if (!name) return "";
  const trimmed = String(name).trim();
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase().replace(/\s+/g, " ");

  const aliasMap: Record<string, string> = {
    S: "S",
    SMALL: "S",
    M: "M",
    MED: "M",
    MEDIUM: "M",
    L: "L",
    LRG: "L",
    LARGE: "L",
    XL: "XL",
    XLARGE: "XL",
    "X-LARGE": "XL",
    "EXTRA LARGE": "XL",
    "EXTRA-LARGE": "XL",
    "2XL": "2XL",
    XXL: "2XL",
    "2-XL": "2XL",
    "XX-LARGE": "2XL",
    "3XL": "3XL",
    XXXL: "3XL",
    "3-XL": "3XL",
    "XXX-LARGE": "3XL",
    "4XL": "4XL",
    XXXXL: "4XL",
    "4-XL": "4XL",
    "XXXX-LARGE": "4XL",
    "5XL": "5XL",
    XXXXXL: "5XL",
    "5-XL": "5XL",
    "6XL": "6XL",
    XXXXXXL: "6XL",
    "6-XL": "6XL",
    "FREE SIZE": "Free Size",
    FREESIZE: "Free Size",
    "FREE-SIZE": "Free Size",
    FREE: "Free Size",
    "ONE SIZE": "Free Size",
    ONESIZE: "Free Size",
    "ONE-SIZE": "Free Size",
  };

  if (aliasMap[upper]) {
    return aliasMap[upper];
  }

  return upper;
};
