import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "condition",
  schema,
});

export default definition;
