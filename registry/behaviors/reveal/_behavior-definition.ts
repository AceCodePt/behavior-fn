import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Reveal behavior definition.
 * 
 * uniqueBehaviorDef automatically extracts:
 * - ATTRS: From schema keys (e.g., { "reveal-delay": "reveal-delay", ... })
 * - COMMANDS: From command object (e.g., { "--show": "--show", ... })
 * - OBSERVED_ATTRIBUTES: Array of schema keys
 */
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: {
    "--show": "--show",
    "--hide": "--hide",
    "--toggle": "--toggle",
  },
});

export default definition;
