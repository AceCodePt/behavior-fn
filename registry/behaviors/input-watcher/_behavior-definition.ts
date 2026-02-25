import { uniqueBehaviorDef } from "~utils";
import { schema, INPUT_WATCHER_ATTRS } from "./schema";

/**
 * Observed attributes - derived from INPUT_WATCHER_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const INPUT_WATCHER_OBSERVED_ATTRIBUTES = Object.values(INPUT_WATCHER_ATTRS);

const INPUT_WATCHER_DEFINITION = uniqueBehaviorDef({
  name: "input-watcher",
  schema,
  ATTRS: INPUT_WATCHER_ATTRS,
  OBSERVED_ATTRIBUTES: INPUT_WATCHER_OBSERVED_ATTRIBUTES,
});

export default INPUT_WATCHER_DEFINITION;
