import { LOGGER_ATTRS } from "./schema";

export const loggerBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(e: MouseEvent) {
      const trigger = el.getAttribute(LOGGER_ATTRS.TRIGGER);
      if (trigger === "click") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> clicked!`,
          e,
        );
      }
    },
    onMouseEnter(e: MouseEvent) {
      const trigger = el.getAttribute(LOGGER_ATTRS.TRIGGER);
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
