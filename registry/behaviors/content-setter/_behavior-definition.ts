import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "content-setter",
  schema,
  commands: {
    "--set-content": "--set-content",
  },
});

export default definition;
