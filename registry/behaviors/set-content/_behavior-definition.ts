import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "set-content",
  schema,
  command: {
    "set": "set",
    "toggle": "toggle",
  },
});

export default definition;
