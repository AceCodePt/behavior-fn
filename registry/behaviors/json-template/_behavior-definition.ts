import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const JSON_TEMPLATE_DEFINITION = uniqueBehaviorDef({
  name: "json-template",
  schema,
});

export default JSON_TEMPLATE_DEFINITION;
