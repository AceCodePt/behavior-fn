import { uniqueBehaviorDef } from "~utils";

const CLEARABLE_DEFINITION = uniqueBehaviorDef({
  name: "clearable",
  command: {
    "--clear": "--clear",
  },
});

export default CLEARABLE_DEFINITION;
