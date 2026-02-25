import { uniqueBehaviorDef } from "~utils";
import { schema, CONTENT_SETTER_ATTRS } from "./schema";

/**
 * Commands supported by the content-setter behavior.
 * These are used with the Invoker Commands API.
 */
const CONTENT_SETTER_COMMANDS = {
  "--set-content": "--set-content",
} as const;

/**
 * Observed attributes - derived from CONTENT_SETTER_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
const CONTENT_SETTER_OBSERVED_ATTRIBUTES = Object.values(CONTENT_SETTER_ATTRS);

const CONTENT_SETTER_DEFINITION = uniqueBehaviorDef({
  name: "content-setter",
  schema,
  command: CONTENT_SETTER_COMMANDS,
  ATTRS: CONTENT_SETTER_ATTRS,
  COMMANDS: CONTENT_SETTER_COMMANDS,
  OBSERVED_ATTRIBUTES: CONTENT_SETTER_OBSERVED_ATTRIBUTES,
});

export default CONTENT_SETTER_DEFINITION;
