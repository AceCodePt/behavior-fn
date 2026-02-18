import { uniqueBehaviorDef } from "~utils";

export const REVEAL_COMMANDS = {
  "--show": "--show",
  "--hide": "--hide",
  "--toggle": "--toggle",
} as const;

const REVEAL_DEFINITION = uniqueBehaviorDef({
  name: "reveal",
  command: REVEAL_COMMANDS,
  observedAttributes: [
    "reveal-delay",
    "reveal-duration",
    "reveal-anchor",
    "reveal-auto",
    "reveal-when-target",
    "reveal-when-attribute",
    "reveal-when-value",
  ],
});

export default REVEAL_DEFINITION;
