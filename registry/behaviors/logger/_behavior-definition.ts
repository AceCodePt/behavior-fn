import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Logger behavior definition.
 */
const definition = uniqueBehaviorDef({
  name: "logger",
  schema,
});

export default definition;
