import { uniqueBehaviorDef } from "~utils";
import { schema, ELEMENT_COUNTER_ATTRS } from "./schema";

/**
 * Observed attributes - derived from ELEMENT_COUNTER_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const ELEMENT_COUNTER_OBSERVED_ATTRIBUTES = Object.values(ELEMENT_COUNTER_ATTRS);

const ELEMENT_COUNTER_DEFINITION = uniqueBehaviorDef({
  name: "element-counter",
  schema,
  ATTRS: ELEMENT_COUNTER_ATTRS,
  OBSERVED_ATTRIBUTES: ELEMENT_COUNTER_OBSERVED_ATTRIBUTES,
});

export default ELEMENT_COUNTER_DEFINITION;
