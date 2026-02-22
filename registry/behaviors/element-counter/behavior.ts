import { type BehaviorInstance } from "~registry";
import { type SchemaType, ELEMENT_COUNTER_ATTRS } from "./schema";

export const elementCounterBehaviorFactory = (el: HTMLElement) => {
  let observer: MutationObserver | null = null;
  let rootObserver: MutationObserver | null = null;

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
    rootObserver?.disconnect();

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

  return {
    connectedCallback(this: BehaviorInstance<SchemaType>) {
      initObserver();
    },
    attributeChangedCallback(
      this: BehaviorInstance<SchemaType>,
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
    disconnectedCallback(this: BehaviorInstance<SchemaType>) {
      observer?.disconnect();
      rootObserver?.disconnect();
    },
  };
};
