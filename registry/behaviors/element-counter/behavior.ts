import { registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes } = definition;

export const elementCounterBehaviorFactory = (el: HTMLElement) => {
  let observer: MutationObserver | null = null;
  let rootObserver: MutationObserver | null = null;

  const updateCount = (
    root: HTMLElement,
    selector: string,
  ) => {
    const count = root.querySelectorAll(selector).length.toString();

    // Update property
    const target = el as any;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.tagName === "OUTPUT") {
      target.value = count;
    } else {
      el.textContent = count;
    }

    // Update attribute for CSS/Interop
    el.setAttribute("value", count);

    // Notify listeners
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const setupMutationObserver = (
    root: HTMLElement,
    selector: string,
  ) => {
    updateCount(root, selector);
    observer = new MutationObserver(() => {
      updateCount(root, selector);
    });
    observer.observe(root, { childList: true, subtree: true });
  };

  const initObserver = () => {
    observer?.disconnect();
    rootObserver?.disconnect();

    const rootId = el.getAttribute(attributes['element-counter-root']);
    const selector = el.getAttribute(attributes['element-counter-selector']);

    if (!rootId || !selector) return;

    const root = document.getElementById(rootId);

    if (!root) {
      rootObserver = new MutationObserver(() => {
        const foundRoot = document.getElementById(rootId);
        if (foundRoot) {
          rootObserver?.disconnect();
          setupMutationObserver(foundRoot, selector);
        }
      });
      rootObserver.observe(document.body, { childList: true, subtree: true });
      return;
    }

    setupMutationObserver(root, selector);
  };

  return {
    connectedCallback() {
      initObserver();
    },
    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      if (
        oldValue !== newValue &&
        (name === attributes['element-counter-root'] ||
          name === attributes['element-counter-selector'])
      ) {
        initObserver();
      }
    },
    disconnectedCallback() {
      observer?.disconnect();
      rootObserver?.disconnect();
    },
  };
};

registerBehavior(definition, elementCounterBehaviorFactory);
