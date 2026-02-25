import { uniqueBehaviorDef } from "~utils";
import { schema, JSON_TEMPLATE_ATTRS } from "./schema";

/**
 * Observed attributes - derived from JSON_TEMPLATE_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const JSON_TEMPLATE_OBSERVED_ATTRIBUTES = Object.values(JSON_TEMPLATE_ATTRS);

const JSON_TEMPLATE_DEFINITION = uniqueBehaviorDef({
  name: "json-template",
  schema,
  ATTRS: JSON_TEMPLATE_ATTRS,
  OBSERVED_ATTRIBUTES: JSON_TEMPLATE_OBSERVED_ATTRIBUTES,
});

export default JSON_TEMPLATE_DEFINITION;
