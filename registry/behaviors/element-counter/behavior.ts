import definition from "./_behavior-definition";

const { ATTRS } = definition;

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

    const rootId = el.getAttribute(ATTRS["element-counter-root"]);
    const selector = el.getAttribute(ATTRS["element-counter-selector"]);

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
        (name === ATTRS["element-counter-root"] ||
          name === ATTRS["element-counter-selector"])
      ) {
        initObserver();
      }
    },
    disconnectedCallback() {
      observer?.disconnect();
    },
  };
};
