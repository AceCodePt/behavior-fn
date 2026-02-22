import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const ELEMENT_COUNTER_DEFINITION = uniqueBehaviorDef({
  name: "element-counter",
  schema,
  observedAttributes: Object.keys(schema.properties),
  command: {},
});

export default ELEMENT_COUNTER_DEFINITION;
