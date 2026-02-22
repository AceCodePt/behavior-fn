import { type TObject } from "@sinclair/typebox";

export const getObservedAttributes = (schema: TObject) => {
  return Object.keys(schema.properties);
};

export interface BehaviorDef<C extends string> {
  name: string;
  schema: TObject;
  command?: { [K in C]: K };
}

export type ValidateBehaviorDef<Def extends BehaviorDef<string>> = {
  name: Def["name"];
  schema: Def["schema"];
  command?: {
    [K in keyof Def["command"]]: Def["command"][K] extends K
      ? K
      : K | `Error: Key '${K & string}' should match value`;
  };
};

export const uniqueBehaviorDef = <const Def extends BehaviorDef<string>>(
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
