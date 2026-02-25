import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Request behavior definition.
 * 
 * uniqueBehaviorDef automatically extracts:
 * - ATTRS: From schema keys (e.g., { "request-url": "request-url", ... })
 * - COMMANDS: From command object (e.g., { "--trigger": "--trigger", ... })
 * - OBSERVED_ATTRIBUTES: Array of schema keys
 */
const definition = uniqueBehaviorDef({
  name: "request",
  schema,
  command: {
    "--trigger": "--trigger",
    "--close-sse": "--close-sse",
  },
});

export default definition;
