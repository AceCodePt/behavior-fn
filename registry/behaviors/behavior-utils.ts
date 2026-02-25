import { type BehaviorSchema } from "./types";

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
export function hasValue(el: Element): el is Element & { value: string | number } {
  return 'value' in el && (
    typeof (el as { value?: unknown }).value === 'string' || 
    typeof (el as { value?: unknown }).value === 'number'
  );
}

// --- Behavior Definition ---

/**
 * Extract strongly-typed attribute keys from a TypeBox schema.
 * Creates an object where each key-value pair is identical: { "attr-name": "attr-name" }
 * 
 * @example
 * Schema with keys: "reveal-delay", "reveal-duration"
 * Result: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration" }
 */
type ExtractSchemaKeys<S extends BehaviorSchema> = 
  S extends { properties: infer P } 
    ? { readonly [K in keyof P & string]: K }
    : Record<string, never>;

/**
 * Extract strongly-typed command keys from a command object.
 * Creates an object where each key-value pair is identical: { "--cmd": "--cmd" }
 * 
 * @example
 * Commands: { "--show": "--show", "--hide": "--hide" }
 * Result: { "--show": "--show", "--hide": "--hide" }
 */
type ExtractCommandKeys<C> = 
  C extends Record<string, any>
    ? { readonly [K in keyof C & string]: K }
    : never;

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
 * Create a behavior definition with auto-extracted metadata.
 * 
 * This function automatically extracts and creates strongly-typed objects for:
 * - **ATTRS**: Extracted from schema keys (e.g., { "reveal-delay": "reveal-delay" })
 * - **COMMANDS**: Extracted from command object (e.g., { "--show": "--show" })
 * - **OBSERVED_ATTRIBUTES**: Array of attribute names from schema keys
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
 * // definition.ATTRS = { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration" }
 * // definition.COMMANDS = { "--show": "--show", "--hide": "--hide" }
 * // definition.OBSERVED_ATTRIBUTES = ["reveal-delay", "reveal-duration"]
 * 
 * @param def - The behavior definition with name, schema, and optional commands
 * @returns Extended definition with ATTRS, COMMANDS, and OBSERVED_ATTRIBUTES
 */
export const uniqueBehaviorDef = <
  const S extends BehaviorSchema,
  const C extends Record<string, string>,
  const Def extends BehaviorDef<S, C>,
>(
  def: Def & ValidateBehaviorDef<Def>,
) => {
  // Runtime validation for commands: key must equal value
  if (def.command) {
    for (const [key, value] of Object.entries(def.command)) {
      if (key !== value) {
        throw new Error(
          `Runtime Error: Behavior command key "${key}" does not match its value "${value}". They must be identical.`,
        );
      }
    }
  }

  // Extract attribute keys from schema and create ATTRS object
  // Pattern: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration" }
  const schemaKeys = "properties" in def.schema ? Object.keys(def.schema.properties) : [];
  const ATTRS = schemaKeys.reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as Record<string, string>) as ExtractSchemaKeys<S>;

  // Extract command keys from command object and create COMMANDS object
  // Pattern: { "--show": "--show", "--hide": "--hide" }
  const commandKeys = def.command ? Object.keys(def.command) : [];
  const COMMANDS = commandKeys.length > 0 
    ? commandKeys.reduce((acc, key) => {
        acc[key] = key;
        return acc;
      }, {} as Record<string, string>) as ExtractCommandKeys<C>
    : undefined;

  // Create observed attributes array from schema keys
  const OBSERVED_ATTRIBUTES = schemaKeys as readonly string[];

  return {
    ...def,
    ATTRS,
    COMMANDS,
    OBSERVED_ATTRIBUTES,
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
export function parseBehaviorNames(behaviorAttr: string | null | undefined): string[] {
  if (!behaviorAttr || !behaviorAttr.trim()) {
    return [];
  }

  return behaviorAttr
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
    .sort();
}
