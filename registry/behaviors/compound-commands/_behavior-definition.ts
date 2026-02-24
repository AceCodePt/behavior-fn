import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const COMPOUND_COMMANDS_DEFINITION = uniqueBehaviorDef({
  name: "compound-commands",
  schema,
});

export default COMPOUND_COMMANDS_DEFINITION;
