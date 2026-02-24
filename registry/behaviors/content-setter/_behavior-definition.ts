import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const CONTENT_SETTER_DEFINITION = uniqueBehaviorDef({
  name: "content-setter",
  schema,
  command: {
    "--set-content": "--set-content",
  },
});

export default CONTENT_SETTER_DEFINITION;
