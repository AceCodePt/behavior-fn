import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const ELEMENT_COUNTER_DEFINITION = uniqueBehaviorDef({
  name: "element-counter",
  schema,
});

export default ELEMENT_COUNTER_DEFINITION;
