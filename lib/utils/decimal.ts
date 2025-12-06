// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Decimal = any;

type DecimalLike = Decimal | number | string | null | undefined;

function isDecimal(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    "toFixed" in value &&
    "toString" in value
  );
}

/**
 * Serialize a Decimal value to a string for JSON responses
 */
export function serializeDecimal(value: DecimalLike): string {
  if (value === null || value === undefined) {
    return "0";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return value.toString();
}

/**
 * Serialize all Decimal fields in an object
 */
export function serializeDecimalFields<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];
    if (isDecimal(value)) {
      (result as Record<string, unknown>)[key] = String(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = serializeDecimalFields(
        value as Record<string, unknown>
      );
    }
  }

  return result;
}
