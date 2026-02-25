import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "content-setter",
  schema,
  command: {
    "--set-content": "--set-content",
  },
});

export default definition;
