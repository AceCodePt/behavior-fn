import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Request behavior definition.
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
