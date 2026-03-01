import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Set-value behavior definition.
 * 
 * Allows buttons to set values on form inputs using the Invoker Commands API.
 * Useful for auto-complete, templates, suggestions, and quick-fill scenarios.
 * 
 * Command:
 * - `--set-value`: Sets the input value from the command source's innerText
 * - `--set-value-and-submit`: Sets value and submits the parent form
 */
const definition = uniqueBehaviorDef({
  name: "set-value",
  schema,
  command: {
    "--set-value": "--set-value",
    "--set-value-and-submit": "--set-value-and-submit",
  },
});

export default definition;
