import { uniqueBehaviorDef } from "~utils";

const INPUT_WATCHER_DEFINITION = uniqueBehaviorDef({
  name: "input-watcher",
  observedAttributes: ["watcher-for", "watcher-format"],
});

export default INPUT_WATCHER_DEFINITION;
