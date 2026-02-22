import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const LOGGER_DEFINITION = uniqueBehaviorDef({
  name: "logger",
  schema,
});

export default LOGGER_DEFINITION;
