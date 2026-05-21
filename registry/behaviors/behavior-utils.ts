import { type BehaviorSchema, type InferSchema } from "./types";

/**
 * Extracts the keys (observed attributes) from a schema object.
 *
 * This is the **Canonical Implementation** for TypeBox.
 * When installing for other validators (Zod, Valibot), the CLI transforms this function.
 */
export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  // TypeBox TObject guarantees 'properties'
  if ("properties" in schema) {
    return Object.keys(schema.properties);
  }
  return [];
};

/**
 * Type guard to check if an element has a 'value' property.
 * Useful for form elements (input, select, textarea).
 */
export function hasValue(
  el: Element,
): el is Element & { value: string | number } {
  return (
    "value" in el &&
    (typeof (el as { value?: unknown }).value === "string" ||
      typeof (el as { value?: unknown }).value === "number")
  );
}

// --- Behavior Definition ---

/**
 * Extract strongly-typed attribute keys from a schema's inferred type.
 * Creates an object where each key-value pair is identical: { "attr-name": "attr-name" }
 *
 * This works by getting the keys from the schema's output type (via InferSchema),
 * which works universally for all validators (TypeBox, Zod, Valibot, etc.).
 *
 * @example
 * Schema with keys: "reveal-delay", "reveal-duration"
 * Result: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration" }
 */
type ExtractAttributes<S extends BehaviorSchema | undefined> =
  S extends BehaviorSchema
    ? {
        readonly [K in keyof InferSchema<S> & string]: K;
      }
    : {};

export interface BehaviorDef<
  S extends BehaviorSchema = BehaviorSchema,
  C extends Record<string, string> = Record<string, string>,
> {
  readonly name: string;
  readonly schema?: S;
  readonly command?: C;
}

export type ValidateBehaviorDef<
  Def extends BehaviorDef<BehaviorSchema, Record<string, string>>,
> = {
  readonly name: Def["name"];
  readonly schema?: Def["schema"];
  readonly command?: {
    [K in keyof Def["command"]]: Def["command"][K] extends K
      ? K
      : K | `Error: Key '${K & string}' should match value`;
  };
};

/**
 * Create a behavior definition with auto-extracted attributes.
 *
 * attributes is extracted from schema keys (e.g., { "reveal-delay": "reveal-delay" })
 */
export const uniqueBehaviorDef = <const T extends BehaviorDef>(
  def: ValidateBehaviorDef<T> & T,
): T & { readonly attributes: ExtractAttributes<T["schema"]> } => {
  // Runtime validation for command: key must equal value
  if (def.command) {
    for (const [key, value] of Object.entries(def.command)) {
      if (key !== value) {
        throw new Error(
          `Runtime Error: Behavior command key "${key}" does not match its value "${value}". They must be identical.`,
        );
      }
    }
  }

  const schemaKeys = def.schema ? getObservedAttributes(def.schema) : [];
  const attributes = schemaKeys.reduce(
    (acc, key) => {
      acc[key] = key;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    ...def,
    attributes: attributes as ExtractAttributes<T["schema"]>,
  } as T & { readonly attributes: ExtractAttributes<T["schema"]> };
};

/**
 * Parse and normalize behavior names from a behavior attribute string.
 */
export function parseBehaviorNames(
  behaviorAttr: string | null | undefined,
): string[] {
  if (!behaviorAttr || !behaviorAttr.trim()) {
    return [];
  }

  return behaviorAttr
    .trim()
    .replace(/[^a-zA-Z-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort();
}

/**
 * Normalizes a localized numeric string into a standard JS number.
 * 
 * Heuristic:
 * 1. Strips all non-numeric characters except the last decimal separator.
 * 2. If locale is provided, uses Intl.NumberFormat to identify separators.
 * 3. Fallback: Assumes the last occurrence of '.' or ',' is the decimal if it appears once.
 * 
 * @param value The formatted string to parse
 * @param locale Optional locale (defaults to browser language)
 */
export function parseNumericValue(
  value: string | null | undefined,
  locale: string = typeof navigator !== "undefined" ? navigator.language : "en-US",
): number {
  if (value === null || value === undefined) return 0;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.includes("#")) return 0;

  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    const decimal = parts.find((p) => p.type === "decimal")?.value || ".";
    const group = parts.find((p) => p.type === "group")?.value || ",";

    const normalized = trimmed
      .split(group)
      .join("")
      .replace(decimal, ".");

    const stripped = normalized.replace(/[^\d.\-]/g, "");
    const parsed = parseFloat(stripped);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    const lastDot = trimmed.lastIndexOf(".");
    const lastComma = trimmed.lastIndexOf(",");
    let decimal = ".";
    let group = ",";

    if (lastComma > lastDot) {
      decimal = ",";
      group = ".";
    }

    const normalized = trimmed
      .split(group)
      .join("")
      .replace(decimal, ".");
    const stripped = normalized.replace(/[^\d.\-]/g, "");
    const parsed = parseFloat(stripped);
    return isNaN(parsed) ? 0 : parsed;
  }
}
