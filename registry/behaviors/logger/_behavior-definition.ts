import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const LOGGER_DEFINITION = uniqueBehaviorDef({
  name: "logger",
  schema,
  observedAttributes: Object.keys(schema.properties),
  command: {},
});

export default LOGGER_DEFINITION;
