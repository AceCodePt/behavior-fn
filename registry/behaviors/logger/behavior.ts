import definition from "./_behavior-definition";

const { attributes } = definition;

export const loggerBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(e: MouseEvent) {
      const trigger = el.getAttribute(attributes["logger-trigger"]);
      if (trigger === "click") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> clicked!`,
          e,
        );
      }
    },
    onMouseEnter(e: MouseEvent) {
      const trigger = el.getAttribute(attributes["logger-trigger"]);
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
