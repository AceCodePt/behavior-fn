import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Logger behavior definition.
 * 
 * uniqueBehaviorDef automatically extracts:
 * - ATTRS: From schema keys (e.g., { "logger-trigger": "logger-trigger" })
 * - OBSERVED_ATTRIBUTES: Array of schema keys
 */
const definition = uniqueBehaviorDef({
  name: "logger",
  schema,
});

export default definition;
