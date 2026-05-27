import { dispatchCommand, registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

const { attributes } = definition;

export const conditionBehaviorFactory = (el: HTMLElement) => {
  let observer: MutationObserver | null = null;
  let eventListener: EventListener | null = null;
  let targetEl: HTMLElement | null = null;

  const check = () => {
    const targetId = el.getAttribute(attributes["condition-watch"]);
    const targetAttr = el.getAttribute(attributes["condition-on"]);
    const op = el.getAttribute(attributes["condition-op"]);
    const expected = el.getAttribute(attributes["condition-value"]);
    const command = el.getAttribute(attributes["condition-command"]);
    const commandForId = el.getAttribute(attributes["condition-commandfor"]);

    if (!targetId || !targetAttr || !op || expected === null || !command || !commandForId) return;

    const target = document.getElementById(targetId);
    const commandTarget = document.getElementById(commandForId);
    if (!target || !commandTarget) return;

    // Get value from property first (for form elements), fallback to attribute
    let actualValue: string | null = null;
    if (targetAttr === 'value' && 'value' in target) {
      actualValue = String((target as HTMLInputElement).value);
    } else {
      actualValue = target.getAttribute(targetAttr);
    }

    const actualNum = parseNumericValue(actualValue);
    const expectedNum = parseNumericValue(expected);

    let result = false;
    switch (op) {
      case "==": result = actualValue === expected; break;
      case "!=": result = actualValue !== expected; break;
      case ">": result = actualNum > expectedNum; break;
      case "<": result = actualNum < expectedNum; break;
      case ">=": result = actualNum >= expectedNum; break;
      case "<=": result = actualNum <= expectedNum; break;
    }

    if (result) {
      dispatchCommand(commandTarget, command, el);
    }
  };

  return {
    connectedCallback() {
      const targetId = el.getAttribute(attributes["condition-watch"]);
      const targetAttr = el.getAttribute(attributes["condition-on"]);
      targetEl = targetId ? document.getElementById(targetId) : null;
      
      if (targetEl) {
        // For 'value' property on form elements, listen to input/change events
        if (targetAttr === 'value' && (targetEl instanceof HTMLInputElement || 
                                       targetEl instanceof HTMLTextAreaElement || 
                                       targetEl instanceof HTMLSelectElement)) {
          eventListener = check;
          targetEl.addEventListener('input', eventListener);
          targetEl.addEventListener('change', eventListener);
        } else {
          // For other attributes, use MutationObserver
          observer = new MutationObserver(check);
          observer.observe(targetEl, { attributes: true, attributeFilter: [targetAttr || ""] });
        }
      }
      check();
    },
    disconnectedCallback() {
      observer?.disconnect();
      if (eventListener && targetEl) {
        targetEl.removeEventListener('input', eventListener);
        targetEl.removeEventListener('change', eventListener);
      }
    },
  };
};

registerBehavior(definition, conditionBehaviorFactory);
