import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "command",
  schema,
});

export default definition;
