import { uniqueBehaviorDef } from "~utils";

export const LOGGER_COMMANDS = {} as const;

const LOGGER_DEFINITION = uniqueBehaviorDef({
  name: "logger",
  command: LOGGER_COMMANDS,
  observedAttributes: ["log-trigger"],
});

export default LOGGER_DEFINITION;
