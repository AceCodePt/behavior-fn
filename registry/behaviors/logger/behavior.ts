import { type BehaviorInstance } from "~registry";
import { type SchemaType } from "./schema";

export const loggerBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(this: BehaviorInstance<SchemaType>, e: MouseEvent) {
      const trigger = el.getAttribute("log-trigger");
      if (trigger === "click") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> clicked!`,
          e,
        );
      }
    },
    onMouseEnter(this: BehaviorInstance<SchemaType>, e: MouseEvent) {
      const trigger = el.getAttribute("log-trigger");
      console.log(trigger, "mouse enter");
      if (trigger === "mouseenter") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> mouse entered!`,
          e,
        );
      }
    },
  };
};
