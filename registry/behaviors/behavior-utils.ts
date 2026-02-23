import { type TSchema } from "@sinclair/typebox";
import { type StandardSchemaV1 } from "@standard-schema/spec";
import { type BehaviorSchema, type InferSchema } from "./types";

// Extend with duck-typed properties for introspection
interface TypeBoxLike {
  properties: Record<string, unknown>;
}

interface ZodLike {
  shape: Record<string, unknown>;
}

interface ValibotLike {
  entries: Record<string, unknown>;
}

/**
 * Extracts the keys (observed attributes) from a schema object.
 * Attempts to detect the schema library (TypeBox, Zod, Valibot) via duck typing.
 *
 * @param schema - The schema object (TypeBox, Zod, Valibot, or Standard Schema)
 * @returns Array of property keys
 */
export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];

  // TypeBox
  if ("properties" in schema && typeof (schema as TypeBoxLike).properties === "object") {
    return Object.keys((schema as TypeBoxLike).properties);
  }

  // Zod
  if ("shape" in schema && typeof (schema as ZodLike).shape === "object") {
    return Object.keys((schema as ZodLike).shape);
  }

  // Valibot
  if ("entries" in schema && typeof (schema as ValibotLike).entries === "object") {
    return Object.keys((schema as ValibotLike).entries);
  }

  return [];
};

export interface BehaviorDef<S extends BehaviorSchema = BehaviorSchema, C extends string = string> {
  name: string;
  schema: S;
  command?: { [K in C]: K };
}

export type ValidateBehaviorDef<Def extends BehaviorDef<BehaviorSchema, string>> = {
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
  const Def extends BehaviorDef<S, C>
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
