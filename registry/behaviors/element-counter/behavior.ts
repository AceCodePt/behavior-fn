import { registerBehavior } from "~registry";
import ELEMENT_COUNTER_DEFINITION, {
  ELEMENT_COUNTER_ATTRS,
} from "./_behavior-definition";

export const elementCounterBehaviorFactory = (el: HTMLElement) => {
  let observer: MutationObserver | null = null;

  const updateCount = (root: HTMLElement, selector: string) => {
    const count = root.querySelectorAll(selector).length;
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLOutputElement
    ) {
      el.value = count.toString();
    } else {
      el.textContent = count.toString();
    }
  };

  const initObserver = () => {
    observer?.disconnect();

    const rootId = el.getAttribute(ELEMENT_COUNTER_ATTRS.ROOT);
    const selector = el.getAttribute(ELEMENT_COUNTER_ATTRS.SELECTOR);

    if (!rootId || !selector) return;

    const root = document.getElementById(rootId);
    if (!root) return;

    // 1. Initial Count
    updateCount(root, selector);

    // 2. Watch for changes in the root's subtree
    observer = new MutationObserver(() => {
      updateCount(root, selector);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  };

  initObserver();

  return {
    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      if (
        oldValue !== newValue &&
        (name === ELEMENT_COUNTER_ATTRS.ROOT ||
          name === ELEMENT_COUNTER_ATTRS.SELECTOR)
      ) {
        initObserver();
      }
    },
    disconnectedCallback() {
      observer?.disconnect();
    },
  };
};

registerBehavior(
  ELEMENT_COUNTER_DEFINITION.name,
  elementCounterBehaviorFactory,
);
