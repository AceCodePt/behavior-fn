import { type BehaviorSchema } from "./types";

/**
 * Extracts the keys (observed attributes) from a schema object.
 *
 * This is the **Canonical Implementation** for TypeBox.
 * When installing for other validators (Zod, Valibot), the CLI transforms this function.
 */
export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];

  // TypeBox schemas are JSON Schema objects, so they have a `properties` object.
  if ("properties" in schema && typeof (schema as any).properties === "object") {
    return Object.keys((schema as any).properties);
  }

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
