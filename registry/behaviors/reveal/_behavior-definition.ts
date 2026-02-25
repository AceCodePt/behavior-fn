import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Reveal behavior definition.
 */
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  commands: {
    "--show": "--show",
    "--hide": "--hide",
    "--toggle": "--toggle",
  },
});

export default definition;
