import { type StandardSchemaV1 } from "@standard-schema/spec";
import { type BehaviorSchema } from "./types";

// --- Introspection Adapters ---

/**
 * Extracts the keys (observed attributes) from a schema object.
 *
 * NOTE: The Standard Schema spec (v1) focuses on validation and type inference,
 * not introspection (getting the list of keys). Therefore, we must use "duck typing"
 * to detect the underlying library and extract the keys using its specific API.
 *
 * @param schema - The schema object (TypeBox, Zod, Valibot, or Standard Schema)
 * @returns Array of property keys
 */
export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];

  // 1. TypeBox / JSON Schema
  // TypeBox schemas are JSON Schema objects, so they have a `properties` object.
  if ("properties" in schema && typeof (schema as any).properties === "object") {
    return Object.keys((schema as any).properties);
  }

  // 2. Zod
  // Zod objects store their shape in the `shape` property.
  if ("shape" in schema && typeof (schema as any).shape === "object") {
    return Object.keys((schema as any).shape);
  }

  // 3. Valibot
  // Valibot objects store their shape in the `entries` property.
  if ("entries" in schema && typeof (schema as any).entries === "object") {
    return Object.keys((schema as any).entries);
  }

  // 4. ArkType
  // ArkType schemas are functions but may expose metadata.
  // (Specific introspection logic for ArkType would go here if needed)

  // 5. Fallback for Standard Schema wrappers
  // If a library uses a wrapper that hides the internal structure but exposes `~standard`,
  // we currently cannot introspect it without a standardized introspection API.
  // For now, we return an empty array and rely on the user to provide keys if needed.

  return [];
};

// --- Behavior Definition ---

export interface BehaviorDef<
  S extends BehaviorSchema = BehaviorSchema,
  C extends string = string,
> {
  name: string;
  schema: S;
  command?: { [K in C]: K };
}

export type ValidateBehaviorDef<
  Def extends BehaviorDef<BehaviorSchema, string>,
> = {
  name: Def["name"];
  schema: Def["schema"];
  command?: {
    [K in keyof Def["command"]]: Def["command"][K] extends K
      ? K
      : K | `Error: Key '${K & string}' should match value`;
  };
};

export const uniqueBehaviorDef = <
  const S extends BehaviorSchema,
  const C extends string,
  const Def extends BehaviorDef<S, C>,
>(
  def: Def & ValidateBehaviorDef<Def>,
): Def => {
  if (def.command) {
    for (const [key, value] of Object.entries(def.command)) {
      if (key !== value) {
        throw new Error(
          `Runtime Error: Behavior command key "${key}" does not match its value "${value}". They must be identical.`,
        );
      }
    }
  }

  return def;
};

export const isServer = () => typeof window === "undefined";
