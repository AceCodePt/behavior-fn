import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const REVEAL_DEFINITION = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: {
    "--show": "--show",
    "--hide": "--hide",
    "--toggle": "--toggle",
  },
});

export default REVEAL_DEFINITION;
