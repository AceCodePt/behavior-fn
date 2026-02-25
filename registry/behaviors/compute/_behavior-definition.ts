import { uniqueBehaviorDef } from "~utils";
import { schema, COMPUTE_ATTRS } from "./schema";

/**
 * Observed attributes - derived from COMPUTE_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const COMPUTE_OBSERVED_ATTRIBUTES = Object.values(COMPUTE_ATTRS);

const COMPUTE_DEFINITION = uniqueBehaviorDef({
  name: "compute",
  schema,
  ATTRS: COMPUTE_ATTRS,
  OBSERVED_ATTRIBUTES: COMPUTE_OBSERVED_ATTRIBUTES,
});

export default COMPUTE_DEFINITION;
