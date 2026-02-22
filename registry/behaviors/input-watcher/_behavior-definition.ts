import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const INPUT_WATCHER_DEFINITION = uniqueBehaviorDef({
  name: "input-watcher",
  schema,
});

export default INPUT_WATCHER_DEFINITION;
