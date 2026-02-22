import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const COMPUTE_DEFINITION = uniqueBehaviorDef({
  name: "compute",
  schema,
  observedAttributes: Object.keys(schema.properties),
  command: {},
});

export default COMPUTE_DEFINITION;
