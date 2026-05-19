import { uniqueBehaviorDef } from "~utils";

/**
 * Auto-grow behavior definition.
 *
 * Automatically adjusts textarea height to fit content as the user types.
 * Zero-config behavior with no attributes.
 */
const definition = uniqueBehaviorDef({
  name: "auto-grow",
});

export default definition;
