import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";
import { REVEAL_COMMANDS } from "./commands";

// Full definition with schema (for CLI and type inference)
const REVEAL_DEFINITION = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: REVEAL_COMMANDS,
});

export default REVEAL_DEFINITION;
