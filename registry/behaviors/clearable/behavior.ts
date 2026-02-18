import { registerBehavior, type CommandEvent } from "~registry";
import CLEARABLE_DEFINITION from "./_behavior-definition";

export const clearableBehaviorFactory = (el: HTMLElement) => {
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement) &&
    !(el instanceof HTMLDivElement)
  ) {
    throw new Error(
      `The behavior ${CLEARABLE_DEFINITION.name} is limited to input element, text area, select, div`,
    );
  }
  return {
    onCommand(e: CommandEvent<string>) {
      const cmd = CLEARABLE_DEFINITION.command;

      if (e.command === cmd["--clear"]) {
        if (el instanceof HTMLDivElement) {
          el.innerHTML = "";
        } else {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    },
  };
};

registerBehavior(CLEARABLE_DEFINITION.name, clearableBehaviorFactory);
