import { uniqueBehaviorDef } from "~utils";

export const SET_VALUE_COMMANDS = {
  "--set-value": "--set-value",
  "--set-value-and-submit": "--set-value-and-submit",
} as const;

const SET_VALUE_DEFINITION = uniqueBehaviorDef({
  name: "set-value",
  command: SET_VALUE_COMMANDS,
});

export default SET_VALUE_DEFINITION;
