import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const REQUEST_DEFINITION = uniqueBehaviorDef({
  name: "request",
  schema,
  observedAttributes: Object.keys(schema.properties),
  command: {
    "--trigger": "--trigger",
    "--close-sse": "--close-sse",
  },
});

export default REQUEST_DEFINITION;
