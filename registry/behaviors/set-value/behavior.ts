import { registerBehavior, type CommandEvent } from "~registry";
import SET_VALUE_DEFINITION from "./_behavior-definition";

export const setValueBehaviorFactory = (el: HTMLElement) => {
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement) &&
    !(el instanceof HTMLTableElement)
  ) {
    throw new Error(
      `The behavior ${SET_VALUE_DEFINITION.name} is limited to input element, text area, select, table`,
    );
  }
  return {
    onCommand(e: CommandEvent<string>) {
      const cmd = SET_VALUE_DEFINITION.command;

      if (
        e.command === cmd["--set-value"] ||
        e.command === cmd["--set-value-and-submit"]
      ) {
        if (el instanceof HTMLTableElement) {
          el.innerText = e.source.innerText;
        } else {
          el.value = e.source.innerText;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));

          if (
            e.command === cmd["--set-value-and-submit"] &&
            "form" in el &&
            el.form
          ) {
            el.form.requestSubmit();
          }
        }
      }
    },
  };
};

registerBehavior(SET_VALUE_DEFINITION.name, setValueBehaviorFactory);
