import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Set-value behavior definition.
 *
 * Allows elements to set values on form inputs using the Command Protocol.
 * Useful for auto-complete, templates, suggestions, and quick-fill scenarios.
 *
 * Command:
 * - `set-value`: Sets the input value from the command source's innerText
 * - `set-value-and-submit`: Sets value and submits the parent form
 */
const definition = uniqueBehaviorDef({
  name: "set-value",
  schema,
  command: {
    "set": "set",
    "set-and-submit": "set-and-submit",
    "reset": "reset",
  },
});

export default definition;
