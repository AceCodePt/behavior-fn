import { type CommandEvent, registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const setAttributeBehaviorFactory = (el: HTMLElement) => {
  return {
    onCommand(e: CommandEvent<string>) {
      if (!command) return;

      const attrName = el.getAttribute(attributes["set-attribute-name"]);
      if (!attrName) return;

      // Use command-value from invoker (e.value), fallback to empty string
      const value = e.value ?? "";

      if (e.command === command["set"]) {
        el.setAttribute(attrName, value);
      } else if (e.command === command["toggle"]) {
        if (el.hasAttribute(attrName)) {
          el.removeAttribute(attrName);
        } else {
          el.setAttribute(attrName, value);
        }
      } else if (e.command === command["remove"]) {
        el.removeAttribute(attrName);
      }
    },
  };
};

registerBehavior(definition, setAttributeBehaviorFactory);
