import { type CommandEvent, registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const setContentBehaviorFactory = (el: HTMLElement) => {
  let originalText: string | null = null;
  let isToggled = false;

  return {
    connectedCallback() {
      originalText = el.textContent;
    },

    onCommand(e: CommandEvent<string>) {
      if (!command) return;

      const value = el.getAttribute(attributes["set-content-value"]) ?? e.source.innerText;

      if (e.command === command["set"]) {
        el.textContent = value;
      } else if (e.command === command["toggle"]) {
        if (isToggled) {
          el.textContent = originalText;
        } else {
          el.textContent = value;
        }
        isToggled = !isToggled;
      }
    },
  };
};

registerBehavior(definition, setContentBehaviorFactory);
