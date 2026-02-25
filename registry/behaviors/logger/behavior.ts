import definition from "./_behavior-definition";

const { ATTRS } = definition;

export const loggerBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(e: MouseEvent) {
      const trigger = el.getAttribute(ATTRS["logger-trigger"]);
      if (trigger === "click") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> clicked!`,
          e,
        );
      }
    },
    onMouseEnter(e: MouseEvent) {
      const trigger = el.getAttribute(ATTRS["logger-trigger"]);
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
