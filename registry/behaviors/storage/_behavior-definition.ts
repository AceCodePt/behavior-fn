import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "storage",
  schema,
});

export default definition;
