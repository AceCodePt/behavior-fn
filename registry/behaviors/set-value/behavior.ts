import { type CommandEvent, registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const setValueBehaviorFactory = (el: HTMLElement) => {
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement)
  ) {
    return {};
  }

  const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  return {
    onCommand(e: CommandEvent<string>) {
      if (!command) return;

      if (e.command === command["reset"]) {
        input.value = input.getAttribute("value") || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      if (e.command === command["set"] || e.command === command["set-and-submit"]) {
        // Priority: event.value (from command-value) > fallback attribute > source innerText
        const value = 
          e.value ?? 
          el.getAttribute(attributes["set-value-fallback"]) ?? 
          e.source.textContent?.trim() ?? 
          "";

        input.value = value;
        
        // Dispatch events to trigger reactive systems (like dirty-input)
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        if (e.command === command["set-and-submit"] && "form" in input && input.form) {
          input.form.requestSubmit();
        }
      }
    },
  };
};

registerBehavior(definition, setValueBehaviorFactory);
