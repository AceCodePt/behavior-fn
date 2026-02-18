import { uniqueBehaviorDef } from "~utils";

const COMPUTE_DEFINITION = uniqueBehaviorDef({
  name: "compute",
  observedAttributes: ["formula"],
});

export default COMPUTE_DEFINITION;
