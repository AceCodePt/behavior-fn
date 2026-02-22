import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const COMPUTE_DEFINITION = uniqueBehaviorDef({
  name: "compute",
  schema,
});

export default COMPUTE_DEFINITION;
