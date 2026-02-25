import { uniqueBehaviorDef } from "~utils";
import { schema, COMPOUND_COMMANDS_ATTRS } from "./schema";

/**
 * Observed attributes - derived from COMPOUND_COMMANDS_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const COMPOUND_COMMANDS_OBSERVED_ATTRIBUTES = Object.values(COMPOUND_COMMANDS_ATTRS);

const COMPOUND_COMMANDS_DEFINITION = uniqueBehaviorDef({
  name: "compound-commands",
  schema,
  ATTRS: COMPOUND_COMMANDS_ATTRS,
  OBSERVED_ATTRIBUTES: COMPOUND_COMMANDS_OBSERVED_ATTRIBUTES,
});

export default COMPOUND_COMMANDS_DEFINITION;
