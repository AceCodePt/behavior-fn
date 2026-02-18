import { uniqueBehaviorDef } from "~utils";

export const ELEMENT_COUNTER_ATTRS = {
  ROOT: "data-root",
  SELECTOR: "data-selector",
} as const;

const ELEMENT_COUNTER_DEFINITION = uniqueBehaviorDef({
  name: "element-counter",
  observedAttributes: [
    ELEMENT_COUNTER_ATTRS.ROOT,
    ELEMENT_COUNTER_ATTRS.SELECTOR,
  ],
});

export default ELEMENT_COUNTER_DEFINITION;
