import { registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

/**
 * Dirty behavior factory.
 *
 * Tracks whether a form control's value has changed from its initial baseline.
 * Baseline is defined as the 'value' attribute of the element.
 *
 * @param el - The element to attach the behavior to (input, textarea, or select)
 * @returns Behavior object with lifecycle hooks
 */
export const dirtyBehaviorFactory = (el: HTMLElement) => {
  const isFormElement = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
  if (!isFormElement) {
    return {};
  }

  const checkDirty = () => {
    const input = el as HTMLInputElement;
    const currentValue = input.value;
    const baselineValue = el.getAttribute("value") || "";

    // Normalize for comparison
    const current = parseNumericValue(currentValue);
    const baseline = parseNumericValue(baselineValue);

    if (current !== baseline || currentValue !== baselineValue) {
      // If numeric values are different, or if raw strings are different 
      // (preserving non-numeric diffs like text inputs)
      if (!el.hasAttribute("dirty-state")) {
        el.setAttribute("dirty-state", "");
      }
    } else {
      if (el.hasAttribute("dirty-state")) {
        el.removeAttribute("dirty-state");
      }
    }
  };

  const handleEvent = () => {
    checkDirty();
  };

  return {
    connectedCallback() {
      checkDirty();
      el.addEventListener("input", handleEvent);
      el.addEventListener("change", handleEvent);
    },
    disconnectedCallback() {
      el.removeEventListener("input", handleEvent);
      el.removeEventListener("change", handleEvent);
    },
    attributeChangedCallback(name: string) {
      if (name === "value") {
        checkDirty();
      }
    },
  };
};

registerBehavior(definition, dirtyBehaviorFactory);
