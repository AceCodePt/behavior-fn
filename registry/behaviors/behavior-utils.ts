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
type ExtractAttributes<S extends BehaviorSchema> = {
  readonly [K in keyof InferSchema<S> & string]: K;
};

export interface BehaviorDef<
  S extends BehaviorSchema = BehaviorSchema,
  C extends Record<string, string> = Record<string, string>,
> {
  name: string;
  schema: S;
  command?: C;
}

export type ValidateBehaviorDef<
  Def extends BehaviorDef<BehaviorSchema, Record<string, string>>,
> = {
  name: Def["name"];
  schema: Def["schema"];
  command?: {
    [K in keyof Def["command"]]: Def["command"][K] extends K
      ? K
      : K | `Error: Key '${K & string}' should match value`;
  };
};

/**
 * Create a behavior definition with auto-extracted attributes.
 *
 * attributes is extracted from schema keys (e.g., { "reveal-delay": "reveal-delay" })
 *
 * @example
 * const definition = uniqueBehaviorDef({
 *   name: "reveal",
 *   schema: Type.Object({
 *     "reveal-delay": Type.Optional(Type.String()),
 *     "reveal-duration": Type.Optional(Type.String()),
 *   }),
 *   command: {
 *     "--show": "--show",
 *     "--hide": "--hide",
 *   },
 * });
 *
 * // Auto-created:
 * // definition.attributes = { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration" }
 * // definition.command = { "--show": "--show", "--hide": "--hide" }
 *
 * @param def - The behavior definition with name, schema, and optional command
 * @returns Extended definition with attributes
 */
export const uniqueBehaviorDef = <
  const T extends {
    name: string;
    schema: BehaviorSchema;
    command?: Record<string, string>;
  },
>(
  def: T & ValidateBehaviorDef<T>,
) => {
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

  // Extract attributes from schema using validator-aware function
  // This works for TypeBox (properties), Zod (shape), Valibot (entries), etc.
  const schemaKeys = getObservedAttributes(def.schema);
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
  } as const;
};

export const isServer = () => typeof window === "undefined";

/**
 * Parse and normalize behavior names from a behavior attribute string.
 *
 * This is the **canonical** implementation used by both auto-loader and behavioral-host
 * to ensure consistent behavior parsing across the system.
 *
 * **Algorithm:**
 * 1. Trim whitespace
 * 2. Convert invalid characters to spaces (creates delimiters between words)
 * 3. Split on any non-letter/non-hyphen character (preserving hyphens in names)
 * 4. Filter out empty strings
 * 5. Sort alphabetically for consistency
 *
 * **Why convert instead of remove?**
 * - If we just remove invalid chars, "reveal123logger" becomes "reveallogger" (one word)
 * - By converting to spaces, "reveal123logger" becomes "reveal   logger" (two words)
 * - The split step then correctly separates them
 *
 * **Examples:**
 * - `"reveal logger"` → `["logger", "reveal"]`
 * - `"reveal, logger"` → `["logger", "reveal"]`
 * - `"reveal123logger"` → `["logger", "reveal"]` (numbers become delimiters)
 * - `"input-watcher"` → `["input-watcher"]` (hyphens preserved)
 * - `"reveal logger input-watcher"` → `["input-watcher", "logger", "reveal"]`
 *
 * @param behaviorAttr The raw behavior attribute value
 * @returns Array of sorted, normalized behavior names
 */
export function parseBehaviorNames(
  behaviorAttr: string | null | undefined,
): string[] {
  if (!behaviorAttr || !behaviorAttr.trim()) {
    return [];
  }

  return (
    behaviorAttr
      .trim()
      // Convert invalid characters to spaces (global flag to convert ALL occurrences)
      // This creates delimiters between words so "reveal123logger" → "reveal   logger"
      // Valid characters: letters (a-zA-Z) and hyphens (-)
      // Everything else (numbers, special chars, commas, whitespace, etc.) becomes a space
      .replace(/[^a-zA-Z-]/g, " ")
      // Split on whitespace (one or more) to get individual behavior names
      // Since replace() already converted everything to spaces, this splits on those spaces
      // Hyphens are preserved, so "input-watcher" stays as one name
      .split(/\s+/)
      // Remove empty strings
      .filter(Boolean)
      // Sort alphabetically for consistent ordering
      // This ensures "reveal logger" and "logger reveal" produce the same result
      .sort()
  );
}
