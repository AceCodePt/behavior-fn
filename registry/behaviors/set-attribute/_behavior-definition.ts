import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "set-attribute",
  schema,
  command: {
    "set": "set",
    "toggle": "toggle",
    "remove": "remove",
  },
});

export default definition;
