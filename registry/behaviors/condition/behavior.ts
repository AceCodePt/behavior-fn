import { dispatchCommand, registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

const { attributes } = definition;

export const conditionBehaviorFactory = (el: HTMLElement) => {
  let observer: MutationObserver | null = null;

  const check = () => {
    const targetId = el.getAttribute(attributes["condition-watch"]);
    const targetAttr = el.getAttribute(attributes["condition-on"]);
    const op = el.getAttribute(attributes["condition-op"]);
    const expected = el.getAttribute(attributes["condition-value"]);
    const command = el.getAttribute(attributes["condition-command"]);
    const commandForId = el.getAttribute(attributes["condition-commandfor"]);

    if (!targetId || !targetAttr || !op || expected === null || !command || !commandForId) return;

    const targetEl = document.getElementById(targetId);
    const commandTarget = document.getElementById(commandForId);
    if (!targetEl || !commandTarget) return;

    const actualValue = targetEl.getAttribute(targetAttr);
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
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        observer = new MutationObserver(check);
        observer.observe(targetEl, { attributes: true, attributeFilter: [el.getAttribute(attributes["condition-on"]) || ""] });
      }
      check();
    },
    disconnectedCallback() {
      observer?.disconnect();
    },
  };
};

registerBehavior(definition, conditionBehaviorFactory);
