import { type CommandEvent } from "~registry";
import definition from "./_behavior-definition";

const { commands } = definition;

/**
 * Set-value behavior factory.
 * 
 * Enables declarative value setting for form inputs via command buttons.
 * The button's innerText becomes the input value when the command is triggered.
 * 
 * Features:
 * - Validates element is a form input (input, textarea, select)
 * - Throws error for invalid element types
 * - Dispatches both `input` and `change` events after setting value
 * - Supports form submission using `requestSubmit()` for validation
 * 
 * Commands:
 * - `--set-value`: Set input value from command source's innerText
 * - `--set-value-and-submit`: Set value and submit parent form
 * 
 * @param el - The element to attach the behavior to (must be input/textarea/select)
 * @returns Behavior object with command handler
 * @throws Error if element is not a form input element
 */
export const setValueBehaviorFactory = (el: HTMLElement) => {
  // Type guard: ensure element is a valid form input
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement)
  ) {
    throw new Error(
      `[SetValue] The behavior "set-value" is limited to input, textarea, and select elements. Found: <${el.tagName.toLowerCase()}>`,
    );
  }

  return {
    /**
     * Handle command events to set the input value.
     * 
     * The command source's innerText is used as the new value.
     * Both `input` and `change` events are dispatched to ensure
     * reactive systems (like form validation) are triggered.
     * 
     * For `--set-value-and-submit`, the parent form is submitted
     * using `requestSubmit()` which respects form validation.
     */
    onCommand(e: CommandEvent<string>) {
      if (!commands) return;

      if (
        e.command === commands["--set-value"] ||
        e.command === commands["--set-value-and-submit"]
      ) {
        // Set value from command source's innerText
        el.value = e.source.innerText;

        // Dispatch events to trigger reactive systems
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));

        // Submit form if requested and form exists
        if (
          e.command === commands["--set-value-and-submit"] &&
          "form" in el &&
          el.form
        ) {
          el.form.requestSubmit();
        }
      }
    },
  };
};
